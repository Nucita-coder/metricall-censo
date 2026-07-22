-- 1. Habilitar la lectura de perfiles para miembros de la misma empresa
CREATE POLICY "Leer perfiles de mi empresa" 
ON perfiles 
FOR SELECT 
USING (empresa_id = get_user_tenant() OR id = auth.uid());
