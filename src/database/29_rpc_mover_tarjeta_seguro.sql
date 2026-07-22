-- ========================================================================================
-- RPC GLOBAL: mover_tarjeta_seguro
-- Descripción: Mueve una tarjeta de forma atómica a una lista destino por nombre.
-- Seguridad: SECURITY DEFINER (bypassea RLS para escribir).
-- Esta función resuelve el problema de tarjetas que deben moverse a listas 
-- a las cuales el empleado no tiene permiso de lectura/escritura (ej. "Factibilidad").
-- ========================================================================================

CREATE OR REPLACE FUNCTION mover_tarjeta_seguro(
    p_tarjeta_id UUID,
    p_nombre_lista_destino TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tablero_id UUID;
    v_lista_destino_id UUID;
    v_creador_id UUID;
    v_asignado_a UUID;
    v_empresa_id UUID;
BEGIN
    -- 1. Validar que la tarjeta existe y obtener su información crítica
    SELECT 
        tar.creador_id, 
        tar.empresa_id,
        lis.tablero_id,
        (tar.datos_valores->>'asignado_a')::UUID
    INTO 
        v_creador_id, 
        v_empresa_id,
        v_tablero_id,
        v_asignado_a
    FROM tarjetas tar
    JOIN listas lis ON tar.lista_id = lis.id
    WHERE tar.id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La tarjeta no existe.';
    END IF;

    -- 2. Validación de seguridad ABAC mínima
    -- Permitimos el movimiento si es el creador, el asignado, o si es superusuario (el frontend bloquea la UI, 
    -- pero el backend asegura que no manipulen tarjetas ajenas a menos que tengan el rol).
    -- Aquí simplificamos permitiendo a auth.uid() si es creador o asignado.
    IF v_creador_id != auth.uid() AND (v_asignado_a IS NULL OR v_asignado_a != auth.uid()) THEN
        -- Si no es creador ni asignado, verificamos si es líder/supervisor (tienen acceso global en su tenant)
        IF NOT EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
              AND empresa_id = v_empresa_id 
              AND rol IN ('lider', 'lider_sucursal', 'supervisor')
        ) THEN
            RAISE EXCEPTION 'Acceso denegado: Solo el creador, el asignado o un supervisor pueden mover esta tarjeta.';
        END IF;
    END IF;

    -- 3. Buscar el ID de la lista destino dentro del mismo tablero
    -- Se hace internamente porque el frontend podría tener esta lista oculta por RLS.
    SELECT id INTO v_lista_destino_id
    FROM listas
    WHERE tablero_id = v_tablero_id 
      AND nombre = p_nombre_lista_destino
      AND empresa_id = v_empresa_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la lista destino "%" en este tablero.', p_nombre_lista_destino;
    END IF;

    -- 4. Ejecutar el UPDATE seguro
    UPDATE tarjetas 
    SET lista_id = v_lista_destino_id
    WHERE id = p_tarjeta_id;

END;
$$;
