-- 39_fix_mover_tarjeta_empleados.sql
-- Permite a usuarios empleados mover tarjetas de forma segura si son creadores, asignados,
-- o si tienen permisos granulares en empleado_lista_permisos o permisos_especiales.

CREATE OR REPLACE FUNCTION mover_tarjeta_seguro(
    p_tarjeta_id UUID,
    p_lista_destino_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tablero_id       UUID;
    v_creador_id       UUID;
    v_asignado_a       UUID;
    v_empresa_id       UUID;
    v_lista_origen_id  UUID;
    v_nombre_origen    TEXT;
    v_nombre_destino   TEXT;
    v_usuario_email    TEXT;
    v_datos_actuales   JSONB;
    v_log_movimiento   JSONB;
    v_historial_nuevo  JSONB;
BEGIN
    -- 1. Obtener información crítica de la tarjeta y la lista de origen
    SELECT
        tar.creador_id,
        tar.empresa_id,
        lis.tablero_id,
        (tar.datos_valores->>'asignado_a')::UUID,
        tar.lista_id,
        lis.nombre,
        tar.datos_valores
    INTO
        v_creador_id,
        v_empresa_id,
        v_tablero_id,
        v_asignado_a,
        v_lista_origen_id,
        v_nombre_origen,
        v_datos_actuales
    FROM tarjetas tar
    JOIN listas lis ON tar.lista_id = lis.id
    WHERE tar.id = p_tarjeta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La tarjeta con ID % no existe.', p_tarjeta_id;
    END IF;

    -- 2. Obtener el nombre de la lista de destino
    SELECT nombre INTO v_nombre_destino
    FROM listas
    WHERE id = p_lista_destino_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La lista destino no existe.';
    END IF;

    -- 3. Validación de tenant: el usuario debe pertenecer a la misma empresa
    IF v_empresa_id IS DISTINCT FROM get_user_tenant() THEN
        RAISE EXCEPTION 'Acceso denegado: La tarjeta no pertenece a tu empresa.';
    END IF;

    -- 4. Validación de Origen / Permisos (ABAC + RBAC Relacional)
    IF v_creador_id IS DISTINCT FROM auth.uid()
       AND (v_asignado_a IS NULL OR v_asignado_a IS DISTINCT FROM auth.uid())
    THEN
        IF NOT EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid()
              AND empresa_id = v_empresa_id
              AND (
                  rol IN ('lider', 'lider_sucursal', 'supervisor') 
                  OR (get_user_permissions()->'listas_permitidas') ? v_lista_origen_id::text
              )
        ) AND NOT EXISTS (
            SELECT 1 FROM empleado_lista_permisos elp
            WHERE elp.empleado_id = auth.uid()
              AND elp.lista_id = v_lista_origen_id
              AND (elp.puede_ver = true OR elp.puede_editar = true OR elp.puede_crear = true)
        ) THEN
            RAISE EXCEPTION 'Acceso denegado: No tienes permiso sobre la lista de origen.';
        END IF;
    END IF;

    -- 5. Obtener correo del usuario ejecutante
    SELECT COALESCE(email, 'Usuario Registrado') INTO v_usuario_email
    FROM auth.users
    WHERE id = auth.uid();

    -- 6. Construir entrada de log de movimiento
    IF v_lista_origen_id IS DISTINCT FROM p_lista_destino_id THEN
        v_log_movimiento := jsonb_build_object(
            'id', extract(epoch from now())::text,
            'autor', v_usuario_email,
            'fecha', to_jsonb(now()),
            'tipo', 'movimiento',
            'modificaciones', jsonb_build_array(
                jsonb_build_object(
                    'campo', 'lista_id',
                    'valor_anterior', v_nombre_origen,
                    'valor_nuevo', v_nombre_destino,
                    'lista_origen_id', v_lista_origen_id,
                    'lista_destino_id', p_lista_destino_id
                )
            )
        );

        IF jsonb_typeof(v_datos_actuales->'historial_auditoria') = 'array' THEN
            v_historial_nuevo := (v_datos_actuales->'historial_auditoria') || jsonb_build_array(v_log_movimiento);
        ELSE
            v_historial_nuevo := jsonb_build_array(v_log_movimiento);
        END IF;

        v_datos_actuales := jsonb_set(
            COALESCE(v_datos_actuales, '{}'::jsonb),
            '{historial_auditoria}',
            v_historial_nuevo
        );
    END IF;

    -- 7. Mover la tarjeta y actualizar la auditoría de forma atómica
    UPDATE tarjetas
    SET 
        lista_id = p_lista_destino_id,
        datos_valores = v_datos_actuales,
        updated_at = NOW()
    WHERE id = p_tarjeta_id;

END;
$$;

GRANT EXECUTE ON FUNCTION mover_tarjeta_seguro(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mover_tarjeta_seguro(UUID, UUID) TO service_role;
