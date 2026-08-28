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
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?numero_telefono=eq.${cleanNumber}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?on_conflict=numero_telefono`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const resListas = await fetch(`${SUPABASE_URL}/rest/v1/listas?select=id,nombre,empresa_id,tablero_id&limit=100`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!resListas.ok) {
      console.error('[CREAR TARJETA REST ERROR]: Error consultando listas:', resListas.status);
      return false;
    }

    const listas = await resListas.json();
    if (!Array.isArray(listas) || listas.length === 0) {
      console.error('[CREAR TARJETA REST ERROR]: No hay listas registradas en la BD');
      return false;
    }

    // Buscar lista de ventas online
    let targetLista = listas.find(l => (l.nombre || '').toLowerCase().includes('ventas online'))
                   || listas.find(l => (l.nombre || '').toLowerCase().includes('ventas'))
                   || listas[0];

    const targetListaId = targetLista.id;
    const empresaId = targetLista.empresa_id || null;

    const resCard = await fetch(`${SUPABASE_URL}/rest/v1/tarjetas`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        lista_id: targetListaId,
        empresa_id: empresaId,
        datos_valores: {
          nombreApellido: datos.nombre,
          sector: datos.sector,
          telefonoMovil: datos.telefono,
          origen: 'WhatsApp Bot',
          fechaVenta: new Date().toISOString().split('T')[0]
        }
      })
    });

    if (!resCard.ok) {
      console.error('[CREAR TARJETA REST ERROR]: Falló la creación de tarjeta:', resCard.status, await resCard.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CREAR TARJETA REST EXCEPTION]:', err);
    return false;
  }
}

// ─── 6. Confirmación de falla recibida ───────────────────────────────────────
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
