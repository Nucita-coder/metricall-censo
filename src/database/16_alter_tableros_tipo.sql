-- Migración para añadir tipología a los tableros
ALTER TABLE tableros ADD COLUMN tipo TEXT NOT NULL DEFAULT 'instalaciones';
