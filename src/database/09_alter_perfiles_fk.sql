-- ========================================================================================
-- ALTERACIÓN DE ESQUEMA: FK SUCURSAL EN PERFILES
-- Problema: No se podían borrar sucursales si un usuario estaba asignado a ella (RESTRICT)
-- Solución: Cambiar a SET NULL para que el usuario quede "sin sucursal" en vez de bloquear
-- ========================================================================================

-- 1. Eliminar la restricción actual
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS fk_sucursal;

-- 2. Añadir la restricción con ON DELETE SET NULL
ALTER TABLE perfiles ADD CONSTRAINT fk_sucursal 
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;
