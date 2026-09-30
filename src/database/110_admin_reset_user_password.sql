-- ========================================================================================
-- MIGRACIÓN 110: Restablecer contraseña de usuario por el Developer
-- Propietario: Anthony Huice | anthonyhuice92@gmail.com
-- UUID: ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    p_target_user_id UUID,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    -- 1. Verificar si el usuario ejecutor es el developer
    v_is_dev := (
        auth.uid() = 'ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47'::UUID
        OR EXISTS (
            SELECT 1 FROM public.perfiles 
            WHERE id = auth.uid() AND LOWER(rol::TEXT) IN ('developer', 'desarrollador')
        )
    );

    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Acceso denegado: Solo el desarrollador tiene permisos para restablecer contraseñas de usuarios.';
    END IF;

    -- 2. Validar que la nueva contraseña cumpla con el mínimo de caracteres
    IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe contener al menos 6 caracteres.';
    END IF;

    -- 3. Comprobar existencia del usuario en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
        RAISE EXCEPTION 'El usuario destino no existe en el sistema de autenticación.';
    END IF;

    -- 4. Actualizar contraseña cifrada con bcrypt en auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(trim(p_new_password), gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_target_user_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO service_role;
