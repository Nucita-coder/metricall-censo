# 📑 DOCUMENTO DE CONTEXTO Y ARQUITECTURA: SISTEMA BOT WHATSAPP CLOUD API + IA (GEMINI)

**Propósito:** Transferir todo el conocimiento, reglas de arquitectura, flujo de interacción de WhatsApp y lógica de base de datos implementados en el proyecto principal para aplicarlos en el nuevo sistema (**MetricallBot**).

---

## 1. Stack Tecnológico y Reglas de Código (AGENTS.md)

* **Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Supabase (PostgreSQL + RLS + RPC) · TanStack Query · Zustand · Tailwind CSS 4.
* **Límite de 350 líneas por archivo (OBLIGATORIO):** Ningún archivo `.ts` o `.tsx` puede superar las 350 líneas. Si una función o handler crece, debe dividirse en submódulos independientes (ejemplo: `route.ts`, `service.ts`, `session.ts`, `gemini.ts`, `preview.ts`, `publicar.ts`).
* **Cero `any`:** Strict TypeScript. Precios en USD como `DECIMAL(12,2)` / `string`.
* **Soft Delete:** Filtrar `deleted_at IS NULL` en toda consulta SQL/Supabase.

---

## 2. Flujo y UX del Bot por WhatsApp Cloud API

### A. Recepción de Fotos y Anti-Spam Batching
* Se permite un **máximo de 4 fotos** por publicación.
* Para evitar race conditions en PostgreSQL cuando Meta envía webhooks concurrentes de múltiples fotos en el mismo milisegundo, la inserción de imágenes en el array `fotos_urls` de la sesión se realiza mediante la función RPC atómica `agregar_foto_whatsapp_sesion`.
* Las fotos 2, 3 y 4 se procesan silenciosamente sin enviar mensajes repetidos de "Foto cargada".

### B. Extracción de Datos con IA (Google Gemini 2.0 Flash / 3.5 Flash Lite)
* Gemini analiza el mensaje del usuario y extrae un JSON estructurado con los campos requeridos.
* **Para repuestos:** Pieza/Nombre, Marca del repuesto (donde "Genérico" es 100% válida), Precio ($), N° de parte (Opcional), Condición (Opcional), Negociable (Opcional), Venta continua (Opcional), Observaciones.
* La ubicación y ciudad del vendedor no se preguntan: se toman por defecto del perfil de la empresa o usuario.

### C. Previsualización Interactiva con Botones Nativos de Meta (Interactive Quick Reply)
El bot genera un borrador formateado y adjunta 3 botones interactivos nativos al final del mensaje de WhatsApp:
1. **`[ ✅ Publicar ]`**: Valida campos obligatorios y ejecuta el `INSERT` en la BD.
2. **`[ ✏️ Modificar ]`**: Cambia el estado de la sesión a `ESPERANDO_CORRECCION` y le pide al usuario escribir el cambio (ej: *"precio 70$"*, *"es nuevo"*). Al recibir la respuesta, Gemini actualiza el JSON y vuelve a enviar el borrador con los 3 botones.
3. **`[ ❌ Cancelar ]`**: Limpia la sesión y reinicia el flujo.

### D. Preguntas Situacionales
* Si el usuario hace una pregunta corta (*"¿qué sigue?"*, *"¿cuánto cuesta?"*, *"¿dónde sale mi publicación?"*), Gemini la responde de forma concisa (1 a 2 líneas) y re-presenta la previsualización con los 3 botones.

---

## 3. Autorización de Números y Empresas (Códigos TUC-XXXXX / MET-XXXXX)

* Cada empresa registrada tiene un código único (`whatsapp_codigo`).
* Si un número no registrado envía el código por WhatsApp, se registra como `PENDIENTE` en la tabla `whatsapp_numeros_autorizados`.
* El administrador de la empresa aprueba o revoca el número desde el panel de control.
* Al publicar desde WhatsApp, el bot resuelve la empresa y atribuye el registro al `empresa_id` correspondiente y al `auth_user_id` del representante.

---

## 4. Base de Datos, Triggers y RPCs Clave

* **`096_whatsapp_numeros_autorizados.sql`**: Tabla de vinculación de números autorizados y trigger de autogeneración de códigos de empresa.
* **`097_fix_whatsapp_session_atomic_fotos.sql`**: RPC `agregar_foto_whatsapp_sesion` para agregación atómica de arrays de fotos sin race conditions.
* **`098_fix_validar_publicacion_repuesto_taller.sql`**: Trigger `validar_publicacion_repuesto` actualizado para admitir empresas de tipo `TALLER` y `ALIADO_COMERCIAL` con cupo inicial de publicaciones.

---

## 5. Configuración de Meta Cloud API y Variables de Entorno

```env
WHATSAPP_PHONE_NUMBER_ID=1327272020463323
WHATSAPP_WABA_ID=2044205619545598
WHATSAPP_ACCESS_TOKEN=tu_system_user_token_permanente
WHATSAPP_VERIFY_TOKEN=tu_verify_token_secreto
WHATSAPP_APP_SECRET=tu_app_secret_de_meta
GEMINI_API_KEY=tu_gemini_api_key
```

### Tarifas y Costos Optimización
* **Meta:** 1,000 conversaciones de servicio al mes gratis. Excedentes o salientes (*Utility*) a ~$0.015 USD por ventana de 24h.
* **Gemini API:** Capa gratuita de 1,500 peticiones diarias (45,000/mes) ➔ Costo de IA $0.00 USD para bajo/medio volumen.
