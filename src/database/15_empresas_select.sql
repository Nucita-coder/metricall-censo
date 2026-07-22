-- ========================================================================================
-- SCRIPT DE SEGURIDAD: LECTURA DE EMPRESAS
-- ========================================================================================

-- Permitimos que cualquier usuario autenticado en la app pueda leer la tabla de empresas.
-- Esto es fundamental para que, al ingresar un "Código de Invitación", 
-- el sistema pueda buscar a qué empresa le pertenece ese código.

CREATE POLICY "Leer empresas" ON empresas FOR SELECT TO authenticated USING (true);
