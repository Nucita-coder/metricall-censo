-- ========================================================================================
-- MIGRACIÓN DE DATOS: NORMALIZACIÓN DE SECTORES EN CENSO COMERCIAL
-- Objetivo: Unificar nombres de sectores dispersos a sus nombres canónicos oficiales
--           sin perder ninguna tarjeta ni información cargada hoy.
-- ========================================================================================

-- 1. Actualizar 'sector' y 'urbanizacion' en tarjetas de censo
UPDATE tarjetas
SET datos_valores = datos_valores 
  || jsonb_build_object(
      'sector',
      CASE 
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('inavis', 'sector inavi', 'sector inavis', 'inavi') THEN 'Inavi'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector ali primera', 'ali primera', 'alí primera') THEN 'Alí Primera'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector san rafael', 'san rafael') THEN 'San Rafael'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector la esperanza', 'la esperanza') THEN 'La Esperanza'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector san simon', 'san simon', 'san simón') THEN 'San Simón'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector flamingo', 'flamingo', 'urbanizacion flamingo') THEN 'Urbanización Flamingo'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector terraplen', 'terraplen', 'terraplén') THEN 'Terraplén'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector viento fresco', 'viento fresco') THEN 'Viento Fresco'
        ELSE COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', '')
      END,
      'urbanizacion',
      CASE 
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('inavis', 'sector inavi', 'sector inavis', 'inavi') THEN 'Inavi'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector ali primera', 'ali primera', 'alí primera') THEN 'Alí Primera'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector san rafael', 'san rafael') THEN 'San Rafael'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector la esperanza', 'la esperanza') THEN 'La Esperanza'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector san simon', 'san simon', 'san simón') THEN 'San Simón'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector flamingo', 'flamingo', 'urbanizacion flamingo') THEN 'Urbanización Flamingo'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector terraplen', 'terraplen', 'terraplén') THEN 'Terraplén'
        WHEN lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN ('sector viento fresco', 'viento fresco') THEN 'Viento Fresco'
        ELSE COALESCE(datos_valores->>'urbanizacion', datos_valores->>'sector', '')
      END
  )
WHERE 
  datos_valores->>'origen' = 'censo'
  OR datos_valores->>'fechaCenso' IS NOT NULL
  OR datos_valores->>'dispuestoCambiar' IS NOT NULL
  OR lower(trim(COALESCE(datos_valores->>'sector', datos_valores->>'urbanizacion', ''))) IN (
      'inavis', 'sector inavi', 'sector inavis',
      'sector ali primera', 'ali primera',
      'sector san rafael',
      'sector la esperanza',
      'sector san simon',
      'sector flamingo',
      'sector terraplen',
      'sector viento fresco'
  );
