// Submódulo para gestión de contactos, comportamiento y moderación de WhatsApp Bot

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Cache en memoria para bloqueos (evita llamadas repetitivas en usuarios bloqueados)
const blockedCache = new Map();

/**
 * Invalida o actualiza el cache de bloqueo de un contacto
 */
export function invalidarCacheBloqueo(numeroTelefono, isBlocked) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (cleanNumber) {
    if (typeof isBlocked === 'boolean') {
      blockedCache.set(cleanNumber, isBlocked);
    } else {
      blockedCache.delete(cleanNumber);
    }
  }
}

/**
 * Verifica si un número telefónico se encuentra bloqueado
 */
export async function verificarContactoBloqueado(numeroTelefono) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber) return false;

  // 1. Cache en memoria
  if (blockedCache.has(cleanNumber)) {
    return blockedCache.get(cleanNumber);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_contactos?numero_telefono=eq.${cleanNumber}&select=bloqueado`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const isBlocked = Array.isArray(data) && data[0]?.bloqueado === true;
      blockedCache.set(cleanNumber, isBlocked);
      return isBlocked;
    }
  } catch (err) {
    console.warn('[CONTACTOS] Error al verificar bloqueo:', err.message);
  }

  return false;
}

/**
 * Registra o actualiza la actividad de un contacto
 */
export async function registrarContactoWhatsApp(numeroTelefono, nombre, ultimoMensaje) {
  const cleanNumber = (numeroTelefono || '').replace(/\D/g, '');
  if (!cleanNumber || !SUPABASE_URL || !SUPABASE_KEY) return;

  const nowIso = new Date().toISOString();
  const contactName = (nombre && nombre.trim()) ? nombre.trim() : 'Usuario WhatsApp';
  const cleanMessage = (ultimoMensaje || '').trim().slice(0, 300);

  try {
    // 1. Consultar si ya existe para incrementar total_mensajes
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_contactos?numero_telefono=eq.${cleanNumber}&select=total_mensajes,nombre`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    let totalMensajes = 1;
    let existingName = contactName;

    if (checkRes.ok) {
      const rows = await checkRes.json();
      if (Array.isArray(rows) && rows[0]) {
        totalMensajes = (rows[0].total_mensajes || 0) + 1;
        if (rows[0].nombre && rows[0].nombre !== 'Usuario WhatsApp' && contactName === 'Usuario WhatsApp') {
          existingName = rows[0].nombre;
        }
      }
    }

    // 2. Upsert con datos actualizados
    await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_contactos`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        numero_telefono: cleanNumber,
        nombre: existingName,
        ultimo_mensaje: cleanMessage,
        total_mensajes: totalMensajes,
        ultimo_contacto: nowIso
      })
    });
  } catch (err) {
    console.warn('[CONTACTOS] Error al registrar contacto:', err.message);
  }
}
