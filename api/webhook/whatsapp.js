import {
  enviarMenuPrincipal,
  enviarFormularioPago,
  enviarMenuFallas,
  enviarInstruccionesSuscripcion,
  enviarConfirmacionSuscripcion,
  enviarConfirmacionPago,
  enviarConfirmacionFalla,
  enviarMensajeTexto,
  enviarResumenParaConfirmacion,
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

// Palabras que el usuario puede escribir para confirmar
const PALABRAS_SI = ['si', 'sí', 'si!', 'sí!', 'yes', 'correcto', 'ok', 'dale', 'confirmar', 'confirmo', '1'];
// Palabras que el usuario puede escribir para rechazar
const PALABRAS_NO = ['no', 'no!', 'nope', 'cancelar', 'reintentar', 'mal', 'incorrecto', 'cambiar', '2'];

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

      // Obtener estado de la conversación desde Supabase (con timeout automático de 5 min)
      const sesion = await obtenerEstadoSesionRest(fromPhone);

      // ── ESTADO: CONFIRMANDO_PAGO ─ usuario responde Sí o No al resumen ───────
      if (sesion.estado === 'CONFIRMANDO_PAGO') {
        const respuesta = textBody.toLowerCase().trim();
        const datosGuardados = sesion.datos_temporales || {};

        if (PALABRAS_SI.includes(respuesta)) {
          // ✅ Usuario confirmó → crear tarjeta
          await crearTarjetaCobranzaRest(datosGuardados);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosGuardados);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago confirmado y registrado: Ref ${datosGuardados.referencia}` });
          return res.status(200).json({ status: 'pago_confirmado_y_registrado' });

        } else if (PALABRAS_NO.includes(respuesta)) {
          // ❌ Usuario rechazó → pedir que reenvíe los datos
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO');
          await enviarMensajeTexto(fromPhone,
            '↩️ Entendido. Por favor, envía nuevamente los datos del pago (cédula, referencia, monto, banco) junto con el comprobante.');
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Usuario rechazó datos, se solicita reenvío' });
          return res.status(200).json({ status: 'pago_rechazado_reintento' });

        } else {
          // Respuesta no reconocida → recordar qué debe hacer
          await enviarMensajeTexto(fromPhone,
            '❓ No entendí tu respuesta. Por favor responde *Sí* para confirmar el pago o *No* para corregir los datos.');
          return res.status(200).json({ status: 'confirmacion_pendiente' });
        }
      }

      // ── ESTADO: ESPERANDO_DATOS_PAGO ─ recibe texto y/o imagen ──────────────
      if (sesion.estado === 'ESPERANDO_DATOS_PAGO') {
        let textContent = textBody;
        let comprobanteUrl = null;

        // Procesar imagen si viene en este mensaje
        if (messageType === 'image' && message.image?.id) {
          console.log('[WEBHOOK PAGO] Imagen recibida, mediaId:', message.image.id);
          comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
          console.log('[WEBHOOK PAGO] comprobanteUrl resultado:', comprobanteUrl);
          if (message.image?.caption) {
            textContent = message.image.caption;
          }
        }

        const datosTemp = sesion.datos_temporales || {};

        // Extraer datos del texto
        let datosPago;
        if (textContent && textContent.trim()) {
          datosPago = await extraerDatosPago(textContent, fromPhone);
        } else {
          datosPago = {
            cedula:     datosTemp.cedula     || 'No especificada',
            referencia: datosTemp.referencia || 'S/N',
            monto:      datosTemp.monto      || 'Por verificar',
            banco:      datosTemp.banco      || 'No especificado',
            telefono:   fromPhone
          };
        }

        // Asignar comprobante_url: prioridad → mensaje actual → temporales
        if (comprobanteUrl) {
          datosPago.comprobante_url = comprobanteUrl;
        } else if (datosTemp.comprobante_url) {
          datosPago.comprobante_url = datosTemp.comprobante_url;
        }

        // Rellenar campos vacíos con datos temporales previos
        if (datosTemp.cedula     && datosPago.cedula     === 'No especificada')  datosPago.cedula     = datosTemp.cedula;
        if (datosTemp.referencia && datosPago.referencia === 'S/N')              datosPago.referencia = datosTemp.referencia;
        if (datosTemp.monto      && datosPago.monto      === 'Por verificar')    datosPago.monto      = datosTemp.monto;
        if (datosTemp.banco      && datosPago.banco      === 'No especificado')  datosPago.banco      = datosTemp.banco;

        console.log('[WEBHOOK PAGO] datosPago extraídos:', JSON.stringify(datosPago));

        if (comprobanteUrl || textContent || datosTemp.comprobante_url) {
          // Guardar datos y pasar a CONFIRMANDO_PAGO (mostrar resumen antes de crear tarjeta)
          await actualizarEstadoSesionRest(fromPhone, 'CONFIRMANDO_PAGO', datosPago);
          await enviarResumenParaConfirmacion(fromPhone, datosPago);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Resumen de pago enviado, esperando confirmación del cliente' });
          return res.status(200).json({ status: 'esperando_confirmacion' });
        } else {
          // Sin datos suficientes → guardar lo que haya y esperar más info
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO', datosPago);
        }
      }

      // ── ESTADO: ESPERANDO_DATOS_SUSCRIPCION ──────────────────────────────────
      if (sesion.estado === 'ESPERANDO_DATOS_SUSCRIPCION' && textBody) {
        const datosExtrada = await extraerDatosSuscripcion(textBody, fromPhone);
        const tarjetaCreada = await crearTarjetaVentaOnlineRest(datosExtrada);
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');

        if (tarjetaCreada) {
          await enviarConfirmacionSuscripcion(fromPhone, datosExtrada);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Suscripción procesada: ${datosExtrada.nombre}` });
          return res.status(200).json({ status: 'suscripcion_registrada' });
        } else {
          await enviarMensajeTexto(fromPhone, `Gracias *${datosExtrada.nombre}*, recibimos tus datos. Un asesor te contactará a la brevedad.`);
          return res.status(200).json({ status: 'suscripcion_fallback' });
        }
      }

      // Si el usuario escribe "suscribirme" / "suscribirse" desde cualquier estado
      const textLower = textBody.toLowerCase();
      if (textLower.includes('suscrib') || textLower.includes('comprar') || textLower === '1') {
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
        await enviarInstruccionesSuscripcion(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Instrucciones de suscripción enviadas por texto' });
        return res.status(200).json({ status: 'instrucciones_enviadas' });
      }

      // ── Menú principal (estado INICIO o no reconocido) ────────────────────────
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
