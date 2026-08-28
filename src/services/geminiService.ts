export interface DatosSuscripcionExtraidos {
  nombre: string;
  sector: string;
  telefono: string;
}

export async function extraerDatosSuscripcionConGemini(
  mensajeTexto: string,
  numeroEmisor: string
): Promise<DatosSuscripcionExtraidos> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  const fallback: DatosSuscripcionExtraidos = {
    nombre: 'Cliente WhatsApp',
    sector: 'No especificado',
    telefono: numeroEmisor,
  };

  if (!mensajeTexto || !mensajeTexto.trim()) {
    return fallback;
  }

  if (!apiKey) {
    console.warn('[GEMINI WARNING] GEMINI_API_KEY no configurada. Usando extracción básica.');
    return extraerDatosBasicos(mensajeTexto, numeroEmisor);
  }

  const prompt = `Eres un asistente de IA para la empresa Metricall. Un cliente envió el siguiente mensaje para suscribirse a un servicio.
Extrae la información relevante del mensaje y responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin formato markdown ni bloques \`\`\`json):

{
  "nombre": "Nombre y Apellido del cliente",
  "sector": "Sector, urbanización, barrio, ciudad o zona residencial donde vive",
  "telefono": "Número telefónico de contacto si el cliente mencionó uno diferente en el texto, de lo contrario coloca 'DEFAULT'"
}

Reglas:
1. Si el cliente no indicó un número de teléfono diferente dentro del texto, coloca "DEFAULT" en el campo "telefono".
2. Si falta el nombre o el sector, intenta deducirlo del texto o coloca "No especificado".
3. Responde SOLAMENTE el JSON plano.

Mensaje del cliente:
"${mensajeTexto.replace(/"/g, '\\"')}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[GEMINI ERROR HTTP]:', response.status, await response.text());
      return extraerDatosBasicos(mensajeTexto, numeroEmisor);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJson);

    const nombreRaw = String(parsed.nombre || '').trim();
    const sectorRaw = String(parsed.sector || '').trim();

    const nombre = (nombreRaw && nombreRaw !== 'Nombre y Apellido del cliente') ? nombreRaw : null;
    const sector = (sectorRaw && sectorRaw !== 'Sector, urbanización, barrio o zona donde vive') ? sectorRaw : null;
    let telefono = parsed.telefono && parsed.telefono !== 'DEFAULT'
      ? String(parsed.telefono).replace(/\D/g, '')
      : null;
    if (!telefono || telefono.length < 7) telefono = null;

    // Si Gemini no extrajo bien, usar extracción básica como respaldo
    const basico = extraerDatosBasicos(mensajeTexto, numeroEmisor);
    return {
      nombre:   nombre   || basico.nombre,
      sector:   sector   || basico.sector,
      telefono: telefono || basico.telefono,
    };
  } catch (error) {
    console.error('[GEMINI EXCEPTION]:', error);
    return extraerDatosBasicos(mensajeTexto, numeroEmisor);
  }
}

function extraerDatosBasicos(texto: string, numeroEmisor: string): DatosSuscripcionExtraidos {
  const partes = texto.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);

  // Capitalizar primera letra de cada palabra
  const capitalizar = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());

  const nombre = partes[0] ? capitalizar(partes[0]) : 'Cliente WhatsApp';
  const sector = partes[1] ? capitalizar(partes[1]) : 'No especificado';

  const matchTel = texto.match(/(?:04\d{9}|584\d{9}|\+?58\d{10}|\d{10,11})/);
  const telefono = matchTel ? matchTel[0].replace(/\D/g, '') : numeroEmisor;

  return { nombre, sector, telefono };
}
