import {
  enviarMenuPrincipal,
  enviarFormularioPago,
  enviarMenuFallas,
  enviarLinkSuscripcion,
  enviarConfirmacionFalla,
  enviarMensajeTexto
} from '../services/whatsapp.js';
import { insertarLog } from '../services/logger.js';

// Etiquetas legibles para tipos de falla
const FALLA_LABELS = {
  falla_luz_roja:      '🔴 Luz roja en equipo',
  falla_intermitencia: '📶 Intermitencia de servicio',
  falla_lento:         '🐌 Internet lento',
  falla_paginas:       '🚫 No abren algunas páginas',
  falla_sin_datos:     '📵 No recibe datos'
};

export default async function handler(req, res) {

  // ── GET: Verificación del Webhook por Meta ──────────────────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'metricall_bot_secret_2026';
    if (mode === 'subscribe' && (token === VERIFY_TOKEN || token === 'metricall_bot_verify_token_2026')) {
      await insertarLog({ tipo: 'sistema', mensaje_texto: 'Webhook verificado con Meta' });
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Token inválido');
  }

  // ── POST: Recepción de mensajes ─────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Log RAW
      await insertarLog({ tipo: 'raw_incoming', mensaje_texto: 'Evento recibido de Meta', contenido: body });

      const value   = body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];

      if (!message) {
        await insertarLog({ tipo: 'info', mensaje_texto: 'Evento sin mensaje (status update o notificación)', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const fromPhone   = message.from;
      const messageType = message.type;

      // ── Botones interactivos (reply buttons) ─────────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
        const buttonId    = message.interactive.button_reply.id;
        const buttonTitle = message.interactive.button_reply.title;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Botón: ${buttonTitle}`, contenido: { buttonId } });

        if (buttonId === 'btn_reporte_pago') {
          await enviarFormularioPago(fromPhone);

        } else if (buttonId === 'btn_reporte_falla') {
          await enviarMenuFallas(fromPhone);

        } else if (buttonId === 'btn_suscribirse') {
          await enviarLinkSuscripcion(fromPhone);
        }

        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Respuesta a botón: ${buttonId}` });
        return res.status(200).json({ status: 'button_handled' });
      }

      // ── Selección de lista (fallas) ───────────────────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'list_reply') {
        const itemId    = message.interactive.list_reply.id;
        const itemTitle = message.interactive.list_reply.title;
        const label     = FALLA_LABELS[itemId] || itemTitle;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Falla seleccionada: ${label}`, contenido: { itemId } });
        await enviarConfirmacionFalla(fromPhone, label);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Confirmación de falla enviada: ${label}` });
        return res.status(200).json({ status: 'falla_registrada' });
      }

      // ── Mensaje de texto o imagen → Mostrar menú principal ───────────────────
      const textBody = message.text?.body || '';

      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromPhone,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody }
      });

      // Siempre mostrar el menú principal
      await enviarMenuPrincipal(fromPhone);
      await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Menú principal enviado' });

      return res.status(200).json({ status: 'menu_enviado' });

    } catch (err) {
      await insertarLog({ tipo: 'error', mensaje_texto: err.message, contenido: { stack: err.stack } });
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
