-- ─────────────────────────────────────────────────────────────────────────────
-- 51_storage_policy_whatsapp.sql
-- Crea bucket público 'evidencias-bot' y permite upload anónimo desde el webhook
-- EJECUTAR EN: Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Crear el bucket público si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-bot',
  'evidencias-bot',
  true,
  10485760,  -- 10 MB máx por archivo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760;

-- 2. Política: cualquier usuario (incluso anónimo) puede subir archivos
CREATE POLICY "Anon puede subir comprobantes de pago"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'evidencias-bot'
);

-- 3. Política: cualquiera puede leer los archivos del bucket (público)
CREATE POLICY "Público puede leer comprobantes"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (
  bucket_id = 'evidencias-bot'
);
