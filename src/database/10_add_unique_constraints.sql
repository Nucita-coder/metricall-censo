-- ========================================================================================
-- ALTERACIÓN DE ESQUEMA: RESTRICCIONES DE UNICIDAD (NOMBRES DUPLICADOS)
-- Objetivo: Evitar que existan entidades homónimas dentro de su respectivo padre
-- ========================================================================================

-- 1. Una Empresa no puede tener dos Sucursales con el mismo nombre
ALTER TABLE sucursales ADD CONSTRAINT unique_nombre_sucursal_por_empresa UNIQUE (empresa_id, nombre);

-- 2. Una Sucursal no puede tener dos Tableros con el mismo nombre
ALTER TABLE tableros ADD CONSTRAINT unique_nombre_tablero_por_sucursal UNIQUE (sucursal_id, nombre);

-- 3. Un Tablero no puede tener dos Listas con el mismo nombre
ALTER TABLE listas ADD CONSTRAINT unique_nombre_lista_por_tablero UNIQUE (tablero_id, nombre);

-- (Nota: Las tarjetas no tienen una columna "nombre", por lo que no se les puede aplicar
-- un UNIQUE directamente. Su unicidad se garantiza por su ID o por validaciones a nivel de frontend).
