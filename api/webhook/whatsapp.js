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
      console.log('[WEBHOOK POST RECEIVED]:', JSON.stringify(body, null, 2));

      // Extraer mensajes entrantes del webhook de WhatsApp
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const fromNumber = message.from; // Número del remitente
        const messageType = message.type;
        const textBody = message.text?.body || '';

        console.log(`[WHATSAPP MESSAGE] De: ${fromNumber} | Tipo: ${messageType} | Texto: ${textBody}`);

        // Credenciales de envío de Meta WhatsApp Cloud API
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'EABCWkEzhIB0BSVmIhtsFl1mpzi2NdsgR8zjRioYmxmKZCv9ZBpfJPkgqunFGRdOYH7WVAETMQyQXI9N1tn4jnfahZCZCyga34ld1AZBAla866ybZA4IHaZACFUwZBBR2zzuHSvqpSj5brXnvZCMZC6xZBGRqtiaKJz7dQP7MjHH8Klo0xm8ZACUFPyqf9bV86eICUgZDZD';
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323';

        // Enviar respuesta automática por la Cloud API
        if (accessToken && phoneNumberId) {
          const responseText = `¡Hola! 👋 Gracias por escribir a *MetricallBot*.\n\nHemos recibido tu mensaje: "${textBody || 'Contenido multimedia'}"\n\nEl sistema está procesando tu solicitud.`;

          await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: fromNumber,
              type: 'text',
              text: { body: responseText },
            }),
          }).then(r => r.json()).then(data => {
            console.log('[WHATSAPP API RESPUESTA ENVIADA]:', data);
          }).catch(err => {
            console.error('[WHATSAPP API ERROR AL ENVIAR]:', err);
          });
        }
      }

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      console.error('[WEBHOOK ERROR]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
