-- 108_fix_trigger_notificacion_almacen.sql
-- Objetivo: Evitar que el trigger genérico de notificación de tarjetas
-- dispare para tarjetas de ALMACÉN, ya que estas tienen su propia
-- notificación específica enviada desde el frontend (tarjetaCreacionService.ts).
-- Sin este fix, al asignar material se generaban 2 notificaciones:
--   1. "Te han asignado una nueva tarjeta de trabajo." (trigger genérico)
--   2. "Se te asignó X und. de MAT-XXX. Este material está ahora en tu custodia." (frontend)
-- ========================================================================================

CREATE OR REPLACE FUNCTION check_assignee_change_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    old_assignee UUID;
    new_assignee UUID;
    tipo_carga TEXT;
BEGIN
    -- Determinar el técnico asignado antes del cambio (si aplica)
    IF TG_OP = 'UPDATE' THEN
        old_assignee := (OLD.datos_valores->>'asignado_a')::UUID;
    ELSE
        old_assignee := NULL;
    END IF;

    -- Extraer el técnico asignado nuevo
    new_assignee := (NEW.datos_valores->>'asignado_a')::UUID;

    -- Extraer el tipoCarga para identificar tarjetas de almacén
    tipo_carga := TRIM(UPPER(COALESCE(NEW.datos_valores->>'tipoCarga', '')));

    -- Si es una tarjeta de almacén, NO notificar desde el trigger.
    -- El frontend (tarjetaCreacionService.ts) ya envía la notificación específica.
    IF tipo_carga IN (
        'CARGA DE MATERIALES',
        'MATERIAL ASIGNADO',
        'DEVOLUCION A ALMACEN CENTRAL',
        'DEVOLUCION DE ASIGNACION',
        'MATERIAL RECUPERADO'
    ) THEN
        RETURN NEW;
    END IF;

    -- Reglas para notificar tarjetas de trabajo normales:
    -- 1. Hay un usuario asignado (new_assignee NO ES NULL)
    -- 2. Es distinto al asignado anteriormente (o antes no había ninguno)
    IF new_assignee IS NOT NULL
       AND (old_assignee IS NULL OR old_assignee != new_assignee) THEN

       INSERT INTO notificaciones (usuario_id, tarjeta_id, mensaje)
       VALUES (new_assignee, NEW.id, 'Te han asignado una nueva tarjeta de trabajo.');

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
