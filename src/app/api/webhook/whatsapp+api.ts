import { supabase } from '../../../lib/supabase';
import { extraerDatosSuscripcionConGemini } from '../../../services/geminiService';
import {
  actualizarEstadoSesion,
  crearTarjetaVentaOnline,
  enviarMensajeTextoWhatsApp,
  obtenerEstadoSesion,
} from '../../../services/whatsappService';

// GET: Verificación requerida por Meta WhatsApp Cloud API al hacer clic en "Verificar y guardar"
export async function GET(request: Request) {
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
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK WHATSAPP RECEIVED]:', JSON.stringify(body, null, 2));

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) {
      return Response.json({ status: 'ignored' }, { status: 200 });
    }

    const from = message.from;
    let mensajeTexto = '';
    let esBtnSuscribirse = false;

    if (message.type === 'text') {
      mensajeTexto = message.text?.body || '';
    } else if (message.type === 'interactive') {
      const btnId = message.interactive?.button_reply?.id || '';
      const btnTitle = message.interactive?.button_reply?.title || '';
      mensajeTexto = btnTitle || btnId;
      if (btnId === 'btn_suscribirse') {
        esBtnSuscribirse = true;
      }
    } else if (message.type === 'button') {
      mensajeTexto = message.button?.text || message.button?.payload || '';
    }

    // Registrar log entrante
    await supabase.from('whatsapp_webhook_logs').insert({
      tipo: 'incoming',
      numero_telefono: from,
      mensaje_texto: mensajeTexto,
      contenido: body,
    });

    const textoLower = mensajeTexto.toLowerCase().trim();

    // 1. Verificar sesión actual del usuario
    const sesion = await obtenerEstadoSesion(from);
    console.log('[SESION ESTADO]:', JSON.stringify(sesion));

    // 2. Si el cliente presionó el botón "Suscribirse" o escribe comando
    const esComandoSuscribir =
      esBtnSuscribirse ||
      textoLower.includes('suscrib') ||
      textoLower.includes('comprar') ||
      textoLower.includes('plan') ||
      textoLower === '1';

    if (esComandoSuscribir && sesion.estado !== 'ESPERANDO_DATOS_SUSCRIPCION') {
      await actualizarEstadoSesion(from, 'ESPERANDO_DATOS_SUSCRIPCION');

      const mensajeInstrucciones =
        `¡Excelente! 🚀 Para procesar tu solicitud de suscripción, por favor envíanos la siguiente información en *UN SOLO MENSAJE*:\n\n` +
        `1. *Nombre y Apellido* (Obligatorio)\n` +
        `2. *Sector donde vives* (Obligatorio)\n` +
        `3. *Número de contacto* (Opcional - si no lo indicas, te contactaremos a este mismo número de WhatsApp)\n\n` +
        `📌 *Ejemplo de mensaje:*\n` +
        `Juan Pérez, Sector Las Delicias, 04141234567`;

      await enviarMensajeTextoWhatsApp(from, mensajeInstrucciones);
      return Response.json({ status: 'success', flow: 'instrucciones_enviadas' }, { status: 200 });
    }

    // 3. Si el cliente responde con sus datos (estado ESPERANDO_DATOS_SUSCRIPCION)
    if (sesion.estado === 'ESPERANDO_DATOS_SUSCRIPCION') {
      console.log('[FLUJO SUSCRIPCION] Procesando datos:', mensajeTexto);

      // Extraer los datos estructurados con Gemini IA
      const datosExtrada = await extraerDatosSuscripcionConGemini(mensajeTexto, from);
      console.log('[DATOS EXTRAIDOS]:', JSON.stringify(datosExtrada));

      // Crear la tarjeta en la lista 'ventas online' del tablero 'Gestión Online'
      const tarjetaCreada = await crearTarjetaVentaOnline(datosExtrada);
      console.log('[TARJETA CREADA]:', tarjetaCreada);

      // Reiniciar estado de la sesión
      await actualizarEstadoSesion(from, 'INICIO');

      const mensajeConfirmacion =
        `✅ *Solicitud procesada*\n\n` +
        `Gracias *${datosExtrada.nombre}*, hemos recibido tus datos correctamente.\n\n` +
        `📍 *Sector:* ${datosExtrada.sector}\n` +
        `📱 *Contacto:* ${datosExtrada.telefono}\n\n` +
        `Un asesor se estará contactando con usted en un plazo de 24 a 48 horas.`;

      await enviarMensajeTextoWhatsApp(from, mensajeConfirmacion);

      const flowStatus = tarjetaCreada ? 'tarjeta_creada' : 'tarjeta_fallback';
      return Response.json({ status: 'success', flow: flowStatus, datos: datosExtrada }, { status: 200 });
    }

    // 4. Mensaje por defecto: mostrar menú principal (la sesión no está en flujo activo)
    return Response.json({ status: 'success', flow: 'no_flujo_activo', estado: sesion.estado }, { status: 200 });

  } catch (error) {
    console.error('[WEBHOOK POST EXCEPTION]:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
