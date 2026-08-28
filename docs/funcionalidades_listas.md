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
