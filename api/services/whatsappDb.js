// Submódulo de operaciones de base de datos, sesiones y almacenamiento para WhatsApp Bot

import { getCredentials } from './whatsappMessages.js';

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
  if (!sesion || sesion.estado === 'INICIO' || !sesion.updated_at) return false;
  return (Date.now() - new Date(sesion.updated_at).getTime()) / 60000 >= SESSION_TIMEOUT_MINUTOS;
}

export async function obtenerEstadoSesionRest(numeroTelefono) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber) return { numero_telefono: cleanNumber, estado: 'INICIO' };

  const cached = global.whatsappSessions[cleanNumber];
  if (cached) {
    if (sesionExpirada(cached)) {
      const reset = { numero_telefono: cleanNumber, estado: 'INICIO', datos_temporales: {}, updated_at: new Date().toISOString() };
      global.whatsappSessions[cleanNumber] = reset;
      actualizarEstadoSesionRest(cleanNumber, 'INICIO').catch(() => {});
      return reset;
    }
    return cached;
  }

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_sesiones?numero_telefono=eq.${cleanNumber}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          const sesion = data[0];
          if (sesionExpirada(sesion)) {
            const reset = { numero_telefono: cleanNumber, estado: 'INICIO', datos_temporales: {}, updated_at: new Date().toISOString() };
            global.whatsappSessions[cleanNumber] = reset;
            actualizarEstadoSesionRest(cleanNumber, 'INICIO').catch(() => {});
            return reset;
          }
          global.whatsappSessions[cleanNumber] = sesion;
          return sesion;
        }
      }
    } catch (err) {
      console.error('[SESION REST ERROR]:', err);
    }
  }

  const def = { numero_telefono: cleanNumber, estado: 'INICIO' };
  global.whatsappSessions[cleanNumber] = def;
  return def;
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
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_crear_tarjeta_suscripcion`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_nombre: datos.nombre, p_sector: datos.sector, p_telefono: datos.telefono })
    });
    return res.ok;
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
      p_fecha_pago:      datos.fechaPago || datos.fecha || '',
      p_referencia:      datos.referencia || '',
      p_monto:           datos.monto || '',
      p_banco:           datos.banco || '',
      p_telefono:        datos.telefono || '',
      p_comprobante_url: datos.comprobante_url || '',
      p_nombre:          datos.nombre || ''
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
      return null;
    }

    try {
      const parsed = JSON.parse(resText);
      return typeof parsed === 'string' ? parsed : true;
    } catch {
      return true;
    }
  } catch (err) {
    console.error('[CREAR TARJETA COBRANZA RPC EXCEPTION]:', err);
    return null;
  }
}

export async function actualizarFechaPagoTarjetaRest(tarjetaId, fromPhone, nuevaFecha) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !nuevaFecha) return false;

  try {
    let tId = tarjetaId;
    if (!tId && fromPhone) {
      const cleanPhone = fromPhone.replace(/\D/g, '').slice(-8);
      const resSearch = await fetch(
        `${SUPABASE_URL}/rest/v1/tarjetas?datos_valores->>telefonoMovil=like.*${cleanPhone}*&order=created_at.desc&limit=1&select=id`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      if (resSearch.ok) {
        const rows = await resSearch.json();
        if (rows?.[0]) tId = rows[0].id;
      }
    }
    if (!tId) return false;

    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_actualizar_fecha_pago`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_tarjeta_id: tId, p_nueva_fecha: nuevaFecha })
    });
    if (rpcRes.ok) return true;

    const resGet = await fetch(`${SUPABASE_URL}/rest/v1/tarjetas?id=eq.${tId}&select=datos_valores`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (!resGet.ok) return false;
    const items = await resGet.json();
    if (!items?.[0]) return false;

    const datosValores = { ...(items[0].datos_valores || {}), fechaPago: nuevaFecha };
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/tarjetas?id=eq.${tId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ datos_valores: datosValores, updated_at: new Date().toISOString() })
    });
    return patchRes.ok;
  } catch (err) {
    console.error('[ACTUALIZAR FECHA TARJETA ERROR]:', err);
    return false;
  }
}

// ─── Procesamiento de imagen enviada por WhatsApp ─────────────────────────
export async function procesarImagenWhatsApp(mediaId, fromPhone) {
  const { accessToken } = getCredentials();
  if (!accessToken || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[PROCESAR IMAGEN WHATSAPP] Faltan credenciales:', { accessToken: !!accessToken, SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY });
    return null;
  }

  const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
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
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bot_crear_tarjeta_falla`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_nombre:     datos.nombre || 'Cliente WhatsApp',
        p_cedula:     datos.cedula || '',
        p_telefono:   datos.telefono || '',
        p_tipo_falla: datos.tipoFalla || 'Falla Técnica'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[CREAR TARJETA FALLA RPC EXCEPTION]:', err);
    return false;
  }
}
