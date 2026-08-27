-- Tabla para logs del bot de WhatsApp en tiempo real
CREATE TABLE IF NOT EXISTS whatsapp_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL DEFAULT 'incoming', -- 'incoming' | 'outgoing' | 'error' | 'button'
    numero_telefono TEXT,
    mensaje_texto TEXT,
    contenido JSONB DEFAULT '{}'::jsonb,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_tipo ON whatsapp_webhook_logs (tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON whatsapp_webhook_logs (created_at DESC);

-- Habilitar RLS
ALTER TABLE whatsapp_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario autenticado puede leer y escribir (para el panel admin)
CREATE POLICY "Allow authenticated read" ON whatsapp_webhook_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon insert" ON whatsapp_webhook_logs
    FOR INSERT TO anon WITH CHECK (true);

-- Habilitar Realtime para que el panel se actualice en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_webhook_logs;
