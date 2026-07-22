-- 1. Eliminar la política defectuosa
DROP POLICY IF EXISTS "Lectura Granular - Tarjetas" ON tarjetas;

-- 2. Crear la política corregida usando la columna creador_id real
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
            )
          )
        )
      )
    )
  );
