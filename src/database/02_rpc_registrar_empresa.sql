-- ========================================================================================
-- RPC: REGISTRO TRANSACCIONAL DE EMPRESA
-- Objetivo: Al registrarse una Empresa, crear tanto la entidad "empresas" como el "perfil"
-- con rol 'lider' en una sola transacción ACID para evitar dependencias huérfanas.
-- ========================================================================================

CREATE OR REPLACE FUNCTION crear_empresa_y_perfil(
    p_nombre_empresa TEXT,
    p_nombre_completo TEXT
) RETURNS JSONB AS $$
DECLARE
    v_empresa_id UUID;
    v_perfil_id UUID;
    v_uid UUID;
BEGIN
    -- Obtenemos el UID del usuario recién autenticado
    v_uid := auth.uid();
    
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado en Supabase Auth';
    END IF;

    -- 1. Insertar la Empresa
    INSERT INTO empresas (nombre)
    VALUES (p_nombre_empresa)
    RETURNING id INTO v_empresa_id;

    -- 2. Insertar el Perfil (El líder adquiere la empresa_id creada)
    INSERT INTO perfiles (id, rol, nombre_completo, empresa_id)
    VALUES (v_uid, 'lider', p_nombre_completo, v_empresa_id)
    RETURNING id INTO v_perfil_id;

    -- 3. Devolver el resultado
    RETURN jsonb_build_object(
        'empresa_id', v_empresa_id,
        'perfil_id', v_perfil_id,
        'mensaje', 'Empresa y Líder creados exitosamente'
    );
EXCEPTION WHEN OTHERS THEN
    -- En caso de cualquier error, la transacción hace ROLLBACK automático
    RAISE EXCEPTION 'Fallo al registrar la empresa: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
