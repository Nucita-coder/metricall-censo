-- =================================================================
-- MIGRACIÓN 100: Sistema de Archivado Mensual COBRANZA-RECUPERO-CHURN
-- =================================================================

-- 1. Añadir columna mes_periodo (ej. "2026-08")
ALTER TABLE public.tableros
  ADD COLUMN IF NOT EXISTS mes_periodo VARCHAR(7) DEFAULT NULL;

-- 2. Añadir columna archivado (indica si el tablero fue cerrado para ese mes)
ALTER TABLE public.tableros
  ADD COLUMN IF NOT EXISTS archivado BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. RPC para cerrar el mes del tablero de cobranza y crear el siguiente automáticamente
CREATE OR REPLACE FUNCTION public.archivar_tablero_cobranza(p_tablero_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tablero       RECORD;
  v_mes_nombres   TEXT[] := ARRAY[
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  v_now           TIMESTAMPTZ := NOW();
  v_mes_index     INT := EXTRACT(MONTH FROM v_now)::INT;       -- 1-12
  v_anio          INT := EXTRACT(YEAR FROM v_now)::INT;
  v_mes_str       VARCHAR(7);
  v_nombre_mes    TEXT;
  v_nuevo_nombre  TEXT;

  -- Para el siguiente mes
  v_sig_mes_index INT;
  v_sig_anio      INT;
  v_sig_nombre    TEXT;
  v_sig_mes_str   VARCHAR(7);

  v_nuevo_tablero_id UUID;
BEGIN
  -- Obtener datos del tablero actual
  SELECT * INTO v_tablero FROM public.tableros WHERE id = p_tablero_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tablero no encontrado');
  END IF;

  -- Construir mes_periodo y nombre del mes actual
  v_mes_str    := v_anio || '-' || LPAD(v_mes_index::TEXT, 2, '0');
  v_nombre_mes := v_mes_nombres[v_mes_index];
  v_nuevo_nombre := 'COBRANZA - ' || v_nombre_mes || ' ' || v_anio;

  -- Archivar el tablero actual
  UPDATE public.tableros
  SET
    archivado   = TRUE,
    mes_periodo = v_mes_str,
    nombre      = v_nuevo_nombre
  WHERE id = p_tablero_id;

  -- Calcular siguiente mes
  IF v_mes_index = 12 THEN
    v_sig_mes_index := 1;
    v_sig_anio      := v_anio + 1;
  ELSE
    v_sig_mes_index := v_mes_index + 1;
    v_sig_anio      := v_anio;
  END IF;

  v_sig_nombre  := v_mes_nombres[v_sig_mes_index];
  v_sig_mes_str := v_sig_anio || '-' || LPAD(v_sig_mes_index::TEXT, 2, '0');

  -- Crear el tablero del siguiente mes
  INSERT INTO public.tableros (
    sucursal_id, empresa_id, nombre, descripcion, tipo, mes_periodo, archivado
  )
  VALUES (
    v_tablero.sucursal_id,
    v_tablero.empresa_id,
    'COBRANZA - ' || v_sig_nombre || ' ' || v_sig_anio,
    'Tablero para el seguimiento y recuperación de clientes cortados',
    'cobranza',
    v_sig_mes_str,
    FALSE
  )
  RETURNING id INTO v_nuevo_tablero_id;

  -- Crear las 6 listas del nuevo tablero
  INSERT INTO public.listas (empresa_id, tablero_id, nombre, orden, color_fondo)
  VALUES
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Carga de cobranza clientes cortados', 1, 'rgba(255, 255, 255, 0.85)'),
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Acción efectiva',                     2, 'rgba(255, 255, 255, 0.85)'),
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Acción negativa',                     3, 'rgba(255, 255, 255, 0.85)'),
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Recupero',                            4, 'rgba(255, 255, 255, 0.85)'),
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Acción efectiva (Recupero)',          5, 'rgba(255, 255, 255, 0.85)'),
    (v_tablero.empresa_id, v_nuevo_tablero_id, 'Acción negativa (Recupero)',          6, 'rgba(255, 255, 255, 0.85)');

  RETURN jsonb_build_object(
    'ok',                  true,
    'tablero_archivado_id', p_tablero_id,
    'nombre_archivado',    v_nuevo_nombre,
    'nuevo_tablero_id',    v_nuevo_tablero_id,
    'nuevo_nombre',        'COBRANZA - ' || v_sig_nombre || ' ' || v_sig_anio
  );
END;
$$;

-- 4. Grants para que usuarios autenticados puedan llamar la RPC
GRANT EXECUTE ON FUNCTION public.archivar_tablero_cobranza(UUID) TO authenticated;
