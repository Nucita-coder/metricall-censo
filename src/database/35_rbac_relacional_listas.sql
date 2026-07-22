-- ========================================================================================
-- 35_rbac_relacional_listas.sql
-- Objetivo: Migrar permisos de listas a un modelo relacional y atómico, y preparar transiciones
-- ========================================================================================

-- 1. Crear la tabla intermedia para permisos granulares
CREATE TABLE IF NOT EXISTS empleado_lista_permisos (
    empleado_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    lista_id UUID NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    puede_ver BOOLEAN DEFAULT false,
    puede_crear BOOLEAN DEFAULT false,
    puede_editar BOOLEAN DEFAULT false,
    puede_borrar BOOLEAN DEFAULT false,
    PRIMARY KEY (empleado_id, lista_id)
);

-- Índices para mejorar rendimiento en RLS
CREATE INDEX IF NOT EXISTS idx_elp_empleado ON empleado_lista_permisos (empleado_id);
CREATE INDEX IF NOT EXISTS idx_elp_lista ON empleado_lista_permisos (lista_id);

-- 2. Habilitar RLS y conceder permisos a la API (PostgREST)
ALTER TABLE empleado_lista_permisos ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON empleado_lista_permisos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON empleado_lista_permisos TO service_role;

-- Solo los líderes pueden gestionar los permisos, los empleados solo leen los suyos
CREATE POLICY "Empleados ven sus permisos" ON empleado_lista_permisos
    FOR SELECT USING (empleado_id = auth.uid() OR get_user_role() != 'empleado');

CREATE POLICY "Líderes gestionan permisos" ON empleado_lista_permisos
    FOR ALL USING (get_user_role() != 'empleado');

-- 3. Migración Atómica de Datos (Extraer de JSON heredado)
-- Nota: Solo migra si el empleado ya tenía un array en 'listas_permitidas'
INSERT INTO empleado_lista_permisos (empleado_id, lista_id, puede_ver, puede_crear, puede_editar, puede_borrar)
SELECT 
    id AS empleado_id,
    (jsonb_array_elements_text(COALESCE(permisos_especiales->'listas_permitidas', '[]'::jsonb)))::UUID AS lista_id,
    true AS puede_ver,
    true AS puede_crear,
    true AS puede_editar,
    false AS puede_borrar
FROM perfiles
WHERE jsonb_typeof(permisos_especiales->'listas_permitidas') = 'array'
ON CONFLICT (empleado_id, lista_id) DO NOTHING;

-- 4. Añadir columna de transiciones a la tabla de listas
ALTER TABLE listas ADD COLUMN IF NOT EXISTS transiciones_permitidas UUID[] DEFAULT '{}';

-- 5. Refactorizar Políticas RLS de Tarjetas para usar la nueva relación
-- Borramos las políticas previas de edición y borrado si existían
DROP POLICY IF EXISTS "Tarjetas - Actualizar" ON tarjetas;
DROP POLICY IF EXISTS "RBAC - Editar Tarjetas" ON tarjetas;
DROP POLICY IF EXISTS "Tarjetas - Eliminar" ON tarjetas;
DROP POLICY IF EXISTS "RBAC - Borrar Tarjetas" ON tarjetas;

-- Nueva política de UPDATE optimizada
CREATE POLICY "RBAC Relacional - Editar Tarjetas" ON tarjetas
FOR UPDATE USING (
    empresa_id = get_user_tenant()
    AND (
        get_user_role() != 'empleado'
        OR EXISTS (
            SELECT 1 FROM empleado_lista_permisos elp
            WHERE elp.empleado_id = auth.uid()
              AND elp.lista_id = tarjetas.lista_id
              AND elp.puede_editar = true
        )
    )
);

-- Nueva política de DELETE optimizada
CREATE POLICY "RBAC Relacional - Borrar Tarjetas" ON tarjetas
FOR DELETE USING (
    empresa_id = get_user_tenant()
    AND (
        get_user_role() != 'empleado'
        OR EXISTS (
            SELECT 1 FROM empleado_lista_permisos elp
            WHERE elp.empleado_id = auth.uid()
              AND elp.lista_id = tarjetas.lista_id
              AND elp.puede_borrar = true
        )
    )
);
