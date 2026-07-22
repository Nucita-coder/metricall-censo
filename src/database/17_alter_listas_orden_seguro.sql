-- Misión: Menú de Tres Puntos y Reordenamiento de Listas (Drag & Drop)
ALTER TABLE listas ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;
