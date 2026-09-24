# Guía Oficial de Estilos y Paleta de Colores Corporativa — Metricall

Este documento establece el estándar de diseño visual institucional, sobrio, minimalista y netamente corporativo para toda la plataforma Metricall. Su cumplimiento es obligatorio en todos los componentes, vistas, tableros y modales.

---

## 1. Filosofía de Diseño y Principios Rectores

1. **Formalidad y Sobriedad Institucional**: La plataforma es una herramienta de gestión operativa y directiva de alto nivel. Debe transmitir elegancia, orden y seriedad en cada elemento.
2. **Jerarquía Visual sin Ruido Cromático**: Se prohíbe la coexistencia de múltiples colores saturados o fluorescentes que compitan entre sí por la atención del usuario. Los datos críticos deben destacar por contraste y tipografía, no por estridencia.
3. **Ayuda Visual Periférica y Sutil**: Los colores de fondo tintados en las tarjetas (mapas de calor) se mantienen exclusivamente como guías tenues y amables a la vista.
4. **Cero Emojis**: Queda estrictamente prohibido el uso de emojis en etiquetas, botones, estatus o badges.

---

## 2. Entorno 1: Tablero Kanban y Tarjetas (Fondo Claro)

Las columnas y tarjetas del tablero operan sobre una base clara y despejada, optimizada para jornadas prolongadas de trabajo sin fatiga visual.

### Paleta Oficial de Tarjetas y Elementos Clave

| Elemento / Rol | Token / HEX | Descripción y Uso |
| :--- | :--- | :--- |
| **Fondo Tarjeta por Defecto** | `#FFFFFF` | Superficie blanca limpia para tarjetas en gestión o estándar. |
| **Fondo Ayuda Visual: Efectiva** | `#E8F5E9` | Verde pastel muy tenue. Indica gestión exitosa o cliente interesado. |
| **Fondo Ayuda Visual: Negativa** | `#FFEBEE` | Rojo pastel muy tenue. Indica gestión desfavorable o no interesado. |
| **Fondo Ayuda Visual: Posible** | `#E3F2FD` | Azul pastel muy tenue. Casos en evaluación o factibilidad. |
| **Borde de Tarjeta** | `#E2E8F0` | Borde sutil que delimita la tarjeta sin saturar. |
| **Título / Nombre Cliente** | `#1A202C` | Carbón oscuro de máxima legibilidad y nitidez (`fontWeight: 'bold'`). |
| **Contrato / N° Abonado (`# LCH`)** | `#1E293B` | Azul pizarra oscuro. Se acompaña de icono Hash en `#64748B`. |
| **Metadatos (C.I., Teléfono)** | `#475569` | Gris pizarra medio para información complementaria. |
| **Iconos de Metadatos** | `#64748B` | Tono neutro institucional para iconos de usuario, teléfono y contrato. |
| **Monto de Deuda / Saldo** | `#1E293B` | Texto sobrio en negrita (`fontWeight: 'bold'`). Evitar grises deslavados. |
| **Fecha de Registro** | `#64748B` | Fecha en la esquina superior derecha (`fontSize: 11`). |

---

## 3. Badges y Pastillas de Estado en Tarjetas Claras

Todos los badges deben mantener un formato píldora compacto (`paddingHorizontal: 6`, `paddingVertical: 2`, `borderRadius: 4`, `fontSize: 10`, `fontWeight: 'bold'`), con bordes finos de 1px y texto en mayúsculas limpias:

### A. Badges de Cabecera (Servicio / Módulo)
- **Cobranza**: Fondo `#F1F5F9`, borde `#E2E8F0`, texto `#475569`.
- **Servicios (`HOGAR`, `PYMES`, `DEDICADO`, `ISP`)**: Fondo `#F1F5F9`, borde `#E2E8F0`, texto `#334155`.
- **Procesado en SAE**: Fondo `#F1F5F9`, borde `#CBD5E1`, texto `#334155`.

### B. Badges de Gestión y Contacto (Pie de Tarjeta)
- **Canal de Contacto (`LLAMADA TELEFONICA`, `WHATSAPP`, `CORREO`, etc.)**:
  - Fondo: `#F1F5F9`
  - Borde: `#CBD5E1`
  - Texto: `#475569`
- **Resultado Efectivo (`COBRO EFECTIVO`, `CONVENIO DE PAGO`, `RECUPERADO`)**:
  - Fondo: `#E6F4EA` (verde menta institucional muy suave)
  - Borde: `#A8DAB5`
  - Texto: `#137333` (verde corporativo profundo)
- **Resultado Negativo (`NO DESEA PAGAR`, `PIDE RETIRO`, `TIENE FALLA`, etc.)**:
  - Fondo: `#FCE8E6` (rosa institucional muy suave)
  - Borde: `#F5C2C0`
  - Texto: `#C5221F` (rojo ladrillo sobrio)
- **Resultado No Conclusivo (`NO CONTESTO`, `LUEGO PASA POR OFICINA`, `FUERA DE ZONA`)**:
  - Fondo: `#F1F5F9`
  - Borde: `#CBD5E1`
  - Texto: `#475569`

---

## 4. Entorno 2: Modales, Formularios y Tableros Oscuros (Dark Corporate)

Toda la suite de modales detallados, formularios de edición, auditorías y paneles de configuración opera bajo la paleta corporativa oscura oficial (referencia: Modal Nueva Venta):

| Elemento / Componente | Token / HEX | Función Oficial |
| :--- | :--- | :--- |
| **Superficie Base / Fondos Principales** | `#22272B` | Fondo de modales, paneles principales y contenedores raíz. |
| **Encabezados y Tarjetas Agrupadoras** | `#2C333A` | Cajas internas, contenedores de subsecciones e historiales. |
| **Bordes y Divisores** | `#384148` | Líneas divisorias, contornos de inputs y separación estructural. |
| **Campos de Entrada / Inputs / Dropdowns** | `#1D2125` | Superficie interna de campos de texto y selectores (borde `#384148`). |
| **Texto Principal / Títulos / Valores** | `#FFFFFF` o `#B6C2CF` | Títulos principales, valores numéricos destacados y encabezados. |
| **Texto Secundario / Etiquetas / Subtítulos** | `#8C9BAB` | Labels de formularios, placeholders, notas y metadatos secundarios. |
| **Botón de Acción Principal (Primario)** | `#A0B2C6` / `#8FA3B7` | Botón de confirmación/guardado. Texto en `#1D2125` (negrita). |
| **Botones Secundarios / Cancelar** | `#1D2125` | Fondo oscuro con borde `#384148` y texto `#B6C2CF`. |
| **Pastillas / Tags en Modo Oscuro** | `#2C333A` | Borde `#384148` y texto `#B6C2CF` o `#8C9BAB`. |

---

## 5. Prohibiciones Estrictas de Diseño

1. **Prohibido el uso de colores fluorescentes, estridentes o neón**:
   - PROHIBIDO: Verde neón (`#34D399`, `#10B981`, `#22C55E`).
   - PROHIBIDO: Amarillo chillón (`#FCD34D`, `#FBBF24`).
   - PROHIBIDO: Azul o cian saturado (`#38BDF8`, `#579DFF`, `#60A5FA`).
   - PROHIBIDO: Naranja brillante (`#F59E0B`, `#F97316`).
   - PROHIBIDO: Morados o fucsias encendidos (`#C084FC`, `#E879F9`).
2. **Prohibido el uso de emojis decorativos** en cualquier etiqueta, botón o estatus.
3. **Prohibido el uso de chips o pastillas de selección** para desglosar filtros (usar únicamente `SelectDropdown`).
4. **Prohibido el uso del tipo `any`** en el código TypeScript.
5. **Límite de líneas**: Ningún archivo `.ts`, `.tsx` o `.js` debe superar las 350 líneas de código.
