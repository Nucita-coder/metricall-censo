-- ========================================================================================
-- SCRIPT DE MIGRACIÓN: PERMISOS DE TABLA SOLICITUDES_ACCESO
-- ========================================================================================

-- Otorgar permisos base a los usuarios autenticados para que puedan interactuar con la tabla.
-- (El RLS que ya configuramos se encargará de limitar QUÉ filas pueden ver o modificar).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_acceso TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_acceso TO service_role;
