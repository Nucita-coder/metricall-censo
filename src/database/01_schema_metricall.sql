-- ========================================================================================
-- SCRIPT DDL DEFINITIVO METRICALL - ARQUITECTURA MAESTRA Y ESCALABLE
-- Optimizado con índices GIN, jerarquía híbrida y denormalización de Tenant (empresa_id)
-- ========================================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE rol_usuario AS ENUM ('lider', 'lider_sucursal', 'supervisor', 'empleado');

-- ========================================================================================
-- 3. TABLA BASE: PERFILES (Vinculada a Supabase Auth)
-- ========================================================================================
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol rol_usuario NOT NULL DEFAULT 'empleado',
    nombre_completo TEXT NOT NULL,
    -- Referencias jerárquicas: se deben llenar después de crear la empresa/sucursal
    empresa_id UUID, 
    sucursal_id UUID,
    supervisor_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    
    -- Control de acceso granular y dinámico ABAC
    permisos_especiales JSONB NOT NULL DEFAULT '{"puede_borrar_tarjetas": false, "puede_editar_listas": false, "puede_crear_tableros": false}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice GIN obligatorio para búsquedas ultra rápidas de permisos
CREATE INDEX idx_perfiles_permisos ON perfiles USING GIN (permisos_especiales);
-- Índice para búsquedas rápidas por tenant
CREATE INDEX idx_perfiles_empresa ON perfiles (empresa_id);

-- ========================================================================================
-- 4. NIVEL 1: EMPRESAS (Tenant Global)
-- ========================================================================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar ForeignKey en Perfiles a Empresa
ALTER TABLE perfiles ADD CONSTRAINT fk_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT;

-- ========================================================================================
-- 5. NIVEL 2: SUCURSALES (Aislamiento Geográfico)
-- ========================================================================================
CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para el Tenant
CREATE INDEX idx_sucursales_empresa ON sucursales (empresa_id);

-- Habilitar ForeignKey en Perfiles a Sucursal
ALTER TABLE perfiles ADD CONSTRAINT fk_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT;

-- ========================================================================================
-- 6. NIVEL 3: TABLEROS (Proyectos/Departamentos)
-- ========================================================================================
CREATE TABLE tableros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    -- Denormalización de tenant para evitar JOINs en RLS
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE, 
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_tableros_sucursal ON tableros (sucursal_id);
CREATE INDEX idx_tableros_empresa ON tableros (empresa_id);

-- ========================================================================================
-- 7. NIVEL 4: LISTAS (Plantillas / Motor Dinámico de Formularios)
-- ========================================================================================
CREATE TABLE listas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tablero_id UUID NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE, 
    nombre TEXT NOT NULL,
    -- Motor de reglas dinámicas
    esquema_campos JSONB NOT NULL DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices GIN y relaciones
CREATE INDEX idx_listas_esquema ON listas USING GIN (esquema_campos);
CREATE INDEX idx_listas_tablero ON listas (tablero_id);
CREATE INDEX idx_listas_empresa ON listas (empresa_id);

-- ========================================================================================
-- 8. NIVEL 5: TARJETAS (Registros Finales del Trabajador)
-- ========================================================================================
CREATE TABLE tarjetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lista_id UUID NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE, 
    creador_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
    
    -- Respuestas tabuladas validadas estrictamente
    datos_valores JSONB NOT NULL DEFAULT '{}'::jsonb, 
    
    -- Arreglo de strings para URLs de Supabase Storage. Nunca Base64.
    archivos_urls TEXT[] DEFAULT '{}', 
    estado TEXT DEFAULT 'completado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices GIN y relaciones
CREATE INDEX idx_tarjetas_datos ON tarjetas USING GIN (datos_valores);
CREATE INDEX idx_tarjetas_lista ON tarjetas (lista_id);
CREATE INDEX idx_tarjetas_empresa ON tarjetas (empresa_id);

-- ========================================================================================
-- 9. FUNCIÓN RPC: OBTENER EMPRESA DEL USUARIO (Auxiliar RLS Optimizada)
-- ========================================================================================
-- Función STABLE para que PostgreSQL cachee el resultado por query, haciendo el RLS rapidísimo
CREATE OR REPLACE FUNCTION get_user_tenant() RETURNS UUID AS $$
  SELECT empresa_id FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========================================================================================
-- 10. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ========================================================================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tableros ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

-- Política Base Ultra Rápida para el Tenant (Lectura):
-- Gracias a la denormalización (empresa_id en todas las tablas) y al STABLE function, 
-- evitamos todo tipo de JOINs costosos y subconsultas profundas.
CREATE POLICY "Tenant Isolation - Leer Empresas" ON empresas FOR SELECT USING (id = get_user_tenant());
CREATE POLICY "Tenant Isolation - Leer Sucursales" ON sucursales FOR SELECT USING (empresa_id = get_user_tenant());
CREATE POLICY "Tenant Isolation - Leer Tableros" ON tableros FOR SELECT USING (empresa_id = get_user_tenant());
CREATE POLICY "Tenant Isolation - Leer Listas" ON listas FOR SELECT USING (empresa_id = get_user_tenant());
CREATE POLICY "Tenant Isolation - Leer Tarjetas" ON tarjetas FOR SELECT USING (empresa_id = get_user_tenant());
