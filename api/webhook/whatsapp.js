export default function handler(req, res) {
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
      console.log('[WEBHOOK POST RECEIVED]:', JSON.stringify(req.body, null, 2));
      return res.status(200).json({ status: 'success' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
