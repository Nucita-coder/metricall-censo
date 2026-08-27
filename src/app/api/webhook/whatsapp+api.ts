import { ExpoRequest } from 'expo-router/server';

// GET: Verificación requerida por Meta WhatsApp Cloud API al hacer clic en "Verificar y guardar"
export async function GET(request: ExpoRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'metricall_bot_secret_2026';
  const ALT_TOKEN = 'metricall_bot_verify_token_2026';

  if (mode === 'subscribe' && (token === VERIFY_TOKEN || token === ALT_TOKEN)) {
    console.log('[WEBHOOK] Verificación exitosa con Meta!');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Token de verificación inválido', { status: 403 });
}

// POST: Recepción de eventos, fotos y mensajes entrantes de WhatsApp
export async function POST(request: ExpoRequest) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK WHATSAPP]:', JSON.stringify(body, null, 2));

    // Retornamos 200 OK inmediatamente a Meta para evitar retentativas de webhook
    return Response.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK ERROR]:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
