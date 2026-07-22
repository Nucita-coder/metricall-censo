-- ========================================================================================
-- ALTERACIÓN DE ESQUEMA: ORDEN DE LISTAS (DRAG & DROP)
-- ========================================================================================

-- 1. Añadimos la columna 'orden'
ALTER TABLE listas ADD COLUMN orden INT NOT NULL DEFAULT 0;

-- 2. Creamos la función RPC para el Bulk Update
-- Toma un array JSON con el formato: [{"id": "uuid", "orden": 0}, {"id": "uuid", "orden": 1}]
CREATE OR REPLACE FUNCTION actualizar_orden_listas(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    v_empresa_id uuid;
BEGIN
    -- Obtenemos el ID de empresa del usuario autenticado (Protección RLS estricta)
    -- Asumimos que get_user_tenant() ya existe desde el setup inicial
    v_empresa_id := get_user_tenant();

    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        UPDATE listas 
        SET orden = (item->>'orden')::int
        WHERE id = (item->>'id')::uuid 
        AND empresa_id = v_empresa_id; -- Aseguramos que solo afecte a sus listas
    END LOOP;
END;
$$;
