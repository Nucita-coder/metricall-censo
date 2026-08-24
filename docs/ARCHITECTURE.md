# Arquitectura de Base de Datos y Backend (Metricall) - Versión Maestra y Escalabilidad

## Filosofía Principal
Metricall soluciona el "desorden del texto libre" (tipo Trello) forzando la recolección de datos estructurados, tabulados y validados en campo mediante formularios dinámicos estrictos.

## Modelo Jerárquico (5 Niveles) con Denormalización de Tenant
Para optimizar el RLS y evitar JOINs costosos (anti-patrón), el `empresa_id` (Tenant) se denormaliza y se propaga en todas las tablas de la cascada:
1. **Empresas**: Raíz (Tenant global). NO debe tener `propietario_id` para evitar dependencias circulares (deadlocks) al crear cuentas. El dueño legítimo se determina en la tabla `perfiles` (`rol = 'lider'` con ese `empresa_id`).
2. **Sucursales**: Sedes geográficas. FK `empresa_id`.
3. **Tableros**: Proyectos/Departamentos. FK `sucursal_id`, FK `empresa_id`.
4. **Listas**: Plantillas de procesos. FK `tablero_id`, FK `empresa_id`. `esquema_campos` (JSONB).
   - **Instalaciones**: `Venta`, `Factibilidad`, `Por Instalar`, `Asignado A`, `Liberada`, `En Proceso`, `Por Activar`, `Cliente Activo`.
   - **Censo**: `Censo`, `si desea`, `no desea`, `es posible` (Enrutamiento automático al seleccionar `dispuestoCambiar`).
   - **Almacén**: `Carga de Materiales`, `Material Recibido`, `Material Asignado`, `Devolución de Asignación`, `Devolución a Almacén Central`, `Recuperados` (Enrutamiento automático al seleccionar `tipoCarga`).
5. **Tarjetas**: Registros finales. FK `lista_id`, FK `empresa_id`. `datos_valores` (JSONB).

## Sistema Híbrido de Jerarquía y Permisos Dinámicos
1. **Modelado Práctico de 2 Niveles de Acceso**:
   - **Administradores / Gestión (`rol != 'empleado'`)**: Engloba `lider`, `lider_sucursal` y `supervisor`. Poseen acceso total (bypass RLS) a sucursales, tableros, listas y tarjetas sin pasar por restricciones de matriz.
   - **Empleados Operativos (`rol == 'empleado'`)**: Su acceso está 100% restringido y regulado por la matriz de permisos (`permisos_especiales` JSONB y `empleado_lista_permisos`).
2. **Etiquetas Operativas (`etiquetas TEXT[]`)**: Clasificadores de función o especialidad laboral (ej. "Supervisor", "Técnico", "Asesor") utilizados únicamente en la UI para filtrado y asignación de tareas en el Kanban, sin otorgar permisos de base de datos.
3. **Lógica de Ascenso**: Un rol superior solo puede ascender/modificar a alguien de menor jerarquía en su misma jurisdicción.

## Reglas de Componentes UI y Formularios Globales
- **Reutilización Global**: Todos los componentes de formulario (`InputTexto`, `DatePickerInput`, `SelectDropdown`) deben importarse de `src/components/venta/CamposVenta.tsx`. Prohibido duplicar componentes de entrada localmente.
- **Selectores emergentes compactos**: Los modales de opciones (`SelectDropdown`) deben ser ventanas flotantes emergentes centradas (`maxWidth: 340`, `animationType="fade"`). Prohibido el uso de desplegables tipo bottom-sheet (`justifyContent: 'flex-end'`).

## Optimización y Escalabilidad (Obligatorio)
- **Índices GIN**: Obligatorios en TODAS las columnas JSONB (`esquema_campos`, `datos_valores`, `permisos_especiales`).
- **Políticas RLS Optimizadas**: Cero JOINs en el `USING`. Al propagar `empresa_id` en todas las tablas, el RLS se reduce a una sola lectura de clave primaria.
- **Paginación Forzada**: Se debe usar `LIMIT` y `OFFSET` en todo query frontend/backend.
- **Connection Pooling**: Se asume uso del puerto 6543 para encolado eficiente de conexiones.

## Mejores Prácticas Obligatorias
- **UUIDs**: Claves primarias `gen_random_uuid()`.
- **Cascade**: `ON DELETE CASCADE` controlado.
- **Multimedia**: Archivos en Supabase Storage (tabla solo contiene `TEXT[]` de URLs).
- **Delimitación de Alcance**: Delimitarse estrictamente a la tarea asignada. Queda prohibido modificar archivos, funciones o componentes aparte que no tengan relación directa con el requerimiento.

## Anti-patrones Prohibidos
- **NO modelo EAV**: Todo es JSONB.
- **NO UUIDs secuenciales**: Ni enteros predecibles.
- **NO Base64 en DB**: Solo URLs.
- **NO asumir validación frontend**: Restricciones e integridad siempre en SQL.
- **NO modificar cosas fuera de alcance**: No realizar cambios secundarios o no solicitados en archivos no relacionados.

**modularizar siempre**: es necesario que cada archivo tenga un maximo de 350 lineas.