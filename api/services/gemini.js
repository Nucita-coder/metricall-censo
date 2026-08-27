// Módulo de integración con Google Gemini 2.0 Flash / 3.5 Flash Lite para extracción de datos

const SYSTEM_PROMPT = `
Eres un asistente de IA para MetricallBot en WhatsApp.
Tu objetivo es analizar mensajes y/o imágenes de productos, repuestos o censos enviados por usuarios y extraer un JSON estructurado.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con los siguientes campos:
{
  "pieza_nombre": "Nombre de la pieza o producto (string obligatorio)",
  "marca": "Marca del repuesto/producto. Si no se especifica o no es clara, coloca 'Genérico'",
  "precio_usd": "Precio en USD como número o string con formato (ej: '45.00' o '45'). Si no se menciona, deja ''",
  "numero_parte": "Número de parte o serial si está visible o mencionado, de lo contrario ''",
  "condicion": "Condición (Nuevo, Usado, Reconstruido, etc.), por defecto 'Usado'",
  "negociable": true/false (por defecto false),
  "observaciones": "Notas adicionales o detalles sobre el estado del producto"
}
`;

export async function extraerDatosConGemini(userText, imageBase64Data = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[GEMINI ERROR]: GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const parts = [
    { text: SYSTEM_PROMPT },
    { text: `Mensaje del usuario: "${userText || 'Analiza esta imagen y extrae la información del producto/repuesto'}"` }
  ];

  if (imageBase64Data) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64Data
      }
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      })
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parsear el JSON retornado por Gemini
    const datosExtraidos = JSON.parse(rawText);
    return {
      pieza_nombre: datosExtraidos.pieza_nombre || 'Repuesto / Registro',
      marca: datosExtraidos.marca || 'Genérico',
      precio_usd: datosExtraidos.precio_usd || 'Consultar',
      numero_parte: datosExtraidos.numero_parte || 'N/A',
      condicion: datosExtraidos.condicion || 'Usado',
      negociable: datosExtraidos.negociable || false,
      observaciones: datosExtraidos.observaciones || ''
    };
  } catch (error) {
    console.error('[GEMINI ERROR]:', error);
    return {
      pieza_nombre: userText ? userText.slice(0, 40) : 'Producto en revisión',
      marca: 'Genérico',
      precio_usd: 'Por definir',
      numero_parte: 'N/A',
      condicion: 'Usado',
      negociable: false,
      observaciones: ''
    };
  }
}

// ─── Respuesta conversacional libre (modo prueba) ────────────────────────────
export async function generarRespuestaConversacional(userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Eres MetricallBot, un asistente simpático, directo y con humor venezolano que trabaja en un sistema de inventario llamado Metricall.
El usuario te escribió: "${userText}"
Respóndele de forma natural, breve (máximo 3 líneas), con energía y usando algún emoji.
Si el mensaje no tiene sentido o es muy corto (como una sola letra), di algo gracioso al respecto.
Responde siempre en español venezolano.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 }
      })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || '¡Hola! 👋 Soy MetricallBot. Escríbeme un producto y te ayudo a registrarlo.';
  } catch (err) {
    console.error('[GEMINI CONV ERROR]:', err);
    return '¡Hola! 👋 Soy MetricallBot. ¿En qué te puedo ayudar hoy?';
  }
}

// ─── Extracción de Datos de Reporte de Pago ─────────────────────────────────
export async function extraerDatosPagoConGemini(userText, imageBase64Data = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) console.error('[GEMINI ERROR]: GEMINI_API_KEY no configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `
Eres un asistente experto en extracción de datos de reportes de pago bancarios y pago móvil en Venezuela.
Tu tarea es analizar el mensaje del usuario y/o la imagen de la captura del comprobante y extraer los siguientes datos en JSON estricto:
{
  "cedula": "Número de cédula de identidad (ej: 12345678), o '' si no está",
  "referencia": "Número de referencia COMPLETO del pago/pago móvil/transferencia, o ''",
  "monto": "Monto pagado (ej: '500 Bs' o '15$'), o ''",
  "telefono_pago_movil": "Número de teléfono asociado al pago móvil, o ''",
  "banco": "Nombre del banco emisor (ej: Banesco, Mercantil, BDV, Provincial), o ''"
}
`;

  const parts = [
    { text: systemPrompt },
    { text: `Mensaje del usuario o datos: "${userText || 'Analiza la imagen del comprobante'}"` }
  ];

  if (imageBase64Data) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64Data } });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.1 }
      })
    });
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);
    return {
      cedula: parsed.cedula || 'Por definir',
      referencia: parsed.referencia || 'Por definir',
      monto: parsed.monto || 'Por definir',
      telefono_pago_movil: parsed.telefono_pago_movil || 'Por definir',
      banco: parsed.banco || 'Por definir'
    };
  } catch (err) {
    console.error('[GEMINI PAGO ERROR]:', err);
    return { cedula: 'Por definir', referencia: 'Por definir', monto: 'Por definir', telefono_pago_movil: 'Por definir', banco: 'Por definir' };
  }
}

