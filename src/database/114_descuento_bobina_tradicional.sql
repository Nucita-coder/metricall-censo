-- MIGRACIÓN 114: Descuento condicional de bobina vs preconectorizado en custodia técnica
-- Asegura que las bobinas (por metraje) solo se descuenten en instalación tradicional
-- y los paquetes de cable preconectorizado solo en instalación preconectorizada.

CREATE OR REPLACE FUNCTION fn_aplicar_impacto_tarjeta_custodia(
    p_tarjeta_id UUID,
    p_lista_id UUID,
    p_empresa_id UUID,
    p_datos JSONB,
    p_multiplicador NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tablero_tipo TEXT;
    v_tablero_nombre TEXT;
    v_lista_nombre TEXT;
    v_tipo_carga TEXT;
    v_es_almacen BOOLEAN := FALSE;
    v_es_instalacion BOOLEAN := FALSE;
    v_es_asignacion BOOLEAN := FALSE;
    v_tipo_instalacion TEXT;

    v_user_uuid UUID;
    v_nombre_resp TEXT;
    v_nombre_perfil TEXT;

    v_item JSONB;
    v_mat_k TEXT;
    v_mat_v TEXT;
    v_cant NUMERIC;
    v_codigo TEXT;
    v_nombre TEXT;
    v_modelo TEXT;
    v_delta_base NUMERIC;

    v_ont_cod TEXT;
    v_ont_nom TEXT;
    v_ont_mod TEXT;
    v_modelo_drop TEXT;
BEGIN
    IF p_datos IS NULL THEN
        RETURN;
    END IF;

    SELECT t.tipo, LOWER(TRIM(t.nombre)), LOWER(TRIM(l.nombre))
    INTO v_tablero_tipo, v_tablero_nombre, v_lista_nombre
    FROM listas l
    JOIN tableros t ON l.tablero_id = t.id
    WHERE l.id = p_lista_id;

    v_tipo_carga := UPPER(TRIM(COALESCE(p_datos->>'tipoCarga', '')));
    v_tipo_instalacion := LOWER(TRIM(COALESCE(p_datos->>'tipoInstalacion', 'tradicional')));

    v_es_almacen := (
        v_tablero_tipo = 'almacen'
        OR v_tipo_carga IN ('MATERIAL_ASIGNADO', 'DEVOLUCION_ASIGNACION', 'MATERIAL_RECIBIDO', 'DEVOLUCION_ALMACEN_CENTRAL')
        OR v_lista_nombre LIKE '%asignad%'
        OR v_lista_nombre LIKE '%devuelt%'
        OR v_lista_nombre LIKE '%recibid%'
    );

    v_es_asignacion := (
        v_tipo_carga = 'MATERIAL_ASIGNADO'
        OR v_lista_nombre LIKE '%material%asignad%'
        OR v_lista_nombre LIKE '%materiales asignados%'
        OR (v_es_almacen AND v_lista_nombre LIKE '%asignad%')
    );

    v_es_instalacion := (
        NOT v_es_almacen
        AND (
            v_tablero_tipo IN ('operaciones', 'instalaciones', 'censo', 'ventas', 'soporte')
            OR p_datos->'materiales' IS NOT NULL
            OR p_datos->>'serialEquipo' IS NOT NULL
            OR p_datos->>'serial_onu' IS NOT NULL
            OR p_datos->>'nroNap' IS NOT NULL
            OR p_datos->>'potencia_casa' IS NOT NULL
            OR p_datos->>'cable_drop' IS NOT NULL
            OR v_tablero_nombre LIKE '%instalac%'
            OR v_tablero_nombre LIKE '%atenci%'
            OR v_tablero_nombre LIKE '%falla%'
        )
    );

    -- ─────────────────────────────────────────────────────────────────────────────
    -- CASO A: TARJETA DE INSTALACIÓN / ATENCIÓN TÉCNICA (DESCUENTA DE CUSTODIA)
    -- ─────────────────────────────────────────────────────────────────────────────
    IF v_es_instalacion THEN
        v_user_uuid := safe_cast_uuid(COALESCE(p_datos->>'tecnico_id', p_datos->>'asignado_a'));
        v_nombre_resp := TRIM(COALESCE(p_datos->>'tecnicoAsignado', p_datos->>'tecnico', p_datos->>'asignadoA', p_datos->>'creadorNombre', ''));

        IF v_user_uuid IS NULL AND v_nombre_resp != '' THEN
            SELECT id, nombre_completo INTO v_user_uuid, v_nombre_perfil
            FROM perfiles
            WHERE LOWER(TRIM(nombre_completo)) = LOWER(TRIM(v_nombre_resp))
            LIMIT 1;
            IF v_nombre_perfil IS NOT NULL THEN
                v_nombre_resp := v_nombre_perfil;
            END IF;
        ELSIF v_user_uuid IS NOT NULL AND v_nombre_resp = '' THEN
            SELECT nombre_completo INTO v_nombre_resp FROM perfiles WHERE id = v_user_uuid;
        END IF;

        IF v_user_uuid IS NULL THEN
            RETURN;
        END IF;

        -- 1. Descontar insumos reportados en materiales
        IF p_datos->'materiales' IS NOT NULL AND jsonb_typeof(p_datos->'materiales') = 'object' THEN
            FOR v_mat_k, v_mat_v IN SELECT * FROM jsonb_each_text(p_datos->'materiales')
            LOOP
                v_cant := safe_cast_numeric(v_mat_v);

                -- Cable preconectorizado: SOLO se descuenta si la instalación es preconectorizada
                IF v_mat_k = 'cablePreconectorizado' AND TRIM(COALESCE(v_mat_v, '')) != '' THEN
                    IF v_tipo_instalacion = 'preconectorizado' THEN
                        v_cant := 1;
                        IF TRIM(v_mat_v) = '50' THEN
                            v_codigo := 'MAT-CABLE-DROP-50'; v_nombre := 'CABLE DROP 50 MTS';
                        ELSIF TRIM(v_mat_v) = '70' THEN
                            v_codigo := 'MAT-CABLE-DROP-70'; v_nombre := 'CABLE DROP 70 MTS';
                        ELSIF TRIM(v_mat_v) = '100' THEN
                            v_codigo := 'MAT-CABLE-DROP-100'; v_nombre := 'CABLE DROP 100 MTS';
                        ELSE
                            v_codigo := 'MAT-CABLE-PRECONECTORIZADO'; v_nombre := 'CABLE PRECONECTORIZADO';
                        END IF;
                    ELSE
                        v_codigo := NULL;
                    END IF;
                ELSIF v_cant > 0 THEN
                    CASE v_mat_k
                        WHEN 'ontConWifi' THEN v_codigo := 'MAT-ONT-CON-WIFI'; v_nombre := 'ONT CON WIFI';
                        WHEN 'ontSinWifi' THEN v_codigo := 'MAT-ONT-SIN-WIFI'; v_nombre := 'ONT SIN WIFI';
                        WHEN 'tensorPlastico' THEN v_codigo := 'MAT-TENSOR-PLASTICO'; v_nombre := 'TENSOR PLÁSTICO';
                        WHEN 'tensorHierro' THEN v_codigo := 'MAT-TENSOR-HIERRO'; v_nombre := 'TENSOR HIERRO';
                        WHEN 'grapas' THEN v_codigo := 'MAT-GRAPAS'; v_nombre := 'GRAPAS';
                        WHEN 'tirrap' THEN v_codigo := 'MAT-TIRRAP'; v_nombre := 'TIRRAP';
                        WHEN 'pachCordApc' THEN v_codigo := 'MAT-PACH-APC'; v_nombre := 'PACH CORD APC';
                        WHEN 'pachCordUpc' THEN v_codigo := 'MAT-PACH-UPC'; v_nombre := 'PACH CORD UPC';
                        WHEN 'pachCordApcUpc' THEN v_codigo := 'MAT-PACH-APC-UPC'; v_nombre := 'PACH CORD APC/UPC';
                        WHEN 'cajaTerminalCon' THEN v_codigo := 'MAT-CAJA-TERM-CON'; v_nombre := 'CAJA TERM. CON ACCESORIOS';
                        WHEN 'cajaTerminalSin' THEN v_codigo := 'MAT-CAJA-TERM-SIN'; v_nombre := 'CAJA TERM. SIN ACCESORIOS';
                        WHEN 'conectorAcople' THEN v_codigo := 'MAT-CONECTOR-ACOPLE-HH'; v_nombre := 'CONECTOR/ACOPLE H-H';
                        WHEN 'conectorMecanicoApc' THEN v_codigo := 'MAT-CONECTOR-MEC-APC'; v_nombre := 'CONECTOR MECÁNICO APC';
                        WHEN 'conectorMecanicoUpc' THEN v_codigo := 'MAT-CONECTOR-MEC-UPC'; v_nombre := 'CONECTOR MECÁNICO UPC';
                        WHEN 'precinto' THEN v_codigo := 'MAT-PRECINTO'; v_nombre := 'PRECINTO';
                        WHEN 'cableDrop' THEN v_codigo := 'MAT-CABLE-DROP'; v_nombre := 'CABLE DROP';
                        WHEN 'cable_drop' THEN v_codigo := 'MAT-CABLE-DROP'; v_nombre := 'CABLE DROP';
                        ELSE v_codigo := NULL;
                    END CASE;
                ELSE
                    v_codigo := NULL;
                END IF;

                IF v_codigo IS NOT NULL AND v_cant > 0 THEN
                    -- Si el técnico tiene su stock registrado bajo MAT-CABLE-PRECONECTORIZADO general
                    IF v_mat_k = 'cablePreconectorizado' THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM stock_custodia_personal
                            WHERE usuario_id = v_user_uuid AND codigo_material = v_codigo
                        ) AND EXISTS (
                            SELECT 1 FROM stock_custodia_personal
                            WHERE usuario_id = v_user_uuid AND codigo_material = 'MAT-CABLE-PRECONECTORIZADO'
                        ) THEN
                            v_codigo := 'MAT-CABLE-PRECONECTORIZADO';
                            v_nombre := 'CABLE PRECONECTORIZADO';
                        END IF;
                    END IF;

                    INSERT INTO stock_custodia_personal (
                        empresa_id, usuario_id, usuario_nombre, codigo_material, nombre_material, modelo_material, cantidad, updated_at
                    ) VALUES (
                        p_empresa_id, v_user_uuid, v_nombre_resp, v_codigo, v_nombre, 'GENERAL', -1 * v_cant * p_multiplicador, now()
                    )
                    ON CONFLICT (usuario_id, codigo_material, modelo_material)
                    DO UPDATE SET
                        cantidad = stock_custodia_personal.cantidad + EXCLUDED.cantidad,
                        usuario_nombre = COALESCE(NULLIF(EXCLUDED.usuario_nombre, ''), stock_custodia_personal.usuario_nombre),
                        empresa_id = COALESCE(stock_custodia_personal.empresa_id, EXCLUDED.empresa_id),
                        updated_at = now();
                END IF;
            END LOOP;
        END IF;

        -- 2. Descontar cable drop (bobina en metros) si vino en campo separado SOLO si es tradicional
        IF v_tipo_instalacion != 'preconectorizado' THEN
            v_cant := safe_cast_numeric(COALESCE(p_datos->>'cable_drop', p_datos->>'cableDrop'));
            IF v_cant > 0 THEN
                -- Identificar el modelo exacto que el técnico tiene asignado en custodia para MAT-CABLE-DROP
                SELECT modelo_material INTO v_modelo_drop
                FROM stock_custodia_personal
                WHERE usuario_id = v_user_uuid AND codigo_material = 'MAT-CABLE-DROP'
                ORDER BY cantidad DESC LIMIT 1;

                IF v_modelo_drop IS NULL THEN
                    v_modelo_drop := 'DROP';
                END IF;

                INSERT INTO stock_custodia_personal (
                    empresa_id, usuario_id, usuario_nombre, codigo_material, nombre_material, modelo_material, cantidad, updated_at
                ) VALUES (
                    p_empresa_id, v_user_uuid, v_nombre_resp, 'MAT-CABLE-DROP', 'CABLE DROP', v_modelo_drop, -1 * v_cant * p_multiplicador, now()
                )
                ON CONFLICT (usuario_id, codigo_material, modelo_material)
                DO UPDATE SET
                    cantidad = stock_custodia_personal.cantidad + EXCLUDED.cantidad,
                    updated_at = now();
            END IF;
        END IF;

        -- 3. Descontar ONT/ONU si vino serial y NO fue reportado en materiales
        IF TRIM(COALESCE(p_datos->>'serialEquipo', p_datos->>'serial_onu', '')) != ''
           AND safe_cast_numeric(p_datos->'materiales'->>'ontConWifi') = 0
           AND safe_cast_numeric(p_datos->'materiales'->>'ontSinWifi') = 0 THEN
            SELECT codigo_material, nombre_material, modelo_material
            INTO v_ont_cod, v_ont_nom, v_ont_mod
            FROM stock_custodia_personal
            WHERE usuario_id = v_user_uuid
              AND (codigo_material ILIKE '%ONT%' OR nombre_material ILIKE '%ONT%')
            ORDER BY cantidad DESC
            LIMIT 1;

            IF v_ont_cod IS NOT NULL THEN
                UPDATE stock_custodia_personal
                SET cantidad = stock_custodia_personal.cantidad + (-1 * p_multiplicador),
                    updated_at = now()
                WHERE usuario_id = v_user_uuid
                  AND codigo_material = v_ont_cod
                  AND modelo_material = v_ont_mod;
            END IF;
        END IF;

        RETURN;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- CASO B: TARJETA DE ALMACÉN (ASIGNACIÓN O DEVOLUCIÓN A CUSTODIA)
    -- ─────────────────────────────────────────────────────────────────────────────
    IF NOT (v_tipo_carga IN ('MATERIAL_ASIGNADO', 'DEVOLUCION_ASIGNACION')
            OR v_lista_nombre LIKE '%asignad%'
            OR v_lista_nombre LIKE '%devuelt%') THEN
        RETURN;
    END IF;

    IF v_es_asignacion THEN
        v_delta_base := 1 * p_multiplicador;
        v_nombre_resp := TRIM(COALESCE(p_datos->>'asignadoA', p_datos->>'tecnicoAsignado', p_datos->>'recibidoPor', ''));
    ELSE
        v_delta_base := -1 * p_multiplicador;
        v_nombre_resp := TRIM(COALESCE(p_datos->>'entregadoPor', p_datos->>'asignadoA', p_datos->>'tecnicoAsignado', ''));
    END IF;

    v_user_uuid := safe_cast_uuid(p_datos->>'asignado_a');

    IF v_user_uuid IS NULL AND v_nombre_resp != '' THEN
        SELECT id, nombre_completo INTO v_user_uuid, v_nombre_perfil
        FROM perfiles
        WHERE LOWER(TRIM(nombre_completo)) = LOWER(TRIM(v_nombre_resp))
        LIMIT 1;
        IF v_nombre_perfil IS NOT NULL THEN
            v_nombre_resp := v_nombre_perfil;
        END IF;
    ELSIF v_user_uuid IS NOT NULL AND v_nombre_resp = '' THEN
        SELECT nombre_completo INTO v_nombre_resp FROM perfiles WHERE id = v_user_uuid;
    END IF;

    IF v_user_uuid IS NULL THEN
        RETURN;
    END IF;

    IF jsonb_typeof(p_datos->'items') = 'array' AND jsonb_array_length(p_datos->'items') > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_datos->'items')
        LOOP
            v_codigo := UPPER(TRIM(COALESCE(v_item->>'codigoMaterial', '')));
            v_nombre := UPPER(TRIM(COALESCE(v_item->>'nombreMaterial', 'MATERIAL')));
            v_modelo := UPPER(TRIM(COALESCE(v_item->>'modeloMaterial', 'GENERAL')));
            IF v_modelo = '' THEN v_modelo := 'GENERAL'; END IF;
            v_cant := safe_cast_numeric(COALESCE(v_item->>'cantidadRecibida', v_item->>'cantidad'));

            IF v_cant > 0 AND (v_codigo != '' OR v_nombre != '') THEN
                IF v_codigo = '' THEN v_codigo := 'SIN-CÓDIGO'; END IF;

                INSERT INTO stock_custodia_personal (
                    empresa_id, usuario_id, usuario_nombre, codigo_material, nombre_material, modelo_material, cantidad, updated_at
                ) VALUES (
                    p_empresa_id, v_user_uuid, v_nombre_resp, v_codigo, v_nombre, v_modelo, v_cant * v_delta_base, now()
                )
                ON CONFLICT (usuario_id, codigo_material, modelo_material)
                DO UPDATE SET
                    cantidad = stock_custodia_personal.cantidad + EXCLUDED.cantidad,
                    usuario_nombre = COALESCE(NULLIF(EXCLUDED.usuario_nombre, ''), stock_custodia_personal.usuario_nombre),
                    nombre_material = COALESCE(NULLIF(EXCLUDED.nombre_material, ''), stock_custodia_personal.nombre_material),
                    empresa_id = COALESCE(stock_custodia_personal.empresa_id, EXCLUDED.empresa_id),
                    updated_at = now();
            END IF;
        END LOOP;
    ELSE
        v_codigo := UPPER(TRIM(COALESCE(p_datos->>'codigoMaterial', '')));
        v_nombre := UPPER(TRIM(COALESCE(p_datos->>'nombreMaterial', 'MATERIAL')));
        v_modelo := UPPER(TRIM(COALESCE(p_datos->>'modeloMaterial', 'GENERAL')));
        IF v_modelo = '' THEN v_modelo := 'GENERAL'; END IF;
        v_cant := safe_cast_numeric(COALESCE(p_datos->>'cantidadRecibida', p_datos->>'cantidad'));

        IF v_cant > 0 AND (v_codigo != '' OR v_nombre != '') THEN
            IF v_codigo = '' THEN v_codigo := 'SIN-CÓDIGO'; END IF;

            INSERT INTO stock_custodia_personal (
                empresa_id, usuario_id, usuario_nombre, codigo_material, nombre_material, modelo_material, cantidad, updated_at
            ) VALUES (
                p_empresa_id, v_user_uuid, v_nombre_resp, v_codigo, v_nombre, v_modelo, v_cant * v_delta_base, now()
            )
            ON CONFLICT (usuario_id, codigo_material, modelo_material)
            DO UPDATE SET
                cantidad = stock_custodia_personal.cantidad + EXCLUDED.cantidad,
                usuario_nombre = COALESCE(NULLIF(EXCLUDED.usuario_nombre, ''), stock_custodia_personal.usuario_nombre),
                nombre_material = COALESCE(NULLIF(EXCLUDED.nombre_material, ''), stock_custodia_personal.nombre_material),
                empresa_id = COALESCE(stock_custodia_personal.empresa_id, EXCLUDED.empresa_id),
                updated_at = now();
        END IF;
    END IF;
END;
$$;
