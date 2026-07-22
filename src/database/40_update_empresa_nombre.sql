-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: ACTUALIZAR NOMBRE DE LA EMPRESA A 'Fibex Telecom'
-- ========================================================================================

UPDATE empresas 
SET nombre = 'Fibex Telecom' 
WHERE LOWER(nombre) LIKE '%administrador%' OR LOWER(nombre) LIKE '%empresa%';
