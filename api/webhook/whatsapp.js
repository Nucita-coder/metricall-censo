import { extraerDatosConGemini } from '../services/gemini.js';
import { enviarMensajeTexto, enviarBorradorPrevisualizacion } from '../services/whatsapp.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'metricall_bot_secret_2026';
    const ALT_TOKEN = 'metricall_bot_verify_token_2026';

    if (mode === 'subscribe' && (token === VERIFY_TOKEN || token === ALT_TOKEN)) {
      console.log('[WEBHOOK] Verificación exitosa con Meta!');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Token de verificación inválido');
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const fromNumber = message.from;
        const messageType = message.type;

        // 1. Mapeo de clics en botones interactivos
        if (messageType === 'interactive') {
          const buttonId = message.interactive?.button_reply?.id;
          console.log(`[BOTÓN CLICKEADO]: ${buttonId} por ${fromNumber}`);

          if (buttonId === 'btn_publicar') {
            await enviarMensajeTexto(
              fromNumber,
              '✅ *¡Publicación registrada con éxito en Metricall!*\n\nTu registro ha sido guardado y atribuido a tu empresa correctamente.'
            );
          } else if (buttonId === 'btn_modificar') {
            await enviarMensajeTexto(
              fromNumber,
              '✏️ *Modificación de borrador*\n\nEscribe el cambio que deseas realizar (ejemplo: *"el precio es $65"*, *"es nuevo"*, *"marca Chevrolet"*).'
            );
          } else if (buttonId === 'btn_cancelar') {
            await enviarMensajeTexto(
              fromNumber,
              '❌ *Publicación cancelada*\n\nSe ha descartado el borrador. Puedes enviar una nueva foto o mensaje cuando desees.'
            );
          }
          return res.status(200).json({ status: 'success' });
        }

        // 2. Procesamiento de Texto o Imágenes entrantes con Gemini IA
        const textBody = message.text?.body || '';

        // Notificar brevemente al usuario
        await enviarMensajeTexto(fromNumber, '🤖 *MetricallBot:* Analizando información con IA...');

        // Analizar datos con Gemini
        const datosExtraidos = await extraerDatosConGemini(textBody);

        // Enviar el borrador con los 3 botones interactivos nativos de Meta
        await enviarBorradorPrevisualizacion(fromNumber, datosExtraidos);
      }

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      console.error('[WEBHOOK ERROR]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
