-- ========================================================================================
-- SCRIPT DE PERMISOS (GRANTS)
-- ========================================================================================

-- A veces, al crear tablas por SQL puro, PostgreSQL no le da permisos a los roles 
-- anon y authenticated que usa Supabase para la API. Esto soluciona el 
-- "permission denied for table..." de raíz.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
