-- ========================================================================================
-- MIGRACIÓN 109: Arquitectura Ledger Transaccional de Custodia Personal de Materiales
-- Sincroniza Asignaciones, Devoluciones y Consumo en Instalaciones de forma atómica.
-- ========================================================================================

-- 1. Crear tabla relacional stock_custodia_personal
CREATE TABLE IF NOT EXISTS stock_custodia_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usuario_nombre TEXT,
    codigo_material TEXT NOT NULL,
    nombre_material TEXT NOT NULL,
    modelo_material TEXT NOT NULL DEFAULT 'GENERAL',
    cantidad NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_custodia_personal UNIQUE (usuario_id, codigo_material, modelo_material)
);

-- 2. Índices para alto rendimiento (< 5ms)
CREATE INDEX IF NOT EXISTS idx_stock_custodia_usuario ON stock_custodia_personal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_stock_custodia_saldo ON stock_custodia_personal(usuario_id, cantidad);
CREATE INDEX IF NOT EXISTS idx_stock_custodia_empresa ON stock_custodia_personal(empresa_id);

-- 3. Habilitar RLS y Políticas de Acceso
ALTER TABLE stock_custodia_personal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura stock_custodia_personal" ON stock_custodia_personal;
CREATE POLICY "Lectura stock_custodia_personal" ON stock_custodia_personal
    FOR SELECT USING (
        is_developer()
        OR usuario_id = auth.uid()
        OR (empresa_id IS NOT NULL AND empresa_id = get_user_tenant())
    );

DROP POLICY IF EXISTS "Escritura stock_custodia_personal" ON stock_custodia_personal;
CREATE POLICY "Escritura stock_custodia_personal" ON stock_custodia_personal
    FOR ALL USING (
        is_developer()
        OR (empresa_id IS NOT NULL AND empresa_id = get_user_tenant())
    );

-- 4. Funciones auxiliares de casteo seguro
CREATE OR REPLACE FUNCTION safe_cast_numeric(p_val TEXT, p_default NUMERIC DEFAULT 0)
RETURNS NUMERIC AS $$
BEGIN
    IF p_val IS NULL OR TRIM(p_val) = '' THEN
        RETURN p_default;
    END IF;
    RETURN p_val::NUMERIC;
EXCEPTION WHEN OTHERS THEN
    RETURN p_default;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION safe_cast_uuid(p_val TEXT)
RETURNS UUID AS $$
BEGIN
    IF p_val IS NULL OR TRIM(p_val) = '' THEN
        RETURN NULL;
    END IF;
    RETURN p_val::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Función central de aplicación de impacto transaccional
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
    v_tipo_carga       TEXT;
    v_lista_nombre     TEXT;
    v_tablero_tipo     TEXT;
    v_es_devolucion    BOOLEAN;
    v_es_asignacion    BOOLEAN;
    v_es_instalacion   BOOLEAN;
    v_delta_base       NUMERIC;
    v_user_uuid        UUID;
    v_nombre_resp      TEXT;
    v_nombre_perfil    TEXT;
    v_item             JSONB;
    v_codigo           TEXT;
    v_nombre           TEXT;
    v_modelo           TEXT;
    v_cant             NUMERIC;
    v_mat_k            TEXT;
    v_mat_v            TEXT;
    v_ont_cod          TEXT;
    v_ont_nom          TEXT;
    v_ont_mod          TEXT;
BEGIN
    IF p_datos IS NULL THEN
        RETURN;
    END IF;

    v_tipo_carga := TRIM(UPPER(COALESCE(p_datos->>'tipoCarga', '')));

    -- Obtener metadata de la lista y tablero
    SELECT LOWER(TRIM(l.nombre)), t.tipo
    INTO v_lista_nombre, v_tablero_tipo
    FROM listas l
    JOIN tableros t ON l.tablero_id = t.id
    WHERE l.id = p_lista_id;

    -- Identificar si es tarjeta de instalación con materiales o equipo reportados
    v_es_instalacion := (
        (p_datos->'materiales' IS NOT NULL AND p_datos->'materiales' != '{}'::jsonb)
        OR (p_datos->>'serialEquipo' IS NOT NULL AND TRIM(p_datos->>'serialEquipo') != '')
        OR (p_datos->>'serial_onu' IS NOT NULL AND TRIM(p_datos->>'serial_onu') != '')
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

        -- 1. Descontar los insumos reportados en materiales
        IF p_datos->'materiales' IS NOT NULL AND jsonb_typeof(p_datos->'materiales') = 'object' THEN
            FOR v_mat_k, v_mat_v IN SELECT * FROM jsonb_each_text(p_datos->'materiales')
            LOOP
                v_cant := safe_cast_numeric(v_mat_v);
                -- Si es cablePreconectorizado ('50', '70', '100'), la cantidad consumida es 1 paquete/rollo
                IF v_mat_k = 'cablePreconectorizado' AND TRIM(COALESCE(v_mat_v, '')) != '' THEN
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

        -- 2. Descontar cable drop si vino en campo separado
        v_cant := safe_cast_numeric(COALESCE(p_datos->>'cable_drop', p_datos->>'cableDrop'));
        IF v_cant > 0 THEN
            INSERT INTO stock_custodia_personal (
                empresa_id, usuario_id, usuario_nombre, codigo_material, nombre_material, modelo_material, cantidad, updated_at
            ) VALUES (
                p_empresa_id, v_user_uuid, v_nombre_resp, 'MAT-CABLE-DROP', 'CABLE DROP', 'DROP', -1 * v_cant * p_multiplicador, now()
            )
            ON CONFLICT (usuario_id, codigo_material, modelo_material)
            DO UPDATE SET
                cantidad = stock_custodia_personal.cantidad + EXCLUDED.cantidad,
                updated_at = now();
        END IF;

        -- 3. Descontar equipo ONT/ONU si vino serial y NO fue reportado en materiales
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
    -- CASO B: TARJETAS DE ALMACÉN (ASIGNACIÓN O DEVOLUCIÓN DE ASIGNACIÓN)
    -- ─────────────────────────────────────────────────────────────────────────────
    IF COALESCE(v_tablero_tipo, '') != 'almacen'
       AND v_tipo_carga NOT ILIKE '%ASIGNA%'
       AND v_tipo_carga NOT ILIKE '%DEVOLUC%' THEN
        RETURN;
    END IF;

    IF v_tipo_carga ILIKE '%CENTRAL%' OR COALESCE(v_lista_nombre, '') ILIKE '%CENTRAL%' THEN
        RETURN;
    END IF;

    v_es_devolucion := (
        v_tipo_carga ILIKE '%DEVOLUC%'
        OR COALESCE(v_lista_nombre, '') ILIKE '%DEVOLUC%'
    );

    v_es_asignacion := (
        NOT v_es_devolucion
        AND (
            v_tipo_carga ILIKE '%ASIGNA%'
            OR COALESCE(v_lista_nombre, '') ILIKE '%ASIGNA%'
        )
    );

    IF NOT v_es_asignacion AND NOT v_es_devolucion THEN
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

-- 6. Trigger automático sobre la tabla tarjetas
CREATE OR REPLACE FUNCTION fn_sync_custodia_personal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM fn_aplicar_impacto_tarjeta_custodia(OLD.id, OLD.lista_id, OLD.empresa_id, OLD.datos_valores, -1);
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM fn_aplicar_impacto_tarjeta_custodia(NEW.id, NEW.lista_id, NEW.empresa_id, NEW.datos_valores, 1);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.datos_valores IS DISTINCT FROM NEW.datos_valores
           OR OLD.lista_id IS DISTINCT FROM NEW.lista_id
           OR OLD.empresa_id IS DISTINCT FROM NEW.empresa_id THEN
            PERFORM fn_aplicar_impacto_tarjeta_custodia(OLD.id, OLD.lista_id, OLD.empresa_id, OLD.datos_valores, -1);
            PERFORM fn_aplicar_impacto_tarjeta_custodia(NEW.id, NEW.lista_id, NEW.empresa_id, NEW.datos_valores, 1);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_custodia_personal ON tarjetas;
CREATE TRIGGER trg_sync_custodia_personal
AFTER INSERT OR UPDATE OR DELETE ON tarjetas
FOR EACH ROW
EXECUTE FUNCTION fn_sync_custodia_personal();

-- 7. Rutina de Backfill Inicial (Población inmediata de saldos exactos)
DO $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    TRUNCATE TABLE stock_custodia_personal;

    FOR r IN (
        SELECT t.id, t.lista_id, t.empresa_id, t.datos_valores
        FROM tarjetas t
        JOIN listas l ON t.lista_id = l.id
        JOIN tableros tab ON l.tablero_id = tab.id
        WHERE tab.tipo = 'almacen'
           OR t.datos_valores->>'tipoCarga' IS NOT NULL
           OR t.datos_valores->'materiales' IS NOT NULL
           OR t.datos_valores->>'serialEquipo' IS NOT NULL
        ORDER BY t.created_at ASC
    ) LOOP
        PERFORM fn_aplicar_impacto_tarjeta_custodia(r.id, r.lista_id, r.empresa_id, r.datos_valores, 1);
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Backfill de stock_custodia_personal completado con éxito (% tarjetas procesadas).', v_count;
END;
$$;
