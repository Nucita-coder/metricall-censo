-- Permitir que un líder de empresa pueda ver el perfil de los usuarios que han solicitado acceso
CREATE POLICY "Leer perfiles de solicitantes"
ON perfiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_acceso 
    WHERE solicitudes_acceso.usuario_id = perfiles.id 
    AND solicitudes_acceso.empresa_id = get_user_tenant()
  )
);
