# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Componentes y Estilos Globales de Formulario

Todos los componentes de entrada de datos (`InputTexto`, `DatePickerInput`, `SelectDropdown`) DEBEN importarse únicamente desde `src/components/venta/CamposVenta.tsx`.
Queda estrictamente prohibida la redefinición o duplicación local de estos componentes o sus estilos en componentes o formularios individuales.
Todos los selectores de opciones (`SelectDropdown`) deben utilizar modales centrados y compactos (`maxWidth: 340`, `animationType="fade"`).

# Estilo Global de Etiquetas y Badges

Queda ESTRICTAMENTE PROHIBIDO incluir emojis en las etiquetas, badges o estatus (ej. PROHIBIDO usar `✅`, `🟡`, `❌` en badges como `PAGO PROCESADO` o `PAGO PENDIENTE REVISIÓN`). Los emojis restan seriedad profesional a la interfaz.
Todas las etiquetas deben mantener un estilo uniforme, sobrio y minimalista siguiendo exactamente el estándar del badge de `GESTIÓN ONLINE`:
- Formato píldora compacto (`paddingHorizontal: 6`, `paddingVertical: 2`, `borderRadius: 4`).
- Fondo traslúcido suave (`rgba(...)`) correspondiente al tipo/estatus.
- Texto limpio en mayúsculas (`fontSize: 10`, `fontWeight: 'bold'`).
- Sin bordes gruesos ni saturados ni emojis decorativos.

