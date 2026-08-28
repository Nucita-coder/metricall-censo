// Módulo de integración para envío de mensajes y botones interactivos en WhatsApp Cloud API

const getCredentials = () => ({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323'
});

const apiPost = async (phoneNumberId, accessToken, body) => {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return await res.json();
};

// ─── 1. Mensaje de texto simple ───────────────────────────────────────────────
export async function enviarMensajeTexto(toPhone, textContent) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return console.error('[WHATSAPP ERROR]: Token no configurado');
  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: textContent }
    });
  } catch (err) {
    console.error('[WHATSAPP TEXT ERROR]:', err);
  }
}

// ─── 2. Menú principal: 3 botones de bienvenida ───────────────────────────────
export async function enviarMenuPrincipal(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return console.error('[WHATSAPP ERROR]: Token no configurado');
  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '👋 ¡Bienvenido a MetricallBot!'
        },
        body: {
          text: 'Selecciona una opción para continuar:'
        },
        footer: {
          text: 'MetricallBot • Soporte y Pagos'
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_reporte_pago',  title: '💰 Reporte de Pago'  } },
            { type: 'reply', reply: { id: 'btn_reporte_falla', title: '⚠️ Reporte de Falla' } },
            { type: 'reply', reply: { id: 'btn_suscribirse',   title: '✅ Suscribirse'       } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP MENU ERROR]:', err);
  }
}

// ─── 3. Instrucciones de Reporte de Pago ─────────────────────────────────────
export async function enviarFormularioPago(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`💰 *REPORTE DE PAGO*

Por favor envíame la siguiente información en *un solo mensaje* con este formato exacto:

📋 *Cédula:* [tu número de cédula]
🔢 *Referencia (completo):* [número de referencia completo]
💵 *Monto:* [monto pagado]
📱 *Teléfono pago móvil:* [número asociado]
🏦 *Banco:* [nombre del banco emisor]

📸 Y al final, adjunta la *captura del comprobante*.

_Envía todo en un solo mensaje para que podamos procesarlo correctamente. ¡Gracias!_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP PAGO ERROR]:', err);
  }
}

// ─── 4. Lista interactiva de Reportes de Falla (5 opciones) ──────────────────
export async function enviarMenuFallas(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: 'Reporte de Falla'
        },
        body: {
          text: 'Selecciona el tipo de falla que estás presentando:'
        },
        footer: {
          text: 'MetricallBot • Soporte'
        },
        action: {
          button: 'Ver fallas',
          sections: [
            {
              title: 'Tipo de falla',
              rows: [
                { id: 'falla_luz_roja',      title: 'Luz roja en equipo',   description: 'El equipo presenta luz roja' },
                { id: 'falla_intermitencia', title: 'Intermitencia',         description: 'El servicio se cae y vuelve' },
                { id: 'falla_lento',         title: 'Internet lento',        description: 'Conexion mas lenta de lo normal' },
                { id: 'falla_paginas',       title: 'No cargan paginas',     description: 'Algunas paginas no abren' },
                { id: 'falla_sin_datos',     title: 'Sin internet',          description: 'No hay conexion en absoluto' }
              ]
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP FALLAS ERROR]:', err);
  }
}

// ─── 5. Mensaje de Instrucciones de Suscripción ──────────────────────────────
export async function enviarInstruccionesSuscripcion(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`¡Excelente! 🚀 Para procesar tu solicitud de suscripción, por favor envíanos la siguiente información en *UN SOLO MENSAJE*:

1. *Nombre y Apellido* (Obligatorio)
2. *Sector donde vives* (Obligatorio)
3. *Número de contacto* (Opcional - si no lo indicas, te contactaremos a este mismo número de WhatsApp)

📌 *Ejemplo de mensaje:*
Juan Pérez, Sector Las Delicias, 04141234567`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP SUSCRIPCION ERROR]:', err);
  }
}

export async function enviarConfirmacionSuscripcion(toPhone, datos) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`✅ *Solicitud procesada*

Gracias *${datos.nombre}*, hemos recibido tus datos correctamente.

📍 *Sector:* ${datos.sector}
📱 *Contacto:* ${datos.telefono}

Un asesor se estará contactando con usted próximamente.`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP CONFIRMACION SUSCRIPCION ERROR]:', err);
  }
}

// ─── Helpers REST de Supabase con fallback en memoria para Vercel Functions ─
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Usar Service Role Key para bypasear RLS y tener acceso total desde el servidor
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Sesiones en memoria para funciones warm de Vercel
if (!global.whatsappSessions) {
  global.whatsappSessions = {};
}

export async function obtenerEstadoSesionRest(numeroTelefono) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber) return { numero_telefono: cleanNumber, estado: 'INICIO' };

  // 1. Verificar cache en memoria primero
  if (global.whatsappSessions[cleanNumber]) {
    return global.whatsappSessions[cleanNumber];
  }

  // 2. Verificar Supabase REST
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?numero_telefono=eq.${cleanNumber}&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          global.whatsappSessions[cleanNumber] = data[0];
          return data[0];
        }
      }
    } catch (err) {
      console.error('[SESION REST ERROR]:', err);
    }
  }

  const defaultSesion = { numero_telefono: cleanNumber, estado: 'INICIO' };
  global.whatsappSessions[cleanNumber] = defaultSesion;
  return defaultSesion;
}

export async function actualizarEstadoSesionRest(numeroTelefono, nuevoEstado, datosTemporales = {}) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber) return;

  const sesionObj = {
    numero_telefono: cleanNumber,
    estado: nuevoEstado,
    datos_temporales: datosTemporales,
    updated_at: new Date().toISOString()
  };

  // 1. Guardar en memoria de inmediato
  global.whatsappSessions[cleanNumber] = sesionObj;

  // 2. Persistir en Supabase REST con on_conflict
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?on_conflict=numero_telefono`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(sesionObj)
      });
    } catch (err) {
      console.error('[UPDATE SESION REST ERROR]:', err);
    }
  }
}

export async function crearTarjetaVentaOnlineRest(datos) {
  if (!SUPABASE_URL) {
    console.error('[CREAR TARJETA REST]: Falta variable de entorno SUPABASE_URL');
    return false;
  }
  // La RPC usa SECURITY DEFINER, bypasea RLS. La anon key es suficiente.
  const keyToUse = SUPABASE_KEY;
  if (!keyToUse) {
    console.error('[CREAR TARJETA REST]: Falta SUPABASE_KEY o EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return false;
  }
  try {
    console.log('[CREAR TARJETA RPC] Invocando bot_crear_tarjeta_suscripcion:', JSON.stringify(datos));
    const rpcBody = JSON.stringify({
      p_nombre:   datos.nombre,
      p_sector:   datos.sector,
      p_telefono: datos.telefono
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_crear_tarjeta_suscripcion`, {
      method: 'POST',
      headers: {
        'apikey': keyToUse,
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: rpcBody
    });

    const resText = await res.text();
    console.log('[CREAR TARJETA RPC] Resultado:', res.status, resText.slice(0, 300));

    if (!res.ok) {
      console.error('[CREAR TARJETA RPC ERROR]:', res.status, resText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CREAR TARJETA RPC EXCEPTION]:', err);
    return false;
  }
}

export async function crearTarjetaCobranzaRest(datos) {
  if (!SUPABASE_URL) return false;
  const keyToUse = SUPABASE_KEY;
  if (!keyToUse) return false;

  try {
    console.log('[CREAR TARJETA COBRANZA RPC] Invocando bot_crear_tarjeta_cobranza:', JSON.stringify(datos));
    const rpcBody = JSON.stringify({
      p_cedula:          datos.cedula || '',
      p_referencia:      datos.referencia || '',
      p_monto:           datos.monto || '',
      p_banco:           datos.banco || '',
      p_telefono:        datos.telefono || '',
      p_comprobante_url: datos.comprobante_url || '',
      p_nombre:          datos.nombre || 'Cliente Pago WhatsApp'
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_crear_tarjeta_cobranza`, {
      method: 'POST',
      headers: {
        'apikey': keyToUse,
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: rpcBody
    });

    const resText = await res.text();
    console.log('[CREAR TARJETA COBRANZA RPC] Resultado:', res.status, resText.slice(0, 300));

    if (!res.ok) {
      console.error('[CREAR TARJETA COBRANZA RPC ERROR]:', res.status, resText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CREAR TARJETA COBRANZA RPC EXCEPTION]:', err);
    return false;
  }
}

// ─── 6. Procesamiento de imagen enviada por WhatsApp ─────────────────────────
export async function procesarImagenWhatsApp(mediaId, fromPhone) {
  const { accessToken } = getCredentials();
  if (!accessToken || !SUPABASE_URL || !SUPABASE_KEY) return null;

  try {
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) return null;
    const metaData = await metaRes.json();
    const downloadUrl = metaData.url;
    if (!downloadUrl) return null;

    const imageRes = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!imageRes.ok) return null;
    const imageBuffer = await imageRes.arrayBuffer();

    const filename = `comprobantes/pago_${Date.now()}_${fromPhone}.jpg`;
    const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/evidencias/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: imageBuffer
    });

    if (storageRes.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/evidencias/${filename}`;
    }
    return downloadUrl;
  } catch (err) {
    console.error('[PROCESAR IMAGEN WHATSAPP ERROR]:', err);
    return null;
  }
}

// ─── 7. Confirmación de pago recibido ────────────────────────────────────────
export async function enviarConfirmacionPago(toPhone, datos) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`✅ *Reporte de pago recibido*

📋 *Cédula/Abonado:* ${datos.cedula || 'No especificada'}
🔢 *Referencia:* ${datos.referencia || 'S/N'}
💵 *Monto:* ${datos.monto || 'Por verificar'}
🏦 *Banco:* ${datos.banco || 'No especificado'}

Un asesor de cobranza verificará la transacción a la brevedad. ¡Gracias por preferir Metricall!`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP CONFIRMACION PAGO ERROR]:', err);
  }
}

// ─── 8. Confirmación de falla recibida ───────────────────────────────────────
export async function enviarConfirmacionFalla(toPhone, tipoFalla) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`✅ *Reporte recibido*

Hemos registrado tu falla: *${tipoFalla}*

Un técnico revisará el caso y te notificaremos cuando esté resuelto.

_MetricallBot • Soporte Técnico_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP CONFIRMACION ERROR]:', err);
  }
}

