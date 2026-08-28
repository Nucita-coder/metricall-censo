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
`¡Gracias, *${datos.nombre}*! 🎉 Tu solicitud de suscripción ha sido registrada con éxito en nuestro sistema.

📍 *Sector registrado:* ${datos.sector}
📱 *Teléfono de contacto:* ${datos.telefono}

Un asesor comercial se pondrá en contacto contigo muy pronto. ¡Que tengas un excelente día!`;

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

// ─── Helpers REST de Supabase para Vercel Functions ─────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export async function obtenerEstadoSesionRest(numeroTelefono) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !cleanNumber) {
    return { numero_telefono: cleanNumber, estado: 'INICIO' };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?numero_telefono=eq.${cleanNumber}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await res.json();
    if (Array.isArray(data) && data[0]) return data[0];
    return { numero_telefono: cleanNumber, estado: 'INICIO' };
  } catch (err) {
    console.error('[SESION REST ERROR]:', err);
    return { numero_telefono: cleanNumber, estado: 'INICIO' };
  }
}

export async function actualizarEstadoSesionRest(numeroTelefono, nuevoEstado, datosTemporales = {}) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !cleanNumber) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        numero_telefono: cleanNumber,
        estado: nuevoEstado,
        datos_temporales: datosTemporales,
        updated_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('[UPDATE SESION REST ERROR]:', err);
  }
}

export async function crearTarjetaVentaOnlineRest(datos) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const resListas = await fetch(`${SUPABASE_URL}/rest/v1/listas?nombre=ilike.*ventas%20online*&select=id,empresa_id&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const listas = await resListas.json();
    let targetListaId = Array.isArray(listas) && listas[0] ? listas[0].id : null;
    let empresaId = Array.isArray(listas) && listas[0] ? listas[0].empresa_id : null;

    if (!targetListaId) {
      console.error('[CREAR TARJETA REST ERROR]: No se encontró la lista ventas online.');
      return false;
    }

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

    return resCard.ok;
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
