-- ============================================================
-- MIGRACIÓN 102: RPC ROBUSTO PARA ELIMINAR MIEMBROS DE EMPRESA
-- ============================================================

CREATE OR REPLACE FUNCTION public.eliminar_miembro_empresa(p_miembro_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_empresa_id UUID;
    v_caller_rol TEXT;
    v_target_empresa_id UUID;
    v_target_rol TEXT;
BEGIN
    -- 1. Obtener empresa y rol de quien ejecuta la llamada (auth.uid())
    SELECT empresa_id, rol INTO v_caller_empresa_id, v_caller_rol
    FROM public.perfiles
    WHERE id = auth.uid();

    IF v_caller_empresa_id IS NULL THEN
        RAISE EXCEPTION 'El usuario que ejecuta la acción no pertenece a ninguna empresa.';
    END IF;

    IF v_caller_rol NOT IN ('lider', 'lider_sucursal', 'supervisor', 'admin', 'administrador') THEN
        RAISE EXCEPTION 'No tienes permisos de administrador para eliminar miembros.';
    END IF;

    -- 2. Obtener datos del miembro objetivo
    SELECT empresa_id, rol INTO v_target_empresa_id, v_target_rol
    FROM public.perfiles
    WHERE id = p_miembro_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El perfil especificado no existe.';
    END IF;

    IF v_target_empresa_id IS DISTINCT FROM v_caller_empresa_id THEN
        RAISE EXCEPTION 'Acceso denegado: El miembro no pertenece a tu misma empresa.';
    END IF;

    IF p_miembro_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminarte a ti mismo de la empresa.';
    END IF;

    IF v_target_rol = 'lider' THEN
        RAISE EXCEPTION 'No se puede eliminar a un líder de la empresa.';
    END IF;

    -- 3. Limpiar permisos relacionales si existe la tabla
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empleado_lista_permisos') THEN
        DELETE FROM public.empleado_lista_permisos WHERE empleado_id = p_miembro_id;
    END IF;

    -- 4. Limpiar solicitudes de acceso si existe la tabla
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='solicitudes_acceso') THEN
        DELETE FROM public.solicitudes_acceso WHERE usuario_id = p_miembro_id;
    END IF;

    -- 5. Desvincular el perfil de la empresa (etiquetas es TEXT[])
    UPDATE public.perfiles
    SET empresa_id = NULL,
        sucursal_id = NULL,
        rol = 'empleado',
        etiquetas = '{}',
        permisos_especiales = '{}'::jsonb,
        updated_at = NOW()
    WHERE id = p_miembro_id;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.eliminar_miembro_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_miembro_empresa(UUID) TO service_role;
