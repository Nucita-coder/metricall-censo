-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: SOLICITUDES Y APROBACIÓN DE NUEVOS SECTORES (CENSO)
-- Objetivo: Permitir a los asesores solicitar sectores no listados ("Otro")
--           y al líder/administrador aprobarlos para volverlos elegibles globalmente.
-- ========================================================================================

-- 1. Tabla de solicitudes de nuevos sectores
CREATE TABLE IF NOT EXISTS solicitudes_sectores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE SET NULL,
    nombre_sector TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    aprobado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_sectores_empresa ON solicitudes_sectores(empresa_id, estado);

ALTER TABLE solicitudes_sectores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para solicitudes_sectores
DROP POLICY IF EXISTS "Usuarios leen solicitudes de su empresa" ON solicitudes_sectores;
CREATE POLICY "Usuarios leen solicitudes de su empresa" ON solicitudes_sectores
    FOR SELECT USING (empresa_id = get_user_tenant());

DROP POLICY IF EXISTS "Usuarios crean solicitudes propias" ON solicitudes_sectores;
CREATE POLICY "Usuarios crean solicitudes propias" ON solicitudes_sectores
    FOR INSERT WITH CHECK (empresa_id = get_user_tenant() AND usuario_id = auth.uid());

DROP POLICY IF EXISTS "Lideres gestionan solicitudes de su empresa" ON solicitudes_sectores;
CREATE POLICY "Lideres gestionan solicitudes de su empresa" ON solicitudes_sectores
    FOR UPDATE USING (empresa_id = get_user_tenant());

-- 2. Tabla de sectores adicionales aprobados por empresa
CREATE TABLE IF NOT EXISTS sectores_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    aprobado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_sectores_empresa_empresa ON sectores_empresa(empresa_id);

ALTER TABLE sectores_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sectores_empresa
DROP POLICY IF EXISTS "Usuarios leen sectores aprobados de su empresa" ON sectores_empresa;
CREATE POLICY "Usuarios leen sectores aprobados de su empresa" ON sectores_empresa
    FOR SELECT USING (empresa_id = get_user_tenant());

DROP POLICY IF EXISTS "Lideres gestionan sectores de su empresa" ON sectores_empresa;
CREATE POLICY "Lideres gestionan sectores de su empresa" ON sectores_empresa
    FOR ALL USING (empresa_id = get_user_tenant());


-- 3. Función RPC Transaccional Segura para Aprobar Sector
CREATE OR REPLACE FUNCTION aprobar_sector_censo(
    p_solicitud_id UUID
) RETURNS void AS $$
DECLARE
    v_solicitud RECORD;
    v_empresa_llamador UUID;
    v_rol_llamador rol_usuario;
    v_nombre_limpio TEXT;
BEGIN
    -- Validar identidad de quien aprueba
    SELECT rol, empresa_id INTO v_rol_llamador, v_empresa_llamador
    FROM perfiles
    WHERE id = auth.uid();

    IF v_rol_llamador NOT IN ('lider', 'lider_sucursal', 'supervisor', 'admin') AND NOT is_developer() THEN
        RAISE EXCEPTION 'No tienes permisos para aprobar nuevos sectores.';
    END IF;

    -- Obtener la solicitud
    SELECT * INTO v_solicitud
    FROM solicitudes_sectores
    WHERE id = p_solicitud_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de sector no encontrada.';
    END IF;

    IF v_solicitud.empresa_id != v_empresa_llamador AND NOT is_developer() THEN
        RAISE EXCEPTION 'Acceso denegado: La solicitud no pertenece a su empresa.';
    END IF;

    v_nombre_limpio := initcap(trim(v_solicitud.nombre_sector));

    -- Insertar en sectores_empresa si no existe
    INSERT INTO sectores_empresa (empresa_id, nombre, aprobado_por)
    VALUES (v_solicitud.empresa_id, v_nombre_limpio, auth.uid())
    ON CONFLICT (empresa_id, nombre) DO NOTHING;

    -- Actualizar solicitud a aprobada
    UPDATE solicitudes_sectores
    SET estado = 'aprobado',
        aprobado_por = auth.uid(),
        updated_at = now()
    WHERE id = p_solicitud_id;

    -- Si la solicitud tiene tarjeta vinculada, actualizar el sector y urbanización en datos_valores
    IF v_solicitud.tarjeta_id IS NOT NULL THEN
        UPDATE tarjetas
        SET datos_valores = datos_valores 
            || jsonb_build_object(
                'sector', v_nombre_limpio,
                'urbanizacion', v_nombre_limpio,
                'sectorAprobadoOficial', true
            ),
            updated_at = now()
        WHERE id = v_solicitud.tarjeta_id;
    END IF;

    -- Notificar al usuario que solicitó el sector
    INSERT INTO notificaciones (usuario_id, mensaje, leida)
    VALUES (
        v_solicitud.usuario_id,
        'Tu solicitud para incluir el sector "' || v_nombre_limpio || '" ha sido aprobada por la administración.',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Función RPC Transaccional Segura para Rechazar Sector
CREATE OR REPLACE FUNCTION rechazar_sector_censo(
    p_solicitud_id UUID
) RETURNS void AS $$
DECLARE
    v_solicitud RECORD;
    v_empresa_llamador UUID;
    v_rol_llamador rol_usuario;
BEGIN
    SELECT rol, empresa_id INTO v_rol_llamador, v_empresa_llamador
    FROM perfiles
    WHERE id = auth.uid();

    IF v_rol_llamador NOT IN ('lider', 'lider_sucursal', 'supervisor', 'admin') AND NOT is_developer() THEN
        RAISE EXCEPTION 'No tienes permisos para rechazar solicitudes de sectores.';
    END IF;

    SELECT * INTO v_solicitud
    FROM solicitudes_sectores
    WHERE id = p_solicitud_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de sector no encontrada.';
    END IF;

    IF v_solicitud.empresa_id != v_empresa_llamador AND NOT is_developer() THEN
        RAISE EXCEPTION 'Acceso denegado: La solicitud no pertenece a su empresa.';
    END IF;

    UPDATE solicitudes_sectores
    SET estado = 'rechazado',
        updated_at = now()
    WHERE id = p_solicitud_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
