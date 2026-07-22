-- Añadir la columna de fecha de actualización a la tabla tarjetas
ALTER TABLE tarjetas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear la función genérica de auto-actualización si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear el gatillo en la tabla tarjetas para que se dispare en cada actualización
CREATE TRIGGER update_tarjetas_updated_at
BEFORE UPDATE ON tarjetas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
