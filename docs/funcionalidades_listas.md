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
