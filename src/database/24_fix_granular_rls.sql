-- ========================================================================================
-- CORRECCIÓN: ELIMINAR FALLBACKS (Si la lista está vacía, no ve nada)
-- ========================================================================================

-- 1. Sucursales
DROP POLICY IF EXISTS "Lectura Granular - Sucursales" ON sucursales;
CREATE POLICY "Lectura Granular - Sucursales" ON sucursales
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (get_user_permissions()->'sucursales_permitidas') ? id::text
      )
    )
  );

-- 2. Tableros
DROP POLICY IF EXISTS "Lectura Granular - Tableros" ON tableros;
CREATE POLICY "Lectura Granular - Tableros" ON tableros
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (get_user_permissions()->'tableros_permitidos') ? id::text
      )
    )
  );

-- 3. Listas
DROP POLICY IF EXISTS "Lectura Granular - Listas" ON listas;
CREATE POLICY "Lectura Granular - Listas" ON listas
  FOR SELECT USING (
    empresa_id = get_user_tenant()
    AND (
      get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
      OR (
        get_user_role() = 'empleado' 
        AND (get_user_permissions()->'listas_permitidas') ? id::text
      )
    )
  );
