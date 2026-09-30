-- ========================================================================================
-- MIGRACIÓN 111: Permisos (GRANTs) y Políticas RLS para stock_custodia_personal
-- Resuelve error HTTP 403 (Forbidden) / 42501 (Permission Denied for table)
-- ========================================================================================

-- 1. Asegurar existencia de la tabla e índices
CREATE TABLE IF NOT EXISTS public.stock_custodia_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usuario_nombre TEXT,
    codigo_material TEXT NOT NULL,
    nombre_material TEXT NOT NULL,
    modelo_material TEXT NOT NULL DEFAULT 'GENERAL',
    cantidad NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_custodia_personal UNIQUE (usuario_id, codigo_material, modelo_material)
);

CREATE INDEX IF NOT EXISTS idx_stock_custodia_usuario ON public.stock_custodia_personal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_stock_custodia_saldo ON public.stock_custodia_personal(usuario_id, cantidad);
CREATE INDEX IF NOT EXISTS idx_stock_custodia_empresa ON public.stock_custodia_personal(empresa_id);

-- 2. OTORGAR PERMISOS A NIVEL DE TABLA (GRANTS)
-- Sin esto, PostgREST retorna 403 Forbidden antes de evaluar RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stock_custodia_personal TO authenticated;
GRANT ALL ON TABLE public.stock_custodia_personal TO service_role;
GRANT SELECT ON TABLE public.stock_custodia_personal TO anon;

-- Asegurar permisos por defecto para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated, service_role;

-- 3. Habilitar RLS y redefinir políticas de acceso
ALTER TABLE public.stock_custodia_personal ENABLE ROW LEVEL SECURITY;

-- 3.1 Política de BYPASS TOTAL para Developer
DROP POLICY IF EXISTS "Developer - Full Access Stock Custodia" ON public.stock_custodia_personal;
CREATE POLICY "Developer - Full Access Stock Custodia"
ON public.stock_custodia_personal FOR ALL
USING (is_developer())
WITH CHECK (is_developer());

-- 3.2 Política de Lectura (propios materiales, tenant de empresa o developer)
DROP POLICY IF EXISTS "Lectura stock_custodia_personal" ON public.stock_custodia_personal;
CREATE POLICY "Lectura stock_custodia_personal" ON public.stock_custodia_personal
FOR SELECT USING (
    is_developer()
    OR usuario_id = auth.uid()
    OR (empresa_id IS NOT NULL AND empresa_id = get_user_tenant())
);

-- 3.3 Política de Escritura (tenant o developer)
DROP POLICY IF EXISTS "Escritura stock_custodia_personal" ON public.stock_custodia_personal;
CREATE POLICY "Escritura stock_custodia_personal" ON public.stock_custodia_personal
FOR ALL USING (
    is_developer()
    OR (empresa_id IS NOT NULL AND empresa_id = get_user_tenant())
)
WITH CHECK (
    is_developer()
    OR (empresa_id IS NOT NULL AND empresa_id = get_user_tenant())
);

-- 4. Permisos de ejecución sobre funciones auxiliares y sincronizadores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'safe_cast_numeric') THEN
        GRANT EXECUTE ON FUNCTION public.safe_cast_numeric(TEXT, NUMERIC) TO authenticated, service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'safe_cast_uuid') THEN
        GRANT EXECUTE ON FUNCTION public.safe_cast_uuid(TEXT) TO authenticated, service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_aplicar_impacto_tarjeta_custodia') THEN
        GRANT EXECUTE ON FUNCTION public.fn_aplicar_impacto_tarjeta_custodia(UUID, UUID, UUID, JSONB, NUMERIC) TO authenticated, service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_sync_custodia_personal') THEN
        GRANT EXECUTE ON FUNCTION public.fn_sync_custodia_personal() TO authenticated, service_role;
    END IF;
END $$;

-- 5. Notificación de éxito
DO $$
BEGIN
    RAISE NOTICE 'Permisos y políticas RLS para stock_custodia_personal aplicados exitosamente.';
END $$;
