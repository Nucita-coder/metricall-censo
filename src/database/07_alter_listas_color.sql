-- ========================================================================================
-- ALTERACIÓN DE ESQUEMA: AÑADIR COLOR A LISTAS
-- ========================================================================================

-- Añadimos la columna 'color' a la tabla listas existente.
-- Le ponemos un color pastel semitraslúcido por defecto (rgba) para evitar errores si 
-- alguien inserta desde otra fuente.
ALTER TABLE listas ADD COLUMN color TEXT NOT NULL DEFAULT 'rgba(255, 249, 196, 0.4)';
