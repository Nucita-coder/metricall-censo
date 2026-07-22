-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: CREACIÓN SEGURA DE PERFIL DE EMPLEADO
-- ========================================================================================

-- Creamos una función RPC segura para que el trabajador pueda crearse su propio perfil 
-- sin darle permisos de INSERT crudos a la tabla (lo cual sería un agujero de seguridad).
-- Esto fuerza a que el rol sea siempre 'empleado' y sin empresa_id (null) inicialmente.

CREATE OR REPLACE FUNCTION crear_perfil_empleado(
  p_nombre_completo TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO perfiles (id, rol, nombre_completo, empresa_id, sucursal_id, supervisor_id)
  VALUES (auth.uid(), 'empleado', p_nombre_completo, NULL, NULL, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
