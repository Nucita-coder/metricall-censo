-- MIGRACIÓN 115: Limpieza de asignación errónea en tarjetas de Material Recibido / Almacén
-- Corrige tarjetas creadas previamente en 'Material Recibido' o 'Carga de Materiales'
-- que hayan heredado involuntariamente 'asignadoA', 'asignado_a', 'vendedor' o 'asesorComercial'.

UPDATE public.tarjetas t
SET datos_valores = (
    COALESCE(t.datos_valores, '{}'::jsonb)
    - 'asignadoA'
    - 'asignado_a'
    - 'vendedor'
    - 'asesorComercial'
)
FROM public.listas l
WHERE t.lista_id = l.id
  AND (
    l.nombre ILIKE '%material recibido%'
    OR l.nombre ILIKE '%carga de material%'
    OR l.nombre ILIKE '%recuperado%'
    OR l.nombre ILIKE '%almacen central%'
    OR t.datos_valores->>'tipoCarga' ILIKE '%material recibido%'
    OR t.datos_valores->>'tipoCarga' ILIKE '%carga de material%'
  )
  AND (
    t.datos_valores ? 'asignadoA'
    OR t.datos_valores ? 'asignado_a'
  );
