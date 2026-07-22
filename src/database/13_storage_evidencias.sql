-- Creación del Bucket Público "evidencias"
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Seguridad (RLS) para el Bucket
-- Asegurarse de que el bucket tenga RLS activo (aunque por defecto las policies aplican sobre la tabla objects)

-- Política de lectura pública (Cualquiera puede ver la evidencia)
CREATE POLICY "Evidencias públicas para todos" 
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias');

-- Política de inserción (Solo usuarios logueados pueden subir archivos)
CREATE POLICY "Insertar evidencias autenticado" 
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'evidencias' 
    AND auth.role() = 'authenticated'
);
