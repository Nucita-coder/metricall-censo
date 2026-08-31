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
          text: '👋 ¡Bienvenido a Fibex Telecom Anaco!'
        },
        body: {
          text: 'Selecciona una opción para continuar:'
        },
        footer: {
          text: 'Fibex Telecom Anaco (technological project)'
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
`💰 *REPORTE DE PAGO — Paso 1 de 2*

Envíame los datos del pago en *un solo mensaje de texto* con este formato:

💿 *Cédula / Nº Abonado:* [tu cédula]
🔢 *Referencia (completo):* [número de referencia]
💵 *Monto:* [monto pagado]
📱 *Teléfono pago móvil:* [número asociado]
🏦 *Banco:* [nombre del banco emisor]

_⚠️ Escribe y envía el texto primero. Luego te pediré la foto del comprobante por separado._`;

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

// ─── 3.5. Instrucciones de Reporte de Falla ──────────────────────────────────
export async function enviarFormularioFalla(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`⚠️ *REPORTE DE FALLA TÉCNICA — Paso 1 de 2*

¡Hola! Por favor envíame tus datos en *un solo mensaje de texto* con este formato:

👤 *Nombre y Apellido:* [tu nombre]
🆔 *Cédula / Nº Abonado:* [tu cédula o abonado]
📱 *Número de contacto:* [número de contacto]

_💡 Nota: Si deseas que te contactemos al mismo número desde el que nos escribes, no hace falta responder el 3er dato (número de contacto)._`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP FALLA ERROR]:', err);
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
          text: 'Fibex Telecom Anaco (technological project)'
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
        header: {
          type: 'text',
          text: '🔍 Verifica los datos del pago'
        },
        body: {
          text: resumen
        },
        footer: {
          text: '¿Es correcta esta información?'
        },
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

export async function enviarSolicitudComprobante(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`📸 *REPORTE DE PAGO — Paso 2 de 2*

¡Datos recibidos! Ahora envíame la *foto del comprobante* de pago.

_Presiona el ícono de adjunto 📎 y selecciona la imagen del comprobante._`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: mensaje }
    });
  } catch (err) {
    console.error('[WHATSAPP SOLICITUD COMPROBANTE ERROR]:', err);
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

// Tiempo máximo de inactividad antes de resetear la sesión (en minutos)
const SESSION_TIMEOUT_MINUTOS = 5;

function sesionExpirada(sesion) {
  if (!sesion || sesion.estado === 'INICIO') return false;
  if (!sesion.updated_at) return false;
  const ultimaActualizacion = new Date(sesion.updated_at).getTime();
  const ahora = Date.now();
  const minutosTranscurridos = (ahora - ultimaActualizacion) / 1000 / 60;
  return minutosTranscurridos >= SESSION_TIMEOUT_MINUTOS;
}

export async function obtenerEstadoSesionRest(numeroTelefono) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber) return { numero_telefono: cleanNumber, estado: 'INICIO' };

  // 1. Verificar cache en memoria primero
  if (global.whatsappSessions[cleanNumber]) {
    const cached = global.whatsappSessions[cleanNumber];
    // Si la sesión expiró por inactividad → resetear
    if (sesionExpirada(cached)) {
      console.log(`[SESION TIMEOUT] ${cleanNumber} inactivo >=${SESSION_TIMEOUT_MINUTOS}min, reseteando a INICIO`);
      const resetSesion = { numero_telefono: cleanNumber, estado: 'INICIO', datos_temporales: {}, updated_at: new Date().toISOString() };
      global.whatsappSessions[cleanNumber] = resetSesion;
      // Persistir reset en Supabase en background (sin await para no bloquear)
      actualizarEstadoSesionRest(cleanNumber, 'INICIO').catch(() => {});
      return resetSesion;
    }
    return cached;
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
          const sesion = data[0];
          // Si expiró → resetear
          if (sesionExpirada(sesion)) {
            console.log(`[SESION TIMEOUT] ${cleanNumber} inactivo >=${SESSION_TIMEOUT_MINUTOS}min (Supabase), reseteando`);
            const resetSesion = { numero_telefono: cleanNumber, estado: 'INICIO', datos_temporales: {}, updated_at: new Date().toISOString() };
            global.whatsappSessions[cleanNumber] = resetSesion;
            actualizarEstadoSesionRest(cleanNumber, 'INICIO').catch(() => {});
            return resetSesion;
          }
          global.whatsappSessions[cleanNumber] = sesion;
          return sesion;
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
  if (!accessToken || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[PROCESAR IMAGEN WHATSAPP] Faltan credenciales:', { accessToken: !!accessToken, SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY });
    return null;
  }

  // Usar service_role key si está disponible (bypasea RLS de storage), sino anon key
  const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
  // Bucket público con política que permite INSERT desde anon
  const BUCKET = 'evidencias-bot';

  try {
    console.log('[PROCESAR IMAGEN WHATSAPP] Solicitando URL a Meta para mediaId:', mediaId);
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) {
      console.error('[PROCESAR IMAGEN WHATSAPP Meta Error]:', metaRes.status, await metaRes.text());
      return null;
    }
    const metaData = await metaRes.json();
    const downloadUrl = metaData.url;
    if (!downloadUrl) {
      console.error('[PROCESAR IMAGEN WHATSAPP] No se recibió downloadUrl de Meta');
      return null;
    }

    console.log('[PROCESAR IMAGEN WHATSAPP] Descargando imagen desde Meta...');
    const imageRes = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!imageRes.ok) {
      console.error('[PROCESAR IMAGEN WHATSAPP Download Error]:', imageRes.status);
      return null;
    }
    const imageBuffer = await imageRes.arrayBuffer();
    console.log('[PROCESAR IMAGEN WHATSAPP] Imagen descargada, bytes:', imageBuffer.byteLength);

    const filename = `pago_${Date.now()}_${fromPhone}.jpg`;
    console.log(`[PROCESAR IMAGEN WHATSAPP] Subiendo a bucket '${BUCKET}'...`, filename);

    const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': storageKey,
        'Authorization': `Bearer ${storageKey}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: imageBuffer
    });

    const storageText = await storageRes.text();
    if (storageRes.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
      console.log('[PROCESAR IMAGEN WHATSAPP] ✅ Subida exitosa:', publicUrl);
      return publicUrl;
    }

    console.error(`[PROCESAR IMAGEN WHATSAPP] ❌ Error subiendo a '${BUCKET}':`, storageRes.status, storageText);
    return null;
  } catch (err) {
    console.error('[PROCESAR IMAGEN WHATSAPP EXCEPTION]:', err);
    return null;
  }
}

export async function crearTarjetaFallaRest(datos) {
  if (!SUPABASE_URL) return false;
  const keyToUse = SUPABASE_KEY;
  if (!keyToUse) return false;

  try {
    console.log('[CREAR TARJETA FALLA RPC] Invocando bot_crear_tarjeta_falla:', JSON.stringify(datos));
    const rpcBody = JSON.stringify({
      p_nombre:     datos.nombre || 'Cliente WhatsApp',
      p_cedula:     datos.cedula || '',
      p_telefono:   datos.telefono || '',
      p_tipo_falla: datos.tipoFalla || 'Falla Técnica'
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_crear_tarjeta_falla`, {
      method: 'POST',
      headers: {
        'apikey': keyToUse,
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: rpcBody
    });

    const resText = await res.text();
    console.log('[CREAR TARJETA FALLA RPC] Resultado:', res.status, resText.slice(0, 300));

    if (!res.ok) {
      console.error('[CREAR TARJETA FALLA RPC ERROR]:', res.status, resText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CREAR TARJETA FALLA RPC EXCEPTION]:', err);
    return false;
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

Un asesor de cobranza verificará la transacción a la brevedad. ¡Gracias por preferir Fibex Telecom Anaco!`;

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
export async function enviarConfirmacionFalla(toPhone, tipoFalla, datos = {}) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;
  const mensaje =
`✅ *Reporte de falla recibido*

👤 *Cliente:* ${datos.nombre || 'Cliente WhatsApp'}
🆔 *Cédula/Abonado:* ${datos.cedula || 'No especificada'}
📱 *Teléfono:* ${datos.telefono || toPhone}
⚠️ *Tipo de Falla:* ${tipoFalla}

Un técnico de Fibex Telecom Anaco revisará tu caso a la brevedad para comunicarse contigo.

_Fibex Telecom Anaco (technological project) • Soporte Técnico_`;

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

