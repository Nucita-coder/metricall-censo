-- 116_notificaciones_detalladas_inteligentes.sql
-- Objetivo: Generar notificaciones detalladas y específicas con información de Tablero, Lista, Cliente y Asignador
-- Eliminar mensajes genéricos ("Te han asignado una nueva tarjeta de trabajo") por descripciones ricas y operativas.
-- ========================================================================================

CREATE OR REPLACE FUNCTION check_assignee_change_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    old_assignee UUID;
    new_assignee UUID;
    tipo_carga TEXT;
    v_tablero_nombre TEXT;
    v_lista_nombre TEXT;
    v_cliente TEXT;
    v_sector TEXT;
    v_plan TEXT;
    v_asignador_nombre TEXT;
    v_mensaje_notif TEXT;
BEGIN
    -- 1. Determinar asignado anterior
    IF TG_OP = 'UPDATE' THEN
        old_assignee := (OLD.datos_valores->>'asignado_a')::UUID;
    ELSE
        old_assignee := NULL;
    END IF;

    -- 2. Determinar asignado nuevo
    new_assignee := (NEW.datos_valores->>'asignado_a')::UUID;

    -- 3. Identificar si es tarjeta de almacén (estas tienen su propia notificación especializada)
    tipo_carga := TRIM(UPPER(COALESCE(NEW.datos_valores->>'tipoCarga', '')));
    IF tipo_carga IN (
        'CARGA DE MATERIALES',
        'MATERIAL ASIGNADO',
        'DEVOLUCION A ALMACEN CENTRAL',
        'DEVOLUCION DE ASIGNACION',
        'MATERIAL RECUPERADO'
    ) THEN
        RETURN NEW;
    END IF;

    -- 4. Evaluar si hubo asignación o reasignación a un usuario válido
    IF new_assignee IS NOT NULL AND (old_assignee IS NULL OR old_assignee != new_assignee) THEN

        -- Obtener nombres del Tablero y de la Lista
        SELECT t.nombre, l.nombre
        INTO v_tablero_nombre, v_lista_nombre
        FROM listas l
        JOIN tableros t ON l.tablero_id = t.id
        WHERE l.id = NEW.lista_id;

        -- Extraer datos específicos de la tarjeta
        v_cliente := COALESCE(
            NULLIF(TRIM(NEW.datos_valores->>'cliente'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'nombreApellido'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'nombre'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'NOMBRE Y APELLIDO'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'titulo'), ''),
            'Nueva Tarjeta'
        );

        v_sector := COALESCE(
            NULLIF(TRIM(NEW.datos_valores->>'sector'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'urbanizacion'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'zona'), ''),
            ''
        );

        v_plan := COALESCE(
            NULLIF(TRIM(NEW.datos_valores->>'plan'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'servicio'), ''),
            NULLIF(TRIM(NEW.datos_valores->>'tipoServicio'), ''),
            ''
        );

        -- Determinar quién realizó la asignación
        SELECT nombre_completo INTO v_asignador_nombre
        FROM perfiles
        WHERE id = auth.uid();

        -- Construir mensaje estructurado y descriptivo
        v_mensaje_notif := 'Asignación en ' || COALESCE(v_tablero_nombre, 'Operaciones') || ': ' || v_cliente;

        IF v_sector <> '' THEN
            v_mensaje_notif := v_mensaje_notif || ' (' || v_sector || ')';
        END IF;

        IF v_lista_nombre IS NOT NULL AND v_lista_nombre <> '' THEN
            v_mensaje_notif := v_mensaje_notif || ' en lista "' || v_lista_nombre || '"';
        END IF;

        IF v_asignador_nombre IS NOT NULL AND auth.uid() <> new_assignee THEN
            v_mensaje_notif := v_mensaje_notif || '. Asignado por ' || v_asignador_nombre;
        END IF;

        -- Insertar notificación enriquecida
        INSERT INTO notificaciones (usuario_id, tarjeta_id, mensaje, leida)
        VALUES (new_assignee, NEW.id, v_mensaje_notif, false);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
