-- 37_sistema_notificaciones.sql
-- Objetivo: Sistema de notificaciones In-App cuando se asigna un usuario a una tarjeta
-- ========================================================================================

-- 1. Crear tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- Permisos
GRANT ALL ON notificaciones TO authenticated;
GRANT ALL ON notificaciones TO service_role;

-- 2. Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Un usuario solo puede leer sus propias notificaciones
DROP POLICY IF EXISTS "Lectura de notificaciones propias" ON notificaciones;
CREATE POLICY "Lectura de notificaciones propias" ON notificaciones
    FOR SELECT USING (usuario_id = auth.uid());

-- Un usuario solo puede actualizar (marcar como leídas) sus propias notificaciones
DROP POLICY IF EXISTS "Actualización de notificaciones propias" ON notificaciones;
CREATE POLICY "Actualización de notificaciones propias" ON notificaciones
    FOR UPDATE USING (usuario_id = auth.uid());

-- Permitir inserción interna mediante triggers (Service Role o functions bypass RLS)
-- No se requiere política de INSERT porque los inserts los hace el trigger SECURITY DEFINER

-- 3. Habilitar Realtime para la tabla notificaciones (Requerido para React Native subs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notificaciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
    END IF;
END
$$;

-- 4. Función de Disparo (Trigger)
CREATE OR REPLACE FUNCTION check_assignee_change_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    old_assignee UUID;
    new_assignee UUID;
BEGIN
    -- Determinar el técnico asignado antes del cambio (si aplica)
    IF TG_OP = 'UPDATE' THEN
        old_assignee := (OLD.datos_valores->>'asignado_a')::UUID;
    ELSE
        old_assignee := NULL;
    END IF;

    -- Extraer el técnico asignado nuevo
    new_assignee := (NEW.datos_valores->>'asignado_a')::UUID;

    -- Reglas para notificar:
    -- 1. Hay un usuario asignado (new_assignee NO ES NULL)
    -- 2. Es distinto al asignado anteriormente (o antes no había ninguno)
    IF new_assignee IS NOT NULL 
       AND (old_assignee IS NULL OR old_assignee != new_assignee) THEN
       
       INSERT INTO notificaciones (usuario_id, tarjeta_id, mensaje)
       VALUES (new_assignee, NEW.id, 'Te han asignado una nueva tarjeta de trabajo.');
       
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vincular el Trigger a la tabla tarjetas
DROP TRIGGER IF EXISTS trg_notificar_asignacion_update ON tarjetas;
CREATE TRIGGER trg_notificar_asignacion_update
    AFTER UPDATE ON tarjetas
    FOR EACH ROW
    EXECUTE FUNCTION check_assignee_change_and_notify();

DROP TRIGGER IF EXISTS trg_notificar_asignacion_insert ON tarjetas;
CREATE TRIGGER trg_notificar_asignacion_insert
    AFTER INSERT ON tarjetas
    FOR EACH ROW
    EXECUTE FUNCTION check_assignee_change_and_notify();
