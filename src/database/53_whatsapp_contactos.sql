-- ============================================================
-- MIGRACIÓN 53: TABLA DE CONTACTOS Y MODERACIÓN DE WHATSAPP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_contactos (
    numero_telefono TEXT PRIMARY KEY,
    nombre TEXT DEFAULT 'Desconocido',
    bloqueado BOOLEAN DEFAULT false,
    motivo_bloqueo TEXT,
    total_mensajes INTEGER DEFAULT 1,
    ultimo_mensaje TEXT,
    primer_contacto TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contactos_bloqueado ON public.whatsapp_contactos (bloqueado);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contactos_ultimo ON public.whatsapp_contactos (ultimo_contacto DESC);

-- Habilitar RLS
ALTER TABLE public.whatsapp_contactos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_contactos' AND policyname = 'Permitir lectura a autenticados en whatsapp_contactos'
    ) THEN
        CREATE POLICY "Permitir lectura a autenticados en whatsapp_contactos"
            ON public.whatsapp_contactos FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_contactos' AND policyname = 'Permitir full access a anon y service_role en whatsapp_contactos'
    ) THEN
        CREATE POLICY "Permitir full access a anon y service_role en whatsapp_contactos"
            ON public.whatsapp_contactos FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_contactos' AND policyname = 'Permitir update a autenticados en whatsapp_contactos'
    ) THEN
        CREATE POLICY "Permitir update a autenticados en whatsapp_contactos"
            ON public.whatsapp_contactos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Habilitar Realtime si la publicación existe
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contactos;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
