# Metricall 📡 - CRM, ERP & WMS Operativo para Telecomunicaciones

**Metricall** es una plataforma operativa integral diseñada para empresas de telecomunicaciones (proveedores de Internet FTTH e ISPs). Su objetivo principal es estructurar y estandarizar la captura de datos en campo (ventas, censos, factibilidad técnica e instalaciones) eliminando el texto libre desordenado mediante flujos Kanban dinámicos, georreferenciados y asistidos por Inteligencia Artificial.

---

## 🚀 Características Principales

* **Tableros Kanban de Flujo Operativo**:
  * Gestión por etapas: *Venta*, *Factibilidad Técnica (Evidencia LCH obligatoria)*, *Por Instalar*, *Asignado A*, *En Proceso*, *Por Activar*, *Cliente Activo* y *Liberada*.
  * Georreferenciación GPS obligatoria y captura de **GeoFotos** (Caja NAP y residencia del cliente).
  * Trazabilidad completa con historial cronológico de cambios y autoría.
* **Censo Comercial y Prospección en Campo**:
  * Levantamiento de prospectos con datos de servicios actuales y disposición de cambio.
  * Botón de **Conversión a Venta** directa que traslada el caso a Factibilidad en el tablero de instalaciones.
  * Importación y exportación masiva en formato Excel (`.xlsx`).
* **Módulo de Almacén y WMS (Materiales)**:
  * Control de inventario central y custodia personal asignada a cada instalador.
  * Registro multi-ítem con modelos y seriales de ONUs / Routers.
  * Generación de órdenes de entrega con firma manuscrita digitalizada.
* **Bot de WhatsApp con Inteligencia Artificial (Meta Cloud API + Google Gemini)**:
  * Recepción de prospectos de ventas online, reporte de pagos y fallas técnicas en tiempo real.
  * Extracción automática estructurada mediante **Google Gemini 2.0 Flash / 3.5 Flash Lite**.
  * Respuestas interactivas con botones nativos de Meta (`[ ✅ Confirmar ]` / `[ ❌ Corregir ]`).
  * Enrutamiento automático a listas de *Gestión Online*, *Reporte Pago* y *Atención de Fallas*.
* **Métricas y KPIs de Rendimiento**:
  * Tasa de conversión y efectividad de vendedores, técnicos instaladores y censadores.
  * Reportes consolidados y exportación directa para WhatsApp y PDF.
* **Messenger Interno Empresarial**:
  * Chat en tiempo real entre colaboradores con capacidad de vincular tarjetas y tableros.

---

## 🛠️ Stack Tecnológico

* **Frontend Móvil y Web**: [Expo SDK 57](https://expo.dev) (`react-native` 0.86, `react` 19.2, `expo-router` v4).
* **Backend & Base de Datos**: [Supabase](https://supabase.com) (PostgreSQL 15+, RLS sin JOINs denormalizado por Tenant, Triggers, RPCs con `SECURITY DEFINER` y Storage de evidencias).
* **Funciones Serverless / API**: Node.js desplegado en [Vercel](https://vercel.com) (`/api/webhook/whatsapp.js` y `/api/services`).
* **Inteligencia Artificial**: API de Google Gemini (Flash 2.0 / Flash Lite).
* **Diseño UI**: Tema oscuro sobrio (Jira Dark Theme `#1D2125`), iconos de Lucide, y componentes estandarizados.

---

## 📁 Estructura del Proyecto

```
├── api/                    # Webhook de WhatsApp y servicios de IA en Vercel
│   ├── services/           # Integración con Meta API, Gemini y Logger
│   └── webhook/            # Endpoint de recepción de mensajes y eventos de Meta
├── assets/                 # Recursos gráficos, logos y fuentes
├── docs/                   # Documentación maestra de arquitectura y flujos
│   ├── ARCHITECTURE.md     # Modelo jerárquico de 5 niveles y optimización RLS
│   ├── WHATSAPP_BOT_ARCHITECTURE.md # Arquitectura del bot Meta + Gemini
│   └── funcionalidades_listas.md    # Especificación de listas y formularios
├── src/
│   ├── app/                # Rutas y vistas de Expo Router (Drawer, Tabs, Tableros)
│   ├── components/         # Componentes modulares (Kanban, Almacén, Ventas, UI)
│   │   └── venta/CamposVenta.tsx # Componentes únicos y centralizados de formulario
│   ├── context/            # Proveedores de contexto (Auth, UI, Ubicación)
│   ├── database/           # Scripts SQL de migraciones, RLS y RPCs de Supabase
│   ├── hooks/              # Custom hooks para lógica desacoplada
│   ├── lib/                # Configuración de clientes (Supabase)
│   ├── services/           # Servicios de cliente (Excel, Gemini, WhatsApp, Mensajes)
│   └── types/              # Definiciones e interfaces estrictas TypeScript
├── AGENTS.md               # Reglas y políticas de desarrollo para agentes/desarrolladores
├── guiaprompting.md        # Manual de ingeniería de prompts y patrones de razonamiento
└── package.json            # Dependencias y scripts del proyecto
```

---

## ⚙️ Configuración y Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Meta WhatsApp Cloud API (Webhook Vercel)
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WABA_ID=tu_waba_id
WHATSAPP_ACCESS_TOKEN=tu_system_user_token_permanente
WHATSAPP_VERIFY_TOKEN=tu_verify_token_secreto
WHATSAPP_APP_SECRET=tu_app_secret_de_meta

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key
```

---

## 💻 Comandos de Desarrollo

### Instalar dependencias
```bash
npm install
```

### Iniciar entorno de desarrollo Expo
```bash
npm run start
```

### Ejecutar en navegador web
```bash
npm run web
```

### Ejecutar en Android (dispositivo o emulador)
```bash
npm run android
```

### Compilar versión Web para producción (Vercel)
```bash
npm run build
```

---

## 📜 Reglas de Contribución y Código

Consultar [`AGENTS.md`](./AGENTS.md) antes de realizar cualquier modificación:
1. **Cero `any`**: Tipado estricto en todo el código TypeScript.
2. **Componentes centralizados**: Todos los campos de formulario (`InputTexto`, `DatePickerInput`, `SelectDropdown`) deben importarse exclusivamente desde `src/components/venta/CamposVenta.tsx`.
3. **Modales compactos**: Selectores emergentes centrados (`maxWidth: 340`, `animationType="fade"`).
4. **Badges sin emojis**: Etiquetas sobrias tipo píldora traslúcida sin emojis decorativos.
5. **Modularidad estricta**: Máximo 350 líneas de código por archivo.

