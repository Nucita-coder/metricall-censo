-- 1. Añadir la columna 'etiquetas' como un arreglo de texto para permitir múltiples roles operativos
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';
