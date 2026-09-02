# Funcionalidades y Especificaciones de Listas del CRM Metricall

Este documento sirve como registro oficial y norma de referencia para el comportamiento, campos, botones y flujos de trabajo de cada lista en los tableros de Metricall.

---

## 1. Lista: FACTIBILIDAD (Tablero: Ventas / Instalaciones)

La lista **Factibilidad** es la fase técnica donde el equipo revisa la viabilidad de instalación de un cliente antes de asignarle un instalador/técnico.

### 📋 Campos de la Lista / Formulario

#### A. Evidencia LCH
* **`Nro LCH`** (`lch_numero`): Campo de texto numérico obligatorio. Corresponde al número de registro de LCH.
* **`Foto / Evidencia LCH`** (`lch_imagen`): Imagen adjunta obligatoria obtenida mediante la Galería o Cámara de la aplicación.

#### B. Registro Comercial (Herencia de Venta / Censo)
* **`Nombre y Apellido`** (`nombreApellido` / `nombre`).
* **`Documento de Identidad`** (`tipoDocumento` + `documentoIdentidad`).
* **`Teléfonos`** (`telefonoMovil`, `telefonoAdicional`).
* **`Dirección`** (`ciudad`, `sector`, `calle`, `edificio`, `referencia`).
* **`Plan / Servicio Contratado`** (`tipoServicio`, `plan_hogar`, `plan_pymes`).

---

### 🔘 Botones y Acciones Disponibles

1. **`Galería LCH *`** (Botón con icono de imagen):
   - Abre la galería del dispositivo/navegador para subir la evidencia de LCH.
2. **`Cámara LCH *`** (Botón con icono de cámara):
   - Abre la cámara del dispositivo para capturar la fotografía del LCH en tiempo real.
3. **`Guardar LCH`** (Botón azul):
   - Almacena el número y la imagen del LCH en los `datos_valores` de la tarjeta en Supabase.
4. **`Aprobado (Pasar a Instalar)`** (Botón verde de Control de Calidad):
   - **Validación previa**: Requiere obligatoriamente que `Nro LCH` y `Foto LCH` estén cargados.
   - **Efecto**: Actualiza `controlCalidad = 'Aprobado'` y traslada atómicamente la tarjeta a la lista **POR INSTALAR**.
5. **`Rechazado (Devolver a Venta)`** (Botón rojo de Control de Calidad):
   - **Efecto**: Actualiza `controlCalidad = 'Rechazado'` y devuelve la tarjeta a la lista **VENTA**.

---

### 🔄 Regla de herencia de estado
Cualquier tarjeta que sea movida o ingresada a la columna **Factibilidad** (venga de Censo, WhatsApp Bot, Venta o Importación) adopta de forma inmediata y automática todas las propiedades, validaciones y botones descritos para la lista **Factibilidad**.

---

## 2. Lista: VENTA / VENTAS ONLINE (Tablero: Ventas / Instalaciones & Gestión Online)

La lista **Venta** (o **Ventas Online**) es la fase de registro y captación de clientes interesados en contratar el servicio. 

> **Regla de Flujo**: Las tarjetas registradas o procesadas en esta fase no permanecen de forma indefinida en "Venta", sino que una vez seleccionados los datos comerciales y el plan contratado, se procesan y se transfieren automáticamente a la lista **FACTIBILIDAD**.

---

### 📋 Campos de la Lista / Formulario de Venta

#### A. Datos Comerciales
* **`Fecha de Venta`** (`fechaVenta`): Fecha en que el cliente contrata el servicio.
* **`Vendedor / Asesor`** (`vendedor` / `asesorComercial`): Correo o nombre del asesor responsable.
* **`Tipo de Servicio`** (`tipoServicio`): Opciones `hogar`, `pymes`, `dedicado`, `isp`.
* **`Dirección Fiscal`** (`direccionFiscal`): Obligatorio para servicios corporativos (pymes/dedicado/isp).
* **`Fecha de Nacimiento`** (`fechaNacimiento`): Fecha de nacimiento del titular.

#### B. Selección de Planes
* **`Planes Hogar`** (`plan_hogar`): Selección de planes (`Conectados`, `Gamer`, `Cinéfilos`, `Familiar`) y `Tipo de Instalación` (`sin wifi`, `con wifi`).
* **`Planes PYMES`** (`plan_pymes`): Selección de planes (`Emprendedores`, `Comercios`, `Oficinas`, `Negocios`) y `Tipo de Instalación` (`sin wifi`, `con wifi`).

#### C. Datos del Cliente y Ubicación de Instalación
* **`Nombre y Apellido`** (`nombreApellido`).
* **`Tipo y Nro. Documento / RIF`** (`tipoDocumento`, `documentoIdentidad`).
* **`Teléfonos`** (`telefonoMovil`, `telefonoAdicional`).
* **`Dirección`** (`estado`, `ciudad`, `sector`, `calle`, `edificio`, `referencia`).
* **`Geolocalización GPS`** (`latitud`, `longitud`, `ubicacion_cliente`).

#### D. Adicionales
* **`Equipo Adicional`** (`equipoAdicional`): Solicitud de equipos extra (routers, decodificadores, etc.).
* **`Nro. de Abonado / Suscriptor`** (`nroAbonado`): Número de contrato asignado si aplica.

---

### 🔘 Botones y Acciones Disponibles

1. **`Guardar y Enviar a Factibilidad`** (Botón azul en FaseVenta):
   - **Acción**: Valida que se haya seleccionado un plan (`plan_hogar` o `plan_pymes`), guarda la información comercial y traslada automáticamente la tarjeta a la lista **FACTIBILIDAD**.

2. **`Convertir a Venta`** (Formulario de Conversión desde Censo / WhatsApp Bot):
   - **Acción**: Permite al asesor comercial ingresar los datos del contrato para prospectos provenientes de Censo o del Bot de WhatsApp. 
   - Invoca la RPC `convertir_venta_factibilidad` que reubica la tarjeta en **FACTIBILIDAD** del tablero de Ventas/Instalaciones.

---

### 🔄 Regla de herencia de estado
Cualquier tarjeta creada en o movida a la lista **Venta** despliega los selectores de planes y campos comerciales. Al completarse la selección de planes, la tarjeta migra directamente hacia **Factibilidad** para su evaluación técnica.

---

## 3. Listas: POR INSTALAR y ASIGNADO A (Tablero: Ventas / Instalaciones)

Estas fases gestionan la distribución del trabajo hacia el personal técnico de cuadrillas en campo.

### 📋 Campos y Comportamiento
* **`Técnico Asignado`** (`tecnicoAsignado`, `asignado_a`, `tecnico_id`): Identificador y nombre del técnico o cuadrilla responsable de la instalación.
* **`Fecha de Asignación`** (`fechaAsignacionTecnica`): Timestamp de asignación.
* **Filtro Automático de Miembros**: En `POR INSTALAR`, el sistema filtra y despliega únicamente los usuarios con rol o etiqueta `tecnico`, `instalador` o `instalaciones`.

### 🔘 Botones y Acciones Disponibles
1. **`Asignar a Técnico`** (en FasePorInstalar):
   - Al seleccionar un técnico del listado, se vincula su ID y la tarjeta pasa automáticamente a la columna **ASIGNADO A**.
2. **`Aceptar Trabajo (Pasar a En Proceso)`** (en FaseAsignadoA):
   - El técnico confirma que asume la orden y la tarjeta pasa atómicamente a **EN PROCESO**.
3. **`Liberar Caso / Rechazar`** (en FaseAsignadoA):
   - Si la cuadrilla no puede atender el trabajo, selecciona un motivo de liberación y la tarjeta se transfiere a **LIBERADA**.

---

## 4. Lista: EN PROCESO (Fase de Instalación Técnica en Campo)

Es la fase de mayor exigencia técnica, donde el instalador registra los parámetros ópticos, seriales de equipos y evidencias fotográficas con geolocalización.

### 📋 Campos Técnicos de Instalación
* **`Serial del Equipo / ONU`** (`serialEquipo`, `serial_onu`): Serial físico del modem/ONU instalado.
* **`Dirección MAC`** (`mac_equipo` / `macEquipo`): MAC address del equipo.
* **`Caja NAP y Puerto`** (`nroNap`, `cajaNap`, `puertoAsignado`, `puertosDisponibles`): Número identificador de la caja NAP y puerto asignado.
* **`Potencia Óptica NAP`** (`potenciaNap`): Medición en dBm en la caja NAP.
* **`Potencia Óptica Casa`** (`potencia_casa` / `potenciaCasa`): Medición en dBm en la roseta/residencia del cliente.
* **`Cable Drop`** (`cable_drop` / `cableDrop`): Metros de cable de fibra desplegados.
* **`Geolocalización NAP y Residencia`** (`geo_nap`, `geo_casa`): Coordenadas GPS obligatorias tomadas en el punto exacto.
* **`GeoFotos y Evidencias`** (`geofotos`): Capturas fotográficas con marca de agua (timestamp y coordenadas) de la fachada, caja NAP y equipo instalado.
* **`Materiales Consumidos`** (`materiales`): Conteo de tensores plásticos, tensores de hierro, grapas, conectores, etc.

### 🔘 Botones y Acciones Disponibles
1. **`Tomar GeoFoto`** (Cámara con visor de coordenadas GPS y compresión optimizada).
2. **`Capturar GPS NAP / GPS Casa`** (Geolocalización satelital en tiempo real).
3. **`Guardar Datos Técnicos`** (Persistencia en Supabase).
4. **`Finalizar Instalación (Pasar a Por Activar)`**: Valida seriales y potencias y traslada a **POR ACTIVAR**.
5. **`Reportar Impedimento / Liberar Caso`**: Si la instalación no se puede completar (ej. sin puerto en NAP o cliente ausente), envía la tarjeta a **LIBERADA** con el motivo correspondiente.

---

## 5. Listas: POR ACTIVAR y CLIENTE ACTIVO (Aprovisionamiento y Cierre)

Fase donde el equipo de NOC o soporte central verifica los niveles en la OLT y da de alta el servicio en el sistema de facturación.

### 📋 Campos y Acciones
* **`Activado Por`** (`activadoPor`): Nombre del operador de NOC responsable del alta.
* **`Selector de Evidencias para Reporte`**: Permite al usuario marcar qué fotografías (LCH, GeoFotos, Adjuntos) se incluirán en el reporte final.
* **`Generar Reporte WhatsApp`**: Genera un texto formateado con todos los detalles técnicos, seriales, potencias y enlaces directos a las imágenes para envío al grupo de operaciones o soporte.
* **`Completar Activación (Pasar a Cliente Activo)`**:
  - Traslada la tarjeta a **CLIENTE ACTIVO**.
  - Marca la orden como completada con éxito para el cálculo de comisiones e indicadores de efectividad.

---

## 6. Lista: LIBERADA (Casos Caídos o con Impedimento)

Aloja los casos que no pudieron completarse por razones técnicas, comerciales o logísticas.

### 📋 Comportamiento y Reglas
* **`Motivo de Liberación`** (`motivoLiberacion`): Causa documentada (ej. *Sector sin caja NAP*, *Sin puertos disponibles*, *Distancia excesiva*, *Cliente rechazó en sitio*).
* **`Explicación para Retomar Proceso`** (`ultimoMotivoRetorno`): Campo obligatorio para cualquier asesor o supervisor que intente reactivar la tarjeta.
* **`Retomar Instalación`** (Botón azul):
  - Limpia el bloqueo y traslada la tarjeta nuevamente a **ASIGNADO A** o a **FACTIBILIDAD** según el flujo requerido.

---

## 7. Tablero: CENSO COMERCIAL (Prospección en Campo)

El tablero de Censo se utiliza para registrar viviendas y comercios durante los barridos de calle.

### 📋 Columnas del Flujo
1. **`CENSO`**: Registro inicial de la vivienda.
2. **`SI DESEA`**: Prospectos interesados en contratar el servicio.
3. **`NO DESEA`**: Clientes que no están interesados o cuentan con contrato vigente de otra operadora.
4. **`ES POSIBLE`**: Prospectos con potencial pero pendientes de validación de cobertura.

### 🔘 Acciones Especiales
* **`Enrutamiento Automático`**: Al seleccionar el valor de `dispuestoCambiar` en el formulario, el sistema traslada la tarjeta automáticamente a la lista correspondiente (*Si Desea*, *No Desea* o *Es Posible*).
* **`Convertir a Venta`**: Abre el formulario de formalización de contrato comercial e invoca la RPC `convertir_venta_factibilidad`, que traslada la tarjeta desde el tablero de Censo hacia la columna **FACTIBILIDAD** del tablero de Ventas/Instalaciones.

---

## 8. Tablero: ALMACÉN Y CONTROL DE MATERIALES (WMS)

Gestiona la custodia física y movimientos de inventario técnico.

### 📋 Columnas del Flujo
1. **`Carga de Materiales`**: Ingreso de nuevos lotes al almacén.
2. **`Material Recibido`**: Confirmación de recepción física en sede.
3. **`Material Asignado`**: Transferencia de stock a custodia personal de un técnico o cuadrilla.
4. **`Devolución de Asignación`**: Retorno de materiales no utilizados o defectuosos al almacén local.
5. **`Devolución a Almacén Central`**: Reingreso consolidado a la sede principal.
6. **`Recuperados`**: Equipos (ONUs, routers) retirados de clientes por retiro de servicio o churn.

### 🔘 Acciones Especiales
* **`Firma Digital`**: Captura de firma manuscrita en pantalla para generar actas de entrega/devolución con validez legal.
* **`Control de Custodia`**: El técnico puede consultar en cualquier momento su saldo de materiales en la pestaña "Mi Custodia".

