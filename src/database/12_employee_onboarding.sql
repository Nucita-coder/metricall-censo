-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: ONBOARDING Y ASIGNACIÓN GRANULAR
-- Objetivo: Sistema cerrado de invitaciones, sala de espera y asignación segura (RPC)
-- ========================================================================================

-- 1. Alterar tabla empresas para añadir el código de invitación único
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_invitacion VARCHAR(8) UNIQUE DEFAULT substr(md5(random()::text), 1, 6);

-- 2. Crear tabla de solicitudes de acceso
CREATE TABLE IF NOT EXISTS solicitudes_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'rechazado', 'bloqueado', 'aceptado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(usuario_id, empresa_id) -- Prevenir múltiples solicitudes a la misma empresa
);

-- Habilitar RLS
ALTER TABLE solicitudes_acceso ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para solicitudes_acceso

-- Empleados: Pueden leer sus propias solicitudes
CREATE POLICY "Leer solicitudes propias" ON solicitudes_acceso 
  FOR SELECT USING (usuario_id = auth.uid());

-- Empleados: Pueden crear solicitudes a su nombre
CREATE POLICY "Crear solicitud propia" ON solicitudes_acceso 
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Líderes: Pueden leer las solicitudes dirigidas a su empresa
CREATE POLICY "Líderes leen solicitudes a su empresa" ON solicitudes_acceso 
  FOR SELECT USING (empresa_id = get_user_tenant() AND get_user_role() IN ('lider', 'lider_sucursal', 'supervisor'));

-- Líderes: Pueden rechazar o bloquear solicitudes de su empresa
CREATE POLICY "Líderes actualizan solicitudes" ON solicitudes_acceso 
  FOR UPDATE USING (empresa_id = get_user_tenant() AND get_user_role() IN ('lider', 'lider_sucursal', 'supervisor'));


-- 4. Función RPC Transaccional Segura (SECURITY DEFINER) para Aceptar Empleados
-- Esto permite eludir RLS temporalmente SOLO bajo reglas muy estrictas codificadas aquí.
CREATE OR REPLACE FUNCTION aceptar_empleado_granular(
  p_solicitud_id UUID,
  p_sucursal_id UUID,
  p_tableros_permitidos JSONB
) RETURNS void AS $$
DECLARE
  v_empresa_id UUID;
  v_usuario_id UUID;
  v_rol_llamador rol_usuario;
  v_empresa_llamador UUID;
BEGIN
  -- 1. Obtener datos de quien llama la función (El Líder)
  SELECT rol, empresa_id INTO v_rol_llamador, v_empresa_llamador FROM perfiles WHERE id = auth.uid();
  
  -- 2. Validar que quien llama sea un líder
  IF v_rol_llamador NOT IN ('lider', 'lider_sucursal', 'supervisor') THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción.';
  END IF;

  -- 3. Obtener los datos de la solicitud
  SELECT empresa_id, usuario_id INTO v_empresa_id, v_usuario_id 
  FROM solicitudes_acceso 
  WHERE id = p_solicitud_id AND estado = 'pendiente';

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya no está pendiente.';
  END IF;

  -- 4. Protección IDOR: Validar que la solicitud pertenece a la empresa del líder actual
  IF v_empresa_id != v_empresa_llamador THEN
    RAISE EXCEPTION 'Acceso Denegado: Intentando aceptar una solicitud de otra empresa.';
  END IF;

  -- 5. Actualizar el perfil del empleado con asignación granular
  UPDATE perfiles 
  SET 
    empresa_id = v_empresa_id,
    sucursal_id = p_sucursal_id,
    rol = 'empleado',
    permisos_especiales = jsonb_build_object(
      'sucursal_asignada', p_sucursal_id,
      'tableros_permitidos', p_tableros_permitidos
    )
  WHERE id = v_usuario_id;

  -- 6. Marcar la solicitud como aceptada (Deja historial sin colapsar la DB)
  UPDATE solicitudes_acceso SET estado = 'aceptado' WHERE id = p_solicitud_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
