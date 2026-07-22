-- ========================================================================================
-- ALTERACIÓN DE ESQUEMA: FORM BUILDER Y PRIVACIDAD (Nivel 4 y 5)
-- Objetivo: Soportar configuración de metas y permisos por lista, y visibilidad por tarjeta
-- ========================================================================================

-- 1. Añadir configuración avanzada a las listas (Privacidad por defecto, KPIs)
ALTER TABLE listas ADD COLUMN IF NOT EXISTS config_avanzada JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Añadir estado de visibilidad a las tarjetas heredado de la lista
ALTER TABLE tarjetas ADD COLUMN IF NOT EXISTS visibilidad TEXT NOT NULL DEFAULT 'publico';

-- 3. Crear Función Optimizada (STABLE) para obtener el rol del usuario
-- Esto evita hacer JOIN explícitos en el RLS que tumbarían el rendimiento.
CREATE OR REPLACE FUNCTION get_user_role() RETURNS rol_usuario AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Reemplazar la política de lectura (SELECT) en las tarjetas
DROP POLICY IF EXISTS "Tenant Isolation - Leer Tarjetas" ON tarjetas;

-- Nueva política: Un empleado solo lee lo público o lo que él creó. 
-- Los roles superiores (Modo Dios) leen todo lo de su empresa.
CREATE POLICY "Tenant Isolation - Leer Tarjetas" ON tarjetas FOR SELECT USING (
  empresa_id = get_user_tenant() AND (
    visibilidad = 'publico' OR 
    creador_id = auth.uid() OR 
    get_user_role() IN ('lider', 'lider_sucursal', 'supervisor')
  )
);
