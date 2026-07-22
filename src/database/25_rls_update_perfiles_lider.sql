-- Permitir a los líderes actualizar perfiles (como los permisos especiales) de los miembros de su propia empresa
DROP POLICY IF EXISTS "Líderes actualizan perfiles de su empresa" ON perfiles;
CREATE POLICY "Líderes actualizan perfiles de su empresa" 
ON perfiles 
FOR UPDATE 
USING (
  empresa_id = get_user_tenant() 
  AND get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
)
WITH CHECK (
  empresa_id = get_user_tenant() 
  AND get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
);
