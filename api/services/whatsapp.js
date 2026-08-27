// Módulo de integración para envío de mensajes y botones interactivos en WhatsApp Cloud API

const getCredentials = () => ({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323'
});

// 1. Enviar mensaje de texto simple
export async function enviarMensajeTexto(toPhone, textContent) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) {
    console.error('[WHATSAPP ERROR]: WHATSAPP_ACCESS_TOKEN no configurado');
    return;
  }
  
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { body: textContent }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[WHATSAPP TEXT ERROR]:', err);
  }
}

// 2. Enviar Borrador de Previsualización con 3 Botones Interactivos Nativos
export async function enviarBorradorPrevisualizacion(toPhone, datos) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) {
    console.error('[WHATSAPP ERROR]: WHATSAPP_ACCESS_TOKEN no configurado');
    return;
  }

  const bodyText = 
`📝 *Pieza / Producto:* ${datos.pieza_nombre}
🏷️ *Marca:* ${datos.marca}
💵 *Precio:* $${datos.precio_usd} USD
⚙️ *Condición:* ${datos.condicion}
🔢 *N° Parte:* ${datos.numero_parte}
${datos.observaciones ? `ℹ️ *Obs:* ${datos.observaciones}\n` : ''}
¿Deseas publicar este registro en Metricall?`;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: {
            type: 'text',
            text: '📦 BORRADOR DE PUBLICACIÓN'
          },
          body: {
            text: bodyText
          },
          footer: {
            text: 'MetricallBot • Sistema de Censo'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: { id: 'btn_publicar', title: '✅ Publicar' }
              },
              {
                type: 'reply',
                reply: { id: 'btn_modificar', title: '✏️ Modificar' }
              },
              {
                type: 'reply',
                reply: { id: 'btn_cancelar', title: '❌ Cancelar' }
              }
            ]
          }
        }
      })
    });
    const result = await res.json();
    console.log('[WHATSAPP BOTONES ENVIADOS]:', result);
    return result;
  } catch (err) {
    console.error('[WHATSAPP BUTTONS ERROR]:', err);
  }
}
