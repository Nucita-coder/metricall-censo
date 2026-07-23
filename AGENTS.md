# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Componentes y Estilos Globales de Formulario

Todos los componentes de entrada de datos (`InputTexto`, `DatePickerInput`, `SelectDropdown`) DEBEN importarse únicamente desde `src/components/venta/CamposVenta.tsx`.
Queda estrictamente prohibida la redefinición o duplicación local de estos componentes o sus estilos en componentes o formularios individuales.
Todos los selectores de opciones (`SelectDropdown`) deben utilizar modales centrados y compactos (`maxWidth: 340`, `animationType="fade"`).
