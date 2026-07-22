-- ========================================================================================
-- RPC: convertir_venta_factibilidad
-- Permite a un vendedor mover una tarjeta de "Venta" a "Factibilidad" de forma segura,
-- evadiendo las restricciones de RLS de solo-lectura sobre el tablero de instalaciones,
-- pero manteniendo estricto aislamiento de tenant (empresa_id).
-- ========================================================================================

CREATE OR REPLACE FUNCTION convertir_venta_factibilidad(
    p_tarjeta_id UUID,
    p_nuevos_datos JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sucursal_id UUID;
    v_tablero_id UUID;
    v_lista_id UUID;
    v_empresa_id UUID;
BEGIN
    -- 1. Obtener la sucursal_id y empresa_id de la tarjeta origen mediante JOINs
    SELECT 
        tab.sucursal_id, 
        tar.empresa_id 
    INTO 
        v_sucursal_id, 
        v_empresa_id
    FROM tarjetas tar
    JOIN listas lis ON tar.lista_id = lis.id
    JOIN tableros tab ON lis.tablero_id = tab.id
    WHERE tar.id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarjeta no encontrada.';
    END IF;

    -- 2. Validar estricto aislamiento de inquilinos (Tenant)
    IF v_empresa_id != get_user_tenant() THEN
        RAISE EXCEPTION 'Acceso denegado: La tarjeta no pertenece a su empresa.';
    END IF;

    -- 3. Buscar automáticamente el tablero de instalaciones asociado a esa misma sucursal
    SELECT id INTO v_tablero_id
    FROM tableros
    WHERE sucursal_id = v_sucursal_id
      AND tipo = 'instalaciones'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró un tablero de tipo "instalaciones" en esta sucursal.';
    END IF;

    -- 4. Buscar la columna "Factibilidad" dentro de ese tablero
    SELECT id INTO v_lista_id
    FROM listas
    WHERE tablero_id = v_tablero_id
      AND nombre = 'Factibilidad'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la columna "Factibilidad" en el tablero de instalaciones.';
    END IF;

    -- 5. Actualizar la tarjeta: Asignarle los nuevos datos y reubicarla a Factibilidad
    UPDATE tarjetas
    SET 
        lista_id = v_lista_id,
        datos_valores = p_nuevos_datos,
        updated_at = NOW()
    WHERE id = p_tarjeta_id;

END;
$$;
