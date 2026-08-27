// Servicio de logging para el webhook de WhatsApp hacia Supabase

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export async function insertarLog({ tipo, numero_telefono, mensaje_texto, contenido, status_code }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[LOGGER] Supabase URL/Key no configurados');
    return;
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_webhook_logs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        tipo: tipo || 'incoming',
        numero_telefono: numero_telefono || null,
        mensaje_texto: mensaje_texto || null,
        contenido: contenido || {},
        status_code: status_code || null
      })
    });
  } catch (err) {
    console.error('[LOGGER ERROR]:', err.message);
  }
}
