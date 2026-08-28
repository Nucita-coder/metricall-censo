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

// ─── Extracción básica sin IA (fallback robusto) ─────────────────────────────
function extraerDatosBasicosJS(texto, numeroEmisor) {
  // Separar por coma, punto y coma, salto de línea
  const partes = texto.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);

  // Capitalizar primera letra de cada palabra
  const capitalizar = str => str.replace(/\b\w/g, c => c.toUpperCase());

  const nombre = partes[0] ? capitalizar(partes[0]) : null;
  const sector = partes[1] ? capitalizar(partes[1]) : null;

  // Buscar teléfono en el texto
  const matchTel = texto.match(/(?:04\d{9}|584\d{9}|\+?58\d{10}|\d{10,11})/);
  const telefono = matchTel ? matchTel[0].replace(/\D/g, '') : numeroEmisor;

  return {
    nombre:   nombre || 'Cliente WhatsApp',
    sector:   sector || 'No especificado',
    telefono: telefono || numeroEmisor
  };
}

// ─── Extraer datos de suscripción (Nombre, Sector, Teléfono) ─────────────────
export async function extraerDatosSuscripcion(userText, numeroEmisor) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!userText || !userText.trim()) {
    return { nombre: 'Cliente WhatsApp', sector: 'No especificado', telefono: numeroEmisor };
  }

  // Sin API key → extracción básica directamente
  if (!apiKey) {
    console.warn('[GEMINI] Sin API key, usando extracción básica');
    return extraerDatosBasicosJS(userText, numeroEmisor);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = `Un cliente envió el siguiente mensaje para suscribirse a un servicio de internet.
Extrae la información y responde ÚNICAMENTE con un JSON plano (sin formato markdown ni \`\`\`json) con la siguiente estructura:

{
  "nombre": "Nombre y Apellido del cliente (si solo dio un nombre, úsalo igual)",
  "sector": "Sector, urbanización, barrio, ciudad o zona residencial donde vive",
  "telefono": "Número telefónico de contacto si el cliente especificó uno distinto en el texto, de lo contrario la palabra DEFAULT"
}

Reglas:
1. Acepta nombres simples (sin apellido) como válidos.
2. Si falta el nombre o el sector, extráelo del contexto o del texto.
3. Si no hay teléfono diferente, pon DEFAULT.
4. Responde SOLO el JSON, sin texto adicional.

Mensaje del cliente:
"${userText.replace(/"/g, '\\"')}"`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
      })
    });

    if (!response.ok) {
      console.error('[GEMINI HTTP ERROR]:', response.status);
      return extraerDatosBasicosJS(userText, numeroEmisor);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return extraerDatosBasicosJS(userText, numeroEmisor);
    }

    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const nombreRaw = String(parsed.nombre || '').trim();
    const sectorRaw = String(parsed.sector || '').trim();

    // Aceptar cualquier valor no vacío y que no sea el placeholder exacto
    const nombre = (nombreRaw && nombreRaw !== 'Nombre y Apellido del cliente') ? nombreRaw : null;
    const sector = (sectorRaw && sectorRaw !== 'Sector, urbanización, barrio o zona donde vive') ? sectorRaw : null;

    let telefono = parsed.telefono && parsed.telefono !== 'DEFAULT'
      ? String(parsed.telefono).replace(/\D/g, '')
      : null;
    if (!telefono || telefono.length < 7) telefono = null;

    // Si Gemini no extrajo bien, usar extracción básica como respaldo
    const basico = extraerDatosBasicosJS(userText, numeroEmisor);

    return {
      nombre:   nombre   || basico.nombre,
      sector:   sector   || basico.sector,
      telefono: telefono || basico.telefono
    };

  } catch (err) {
    console.error('[GEMINI SUSCRIPCION ERROR]:', err);
    return extraerDatosBasicosJS(userText, numeroEmisor);
  }
}

// ─── Extraer datos de reporte de pago (Cédula, Referencia, Monto, Banco) ──────
export async function extraerDatosPago(userText, numeroEmisor) {
  const apiKey = process.env.GEMINI_API_KEY;

  const extraerBasicosPago = (text) => {
    const txt = (text || '').trim();
    if (!txt) {
      return { cedula: 'No especificada', referencia: 'S/N', monto: 'Por verificar', banco: 'No especificado', telefono: numeroEmisor };
    }

    let cedula = null;
    let referencia = null;
    let monto = null;
    let banco = null;

    // 1. Coincidencia explícita con etiquetas
    const cedulaMatch = txt.match(/(?:cedula|cédula|abonado|ci|v-?)\s*:?\s*([VvEeJjPp]?-?\d{6,9})/i);
    const refMatch = txt.match(/(?:ref|referencia|num|nro|#)\s*:?\s*(\d{6,14})/i);
    const montoMatch = txt.match(/(?:monto|\$|usd|bs|\$bs)\s*:?\s*(\d+(?:[.,]\d{1,2})?\s*(?:\$|usd|bs)?)/i);
    const bancoMatch = txt.match(/(banesco|mercantil|provincial|venezuela|bancamiga|bvc|bnc|bod|exterior|sofitasa|plaza)/i);

    if (cedulaMatch) cedula = cedulaMatch[1];
    if (refMatch) referencia = refMatch[1];
    if (montoMatch) monto = montoMatch[1];
    if (bancoMatch) banco = bancoMatch[0].toUpperCase();

    // 2. Extracción por posición si los tokens fueron enviados en lista (ej: "30953712 11111111 28.029.33 04123757313 mercantil")
    const subTokens = txt.split(/[\s,;\n]+/).filter(Boolean);
    const numeros = subTokens.filter(t => /^\d+([.,]\d+)*$/.test(t) || /^[VvEeJjPp]-\d+$/.test(t));
    const bancoToken = subTokens.find(t => /(banesco|mercantil|provincial|venezuela|bancamiga|bvc|bnc|bod|exterior|sofitasa|plaza)/i.test(t));

    if (!cedula && numeros[0]) cedula = numeros[0];
    if (!referencia && numeros[1]) referencia = numeros[1];
    if (!monto && numeros[2]) monto = numeros[2];
    if (!banco && bancoToken) banco = bancoToken.toUpperCase();

    return {
      cedula:     cedula     || 'No especificada',
      referencia: referencia || 'S/N',
      monto:      monto      || 'Por verificar',
      banco:      banco      || 'No especificado',
      telefono:   numeroEmisor
    };
  };

  if (!userText || !userText.trim()) {
    return extraerBasicosPago('');
  }

  if (!apiKey) {
    console.warn('[GEMINI] Sin API key, usando extracción básica de pago');
    return extraerBasicosPago(userText);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = `Un cliente de internet envió un reporte de pago por WhatsApp.
Extrae la información requerida y responde ÚNICAMENTE con un JSON plano (sin formato markdown ni \`\`\`json):

{
  "cedula": "Cédula, RIF o Nro de Abonado del cliente",
  "referencia": "Número de referencia bancaria o comprobante de pago",
  "monto": "Monto pagado con moneda si especifica (ej: '28.029,33', '25$')",
  "banco": "Nombre del banco de origen (ej: Banesco, Mercantil, Venezuela, etc.)"
}

REGLAS DE EXTRACCIÓN POR POSICIÓN:
- Si el usuario envió valores separados por espacios o comas sin etiquetas explícitas (ejemplo: "30953712 11111111 28.029.33 04123757313 mercantil"):
  1. El 1er número suele ser la Cédula/Abonado (ej: 30953712).
  2. El 2do número es la Referencia (ej: 11111111).
  3. El 3er número es el Monto (ej: 28.029.33).
  4. El texto con el nombre del banco es el Banco (ej: Mercantil).
- Si falta algún dato, coloca 'No especificado'. Responde SOLO el JSON.

Mensaje del cliente:
"${userText.replace(/"/g, '\\"')}"`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
      })
    });

    if (!response.ok) {
      return extraerBasicosPago(userText);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return extraerBasicosPago(userText);

    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Fallback a extracción posicional si Gemini colocó el mismo número en cédula, ref y monto
    if (parsed.cedula && parsed.cedula === parsed.referencia && parsed.cedula === parsed.monto) {
      return extraerBasicosPago(userText);
    }

    return {
      cedula:     parsed.cedula     || 'No especificada',
      referencia: parsed.referencia || 'S/N',
      monto:      parsed.monto      || 'Por verificar',
      banco:      parsed.banco      || 'No especificado',
      telefono:   numeroEmisor
    };
  } catch (err) {
    console.error('[GEMINI PAGO ERROR]:', err);
    return extraerBasicosPago(userText);
  }
}


