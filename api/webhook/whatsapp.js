import {
  enviarMenuPrincipal,
  enviarFormularioPago,
  enviarMenuFallas,
  enviarLinkSuscripcion,
  enviarConfirmacionFalla,
  enviarBorradorPago,
  enviarMensajeTexto
} from '../services/whatsapp.js';
import { extraerDatosPagoConGemini } from '../services/gemini.js';
import { insertarLog } from '../services/logger.js';

// Memoria temporal de borradores de pago por número de teléfono
const borradoresPago = new Map();

const FALLA_LABELS = {
  falla_luz_roja:      '🔴 Luz roja en equipo',
  falla_intermitencia: '📶 Intermitencia de servicio',
  falla_lento:         '🐌 Internet lento',
  falla_paginas:       '🚫 No cargan páginas',
  falla_sin_datos:     '📵 Sin internet'
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function guardarPagoEnSupabase(datos) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/reportes_pago`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(datos)
    });
  } catch (err) {
    console.error('[DATABASE PAGO ERROR]:', err);
  }
}

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
      await insertarLog({ tipo: 'raw_incoming', mensaje_texto: 'Evento recibido de Meta', contenido: body });

      const value   = body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];

      if (!message) {
        await insertarLog({ tipo: 'info', mensaje_texto: 'Evento de notificación/status', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const fromPhone   = message.from;
      const messageType = message.type;

      // ── 1. Botones de menú o confirmación ────────────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
        const buttonId    = message.interactive.button_reply.id;
        const buttonTitle = message.interactive.button_reply.title;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Botón: ${buttonTitle}`, contenido: { buttonId } });

        if (buttonId === 'btn_reporte_pago') {
          borradoresPago.set(fromPhone, { estado: 'esperando_pago' });
          await enviarFormularioPago(fromPhone);

        } else if (buttonId === 'btn_reporte_falla') {
          await enviarMenuFallas(fromPhone);

        } else if (buttonId === 'btn_suscribirse') {
          await enviarLinkSuscripcion(fromPhone);

        } else if (buttonId === 'btn_confirmar_pago') {
          const borrador = borradoresPago.get(fromPhone);
          if (borrador && borrador.datos) {
            await guardarPagoEnSupabase({
              numero_telefono: fromPhone,
              cedula: borrador.datos.cedula,
              referencia: borrador.datos.referencia,
              monto: borrador.datos.monto,
              telefono_pago_movil: borrador.datos.telefono_pago_movil,
              banco: borrador.datos.banco,
              estado: 'pendiente'
            });
            borradoresPago.delete(fromPhone);
            await enviarMensajeTexto(fromPhone, '✅ *¡Pago registrado con éxito!*\n\nTu reporte ha sido guardado. Lo validaremos en breve.');
          } else {
            await enviarMensajeTexto(fromPhone, '✅ *¡Pago registrado con éxito!* Gracias por tu reporte.');
          }

        } else if (buttonId === 'btn_cancelar_pago') {
          borradoresPago.delete(fromPhone);
          await enviarMensajeTexto(fromPhone, '❌ *Reporte de pago cancelado.*\n\nPuedes enviar uno nuevo cuando desees.');
        }

        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Respuesta a botón: ${buttonId}` });
        return res.status(200).json({ status: 'button_handled' });
      }

      // ── 2. Selección de Lista (fallas) ─────────────────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'list_reply') {
        const itemId    = message.interactive.list_reply.id;
        const itemTitle = message.interactive.list_reply.title;
        const label     = FALLA_LABELS[itemId] || itemTitle;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Falla seleccionada: ${label}`, contenido: { itemId } });
        await enviarConfirmacionFalla(fromPhone, label);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Confirmación enviada: ${label}` });
        return res.status(200).json({ status: 'falla_registrada' });
      }

      // ── 3. Procesamiento de Texto o Imagen (Reporte de Pago o Menú) ─────────
      const textBody = message.text?.body || '';
      const isEsperandoPago = borradoresPago.has(fromPhone);

      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromPhone,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody }
      });

      // Si el usuario estaba en flujo de pago o mandó datos/foto
      if (isEsperandoPago || textBody.length > 5 || messageType === 'image') {
        await enviarMensajeTexto(fromPhone, '🤖 *MetricallBot:* Procesando datos de tu pago...');

        const datosPago = await extraerDatosPagoConGemini(textBody);
        borradoresPago.set(fromPhone, { estado: 'confirmar', datos: datosPago });

        await insertarLog({
          tipo: 'gemini_response',
          numero_telefono: fromPhone,
          mensaje_texto: `Extracción de Pago: ${datosPago.referencia}`,
          contenido: datosPago
        });

        await enviarBorradorPago(fromPhone, datosPago);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Resumen de pago con botones enviado' });
        return res.status(200).json({ status: 'pago_procesado' });
      }

      // En caso contrario, mostrar el menú principal
      await enviarMenuPrincipal(fromPhone);
      await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_telefono: fromPhone, mensaje_texto: 'Menú principal enviado' });

      return res.status(200).json({ status: 'menu_enviado' });

    } catch (err) {
      await insertarLog({ tipo: 'error', mensaje_texto: err.message, contenido: { stack: err.stack } });
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
