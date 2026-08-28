-- ============================================================
-- 50_rpc_whatsapp_cobranza.sql
-- Función RPC para crear tarjetas de Reporte de Pago en la lista Cobranza
-- ============================================================

CREATE OR REPLACE FUNCTION public.bot_crear_tarjeta_cobranza(
  p_cedula          TEXT,
  p_referencia      TEXT,
  p_monto           TEXT,
  p_banco           TEXT,
  p_telefono        TEXT,
  p_comprobante_url TEXT DEFAULT NULL,
  p_nombre          TEXT DEFAULT NULL
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
  -- 1. Buscar primero la lista "REPORTE PAGO" o "pago" (Gestión Online)
  SELECT id, empresa_id
  INTO v_lista_id, v_empresa_id
  FROM public.listas
  WHERE lower(nombre) LIKE '%reporte%pago%' OR lower(nombre) LIKE '%reporte de pago%' OR lower(nombre) = 'reporte pago'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_lista_id IS NULL THEN
    SELECT id, empresa_id
    INTO v_lista_id, v_empresa_id
    FROM public.listas
    WHERE lower(nombre) LIKE '%pago%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_lista_id IS NULL THEN
    SELECT id, empresa_id
    INTO v_lista_id, v_empresa_id
    FROM public.listas
    WHERE lower(nombre) LIKE '%cobranza%' OR lower(nombre) LIKE '%recupero%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_lista_id IS NULL THEN
    SELECT id, empresa_id
    INTO v_lista_id, v_empresa_id
    FROM public.listas
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_lista_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ninguna lista en la base de datos';
  END IF;

  -- 2. Obtener creador (líder de la empresa)
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

  v_nombre_final := COALESCE(NULLIF(p_nombre, ''), 'Cliente Pago WhatsApp');
  IF p_cedula IS NOT NULL AND p_cedula <> '' THEN
    v_nombre_final := v_nombre_final || ' (' || p_cedula || ')';
  END IF;

  -- 3. Crear tarjeta de Cobranza con adjuntos
  INSERT INTO public.tarjetas (lista_id, empresa_id, creador_id, datos_valores)
  VALUES (
    v_lista_id,
    v_empresa_id,
    v_creador_id,
    jsonb_build_object(
      'nombreApellido',      v_nombre_final,
      'documentoIdentidad',  COALESCE(p_cedula, ''),
      'nroAbonado',          COALESCE(p_cedula, ''),
      'referencia',          COALESCE(p_referencia, ''),
      'montoPago',           COALESCE(p_monto, ''),
      'bancoOrigen',         COALESCE(p_banco, ''),
      'telefonoMovil',       COALESCE(p_telefono, ''),
      'comprobantePagoUrl',  COALESCE(p_comprobante_url, ''),
      'adjuntos',            CASE WHEN p_comprobante_url IS NOT NULL AND p_comprobante_url <> '' THEN jsonb_build_array(p_comprobante_url) ELSE jsonb_build_array() END,
      'origen',              'WhatsApp Bot',
      'fechaPago',           to_char(now(), 'YYYY-MM-DD'),
      'estadoCobranza',      'Pendiente Verificación'
    )
  )
  RETURNING id INTO v_tarjeta_id;

  RETURN v_tarjeta_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_cobranza(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_cobranza(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

