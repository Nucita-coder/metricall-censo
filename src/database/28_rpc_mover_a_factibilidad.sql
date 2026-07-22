-- ========================================================================================
-- RPC: mover_a_factibilidad
-- Descripción: Mueve una tarjeta de la lista actual (ej. Venta) a Factibilidad.
-- Seguridad: SECURITY DEFINER (bypassea RLS para escribir). Valida que el creador de 
-- la tarjeta sea el usuario actual.
-- ========================================================================================

CREATE OR REPLACE FUNCTION mover_a_factibilidad(
    p_tarjeta_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tablero_id UUID;
    v_lista_factibilidad_id UUID;
    v_creador_id UUID;
    v_empresa_id UUID;
BEGIN
    -- 1. Validar que la tarjeta existe y obtener su creador, empresa y tablero
    SELECT 
        tar.creador_id, 
        tar.empresa_id,
        lis.tablero_id
    INTO 
        v_creador_id, 
        v_empresa_id,
        v_tablero_id
    FROM tarjetas tar
    JOIN listas lis ON tar.lista_id = lis.id
    WHERE tar.id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La tarjeta no existe.';
    END IF;

    -- 2. Validación de seguridad estricta: Solo el creador puede moverla
    IF v_creador_id != auth.uid() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo el creador de la tarjeta puede enviarla a Factibilidad.';
    END IF;

    -- 3. Buscar el ID de la lista "Factibilidad" dentro del mismo tablero
    -- Lo hacemos en el backend porque el frontend no tiene permiso RLS para leer listas ocultas.
    SELECT id INTO v_lista_factibilidad_id
    FROM listas
    WHERE tablero_id = v_tablero_id 
      AND nombre = 'Factibilidad'
      AND empresa_id = v_empresa_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la lista "Factibilidad" en este tablero.';
    END IF;

    -- 4. Ejecutar el UPDATE seguro
    UPDATE tarjetas 
    SET lista_id = v_lista_factibilidad_id
    WHERE id = p_tarjeta_id;

END;
$$;
