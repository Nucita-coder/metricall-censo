-- ============================================================
-- 52_rpc_whatsapp_falla.sql
-- Función RPC para registrar tarjetas de Reporte de Falla desde WhatsApp
-- ============================================================

CREATE OR REPLACE FUNCTION public.bot_crear_tarjeta_falla(
  p_nombre      TEXT,
  p_cedula      TEXT,
  p_telefono    TEXT,
  p_tipo_falla  TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lista_id   UUID;
  v_empresa_id UUID;
  v_creador_id UUID;
  v_tarjeta_id UUID;
  v_nombre_final TEXT;
BEGIN
  -- Definir título de la tarjeta
  IF p_nombre IS NOT NULL AND p_nombre <> '' AND p_nombre <> 'Cliente WhatsApp' THEN
    v_nombre_final := p_nombre || ' - ' || COALESCE(p_tipo_falla, 'Falla Técnica');
  ELSIF p_cedula IS NOT NULL AND p_cedula <> '' THEN
    v_nombre_final := 'Falla (' || p_cedula || ') - ' || COALESCE(p_tipo_falla, 'Falla Técnica');
  ELSE
    v_nombre_final := 'Reporte Falla WhatsApp';
  END IF;

  -- 1. Buscar lista "soporte", "falla" o "reclamo"
  SELECT id, empresa_id
  INTO v_lista_id, v_empresa_id
  FROM public.listas
  WHERE lower(nombre) LIKE '%soporte%' OR lower(nombre) LIKE '%falla%' OR lower(nombre) LIKE '%reclamo%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: primera lista disponible
  IF v_lista_id IS NULL THEN
    SELECT id, empresa_id
    INTO v_lista_id, v_empresa_id
    FROM public.listas
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_lista_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ninguna lista disponible para registrar la falla';
  END IF;

  -- 2. Obtener creador_id: el líder de la empresa
  SELECT id INTO v_creador_id
  FROM public.perfiles
  WHERE empresa_id = v_empresa_id AND rol = 'lider'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_creador_id IS NULL THEN
    SELECT id INTO v_creador_id
    FROM public.perfiles
    WHERE empresa_id = v_empresa_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- 3. Crear tarjeta de Falla Técnica
  INSERT INTO public.tarjetas (lista_id, empresa_id, creador_id, datos_valores)
  VALUES (
    v_lista_id,
    v_empresa_id,
    v_creador_id,
    jsonb_build_object(
      'nombreApellido',      v_nombre_final,
      'nombreCliente',       COALESCE(p_nombre, ''),
      'documentoIdentidad',  COALESCE(p_cedula, ''),
      'nroAbonado',          COALESCE(p_cedula, ''),
      'telefonoMovil',       COALESCE(p_telefono, ''),
      'tipoFalla',           COALESCE(p_tipo_falla, ''),
      'origen',              'WhatsApp Bot - Soporte',
      'fechaReporte',        to_char(now(), 'YYYY-MM-DD'),
      'estadoSoporte',       'Pendiente Técnico'
    )
  )
  RETURNING id INTO v_tarjeta_id;

  RETURN v_tarjeta_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_falla(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_falla(TEXT, TEXT, TEXT, TEXT) TO authenticated;
