-- Tabla para almacenar el estado de las conversaciones activas del bot de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sesiones (
    numero_telefono TEXT PRIMARY KEY,
    estado TEXT NOT NULL DEFAULT 'INICIO', -- 'INICIO' | 'ESPERANDO_DATOS_SUSCRIPCION'
    datos_temporales JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Índice para acelerar búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_whatsapp_sesiones_estado ON whatsapp_sesiones (estado);

-- Habilitar Row Level Security (RLS)
ALTER TABLE whatsapp_sesiones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura
CREATE POLICY "Allow authenticated full access whatsapp_sesiones" ON whatsapp_sesiones
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert update whatsapp_sesiones" ON whatsapp_sesiones
    FOR ALL TO anon USING (true) WITH CHECK (true);
