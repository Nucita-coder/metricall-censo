-- ========================================================================================
-- SCRIPT 34: Refactorización Blind Handoff (UUIDs e Identificadores Inmutables)
-- ========================================================================================

-- 1. Añadir columna slug a la tabla listas (identificador inmutable para la lógica del frontend)
ALTER TABLE listas ADD COLUMN IF NOT EXISTS slug TEXT;

-- Llenar el slug para las listas existentes si están vacíos
UPDATE listas 
SET slug = LOWER(REGEXP_REPLACE(nombre, '\s+', '_', 'g')) 
WHERE slug IS NULL;

-- 2. Modificar Política RLS de Listas para que TODO el tenant pueda leer la estructura
DROP POLICY IF EXISTS "RBAC - Leer Listas" ON listas;
CREATE POLICY "RBAC - Leer Listas" ON listas
FOR SELECT USING (
  empresa_id = get_user_tenant()
);

-- 3. Refactorización del RPC mover_tarjeta_seguro
-- Primero eliminamos la firma antigua que usaba TEXT
DROP FUNCTION IF EXISTS mover_tarjeta_seguro(UUID, TEXT);
DROP FUNCTION IF EXISTS mover_tarjeta_seguro(UUID, UUID);

-- Creamos la nueva firma con UUID y validación de origen estricta
CREATE OR REPLACE FUNCTION mover_tarjeta_seguro(
    p_tarjeta_id UUID,
    p_lista_destino_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tablero_id       UUID;
    v_creador_id       UUID;
    v_asignado_a       UUID;
    v_empresa_id       UUID;
    v_lista_origen_id  UUID;
BEGIN
    -- 1. Obtener información crítica de la tarjeta
    SELECT
        tar.creador_id,
        tar.empresa_id,
        lis.tablero_id,
        (tar.datos_valores->>'asignado_a')::UUID,
        tar.lista_id
    INTO
        v_creador_id,
        v_empresa_id,
        v_tablero_id,
        v_asignado_a,
        v_lista_origen_id
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

    -- 3. Validación de Origen Estricta (ABAC)
    -- Permitir si es creador o asignado
    IF v_creador_id IS DISTINCT FROM auth.uid()
       AND (v_asignado_a IS NULL OR v_asignado_a IS DISTINCT FROM auth.uid())
    THEN
        -- Si no es creador/asignado, verificar si tiene permisos sobre la lista de origen o si es supervisor/líder
        IF NOT EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid()
              AND empresa_id = v_empresa_id
              AND (
                  rol IN ('lider', 'lider_sucursal', 'supervisor') 
                  OR (get_user_permissions()->'listas_permitidas') ? v_lista_origen_id::text
              )
        ) THEN
            RAISE EXCEPTION 'Acceso denegado: No tienes permiso sobre la lista de origen.';
        END IF;
    END IF;

    -- 4. Ejecutar el movimiento atómico
    UPDATE tarjetas
    SET
        lista_id   = p_lista_destino_id,
        updated_at = NOW()
    WHERE id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se pudo actualizar la tarjeta. Intenta de nuevo.';
    END IF;

END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION mover_tarjeta_seguro(UUID, UUID) TO authenticated;
