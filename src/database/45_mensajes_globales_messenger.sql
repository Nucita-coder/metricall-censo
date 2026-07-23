-- 45_mensajes_globales_messenger.sql
-- Ampliación de la mensajería de soporte a Messenger Global con adjuntos de Tableros, Listas y Tarjetas

-- 1. Agregar columnas de adjuntos/referencias en soporte_mensajes
ALTER TABLE soporte_mensajes ADD COLUMN IF NOT EXISTS tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE SET NULL;
ALTER TABLE soporte_mensajes ADD COLUMN IF NOT EXISTS lista_id UUID REFERENCES listas(id) ON DELETE SET NULL;
ALTER TABLE soporte_mensajes ADD COLUMN IF NOT EXISTS tablero_id UUID REFERENCES tableros(id) ON DELETE SET NULL;
ALTER TABLE soporte_mensajes ADD COLUMN IF NOT EXISTS adjunto JSONB DEFAULT NULL;

-- 2. Índices para consultas optimizadas por adjunto
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_tarjeta ON soporte_mensajes(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_lista ON soporte_mensajes(lista_id);
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_tablero ON soporte_mensajes(tablero_id);
CREATE INDEX IF NOT EXISTS idx_soporte_mensajes_adjunto ON soporte_mensajes USING gin(adjunto);

-- 3. Asegurar RLS de lectura y escritura para cualquier miembro de la empresa
DROP POLICY IF EXISTS "Lectura de mensajes de soporte involucrados" ON soporte_mensajes;
CREATE POLICY "Lectura de mensajes de soporte involucrados" ON soporte_mensajes
    FOR SELECT USING (auth.uid() = emisor_id OR auth.uid() = receptor_id);

DROP POLICY IF EXISTS "Insercion de mensajes de soporte propia" ON soporte_mensajes;
CREATE POLICY "Insercion de mensajes de soporte propia" ON soporte_mensajes
    FOR INSERT WITH CHECK (auth.uid() = emisor_id);

DROP POLICY IF EXISTS "Actualizacion de leido para receptor" ON soporte_mensajes;
CREATE POLICY "Actualizacion de leido para receptor" ON soporte_mensajes
    FOR UPDATE USING (auth.uid() = receptor_id);

-- 4. Actualizar trigger para incluir vista previa de adjuntos en la notificación
CREATE OR REPLACE FUNCTION notificar_mensaje_soporte()
RETURNS TRIGGER AS $$
DECLARE
    nombre_emisor TEXT;
    texto_resumen TEXT;
BEGIN
    SELECT nombre_completo INTO nombre_emisor FROM perfiles WHERE id = NEW.emisor_id;
    IF nombre_emisor IS NULL THEN
        nombre_emisor := 'Usuario';
    END IF;

    IF NEW.adjunto IS NOT NULL AND NEW.adjunto->>'tipo' IS NOT NULL THEN
        texto_resumen := '📌 Adjuntó ' || (NEW.adjunto->>'tipo') || ': ' || (NEW.adjunto->>'titulo');
    ELSIF NEW.mensaje LIKE '[IMG]%' THEN
        texto_resumen := '📷 Imagen adjunta';
    ELSE
        texto_resumen := substring(NEW.mensaje from 1 for 40);
    END IF;

    INSERT INTO notificaciones (usuario_id, tarjeta_id, mensaje)
    VALUES (NEW.receptor_id, NEW.tarjeta_id, 'Nuevo mensaje de ' || nombre_emisor || ': ' || texto_resumen);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notificar_mensaje_soporte ON soporte_mensajes;
CREATE TRIGGER trg_notificar_mensaje_soporte
    AFTER INSERT ON soporte_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION notificar_mensaje_soporte();
