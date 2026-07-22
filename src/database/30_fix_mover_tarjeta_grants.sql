-- ========================================================================================
-- SCRIPT 30: Grants y refuerzo de seguridad para mover_tarjeta_seguro
-- Problema: El RPC es SECURITY DEFINER pero necesita un GRANT explícito para que
-- los usuarios autenticados (rol 'authenticated') puedan EJECUTARLO.
-- También reforzamos el RPC con SET search_path para prevenir ataques de escalada.
-- ========================================================================================

-- 1. GRANT de ejecución para todos los RPCs críticos de movimiento
-- Sin esto, aunque el RPC exista, el usuario recibe "permission denied for function"

GRANT EXECUTE ON FUNCTION mover_tarjeta_seguro(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mover_a_factibilidad(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION convertir_venta_factibilidad(UUID, JSONB) TO authenticated;

-- 2. Refuerzo de seguridad: Reescribimos mover_tarjeta_seguro con SET search_path
-- Esto previene que un atacante haga schema injection dentro del SECURITY DEFINER.
-- También validamos que el usuario sea del mismo tenant de la tarjeta.

CREATE OR REPLACE FUNCTION mover_tarjeta_seguro(
    p_tarjeta_id UUID,
    p_nombre_lista_destino TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tablero_id      UUID;
    v_lista_destino_id UUID;
    v_creador_id      UUID;
    v_asignado_a      UUID;
    v_empresa_id      UUID;
BEGIN
    -- 1. Obtener información crítica de la tarjeta (sin filtros RLS porque es SECURITY DEFINER)
    SELECT 
        tar.creador_id, 
        tar.empresa_id,
        lis.tablero_id,
        (tar.datos_valores->>'asignado_a')::UUID
    INTO 
        v_creador_id, 
        v_empresa_id,
        v_tablero_id,
        v_asignado_a
    FROM tarjetas tar
    JOIN listas lis ON tar.lista_id = lis.id
    WHERE tar.id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La tarjeta con ID % no existe.', p_tarjeta_id;
    END IF;

    -- 2. Validación de tenant: el usuario debe pertenecer a la misma empresa
    IF v_empresa_id IS DISTINCT FROM get_user_tenant() THEN
        RAISE EXCEPTION 'Acceso denegado: La tarjeta no pertenece a tu empresa.';
    END IF;

    -- 3. Validación ABAC: el usuario debe ser creador, asignado, o rol superior
    --    Esta regla aplica para TODOS los usuarios incluyendo el súper usuario.
    IF v_creador_id IS DISTINCT FROM auth.uid() 
       AND (v_asignado_a IS NULL OR v_asignado_a IS DISTINCT FROM auth.uid()) 
    THEN
        IF NOT EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
              AND empresa_id = v_empresa_id 
              AND rol IN ('lider', 'lider_sucursal', 'supervisor')
        ) THEN
            RAISE EXCEPTION 'Acceso denegado: Solo el creador, asignado o un supervisor pueden mover esta tarjeta.';
        END IF;
    END IF;

    -- 4. Buscar la lista destino por nombre dentro del mismo tablero
    --    (Sin RLS aquí: el empleado puede no tener acceso de lectura a la lista destino,
    --     pero nosotros ya validamos el tenant y el ABAC arriba.)
    SELECT id INTO v_lista_destino_id
    FROM listas
    WHERE tablero_id = v_tablero_id 
      AND LOWER(TRIM(nombre)) = LOWER(TRIM(p_nombre_lista_destino))
      AND empresa_id = v_empresa_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la lista "%" en el tablero.', p_nombre_lista_destino;
    END IF;

    -- 5. Ejecutar el movimiento atómico (como SECURITY DEFINER bypassea RLS de UPDATE)
    UPDATE tarjetas 
    SET 
        lista_id   = v_lista_destino_id,
        updated_at = NOW()
    WHERE id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se pudo actualizar la tarjeta. Intenta de nuevo.';
    END IF;

END;
$$;

-- Re-aplicar el GRANT después de recrear la función
GRANT EXECUTE ON FUNCTION mover_tarjeta_seguro(UUID, TEXT) TO authenticated;


-- ========================================================================================
-- NOTA PARA EL DESARROLLADOR:
-- ========================================================================================
-- El flujo correcto con este sistema es:
--
-- USUARIO SIN PERMISO DE VER LISTA DESTINO (ej. empleado en "Venta" sin acceso a "Factibilidad"):
--   1. Hace la acción en el frontend (ej. selecciona plan y guarda)
--   2. Frontend llama a: supabase.rpc('mover_tarjeta_seguro', { p_tarjeta_id, p_nombre_lista_destino })
--   3. El RPC (SECURITY DEFINER) bypassea RLS, valida tenant + ABAC, mueve la tarjeta en BD
--   4. El frontend elimina la tarjeta de la lista visible y hace fetchKanbanData(true)
--   5. El empleado ya no ve la tarjeta porque está en una lista a la que no tiene acceso → CORRECTO
--
-- CASOS QUE CUBRE ESTE RPC:
--   ✅ Venta → Factibilidad (tablero instalaciones)
--   ✅ Censo (si desea) → Factibilidad (vía convertir_venta_factibilidad)
--   ✅ Cualquier movimiento automático de fase (FaseVenta, FaseFactibilidad, etc.)
--   ✅ Funciona sin importar los permisos listas_permitidas del empleado
-- ========================================================================================
