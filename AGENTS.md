# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Componentes y Estilos Globales de Formulario

Todos los componentes de entrada de datos (`InputTexto`, `DatePickerInput`, `SelectDropdown`) DEBEN importarse únicamente desde `src/components/venta/CamposVenta.tsx`.
Queda estrictamente prohibida la redefinición o duplicación local de estos componentes o sus estilos en componentes o formularios individuales.
Todos los selectores de opciones (`SelectDropdown`) deben utilizar modales centrados y compactos (`maxWidth: 340`, `animationType="fade"`).

# Estilo Global de Etiquetas y Badges

Queda ESTRICTAMENTE PROHIBIDO incluir emojis en las etiquetas, badges o estatus (ej. PROHIBIDO usar `✅`, `🟡`, `❌` en badges como `PAGO PROCESADO` o `PAGO EN REVISIÓN`). Los emojis restan seriedad profesional a la interfaz.
Todas las etiquetas deben mantener un estilo uniforme, sobrio y minimalista siguiendo exactamente el estándar del badge de `GESTIÓN ONLINE`:
- Formato píldora compacto (`paddingHorizontal: 6`, `paddingVertical: 2`, `borderRadius: 4`).
- Fondo traslúcido suave (`rgba(...)`) correspondiente al tipo/estatus.
- Texto limpio en mayúsculas (`fontSize: 10`, `fontWeight: 'bold'`).
- Sin bordes gruesos ni saturados ni emojis decorativos.
- **Ubicación del Badge de Pago y Redundancia**: Queda prohibido mostrar la etiqueta `GESTIÓN ONLINE` en el encabezado de las tarjetas dentro del tablero de Gestión Online por ser redundante. En su lugar, si la tarjeta es un reporte de pago, el badge de estatus del pago (`PAGO PROCESADO`, `PAGO EN REVISIÓN`, `PAGO RECHAZADO`) DEBE posicionarse directamente en la cabecera superior de la tarjeta.
- **Limpieza de Badges Redundantes**: Se prohíbe colocar badges redundantes como `WS`, `REPORTE FALLA` o `GESTIÓN ONLINE` en la cabecera de las tarjetas dentro de los módulos de Gestión Online. Las tarjetas solo llevarán badge si tienen un servicio contratado (`HOGAR`, `PYMES`, `DEDICADO`, `ISP`), un estatus de pago (`PAGO PROCESADO`, `PAGO RECHAZADO`, `PAGO EN REVISIÓN`) o en tableros de cobranza (`COBRANZA`). Las cabeceras de tarjetas en Ventas Online y Reporte Falla permanecen completamente limpias.

# Prohibición Estricta del Tipo `any` en TypeScript

Queda ESTRICTAMENTE PROHIBIDO el uso del tipo `any` en todo el proyecto.
- Todos los tipos e interfaces deben definirse explícitamente (`unknown`, tipos genéricos, o interfaces/tipos concretos de TypeScript).
- En caso de trabajar con datos dinámicos o respuestas de API/Supabase, se deben utilizar interfaces estrictas o mecanismos de type narrowing / type guards.

# Límite de Líneas por Archivo y Modularización

Es OBLIGATORIO que ningún archivo (`.ts`, `.tsx`, `.js`) supere las 350 líneas de código.
- Todo componente, hook, servicio o vista que crezca debe modularizarse y dividirse en submódulos o subcomponentes independientes.
- Mantener funciones y archivos pequeños, cohesivos y fáciles de mantener.

# Prohibición Estricta de Chips / Filter Chips / Pastillas de Selección

Queda TAJANTEMENTE PROHIBIDO el uso de chips, filter chips, pastillas o píldoras de selección para desglosar filtros u opciones en toda la aplicación.
- Se consideran componentes genéricos y poco profesionales para desglosar opciones.
- Todos los filtros, categorías y opciones de selección DEBEN implementarse únicamente mediante listas desplegables (`SelectDropdown`) centradas o listas estructuradas.
# Estética y Paleta de Colores Corporativa (Sobria y Minimalista)

Queda ESTRICTAMENTE PROHIBIDO romper la estética corporativa sobria mediante el uso de colores fluorescentes, estridentes, neón o chillones (ej. PROHIBIDO usar verde neón `#34D399` / `#10B981` / `#22C55E`, amarillo chillón `#FCD34D` / `#FBBF24`, cian o azul eléctrico saturado `#579DFF` / `#60A5FA` / `#93C5FD`, naranja brillante `#F59E0B`, morados llamativos, etc.). La interfaz no debe parecer un mosaico saturado de colores ("parece un perico").

Todo formulario, modal, tarjeta, tabla e indicador debe ajustarse estrictamente a la paleta corporativa oscura, sobria y minimalista oficial (referencia oficial: Modal Nueva Venta / Formularios):
- **Superficie base / Fondos principales**: `#22272B`
- **Encabezados, tarjetas agrupadoras y subsecciones**: `#2C333A`
- **Bordes y divisores**: `#384148`
- **Campos de entrada, inputs y cajas internas**: `#1D2125` o `#22272B` con borde `#384148`
- **Texto principal / Títulos / Valores numéricos**: `#B6C2CF` o `#FFFFFF` (para énfasis limpio y sobrio)
- **Texto secundario / Etiquetas / Subtítulos / Iconos estándar**: `#8C9BAB`
- **Botones y elementos interactivos**: `#1D2125` con borde `#384148` y texto `#B6C2CF`, o botón de acción principal sobrio (`#A0B2C6` o `#8FA3B7` con texto `#1D2125`).
- **Badges, píldoras y tags**: Tonos neutros o translúcidos muy tenues (`#2C333A` con borde `#384148`, texto `#8C9BAB` o `#B6C2CF`), sin saturación ni colores estridentes.
- **Números de stock, seriales, identificadores y métricas**: Deben utilizar texto limpio `#FFFFFF` o `#B6C2CF`, NUNCA colores fosforescentes (verde, amarillo, cian o naranja).
- La interfaz debe transmitir sobriedad, elegancia y consistencia corporativa en cada modal, tabla, tarjeta y formulario.
