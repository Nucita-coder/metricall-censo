-- ========================================================================================
-- 36_strict_rbac_update_tarjetas.sql
-- Objetivo: Restringir estrictamente la edición de tarjetas. Solo el Superusuario (admin)
-- o los usuarios con el permiso explícito 'puede_editar' en la lista actual pueden modificar.
-- ========================================================================================

-- Eliminamos las políticas previas de edición para evitar conflictos o doble validación
DROP POLICY IF EXISTS "Tarjetas - Actualizar" ON tarjetas;
DROP POLICY IF EXISTS "RBAC - Editar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "RBAC Relacional - Editar Tarjetas" ON tarjetas;

-- Nueva política de UPDATE estrictamente gobernada por RBAC o Superusuario
CREATE POLICY "RBAC Relacional - Editar Tarjetas" ON tarjetas
FOR UPDATE USING (
    empresa_id = get_user_tenant()
    AND (
        get_user_role() = 'lider'
        OR EXISTS (
            SELECT 1 FROM empleado_lista_permisos elp
            WHERE elp.empleado_id = auth.uid()
              AND elp.lista_id = tarjetas.lista_id
              AND elp.puede_editar = true
        )
    )
);
