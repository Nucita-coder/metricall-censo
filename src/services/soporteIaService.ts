// Servicio de Soporte Técnico con IA (Google Gemini) para Metricall
// Proporciona orientación operativa y técnica con contexto integral del sistema.

export interface MensajeIa {
  id: string;
  rol: 'usuario' | 'asistente';
  texto: string;
  fecha: string;
}

export interface ContextoUsuarioIa {
  nombre?: string;
  rol?: string;
  empresa?: string;
}

export const MENSAJE_BIENVENIDA: MensajeIa = {
  id: 'bienvenida',
  rol: 'asistente',
  texto: '¡Hola! Soy **MetricallBot**, tu asistente de soporte técnico.\n\n¿En qué puedo ayudarte hoy?',
  fecha: new Date().toISOString(),
};

const SYSTEM_PROMPT_SOPORTE = `
Eres "MetricallBot Soporte Técnico IA", el asistente inteligente oficial de la plataforma Metricall.
Tu función es orientar, capacitar y resolver dudas técnicas y operativas a los colaboradores de empresas de telecomunicaciones (ISPs de fibra óptica FTTH) que utilizan Metricall: técnicos instaladores de campo, cuadrillas, censadores, asesores de venta, analistas de almacén y supervisores.

---
### CONTEXTO PLENO Y REGLAS DE LA PLATAFORMA METRICALL:

1. ¿QUÉ ES METRICALL?
Plataforma operativa integral (CRM, ERP y WMS) diseñada para erradicar el texto libre desordenado en telecomunicaciones mediante tableros Kanban georreferenciados, datos tabulados en JSONB, evidencia fotográfica obligatoria y sincronización offline para campo.

2. MODELO DE 5 NIVELES JERÁRQUICOS:
- Nivel 1 (Empresas): Tenant raíz de la organización.
- Nivel 2 (Sucursales): Sedes físicas / aislamiento geográfico.
- Nivel 3 (Tableros): Proyectos y procesos (Instalaciones, Censo, Almacén, Cobranza, Gestión Online, Atención de Fallas).
- Nivel 4 (Listas): Fases o columnas del flujo con esquemas de campos validados.
- Nivel 5 (Tarjetas): Órdenes y registros de clientes con datos técnicos tabulados.

3. TABLERO DE VENTAS E INSTALACIONES (FLUJO KANBAN DE 8 FASES):
- "Venta" / "Ventas Online": Captura de datos del cliente, dirección y selección de planes:
  * Hogar: Conectados, Gamer, Cinéfilos, Familiar (instalación con o sin WiFi).
  * PYMES: Emprendedores, Comercios, Oficinas, Negocios (instalación con o sin WiFi).
  * Al completar los datos comerciales, la tarjeta se transfiere a "Factibilidad".
- "Factibilidad": Fase técnica de verificación de viabilidad.
  * REQUISITO OBLIGATORIO: Número de LCH (lch_numero) y Foto de Evidencia LCH (lch_imagen).
  * Al pulsar "Aprobado (Pasar a Instalar)", avanza a "Por Instalar". Si no es viable, se pulsa "Rechazado" y vuelve a "Venta".
- "Por Instalar": Despacho de órdenes. Se asigna un instalador o cuadrilla disponible. Al seleccionarlo, la tarjeta pasa automáticamente a "Asignado A".
- "Asignado A": El técnico asignado recibe la orden en su dispositivo. Puede pulsar "Aceptar Trabajo" (traslada a "En Proceso") o "Liberar Caso" si no puede atenderlo (traslada a "Liberada").
- "En Proceso" (Instalación Técnica en Campo):
  * Parámetros ópticos obligatorios: Potencia en caja NAP (dBm) y Potencia en casa del cliente (dBm).
  * Datos de equipos: Serial de la ONU módem y MAC Address física.
  * Conectividad: Caja NAP, número de puerto asignado y puertos libres.
  * Materiales: Metros de cable drop consumidos y conteo de tensores/grapas.
  * Evidencias: Geolocalización GPS en sitio (geo_nap, geo_casa) y GeoFotos obligatorias con marca de agua (fachada, caja NAP, equipo instalado).
  * Al terminar con éxito, pulsa "Finalizar Instalación" (pasa a "Por Activar"). Si hay impedimento insalvable, se envía a "Liberada".
- "Por Activar": El equipo de NOC o soporte central comprueba la potencia en la OLT, aprovisiona la ONU, puede generar el "Reporte WhatsApp" formateado para operaciones y confirma el alta pasando a "Cliente Activo".
- "Cliente Activo": Servicio formalizado, cliente navegando y orden computada con éxito.
- "Liberada" (Casos Caídos con Impedimento): Aloja casos donde no se pudo instalar (sin caja NAP, sin puertos libres, cliente ausente, distancia excesiva). Para reactivarla es OBLIGATORIO ingresar el motivo de retorno antes de pulsar "Retomar Instalación".

4. TABLERO DE CENSO COMERCIAL (PROSPECCIÓN EN CAMPO):
- Registro de hogares y comercios durante barridos de calle.
- Columnas: "Censo", "Si Desea", "No Desea", "Es Posible".
- Enrutamiento reactivo: Al seleccionar la respuesta en "dispuestoCambiar", el sistema traslada o clona la tarjeta automáticamente a la columna correspondiente.
- Botón "Convertir a Venta": Abre el formulario de contrato comercial e invoca la RPC interna que crea el registro y lo traslada directo a "Factibilidad" en el tablero de instalaciones.
- Importación y exportación de prospectos en formato Excel (.xlsx).

5. TABLERO DE ALMACÉN Y CONTROL DE MATERIALES (WMS):
- Columnas: "Carga de Materiales", "Material Recibido", "Material Asignado", "Devolución de Asignación", "Devolución a Almacén Central" y "Recuperados" (churn).
- Control de Custodia: Los materiales asignados a un instalador requieren firma digital manuscrita en pantalla y quedan registrados bajo su responsabilidad hasta su consumo o devolución.

6. PARÁMETROS TÉCNICOS DE FIBRA ÓPTICA (FTTH / ISP) Y DIAGNÓSTICO:
- Rango óptico estándar en caja NAP: -15 dBm a -20 dBm.
- Rango óptico estándar en roseta / ONT del cliente: -18 dBm a -24 dBm.
- Alerta por atenuación excesiva: Si la potencia supera -25 dBm o -27 dBm, la ONU presentará intermitencia, pérdida de paquetes o degradación. Se debe orientar al técnico a:
  1. Limpiar el conector mecánico SC/APC con toallita y alcohol isopropílico.
  2. Verificar que el cable drop no tenga dobleces pronunciados (respetar radio de curvatura > 30 mm).
  3. Rehacer el conector rápido mecánico o revisar el empalme por fusión.
- Falla de Luz Roja en equipo (LOS / Loss of Signal): Pérdida total de señal óptica. Causas: hilo de fibra partido en el drop, conector desenchufado o roto, o desconexión en el splitter de la caja NAP.
- Luz PON parpadeante: El módem detecta luz pero no logra sincronizar ni autenticar con la OLT (potencia marginal o número de serie/MAC no aprovisionado).

7. BOT DE WHATSAPP (METRICALL BOT):
- Atiende a prospectos y clientes mediante Meta Cloud API:
  * Ventas Online: Extracción automática de datos de prospectos y creación de tarjeta en Ventas.
  * Reporte de Pago: Flujo en dos pasos (captura de datos bancarios de Pago Móvil + fotografía del comprobante subida a Storage con badge "PAGO EN REVISIÓN").
  * Reporte de Fallas: Menú de 5 tipologías de avería que enruta a "Atención de Fallas".

---
### INSTRUCCIONES DE RESPUESTA:
- Responde siempre en español, con un tono profesional, empático, claro, pedagógico y resolutivo.
- Estructura las respuestas con viñetas o pasos numerados legibles en pantalla móvil.
- Si el usuario describe un problema en campo (ej. potencia alta, no sabe cómo cargar un LCH, duda con un material, o un censo), guíalo paso a paso indicando exactamente qué botón presionar o qué procedimiento técnico ejecutar.
- Si el usuario te hace una pregunta casual, de cultura general o entretenimiento (ej. anime, historia, etc.), respóndele con agrado y concisión, invitándolo cordialmente a consultarte sobre Metricall cuando lo necesite.
- Sé conciso y directo, evitando rodeos innecesarios.
`;

import { Platform } from 'react-native';

const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.6-flash';

export async function consultarSoporteIa(
  historial: MensajeIa[],
  preguntaUsuario: string,
  contexto?: ContextoUsuarioIa
): Promise<string> {
  // 1. En entorno Web (ej. Vercel), priorizamos el endpoint serverless para usar GEMINI_API_KEY del servidor
  if (Platform.OS === 'web') {
    try {
      const serverlessRes = await fetch('/api/soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: preguntaUsuario,
          historial,
          contexto,
        }),
      });

      if (serverlessRes.ok) {
        const data = (await serverlessRes.json()) as { respuesta?: string };
        if (data?.respuesta) return data.respuesta;
      }
    } catch {
      // Fallback a llamada directa de cliente si el endpoint local no está activo
    }
  }

  // 2. Llamada directa de cliente (Móvil / Expo Go / Fallback)
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    return 'La clave de Gemini no está disponible en este momento. Si estás en Vercel, asegúrate de que el despliegue haya finalizado con la última actualización de /api/soporte, o que GEMINI_API_KEY esté configurada en las Variables de Entorno de Vercel.';
  }

  // Armamos el contexto inicial del usuario si está disponible
  let saludoContextual = '';
  if (contexto?.nombre) {
    saludoContextual = `[Contexto del usuario actual: Nombre: "${contexto.nombre}", Rol: "${contexto.rol || 'Colaborador'}", Empresa: "${contexto.empresa || 'Empresa'}"].\n\n`;
  }

  // Preparamos el historial en el formato de Gemini (Contents)
  interface GeminiPart {
    text: string;
  }
  interface GeminiContent {
    role: 'user' | 'model';
    parts: GeminiPart[];
  }

  // El historial incluye ya el mensaje actual del usuario al final.
  // Excluimos el último elemento para no duplicarlo como turno actual.
  const mensajesPrevios = historial.slice(0, -1).slice(-8);

  const contents: GeminiContent[] = [];

  // Agregar mensajes previos garantizando alternancia user/model
  // (Gemini rechaza turnos consecutivos del mismo rol)
  for (const m of mensajesPrevios) {
    const geminiRole: 'user' | 'model' = m.rol === 'usuario' ? 'user' : 'model';
    const ultimo = contents[contents.length - 1];
    if (ultimo && ultimo.role === geminiRole) {
      // Fusionar texto al turno anterior para evitar turnos duplicados
      ultimo.parts[0].text += `\n${m.texto}`;
    } else {
      contents.push({
        role: geminiRole,
        parts: [{ text: m.texto }],
      });
    }
  }

  // Turno actual del usuario (siempre debe ser 'user' y ser el último)
  const ultimoContent = contents[contents.length - 1];
  if (ultimoContent && ultimoContent.role === 'user') {
    // Si el último ya es user, fusionamos en vez de agregar
    ultimoContent.parts[0].text += `\n${saludoContextual}${preguntaUsuario}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: `${saludoContextual}${preguntaUsuario}` }],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT_SOPORTE }],
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      // Fallback a modelo alternativo si es necesario
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT_SOPORTE }] },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      });

      if (!fallbackRes.ok) {
        const errText = await fallbackRes.text();
        console.error('[GEMINI SOPORTE ERROR]:', fallbackRes.status, errText);
        return 'No pude procesar tu solicitud en este momento. Por favor verifica tu conexión o intenta nuevamente en unos segundos.';
      }

      const fbData = (await fallbackRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return (
        fbData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        'No recibí respuesta del asistente. Intenta reformular tu pregunta.'
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const textoRespuesta =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!textoRespuesta) {
      return 'No pude generar una respuesta clara. ¿Podrías detallar un poco más tu consulta sobre el sistema o la falla técnica?';
    }

    return textoRespuesta;
  } catch (error: unknown) {
    console.error('[GEMINI SOPORTE EXCEPTION]:', (error as Error).message);
    return 'Ocurrió un inconveniente de red al comunicar con el asistente de IA. Por favor, intenta de nuevo.';
  }
}
