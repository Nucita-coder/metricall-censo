-- =================================================================
-- MIGRACIÓN 101: Inicialización del Tablero ATENCIÓN DE FALLAS
-- =================================================================

DO $$
DECLARE
    r_sucursal RECORD;
    v_tablero_id UUID;
BEGIN
    FOR r_sucursal IN 
        SELECT id, empresa_id FROM public.sucursales
    LOOP
        -- Insertar el tablero "Atención de Fallas" si no existe en la sucursal
        INSERT INTO public.tableros (sucursal_id, empresa_id, nombre, descripcion, tipo)
        VALUES (r_sucursal.id, r_sucursal.empresa_id, 'Atención de Fallas', 'Tablero para la atención y seguimiento técnico de fallas', 'soporte')
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_tablero_id;

        -- Si ya existía, obtenemos su ID
        IF v_tablero_id IS NULL THEN
            SELECT id INTO v_tablero_id
            FROM public.tableros
            WHERE sucursal_id = r_sucursal.id AND nombre = 'Atención de Fallas'
            LIMIT 1;
        END IF;

        IF v_tablero_id IS NOT NULL THEN
            -- Crear las 5 listas del flujo de Atención de Fallas
            INSERT INTO public.listas (empresa_id, tablero_id, nombre, orden, color_fondo)
            VALUES 
                (r_sucursal.empresa_id, v_tablero_id, 'Por asignar', 1, 'rgba(255, 255, 255, 0.85)'),
                (r_sucursal.empresa_id, v_tablero_id, 'Asignado a', 2, 'rgba(255, 255, 255, 0.85)'),
                (r_sucursal.empresa_id, v_tablero_id, 'En Proceso', 3, 'rgba(255, 255, 255, 0.85)'),
                (r_sucursal.empresa_id, v_tablero_id, 'En Revisión', 4, 'rgba(255, 255, 255, 0.85)'),
                (r_sucursal.empresa_id, v_tablero_id, 'Falla Solventada', 5, 'rgba(255, 255, 255, 0.85)')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
