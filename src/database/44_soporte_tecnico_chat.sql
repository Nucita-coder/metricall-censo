-- 44_soporte_tecnico_chat.sql
-- Integración de Soporte Técnico y Mensajería de Soporte

-- 1. Agregar columna soporte_tecnico_id en la tabla empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS soporte_tecnico_id UUID REFERENCES perfiles(id) ON DELETE SET NULL;

-- 2. Crear tabla soporte_mensajes
CREATE TABLE IF NOT EXISTS soporte_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    emisor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    receptor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_empresa ON soporte_mensajes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_conversacion ON soporte_mensajes(emisor_id, receptor_id);
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_created ON soporte_mensajes(created_at);

-- Permisos
GRANT ALL ON soporte_mensajes TO authenticated;
GRANT ALL ON soporte_mensajes TO service_role;

-- 3. Habilitar RLS
ALTER TABLE soporte_mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de mensajes de soporte involucrados" ON soporte_mensajes;
CREATE POLICY "Lectura de mensajes de soporte involucrados" ON soporte_mensajes
    FOR SELECT USING (auth.uid() = emisor_id OR auth.uid() = receptor_id);

DROP POLICY IF EXISTS "Insercion de mensajes de soporte propia" ON soporte_mensajes;
CREATE POLICY "Insercion de mensajes de soporte propia" ON soporte_mensajes
    FOR INSERT WITH CHECK (auth.uid() = emisor_id);

DROP POLICY IF EXISTS "Actualizacion de leido para receptor" ON soporte_mensajes;
CREATE POLICY "Actualizacion de leido para receptor" ON soporte_mensajes
    FOR UPDATE USING (auth.uid() = receptor_id);

-- 4. Habilitar Realtime para soporte_mensajes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'soporte_mensajes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE soporte_mensajes;
    END IF;
END
$$;

-- 5. Trigger para crear notificación automática en la campana
CREATE OR REPLACE FUNCTION notificar_mensaje_soporte()
RETURNS TRIGGER AS $$
DECLARE
    nombre_emisor TEXT;
BEGIN
    SELECT nombre_completo INTO nombre_emisor FROM perfiles WHERE id = NEW.emisor_id;
    IF nombre_emisor IS NULL THEN
        nombre_emisor := 'Usuario';
    END IF;

    INSERT INTO notificaciones (usuario_id, mensaje)
    VALUES (NEW.receptor_id, 'Nuevo mensaje de soporte técnico de ' || nombre_emisor || ': ' || substring(NEW.mensaje from 1 for 40));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_mensaje_soporte ON soporte_mensajes;
CREATE TRIGGER trg_notificar_mensaje_soporte
    AFTER INSERT ON soporte_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION notificar_mensaje_soporte();
