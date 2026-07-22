-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: RBAC Y PERMISOS GRANULARES
-- Objetivo: Restringir acceso de los empleados basado en permisos_especiales JSONB
-- ========================================================================================

-- 1. Función STABLE para leer permisos y mejorar el rendimiento de RLS
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS JSONB AS $$
DECLARE
    v_permisos JSONB;
BEGIN
    SELECT permisos_especiales INTO v_permisos 
    FROM perfiles 
    WHERE id = auth.uid();
    RETURN COALESCE(v_permisos, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Limpieza de Políticas Anteriores
DROP POLICY IF EXISTS "Tenant Isolation - Leer Sucursales" ON sucursales;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Tableros" ON tableros;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Listas" ON listas;
DROP POLICY IF EXISTS "Tenant Isolation - Leer Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Crear Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Editar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Borrar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Insertar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Actualizar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tenant Isolation - Eliminar Tarjetas" ON tarjetas;

-- 3. Nuevas Políticas RLS (Lectura)

-- SUCURSALES
CREATE POLICY "RBAC - Leer Sucursales" ON sucursales 
FOR SELECT USING (
  empresa_id = get_user_tenant() 
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'sucursales_permitidas') ? id::text
  )
);

-- TABLEROS
CREATE POLICY "RBAC - Leer Tableros" ON tableros 
FOR SELECT USING (
  empresa_id = get_user_tenant() 
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'tableros_permitidos') ? id::text
  )
);

-- LISTAS
CREATE POLICY "RBAC - Leer Listas" ON listas 
FOR SELECT USING (
  empresa_id = get_user_tenant() 
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'listas_permitidas') ? id::text
  )
);

-- TARJETAS (Lectura)
CREATE POLICY "RBAC - Leer Tarjetas" ON tarjetas 
FOR SELECT USING (
  empresa_id = get_user_tenant() 
  AND (
    get_user_role() != 'empleado' 
    OR (
        -- Si visibilidad es 'todas', puede ver las tarjetas de las listas permitidas
        ((get_user_permissions()->>'tarjetas_visibilidad') = 'todas' AND (get_user_permissions()->'listas_permitidas') ? lista_id::text)
        OR 
        -- Si visibilidad es 'propias', solo ve las que creó él (o está asignado)
        ((get_user_permissions()->>'tarjetas_visibilidad') = 'propias' AND creador_id = auth.uid())
    )
  )
);

-- 4. Nuevas Políticas RLS (Escritura en Tarjetas)

-- TARJETAS (Crear)
CREATE POLICY "RBAC - Crear Tarjetas" ON tarjetas 
FOR INSERT WITH CHECK (
  empresa_id = get_user_tenant()
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'acciones'->>'crear')::boolean = true
  )
);

-- TARJETAS (Editar)
CREATE POLICY "RBAC - Editar Tarjetas" ON tarjetas 
FOR UPDATE USING (
  empresa_id = get_user_tenant()
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'acciones'->>'editar')::boolean = true
  )
);

-- TARJETAS (Borrar)
CREATE POLICY "RBAC - Borrar Tarjetas" ON tarjetas 
FOR DELETE USING (
  empresa_id = get_user_tenant()
  AND (
    get_user_role() != 'empleado' 
    OR (get_user_permissions()->'acciones'->>'borrar')::boolean = true
  )
);
