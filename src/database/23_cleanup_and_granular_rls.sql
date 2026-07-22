-- ========================================================================================
-- SCRIPT DE LIMPIEZA Y RESTRICCIÓN TOTAL (RBAC GRANULAR)
-- Objetivo: Borrar las políticas permisivas antiguas y aplicar las estrictas
-- ========================================================================================

-- 1. Destruir TODAS las políticas antiguas que daban acceso total a los empleados
DROP POLICY IF EXISTS "Tenant Isolation - Leer Sucursales" ON sucursales;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Tableros" ON tableros;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Listas" ON listas;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Líderes leen listas de su empresa" ON listas;
DROP POLICY IF EXISTS "Empleados leen listas de su sucursal" ON listas;
DROP POLICY IF EXISTS "Líderes leen tarjetas de su empresa" ON tarjetas;
DROP POLICY IF EXISTS "Empleados leen tarjetas de su sucursal" ON tarjetas;
DROP POLICY IF EXISTS "Lectura de listas unificada" ON listas;
DROP POLICY IF EXISTS "Lectura de tarjetas unificada" ON tarjetas;

-- 2. Nueva Política Estricta para SUCURSALES
CREATE POLICY "Lectura Granular - Sucursales" ON sucursales
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (
          jsonb_array_length(COALESCE(get_user_permissions()->'sucursales_permitidas', '[]'::jsonb)) = 0
          OR 
          (get_user_permissions()->'sucursales_permitidas') ? id::text
        )
      )
    )
  );

-- 3. Nueva Política Estricta para TABLEROS
CREATE POLICY "Lectura Granular - Tableros" ON tableros
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (
          jsonb_array_length(COALESCE(get_user_permissions()->'tableros_permitidos', '[]'::jsonb)) = 0
          OR 
          (get_user_permissions()->'tableros_permitidos') ? id::text
        )
      )
    )
  );

-- 4. Nueva Política Estricta para LISTAS
CREATE POLICY "Lectura Granular - Listas" ON listas
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (
          jsonb_array_length(COALESCE(get_user_permissions()->'listas_permitidas', '[]'::jsonb)) = 0
          OR 
          (get_user_permissions()->'listas_permitidas') ? id::text
        )
      )
    )
  );

-- 5. Nueva Política Estricta para TARJETAS
CREATE POLICY "Lectura Granular - Tarjetas" ON tarjetas
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado'
        AND (
          COALESCE(get_user_permissions()->>'tarjetas_visibilidad', 'todas') = 'todas'
          OR
          (
            get_user_permissions()->>'tarjetas_visibilidad' = 'propias'
            AND (datos_valores->>'creador_id' = auth.uid()::text OR datos_valores->>'asignado_a' = auth.uid()::text)
          )
        )
      )
    )
  );
