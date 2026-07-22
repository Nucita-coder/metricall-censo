-- ========================================================================================
-- SCRIPT MAESTRO DE SEGURIDAD: POLÍTICAS RLS COMPLETAS (CRUD)
-- ========================================================================================
-- Este script soluciona el error "new row violates row level security policy" 
-- al intentar hacer INSERT, UPDATE o DELETE, y blinda la base de datos para siempre.

-- 1. EMPRESAS
-- (Asumiendo que ya tienen SELECT). Solo los perfiles de la empresa pueden actualizarla.
CREATE POLICY "Empresas - Insertar" ON empresas FOR INSERT WITH CHECK (id = get_user_tenant());
CREATE POLICY "Empresas - Actualizar" ON empresas FOR UPDATE USING (id = get_user_tenant()) WITH CHECK (id = get_user_tenant());

-- 2. SUCURSALES
CREATE POLICY "Sucursales - Insertar" ON sucursales FOR INSERT WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Sucursales - Actualizar" ON sucursales FOR UPDATE USING (empresa_id = get_user_tenant()) WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Sucursales - Eliminar" ON sucursales FOR DELETE USING (empresa_id = get_user_tenant());

-- 3. TABLEROS
CREATE POLICY "Tableros - Insertar" ON tableros FOR INSERT WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Tableros - Actualizar" ON tableros FOR UPDATE USING (empresa_id = get_user_tenant()) WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Tableros - Eliminar" ON tableros FOR DELETE USING (empresa_id = get_user_tenant());

-- 4. LISTAS
CREATE POLICY "Listas - Insertar" ON listas FOR INSERT WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Listas - Actualizar" ON listas FOR UPDATE USING (empresa_id = get_user_tenant()) WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Listas - Eliminar" ON listas FOR DELETE USING (empresa_id = get_user_tenant());

-- 5. TARJETAS
CREATE POLICY "Tarjetas - Insertar" ON tarjetas FOR INSERT WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Tarjetas - Actualizar" ON tarjetas FOR UPDATE USING (empresa_id = get_user_tenant()) WITH CHECK (empresa_id = get_user_tenant());
CREATE POLICY "Tarjetas - Eliminar" ON tarjetas FOR DELETE USING (empresa_id = get_user_tenant());

-- 6. PERFILES
-- Permitir al usuario actualizar su propio perfil (ej. cambiar nombre)
CREATE POLICY "Perfiles - Actualizar Propio" ON perfiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
