-- 43_eliminar_miembro_empresa.sql
-- Permite a líderes/supervisores desvincular a un empleado de la empresa de forma limpia y segura.

CREATE OR REPLACE FUNCTION eliminar_miembro_empresa(p_miembro_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_miembro_empresa_id UUID;
    v_miembro_rol TEXT;
BEGIN
    -- 1. Obtener tenant y rol del miembro target
    SELECT empresa_id, rol INTO v_miembro_empresa_id, v_miembro_rol
    FROM perfiles WHERE id = p_miembro_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El perfil especificado no existe.';
    END IF;

    -- 2. Validar pertenencia a la misma empresa
    IF v_miembro_empresa_id IS DISTINCT FROM get_user_tenant() THEN
        RAISE EXCEPTION 'Acceso denegado: El usuario no pertenece a tu empresa.';
    END IF;

    -- 3. Prevenir auto-eliminación
    IF p_miembro_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminarte a ti mismo de la empresa.';
    END IF;

    -- 4. Prevenir eliminar líder
    IF v_miembro_rol = 'lider' THEN
        RAISE EXCEPTION 'No se puede eliminar a un líder de la empresa.';
    END IF;

    -- 5. Eliminar permisos de lista del empleado
    DELETE FROM empleado_lista_permisos WHERE empleado_id = p_miembro_id;

    -- 6. Eliminar solicitudes de acceso del empleado
    DELETE FROM solicitudes_acceso WHERE usuario_id = p_miembro_id;

    -- 7. Desvincular el perfil de la empresa
    UPDATE perfiles
    SET empresa_id = NULL,
        sucursal_id = NULL,
        rol = 'empleado',
        etiquetas = '[]'::jsonb,
        permisos_especiales = '{}'::jsonb,
        updated_at = NOW()
    WHERE id = p_miembro_id;
END;
$$;

GRANT EXECUTE ON FUNCTION eliminar_miembro_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION eliminar_miembro_empresa(UUID) TO service_role;
