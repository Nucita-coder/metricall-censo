-- 1. Añadimos la columna 'orden' a tableros
ALTER TABLE tableros ADD COLUMN IF NOT EXISTS orden INT NOT NULL DEFAULT 0;

-- 2. Creamos la función RPC para el Bulk Update o Swap de Tableros
-- Toma un array JSON con el formato: [{"id": "uuid", "orden": 0}, {"id": "uuid", "orden": 1}]
CREATE OR REPLACE FUNCTION actualizar_orden_tableros(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    v_empresa_id uuid;
BEGIN
    -- Obtenemos el ID de empresa del usuario autenticado (Protección RLS)
    v_empresa_id := get_user_tenant();

    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        UPDATE tableros 
        SET orden = (item->>'orden')::int
        WHERE id = (item->>'id')::uuid 
        AND empresa_id = v_empresa_id; -- Aseguramos que solo afecte a sus tableros
    END LOOP;
END;
$$;
