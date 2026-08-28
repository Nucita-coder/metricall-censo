import {
  enviarMenuPrincipal,
  enviarFormularioPago,
  enviarMenuFallas,
  enviarInstruccionesSuscripcion,
  enviarConfirmacionSuscripcion,
  enviarConfirmacionPago,
  enviarConfirmacionFalla,
  enviarMensajeTexto,
  obtenerEstadoSesionRest,
  actualizarEstadoSesionRest,
  crearTarjetaVentaOnlineRest,
  crearTarjetaCobranzaRest,
  procesarImagenWhatsApp
} from '../services/whatsapp.js';
import { extraerDatosSuscripcion, extraerDatosPago } from '../services/gemini.js';
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
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO');
          await enviarFormularioPago(fromPhone);

        } else if (buttonId === 'btn_reporte_falla') {
          await enviarMenuFallas(fromPhone);

        } else if (buttonId === 'btn_suscribirse') {
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
          await enviarInstruccionesSuscripcion(fromPhone);
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

      // ── Mensajes de texto o imágenes ─────────────────────────────────────────
      const textBody = (message.text?.body || '').trim();

      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromPhone,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody }
      });

      // Obtener estado de la conversación desde Supabase
      const sesion = await obtenerEstadoSesionRest(fromPhone);

      // Si el cliente está en estado ESPERANDO_DATOS_PAGO
      if (sesion.estado === 'ESPERANDO_DATOS_PAGO') {
        let textContent = textBody;
        let comprobanteUrl = null;

        // ── Procesar imagen si viene en este mensaje ───────────────────────────
        if (messageType === 'image' && message.image?.id) {
          console.log('[WEBHOOK PAGO] Imagen recibida, mediaId:', message.image.id);
          comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
          console.log('[WEBHOOK PAGO] comprobanteUrl resultado:', comprobanteUrl);
          // Si el cliente escribió un caption, usarlo como texto de datos
          if (message.image?.caption) {
            textContent = message.image.caption;
          }
        }

        // ── Datos temporales de mensajes anteriores ────────────────────────────
        const datosTemp = sesion.datos_temporales || {};

        // ── Extraer datos del texto (caption o mensaje de texto puro) ──────────
        let datosPago;
        if (textContent && textContent.trim()) {
          datosPago = await extraerDatosPago(textContent, fromPhone);
        } else {
          // Solo imagen sin caption → usar datos temporales o valores vacíos
          datosPago = {
            cedula:     datosTemp.cedula     || 'No especificada',
            referencia: datosTemp.referencia || 'S/N',
            monto:      datosTemp.monto      || 'Por verificar',
            banco:      datosTemp.banco      || 'No especificado',
            telefono:   fromPhone
          };
        }

        // ── Asignar comprobante_url: prioridad → mensaje actual → temporales ───
        if (comprobanteUrl) {
          datosPago.comprobante_url = comprobanteUrl;
        } else if (datosTemp.comprobante_url) {
          datosPago.comprobante_url = datosTemp.comprobante_url;
        }

        // ── Rellenar campos vacíos con datos temporales si el usuario envió texto primero y luego foto
        if (datosTemp.cedula     && datosPago.cedula     === 'No especificada')  datosPago.cedula     = datosTemp.cedula;
        if (datosTemp.referencia && datosPago.referencia === 'S/N')              datosPago.referencia = datosTemp.referencia;
        if (datosTemp.monto      && datosPago.monto      === 'Por verificar')    datosPago.monto      = datosTemp.monto;
        if (datosTemp.banco      && datosPago.banco      === 'No especificado')  datosPago.banco      = datosTemp.banco;

        console.log('[WEBHOOK PAGO] datosPago finales a enviar al RPC:', JSON.stringify(datosPago));

        if (comprobanteUrl || textContent || datosTemp.comprobante_url) {
          await crearTarjetaCobranzaRest(datosPago);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosPago);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Reporte de pago registrado: Ref ${datosPago.referencia}` });
          return res.status(200).json({ status: 'pago_registrado' });
        } else {
          // Guardar datos temporales hasta recibir la foto
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO', datosPago);
        }
      }

      // Si el cliente está en estado ESPERANDO_DATOS_SUSCRIPCION
      if (sesion.estado === 'ESPERANDO_DATOS_SUSCRIPCION' && textBody) {
        const datosExtrada = await extraerDatosSuscripcion(textBody, fromPhone);
        const tarjetaCreada = await crearTarjetaVentaOnlineRest(datosExtrada);
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');

        if (tarjetaCreada) {
          await enviarConfirmacionSuscripcion(fromPhone, datosExtrada);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Suscripción procesada y tarjeta creada: ${datosExtrada.nombre}` });
          return res.status(200).json({ status: 'suscripcion_registrada' });
        } else {
          await enviarMensajeTexto(fromPhone, `Gracias *${datosExtrada.nombre}*, recibimos tus datos. Un asesor te contactará a la brevedad.`);
          return res.status(200).json({ status: 'suscripcion_fallback' });
        }
      }

      // Si el usuario escribe texto como "suscribirme" / "suscribirse"
      const textLower = textBody.toLowerCase();
      if (textLower.includes('suscrib') || textLower.includes('comprar') || textLower === '1') {
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
        await enviarInstruccionesSuscripcion(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Instrucciones de suscripción enviadas por texto' });
        return res.status(200).json({ status: 'instrucciones_enviadas' });
      }

      // Mostrar menú principal
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
