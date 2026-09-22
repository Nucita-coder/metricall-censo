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

// ─── 3. Instrucciones de Reporte de Pago ─────────────────────────────────────
export async function enviarFormularioPago(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  const bodyText =
`Por favor envía la *foto o captura* del comprobante con tu número de *Cédula de Identidad* (en el pie de foto o en un mensaje).

📅 Registraremos el pago con fecha de *Hoy*. Si realizaste el pago en otra fecha, pulsa el botón abajo:`;

  if (accessToken) {
    try {
      return await apiPost(phoneNumberId, accessToken, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: { type: 'text', text: '💰 Reporte de Pago' },
          body: { text: bodyText },
          footer: { text: 'Fibex Telecom Anaco' },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'btn_cambiar_fecha_pago', title: '📅 No es de hoy' } }
            ]
          }
        }
      });
    } catch (err) {
      console.error('[WHATSAPP FORM PAGO ERROR]:', err);
    }
  }

  return await enviarTexto(toPhone, `💰 *REPORTE DE PAGO*\n\n${bodyText}`);
}

// ─── 3.1. Almanaque Interactivo de Selección de Fecha de Pago ────────────────
export async function enviarSelectorFechaPago(toPhone, cedula) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const rows = [];
  const hoy = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const diaNum = String(d.getDate()).padStart(2, '0');
    const mesNum = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const isoDate = `${diaNum}/${mesNum}/${anio}`;
    const nombreDia = DIAS_SEMANA[d.getDay()];
    const mesStr = MESES[d.getMonth()];

    let title = `${nombreDia} ${diaNum} ${mesStr}`;
    let description = `${diaNum}/${mesNum}/${anio}`;
    if (i === 0) title = `Hoy — ${diaNum} ${mesStr}`;
    if (i === 1) title = `Ayer — ${diaNum} ${mesStr}`;

    rows.push({
      id: `pago_fecha_${isoDate}`,
      title: title.slice(0, 24),
      description: description
    });
  }

  rows.push({
    id: 'pago_fecha_otra',
    title: 'Otra fecha',
    description: 'Escribir fecha manualmente'
  });

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Fecha del Pago' },
        body: { text: `Cédula: *${cedula}*\n\nSelecciona en el almanaque la fecha en que realizaste el pago:` },
        footer: { text: 'Toca para desplegar las fechas' },
        action: {
          button: 'Elegir Fecha 📅',
          sections: [
            {
              title: 'Días recientes',
              rows: rows
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP FECHA ERROR]:', err);
  }
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

// ─── 5.7. Solicitud de Foto de Comprobante ──────────────────────────────────
export async function enviarSolicitudComprobante(toPhone, fechaTexto) {
  const detalleFecha = fechaTexto ? `\n📅 *Fecha seleccionada:* ${fechaTexto}` : '';
  const mensaje =
`📸 *CAPTURA DEL COMPROBANTE*${detalleFecha}

Por favor envía la *foto o captura de pantalla* del comprobante de pago.

_Presiona el ícono de adjunto 📎 y selecciona la imagen de tu pago._`;

  return await enviarTexto(toPhone, mensaje);
}

// ─── 7. Confirmación de Pago Recibido ────────────────────────────────────────
export async function enviarConfirmacionPago(toPhone, datos) {
  const fechaTexto = datos.fechaPago || datos.fecha || 'Hoy';
  const cedulaTexto = datos.cedula || 'No especificada';
  const mensaje =
`✅ *Reporte de pago recibido*

🆔 *Cédula/Abonado:* ${cedulaTexto}
📅 *Fecha de Pago:* ${fechaTexto}
📎 *Comprobante:* Recibido ✅

Se le notificará cuando el pago haya sido procesado. ¡Gracias por su reporte!`;

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
