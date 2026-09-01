-- ============================================================
-- MIGRACIÓN 104-B: SEGUNDO PASO — Setup completo del developer
-- ⚠️ EJECUTAR SOLO DESPUÉS DE QUE 104a_rol_developer_enum.sql
--    HAYA SIDO EJECUTADO Y CONFIRMADO CON ÉXITO.
-- Propietario: Anthony Huice | anthonyhuice92@gmail.com
-- UUID: ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- PASO 2: Asignar el rol developer a la cuenta del propietario
-- ──────────────────────────────────────────────────────────
UPDATE public.perfiles
SET rol = 'developer'
WHERE id = 'ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47';

-- ──────────────────────────────────────────────────────────
-- PASO 3: Función helper — is_developer()
-- Retorna TRUE si el usuario autenticado es el developer.
-- Usada en RLS y RPCs para bypass total.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = 'ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47'::UUID;
$$;

GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_developer() TO service_role;

-- ──────────────────────────────────────────────────────────
-- PASO 4: get_user_role() ahora retorna TEXT
-- (para mayor compatibilidad con el nuevo valor del ENUM)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT rol::TEXT FROM public.perfiles WHERE id = auth.uid();
$$;

-- ──────────────────────────────────────────────────────────
-- PASO 5: Políticas RLS — Bypass total para el developer
-- ──────────────────────────────────────────────────────────

-- PERFILES
DROP POLICY IF EXISTS "Developer - Full Access Perfiles" ON public.perfiles;
CREATE POLICY "Developer - Full Access Perfiles"
ON public.perfiles FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- EMPRESAS
DROP POLICY IF EXISTS "Developer - Full Access Empresas" ON public.empresas;
CREATE POLICY "Developer - Full Access Empresas"
ON public.empresas FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- SUCURSALES
DROP POLICY IF EXISTS "Developer - Full Access Sucursales" ON public.sucursales;
CREATE POLICY "Developer - Full Access Sucursales"
ON public.sucursales FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- TABLEROS
DROP POLICY IF EXISTS "Developer - Full Access Tableros" ON public.tableros;
CREATE POLICY "Developer - Full Access Tableros"
ON public.tableros FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- LISTAS
DROP POLICY IF EXISTS "Developer - Full Access Listas" ON public.listas;
CREATE POLICY "Developer - Full Access Listas"
ON public.listas FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- TARJETAS
DROP POLICY IF EXISTS "Developer - Full Access Tarjetas" ON public.tarjetas;
CREATE POLICY "Developer - Full Access Tarjetas"
ON public.tarjetas FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- SOLICITUDES DE ACCESO (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'solicitudes_acceso'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Developer - Full Access Solicitudes" ON public.solicitudes_acceso';
    EXECUTE 'CREATE POLICY "Developer - Full Access Solicitudes" ON public.solicitudes_acceso FOR ALL USING (is_developer()) WITH CHECK (is_developer())';
  END IF;
END $$;

-- EMPLEADO LISTA PERMISOS (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'empleado_lista_permisos'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Developer - Full Access ELP" ON public.empleado_lista_permisos';
    EXECUTE 'CREATE POLICY "Developer - Full Access ELP" ON public.empleado_lista_permisos FOR ALL USING (is_developer()) WITH CHECK (is_developer())';
  END IF;
END $$;

-- NOTIFICACIONES (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notificaciones'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Developer - Full Access Notificaciones" ON public.notificaciones';
    EXECUTE 'CREATE POLICY "Developer - Full Access Notificaciones" ON public.notificaciones FOR ALL USING (is_developer()) WITH CHECK (is_developer())';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────
-- PASO 6: RPC eliminar_miembro_empresa con bypass para developer
-- ──────────────────────────────────────────────────────────
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
    -- DEVELOPER: bypass total
    IF is_developer() THEN
        IF p_miembro_id = auth.uid() THEN
            RAISE EXCEPTION 'No puedes eliminarte a ti mismo.';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empleado_lista_permisos') THEN
            DELETE FROM public.empleado_lista_permisos WHERE empleado_id = p_miembro_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='solicitudes_acceso') THEN
            DELETE FROM public.solicitudes_acceso WHERE usuario_id = p_miembro_id;
        END IF;
        UPDATE public.perfiles
        SET empresa_id = NULL,
            sucursal_id = NULL,
            rol = 'empleado',
            etiquetas = '{}',
            permisos_especiales = '{}'::jsonb
        WHERE id = p_miembro_id;
        RETURN;
    END IF;

    -- Flujo normal para líderes/supervisores
    SELECT empresa_id, rol::TEXT INTO v_caller_empresa_id, v_caller_rol
    FROM public.perfiles WHERE id = auth.uid();

    IF v_caller_empresa_id IS NULL THEN
        RAISE EXCEPTION 'El usuario que ejecuta la acción no pertenece a ninguna empresa.';
    END IF;

    IF v_caller_rol NOT IN ('lider', 'lider_sucursal', 'supervisor', 'admin', 'administrador') THEN
        RAISE EXCEPTION 'No tienes permisos de administrador para eliminar miembros.';
    END IF;

    SELECT empresa_id, rol::TEXT INTO v_target_empresa_id, v_target_rol
    FROM public.perfiles WHERE id = p_miembro_id;

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

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empleado_lista_permisos') THEN
        DELETE FROM public.empleado_lista_permisos WHERE empleado_id = p_miembro_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='solicitudes_acceso') THEN
        DELETE FROM public.solicitudes_acceso WHERE usuario_id = p_miembro_id;
    END IF;

    UPDATE public.perfiles
    SET empresa_id         = NULL,
        sucursal_id        = NULL,
        rol                = 'empleado',
        etiquetas          = '{}',
        permisos_especiales = '{}'::jsonb
    WHERE id = p_miembro_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.eliminar_miembro_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_miembro_empresa(UUID) TO service_role;
