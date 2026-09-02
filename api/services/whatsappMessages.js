// Submódulo de mensajería y plantillas interactivas para Meta WhatsApp Cloud API

export const DATOS_PAGO_MOVIL = {
  tipo: 'PAGO MÓVIL',
  banco: 'Mercantil (0105)',
  telefono: '0412-9637516',
  rif: 'J-30818251-6',
  titular: 'FIBEX TELECOM',
};

export const getCredentials = () => ({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323'
});

export const apiPost = async (phoneNumberId, accessToken, body) => {
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

// Helper interno para envío de mensajes de texto
async function enviarTexto(toPhone, texto) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) {
    console.error('[WHATSAPP ERROR]: Token no configurado');
    return;
  }
  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: texto }
    });
  } catch (err) {
    console.error('[WHATSAPP TEXT ERROR]:', err);
  }
}

// ─── 1. Mensaje de texto simple ───────────────────────────────────────────────
export async function enviarMensajeTexto(toPhone, textContent) {
  return await enviarTexto(toPhone, textContent);
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
        header: { type: 'text', text: '👋 ¡Bienvenido a Fibex Telecom Anaco!' },
        body: { text: 'Selecciona una opción para continuar:' },
        footer: { text: 'Fibex Telecom Anaco (technological project)' },
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

// ─── 3. Instrucciones de Reporte de Pago (con datos de Pago Móvil) ────────────
export async function enviarFormularioPago(toPhone) {
  const mensaje =
`💰 *REPORTE DE PAGO — Paso 1 de 2*

📲 *DATOS PARA REALIZAR TU PAGO MÓVIL:*
🏦 *Banco:* ${DATOS_PAGO_MOVIL.banco}
📱 *Teléfono:* ${DATOS_PAGO_MOVIL.telefono}
📋 *RIF:* ${DATOS_PAGO_MOVIL.rif}
🏢 *Titular:* ${DATOS_PAGO_MOVIL.titular}

Una vez realizado tu pago móvil, envíame los datos en *un solo mensaje de texto* con este formato:

💿 *Cédula / Nº Abonado:* [tu cédula]
🔢 *Referencia (completo):* [número de referencia]
💵 *Monto:* [monto pagado]
📱 *Teléfono pago móvil:* [número desde el que pagaste]
🏦 *Banco emisor:* [nombre de tu banco]

_⚠️ Escribe y envía el texto primero. Luego te pediré la foto del comprobante por separado._`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 3.5. Instrucciones de Reporte de Falla ──────────────────────────────────
export async function enviarFormularioFalla(toPhone) {
  const mensaje =
`⚠️ *REPORTE DE FALLA TÉCNICA — Paso 1 de 2*

¡Hola! Por favor envíame tus datos en *un solo mensaje de texto* con este formato:

👤 *Nombre y Apellido:* [tu nombre]
🆔 *Cédula / Nº Abonado:* [tu cédula o abonado]
📱 *Número de contacto:* [número de contacto]

_💡 Nota: Si deseas que te contactemos al mismo número desde el que nos escribes, no hace falta responder el 3er dato (número de contacto)._`;

  return await enviarTexto(toPhone, mensaje);
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
        header: { type: 'text', text: 'Reporte de Falla' },
        body: { text: 'Selecciona el tipo de falla que estás presentando:' },
        footer: { text: 'Fibex Telecom Anaco (technological project)' },
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
  const mensaje =
`¡Excelente! 🚀 Para procesar tu solicitud de suscripción, por favor envíanos la siguiente información en *UN SOLO MENSAJE*:

1. *Nombre y Apellido* (Obligatorio)
2. *Sector donde vives* (Obligatorio)
3. *Número de contacto* (Opcional - si no lo indicas, te contactaremos a este mismo número de WhatsApp)

📌 *Ejemplo de mensaje:*
Juan Pérez, Sector Las Delicias, 04141234567`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 5.5. Confirmación de Suscripción ────────────────────────────────────────
export async function enviarConfirmacionSuscripcion(toPhone, datos) {
  const mensaje =
`✅ *Solicitud procesada*

Gracias *${datos.nombre}*, hemos recibido tus datos correctamente.

📍 *Sector:* ${datos.sector}
📱 *Contacto:* ${datos.telefono}

Un asesor se estará contactando con usted en un plazo de 24 a 48 horas.`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 5.6. Resumen de Pago para Confirmación Interactiva ─────────────────────
export async function enviarResumenParaConfirmacion(toPhone, datos) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const comprobante = datos.comprobante_url ? '📎 Comprobante adjunto ✅' : '📎 Sin comprobante';
  const resumen =
`👤 *Cédula/Abonado:* ${datos.cedula || 'No especificada'}
🔖 *Referencia:* ${datos.referencia || 'S/N'}
💰 *Monto:* ${datos.monto || 'Por verificar'}
🏦 *Banco:* ${datos.banco || 'No especificado'}
${comprobante}`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: '🔍 Verifica los datos del pago' },
        body: { text: resumen },
        footer: { text: '¿Es correcta esta información?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_confirmar_pago',  title: '✅ Confirmar' } },
            { type: 'reply', reply: { id: 'btn_rechazar_pago',   title: '❌ Corregir datos' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP RESUMEN CONFIRMACION ERROR]:', err);
  }
}

// ─── 5.7. Solicitud de Foto de Comprobante ──────────────────────────────────
export async function enviarSolicitudComprobante(toPhone) {
  const mensaje =
`📸 *REPORTE DE PAGO — Paso 2 de 2*

¡Datos recibidos! Ahora envíame la *foto del comprobante* de pago.

_Presiona el ícono de adjunto 📎 y selecciona la imagen del comprobante._`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 7. Confirmación de Pago Recibido ────────────────────────────────────────
export async function enviarConfirmacionPago(toPhone, datos) {
  const mensaje =
`✅ *Reporte de pago recibido*

📋 *Cédula/Abonado:* ${datos.cedula || 'No especificada'}
🔢 *Referencia:* ${datos.referencia || 'S/N'}
💵 *Monto:* ${datos.monto || 'Por verificar'}
🏦 *Banco:* ${datos.banco || 'No especificado'}

Un asesor de cobranza verificará la transacción en un plazo de 24 a 48 horas. ¡Gracias por preferir Fibex Telecom Anaco!`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 8. Confirmación de Falla Recibida ───────────────────────────────────────
export async function enviarConfirmacionFalla(toPhone, tipoFalla, datos = {}) {
  const mensaje =
`✅ *Reporte de falla recibido*

👤 *Cliente:* ${datos.nombre || 'Cliente WhatsApp'}
🆔 *Cédula/Abonado:* ${datos.cedula || 'No especificada'}
📱 *Teléfono:* ${datos.telefono || toPhone}
⚠️ *Tipo de Falla:* ${tipoFalla}

Un técnico de Fibex Telecom Anaco revisará tu caso en un plazo de 24 a 48 horas para comunicarse contigo.

_Fibex Telecom Anaco (technological project) • Soporte Técnico_`;

  return await enviarTexto(toPhone, mensaje);
}
