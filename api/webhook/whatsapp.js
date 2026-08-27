import { extraerDatosConGemini, generarRespuestaConversacional } from '../services/gemini.js';
import { enviarMensajeTexto, enviarBorradorPrevisualizacion } from '../services/whatsapp.js';
import { insertarLog } from '../services/logger.js';

export default async function handler(req, res) {
  // ── GET: Verificación del Webhook por Meta ──────────────────────────────────
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'metricall_bot_secret_2026';
    const ALT_TOKEN = 'metricall_bot_verify_token_2026';

    if (mode === 'subscribe' && (token === VERIFY_TOKEN || token === ALT_TOKEN)) {
      await insertarLog({ tipo: 'sistema', mensaje_texto: 'Webhook verificado con Meta', contenido: { mode, token } });
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Token de verificación inválido');
  }

  // ── POST: Recepción de mensajes de WhatsApp ─────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Loguear el evento RAW completo
      await insertarLog({
        tipo: 'raw_incoming',
        mensaje_texto: 'Evento recibido de Meta',
        contenido: body
      });

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message) {
        await insertarLog({ tipo: 'info', mensaje_texto: 'Evento sin mensaje (status update o notificación)', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const fromNumber = message.from;
      const messageType = message.type;

      // ── Botones interactivos ────────────────────────────────────────────────
      if (messageType === 'interactive') {
        const buttonId = message.interactive?.button_reply?.id;
        const buttonTitle = message.interactive?.button_reply?.title;

        await insertarLog({
          tipo: 'button',
          numero_telefono: fromNumber,
          mensaje_texto: `Botón presionado: ${buttonTitle}`,
          contenido: { buttonId, buttonTitle }
        });

        if (buttonId === 'btn_publicar') {
          await enviarMensajeTexto(fromNumber, '✅ *¡Publicación registrada en Metricall!*\n\nTu registro ha sido guardado correctamente.');
        } else if (buttonId === 'btn_modificar') {
          await enviarMensajeTexto(fromNumber, '✏️ *Modificar borrador*\n\nEscribe el cambio que deseas (ej: *"precio 70$"*, *"es nuevo"*, *"marca Toyota"*).');
        } else if (buttonId === 'btn_cancelar') {
          await enviarMensajeTexto(fromNumber, '❌ *Publicación cancelada.*\n\nEnvía una nueva foto o mensaje cuando quieras.');
        }

        return res.status(200).json({ status: 'button_handled' });
      }

      // ── Texto o imagen ──────────────────────────────────────────────────────
      const textBody = message.text?.body || '';
      const hasImage = messageType === 'image';

      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromNumber,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody, raw: message }
      });

      // Generar respuesta conversacional con Gemini
      const respuesta = await generarRespuestaConversacional(textBody || `[${messageType}]`);

      await insertarLog({
        tipo: 'gemini_response',
        numero_telefono: fromNumber,
        mensaje_texto: respuesta,
        contenido: { respuesta }
      });

      // Enviar la respuesta al usuario
      await enviarMensajeTexto(fromNumber, respuesta);

      await insertarLog({
        tipo: 'outgoing',
        numero_telefono: fromNumber,
        mensaje_texto: 'Respuesta conversacional enviada',
        contenido: {}
      });

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      await insertarLog({ tipo: 'error', mensaje_texto: err.message, contenido: { stack: err.stack } });
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
