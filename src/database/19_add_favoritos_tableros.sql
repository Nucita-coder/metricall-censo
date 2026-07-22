-- Migración para añadir campos de organización a los tableros
ALTER TABLE tableros ADD COLUMN IF NOT EXISTS es_favorito BOOLEAN DEFAULT false;
ALTER TABLE tableros ADD COLUMN IF NOT EXISTS es_anclado BOOLEAN DEFAULT false;
