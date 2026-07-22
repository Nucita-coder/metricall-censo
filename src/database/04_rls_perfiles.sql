-- ========================================================================================
-- SCRIPT DE SEGURIDAD: HABILITAR LECTURA DE PERFILES
-- ========================================================================================

-- 1. Habilitar RLS en la tabla perfiles (Si no estaba habilitado)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que un usuario autenticado pueda leer su propia fila en la tabla perfiles
-- Esto es crucial para que el Dashboard (Nivel 2) pueda consultar a qué empresa pertenece el usuario.
CREATE POLICY "Leer propio perfil" 
ON perfiles 
FOR SELECT 
USING (id = auth.uid());
