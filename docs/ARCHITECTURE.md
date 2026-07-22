# Arquitectura de Base de Datos y Backend (Metricall) - Versión Maestra y Escalabilidad

## Filosofía Principal
Metricall soluciona el "desorden del texto libre" (tipo Trello) forzando la recolección de datos estructurados, tabulados y validados en campo mediante formularios dinámicos estrictos.

## Modelo Jerárquico (5 Niveles) con Denormalización de Tenant
Para optimizar el RLS y evitar JOINs costosos (anti-patrón), el `empresa_id` (Tenant) se denormaliza y se propaga en todas las tablas de la cascada:
1. **Empresas**: Raíz (Tenant global). NO debe tener `propietario_id` para evitar dependencias circulares (deadlocks) al crear cuentas. El dueño legítimo se determina en la tabla `perfiles` (`rol = 'lider'` con ese `empresa_id`).
2. **Sucursales**: Sedes geográficas. FK `empresa_id`.
3. **Tableros**: Proyectos/Departamentos. FK `sucursal_id`, FK `empresa_id`.
4. **Listas**: Plantillas de procesos. FK `tablero_id`, FK `empresa_id`. `esquema_campos` (JSONB).
5. **Tarjetas**: Registros finales. FK `lista_id`, FK `empresa_id`. `datos_valores` (JSONB).

## Sistema Híbrido de Jerarquía y Permisos Dinámicos
1. **Capa 1: Jerarquía Base (`rol` ENUM)**: `lider`, `lider_sucursal`, `supervisor`, `empleado`.
2. **Capa 2: Privilegios Granulares (`permisos_especiales` JSONB)**: Interruptores booleanos (`{"puede_borrar_tarjetas": true}`).
3. **Lógica de Ascenso**: Un rol superior solo puede ascender/modificar a alguien de menor jerarquía en su misma jurisdicción.

## Optimización y Escalabilidad (Obligatorio)
- **Índices GIN**: Obligatorios en TODAS las columnas JSONB (`esquema_campos`, `datos_valores`, `permisos_especiales`).
- **Políticas RLS Optimizadas**: Cero JOINs en el `USING`. Al propagar `empresa_id` en todas las tablas, el RLS se reduce a una sola lectura de clave primaria.
- **Paginación Forzada**: Se debe usar `LIMIT` y `OFFSET` en todo query frontend/backend.
- **Connection Pooling**: Se asume uso del puerto 6543 para encolado eficiente de conexiones.

## Mejores Prácticas Obligatorias
- **UUIDs**: Claves primarias `gen_random_uuid()`.
- **Cascade**: `ON DELETE CASCADE` controlado.
- **Multimedia**: Archivos en Supabase Storage (tabla solo contiene `TEXT[]` de URLs).

## Anti-patrones Prohibidos
- **NO modelo EAV**: Todo es JSONB.
- **NO UUIDs secuenciales**: Ni enteros predecibles.
- **NO Base64 en DB**: Solo URLs.
- **NO asumir validación frontend**: Restricciones e integridad siempre en SQL.

**modularizar siempre**: es necesario que cada archivo tenga un maximo de 350 lineas.