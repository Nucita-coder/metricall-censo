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

Para registrar tu pago, envíame la siguiente información en un solo mensaje:

1️⃣ *Número de abonado*
2️⃣ *Número de referencia*
3️⃣ *Monto pagado*
4️⃣ *Teléfono asociado al pago móvil*
5️⃣ *Banco emisor*
6️⃣ 📸 *Captura del comprobante*

_Envía todos los datos y la imagen para procesar tu pago correctamente._`;

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
          text: '⚠️ REPORTE DE FALLA'
        },
        body: {
          text: 'Selecciona el tipo de falla que estás experimentando:'
        },
        footer: {
          text: 'MetricallBot • Soporte Técnico'
        },
        action: {
          button: 'Ver opciones',
          sections: [
            {
              title: 'Tipo de falla',
              rows: [
                { id: 'falla_luz_roja',        title: '🔴 Luz roja en equipo',        description: 'El equipo presenta luz roja encendida' },
                { id: 'falla_intermitencia',   title: '📶 Intermitencia de servicio', description: 'El servicio se cae y vuelve constantemente' },
                { id: 'falla_lento',           title: '🐌 Internet lento',            description: 'La conexión es más lenta de lo normal' },
                { id: 'falla_paginas',         title: '🚫 No abren algunas páginas',  description: 'Ciertas páginas o apps no cargan' },
                { id: 'falla_sin_datos',       title: '📵 No recibe datos',           description: 'No hay conexión a internet en absoluto' }
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

// ─── 5. Mensaje de Suscripción (placeholder Google Form) ─────────────────────
export async function enviarLinkSuscripcion(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`✅ *SUSCRIBIRSE AL SERVICIO*

Para completar tu suscripción, accede al formulario en el siguiente enlace:

🔗 *[Formulario de suscripción - próximamente]*

_En breve recibirás el enlace actualizado. Gracias por tu interés._`;

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
