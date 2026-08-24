-- =================================================================
-- MIGRACIÓN 099: Inicialización del Tablero COBRANZA-RECUPERO-CHURN
-- =================================================================

DO $$
DECLARE
    v_empresa_id UUID;
    v_sucursal_id UUID;
    v_tablero_id UUID;
BEGIN
    -- Obtenemos la primera sucursal activa
    SELECT s.id, s.empresa_id INTO v_sucursal_id, v_empresa_id
    FROM public.sucursales s
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_sucursal_id IS NOT NULL THEN
        -- Insertar el tablero si no existe
        INSERT INTO public.tableros (sucursal_id, empresa_id, nombre, descripcion, tipo)
        VALUES (v_sucursal_id, v_empresa_id, 'COBRANZA-RECUPERO-CHURN', 'Tablero para el seguimiento y recuperación de clientes cortados', 'cobranza')
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_tablero_id;

        -- Si ya existía, obtenemos su ID
        IF v_tablero_id IS NULL THEN
            SELECT id INTO v_tablero_id
            FROM public.tableros
            WHERE sucursal_id = v_sucursal_id AND nombre = 'COBRANZA-RECUPERO-CHURN'
            LIMIT 1;
        END IF;

        IF v_tablero_id IS NOT NULL THEN
            -- Crear las listas del flujo de cobranza (3 listas únicamente)
            INSERT INTO public.listas (empresa_id, tablero_id, nombre, orden, color_fondo)
            VALUES 
                (v_empresa_id, v_tablero_id, 'Carga de cobranza clientes cortados', 1, 'rgba(255, 255, 255, 0.85)'),
                (v_empresa_id, v_tablero_id, 'Acción efectiva', 2, 'rgba(255, 255, 255, 0.85)'),
                (v_empresa_id, v_tablero_id, 'Acción negativa', 3, 'rgba(255, 255, 255, 0.85)')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
