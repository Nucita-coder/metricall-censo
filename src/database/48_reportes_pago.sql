-- Tabla para almacenar los reportes de pago procesados por WhatsApp Bot
CREATE TABLE IF NOT EXISTS reportes_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_telefono TEXT NOT NULL,
    cedula TEXT,
    referencia TEXT,
    monto TEXT,
    telefono_pago_movil TEXT,
    banco TEXT,
    comprobante_url TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aprobado' | 'rechazado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Permisos RLS y Grants
ALTER TABLE reportes_pago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON reportes_pago FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON reportes_pago FOR ALL TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE ON reportes_pago TO anon;
GRANT SELECT, INSERT, UPDATE ON reportes_pago TO authenticated;

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reportes_pago;
