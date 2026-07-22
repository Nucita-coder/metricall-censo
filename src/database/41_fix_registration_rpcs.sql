-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: FIX PARA REGISTRO DE EMPRESAS Y EMPLEADOS Y GESTIÓN DE EQUIPO
-- ========================================================================================

-- 1. Eliminar versiones anteriores de las funciones para evitar conflictos de sobrecarga (Error 42725)
DROP FUNCTION IF EXISTS crear_perfil_empleado(TEXT);
DROP FUNCTION IF EXISTS crear_perfil_empleado(TEXT, UUID);

DROP FUNCTION IF EXISTS crear_empresa_y_perfil(TEXT, TEXT);
DROP FUNCTION IF EXISTS crear_empresa_y_perfil(TEXT, TEXT, UUID);

DROP FUNCTION IF EXISTS buscar_empresa_por_codigo(TEXT);
DROP FUNCTION IF EXISTS rechazar_solicitud_acceso(UUID);
DROP FUNCTION IF EXISTS bloquear_solicitud_acceso(UUID);

-- 2. Actualizar RPC crear_perfil_empleado
CREATE OR REPLACE FUNCTION crear_perfil_empleado(
  p_nombre_completo TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := COALESCE(auth.uid(), p_user_id);
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado o ID no proporcionado';
  END IF;

  INSERT INTO perfiles (id, rol, nombre_completo, empresa_id, sucursal_id, supervisor_id)
  VALUES (v_uid, 'empleado', p_nombre_completo, NULL, NULL, NULL)
  ON CONFLICT (id) DO UPDATE 
  SET nombre_completo = EXCLUDED.nombre_completo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Actualizar RPC crear_empresa_y_perfil
CREATE OR REPLACE FUNCTION crear_empresa_y_perfil(
    p_nombre_empresa TEXT,
    p_nombre_completo TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_empresa_id UUID;
    v_perfil_id UUID;
    v_uid UUID;
BEGIN
    v_uid := COALESCE(auth.uid(), p_user_id);
    
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
    ON CONFLICT (id) DO UPDATE
    SET rol = 'lider', nombre_completo = EXCLUDED.nombre_completo, empresa_id = v_empresa_id
    RETURNING id INTO v_perfil_id;

    -- 3. Devolver el resultado
    RETURN jsonb_build_object(
        'empresa_id', v_empresa_id,
        'perfil_id', v_perfil_id,
        'mensaje', 'Empresa y Líder creados exitosamente'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Fallo al registrar la empresa: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC público para consultar empresas por código de invitación sin ser bloqueado por RLS de anon
CREATE OR REPLACE FUNCTION buscar_empresa_por_codigo(
  p_codigo TEXT
) RETURNS TABLE (id UUID, nombre TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nombre
  FROM empresas e
  WHERE e.codigo_invitacion ILIKE p_codigo
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC para rechazar una solicitud de acceso
CREATE OR REPLACE FUNCTION rechazar_solicitud_acceso(
  p_solicitud_id UUID
) RETURNS void AS $$
DECLARE
  v_rol_llamador rol_usuario;
  v_empresa_llamador UUID;
  v_solicitud_empresa UUID;
BEGIN
  SELECT rol, empresa_id INTO v_rol_llamador, v_empresa_llamador 
  FROM perfiles WHERE id = auth.uid();

  IF v_rol_llamador NOT IN ('lider', 'lider_sucursal', 'supervisor') THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción.';
  END IF;

  SELECT empresa_id INTO v_solicitud_empresa 
  FROM solicitudes_acceso WHERE id = p_solicitud_id;

  IF v_solicitud_empresa IS NULL OR v_solicitud_empresa != v_empresa_llamador THEN
    RAISE EXCEPTION 'La solicitud no pertenece a tu empresa.';
  END IF;

  DELETE FROM solicitudes_acceso WHERE id = p_solicitud_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC para bloquear una solicitud de acceso
CREATE OR REPLACE FUNCTION bloquear_solicitud_acceso(
  p_solicitud_id UUID
) RETURNS void AS $$
DECLARE
  v_rol_llamador rol_usuario;
  v_empresa_llamador UUID;
  v_solicitud_empresa UUID;
BEGIN
  SELECT rol, empresa_id INTO v_rol_llamador, v_empresa_llamador 
  FROM perfiles WHERE id = auth.uid();

  IF v_rol_llamador NOT IN ('lider', 'lider_sucursal', 'supervisor') THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción.';
  END IF;

  SELECT empresa_id INTO v_solicitud_empresa 
  FROM solicitudes_acceso WHERE id = p_solicitud_id;

  IF v_solicitud_empresa IS NULL OR v_solicitud_empresa != v_empresa_llamador THEN
    RAISE EXCEPTION 'La solicitud no pertenece a tu empresa.';
  END IF;

  UPDATE solicitudes_acceso SET estado = 'bloqueado' WHERE id = p_solicitud_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION crear_perfil_empleado TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION crear_empresa_y_perfil TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION buscar_empresa_por_codigo TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION rechazar_solicitud_acceso TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION bloquear_solicitud_acceso TO authenticated, service_role;
