-- ========================================================================================
-- 46_fix_rls_tarjetas_asignadas.sql
-- Objetivo: Permitir que los empleados con visibilidad 'propias' vean tarjetas asignadas a su nombre (asignadoA) o por UUID (asignado_a)
-- ========================================================================================

DROP POLICY IF EXISTS "Lectura Granular - Tarjetas" ON tarjetas;

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
            AND (
              creador_id = auth.uid() 
              OR 
              datos_valores->>'asignado_a' = auth.uid()::text
              OR
              LOWER(TRIM(COALESCE(datos_valores->>'asignadoA', ''))) = LOWER(TRIM((SELECT COALESCE(nombre_completo, '') FROM perfiles WHERE id = auth.uid())))
              OR
              LOWER(TRIM(COALESCE(datos_valores->>'recibidoPor', ''))) = LOWER(TRIM((SELECT COALESCE(nombre_completo, '') FROM perfiles WHERE id = auth.uid())))
            )
          )
        )
      )
    )
  );
