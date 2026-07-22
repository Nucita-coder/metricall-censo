-- ========================================================================================
-- SCRIPT DE ONBOARDING: AGREGAR COLUMNA LOGO Y CREAR RPC
-- ========================================================================================

-- 1. Agregar la columna logo_url a empresas si no existe (la omitimos en la v2 por error)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Función RPC para procesar todo el Onboarding de un solo golpe (ACID)
CREATE OR REPLACE FUNCTION completar_onboarding(
    p_logo_url TEXT,
    p_nombre_sucursal TEXT,
    p_ubicacion_sucursal TEXT,
    p_nombre_tablero TEXT
) RETURNS JSONB AS $$
DECLARE
    v_empresa_id UUID;
    v_sucursal_id UUID;
    v_tablero_id UUID;
    v_rol TEXT;
BEGIN
    -- 1. Identificar al usuario y validar que es lider
    SELECT empresa_id, rol INTO v_empresa_id, v_rol
    FROM perfiles WHERE id = auth.uid();

    IF v_empresa_id IS NULL OR v_rol != 'lider' THEN
        RAISE EXCEPTION 'No autorizado o no tienes empresa asignada.';
    END IF;

    -- 2. Actualizar el logo de la empresa
    UPDATE empresas SET logo_url = p_logo_url WHERE id = v_empresa_id;

    -- 3. Crear la primera Sucursal
    INSERT INTO sucursales (empresa_id, nombre, ubicacion)
    VALUES (v_empresa_id, p_nombre_sucursal, p_ubicacion_sucursal)
    RETURNING id INTO v_sucursal_id;

    -- 4. Asignar al lider a esta sucursal inicial en su perfil
    UPDATE perfiles SET sucursal_id = v_sucursal_id WHERE id = auth.uid();

    -- 5. Crear el primer Tablero heredando el tenant
    INSERT INTO tableros (sucursal_id, empresa_id, nombre, descripcion)
    VALUES (v_sucursal_id, v_empresa_id, p_nombre_tablero, 'Tablero inicial autogenerado')
    RETURNING id INTO v_tablero_id;

    -- 6. Retornar éxito
    RETURN jsonb_build_object(
        'sucursal_id', v_sucursal_id,
        'tablero_id', v_tablero_id,
        'mensaje', 'Onboarding completado exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
