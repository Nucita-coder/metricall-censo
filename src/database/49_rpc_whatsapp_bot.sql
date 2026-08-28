-- ============================================================
-- 49_rpc_whatsapp_bot.sql
-- Funciones RPC para el bot de WhatsApp que bypasan RLS
-- usando SECURITY DEFINER (se ejecutan como el propietario)
-- ============================================================

-- Función para crear una tarjeta en la lista "ventas online" sin RLS
CREATE OR REPLACE FUNCTION public.bot_crear_tarjeta_suscripcion(
  p_nombre     TEXT,
  p_sector     TEXT,
  p_telefono   TEXT
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
BEGIN
  -- Buscar la lista "ventas online" (case-insensitive)
  SELECT id, empresa_id
  INTO v_lista_id, v_empresa_id
  FROM public.listas
  WHERE lower(nombre) LIKE '%ventas online%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: buscar cualquier lista que contenga "ventas"
  IF v_lista_id IS NULL THEN
    SELECT id, empresa_id
    INTO v_lista_id, v_empresa_id
    FROM public.listas
    WHERE lower(nombre) LIKE '%ventas%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Fallback final: primera lista disponible
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

  -- Obtener el creador_id: el líder de la empresa (primer perfil con rol lider)
  SELECT id
  INTO v_creador_id
  FROM public.perfiles
  WHERE empresa_id = v_empresa_id
    AND rol = 'lider'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: cualquier perfil de la empresa
  IF v_creador_id IS NULL THEN
    SELECT id
    INTO v_creador_id
    FROM public.perfiles
    WHERE empresa_id = v_empresa_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_creador_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún perfil en la empresa para asignar como creador';
  END IF;

  -- Insertar la tarjeta con el creador_id del líder
  INSERT INTO public.tarjetas (lista_id, empresa_id, creador_id, datos_valores)
  VALUES (
    v_lista_id,
    v_empresa_id,
    v_creador_id,
    jsonb_build_object(
      'nombreApellido', p_nombre,
      'sector',         p_sector,
      'telefonoMovil',  p_telefono,
      'origen',         'WhatsApp Bot',
      'fechaVenta',     to_char(now(), 'YYYY-MM-DD')
    )
  )
  RETURNING id INTO v_tarjeta_id;

  RETURN v_tarjeta_id;
END;
$$;

-- Dar acceso a usuarios anónimos y autenticados para ejecutar esta función
GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_suscripcion(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.bot_crear_tarjeta_suscripcion(TEXT, TEXT, TEXT) TO authenticated;

