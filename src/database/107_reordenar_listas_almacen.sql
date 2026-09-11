-- ========================================================================================
-- MIGRACIÓN 107: Reordenar listas del tablero de Almacén
-- Secuencia objetivo:
-- 1. Carga de Materiales
-- 2. Material Recibido
-- 3. Material Asignado
-- 4. Recuperados
-- 5. Devolución de Asignación
-- 6. Devolución a Almacén Central
-- ========================================================================================

UPDATE listas l
SET orden = CASE
    WHEN LOWER(TRIM(l.nombre)) = 'carga de materiales' OR LOWER(TRIM(l.nombre)) ILIKE '%carga de materiales%' THEN 1
    WHEN LOWER(TRIM(l.nombre)) = 'material recibido' OR LOWER(TRIM(l.nombre)) ILIKE '%material recibido%' THEN 2
    WHEN LOWER(TRIM(l.nombre)) = 'material asignado' OR LOWER(TRIM(l.nombre)) ILIKE '%material asignado%' THEN 3
    WHEN LOWER(TRIM(l.nombre)) = 'recuperados' OR LOWER(TRIM(l.nombre)) ILIKE '%recuperado%' THEN 4
    WHEN LOWER(TRIM(l.nombre)) = 'devolución de asignación' OR LOWER(TRIM(l.nombre)) ILIKE '%devolución de asignación%' OR LOWER(TRIM(l.nombre)) ILIKE '%devolucion de asignacion%' THEN 5
    WHEN LOWER(TRIM(l.nombre)) = 'devolución a almacén central' OR LOWER(TRIM(l.nombre)) ILIKE '%almacén central%' OR LOWER(TRIM(l.nombre)) ILIKE '%almacen central%' THEN 6
    ELSE l.orden
END
FROM tableros t
WHERE l.tablero_id = t.id
  AND t.tipo = 'almacen';
