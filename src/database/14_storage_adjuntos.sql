-- Creación del Bucket Público "adjuntos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos', 'adjuntos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública (Para que la app pueda mostrar las imágenes en miniatura)
CREATE POLICY "Lectura publica de adjuntos" 
ON storage.objects FOR SELECT
USING (bucket_id = 'adjuntos');

-- Política de inserción (Para que los vendedores logueados puedan subir imágenes desde la app)
CREATE POLICY "Insercion de adjuntos autenticado" 
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'adjuntos' 
    AND auth.role() = 'authenticated'
);

-- Política de actualización y eliminación opcional (si un usuario necesita borrar o actualizar una foto)
CREATE POLICY "Edicion de adjuntos autenticado"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'adjuntos' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Eliminacion de adjuntos autenticado"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'adjuntos' 
    AND auth.role() = 'authenticated'
);
