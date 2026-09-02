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

