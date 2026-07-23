-- 42_add_profile_fields.sql
-- Añadir campos para foto de perfil (avatar_url) y mensaje/estado de usuario (mensaje)

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mensaje TEXT;
