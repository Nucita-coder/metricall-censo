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
  enviarSolicitudComprobante,
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
// Palabras clave para salir o cancelar cualquier flujo activo
const PALABRAS_CANCELAR = ['cancelar', 'salir', 'menu', 'menú', 'inicio', '0'];

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
        await insertarLog({ tipo: 'info', mensaje_texto: 'Evento sin mensaje (status update o notificación)', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const fromPhone   = message.from;
      const messageType = message.type;
      const textBody    = (message.text?.body || '').trim();

      // 1. Obtener estado de la conversación PRIMERO (con timeout automático de 5 min)
      const sesion = await obtenerEstadoSesionRest(fromPhone);
      const estadoActual = sesion.estado;
      const enFlujoActivo = estadoActual !== 'INICIO';

      // 2. Si el usuario escribe una palabra explícita de cancelación ("cancelar", "menu", "salir")
      if (enFlujoActivo && textBody && PALABRAS_CANCELAR.includes(textBody.toLowerCase())) {
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');
        await enviarMensajeTexto(fromPhone, '↩️ *Gestión cancelada.* Regresando al menú principal...');
        await enviarMenuPrincipal(fromPhone);
        return res.status(200).json({ status: 'flujo_cancelado_por_usuario' });
      }

      // ── 3. Botones interactivos (reply buttons) ─────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
        const buttonId    = message.interactive.button_reply.id;
        const buttonTitle = message.interactive.button_reply.title;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Botón: ${buttonTitle}`, contenido: { buttonId } });

        // ── Validar clics en botones de confirmación obsoletos ────────────────
        if ((buttonId === 'btn_confirmar_pago' || buttonId === 'btn_rechazar_pago') && estadoActual !== 'CONFIRMANDO_PAGO') {
          await enviarMensajeTexto(fromPhone, '⚠️ *Esta confirmación ya expiró o fue procesada.*');
          await enviarMenuPrincipal(fromPhone);
          return res.status(200).json({ status: 'boton_confirmacion_expirado' });
        }

        // ── Botones del menú principal ────────────────────────────────────────
        if (buttonId === 'btn_reporte_pago') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un nuevo Reporte de Pago.');
          }
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO');
          await enviarFormularioPago(fromPhone);

        } else if (buttonId === 'btn_reporte_falla') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un Reporte de Falla.');
            await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          }
          await enviarMenuFallas(fromPhone);

        } else if (buttonId === 'btn_suscribirse') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar la Suscripción.');
          }
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
          await enviarInstruccionesSuscripcion(fromPhone);

        // ── Botones de confirmación de pago válidos ─────────────────────────
        } else if (buttonId === 'btn_confirmar_pago') {
          const datosGuardados = sesion.datos_temporales || {};
          await crearTarjetaCobranzaRest(datosGuardados);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosGuardados);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago confirmado vía botón: Ref ${datosGuardados.referencia}` });
          return res.status(200).json({ status: 'pago_confirmado_y_registrado' });

        } else if (buttonId === 'btn_rechazar_pago') {
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO');
          await enviarFormularioPago(fromPhone);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Usuario rechazó datos vía botón, se reinicia el formulario' });
          return res.status(200).json({ status: 'pago_rechazado_reintento' });
        }

        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Respuesta a botón: ${buttonId}` });
        return res.status(200).json({ status: 'button_handled' });
      }

      // ── 4. Selección de lista (fallas) ───────────────────────────────────────
      if (messageType === 'interactive' && message.interactive?.type === 'list_reply') {
        const itemId    = message.interactive.list_reply.id;
        const itemTitle = message.interactive.list_reply.title;
        const label     = FALLA_LABELS[itemId] || itemTitle;

        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Falla seleccionada: ${label}`, contenido: { itemId } });
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');
        await enviarConfirmacionFalla(fromPhone, label);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Confirmación de falla enviada: ${label}` });
        return res.status(200).json({ status: 'falla_registrada' });
      }

      // ── 5. Procesamiento de mensajes según Estado Actual ────────────────────
      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromPhone,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody }
      });

      // ── ESTADO: CONFIRMANDO_PAGO ─ usuario responde por texto (Sí / No) ─────
      if (estadoActual === 'CONFIRMANDO_PAGO') {
        const respuesta = textBody.toLowerCase().trim();
        const datosGuardados = sesion.datos_temporales || {};

        if (PALABRAS_SI.includes(respuesta)) {
          await crearTarjetaCobranzaRest(datosGuardados);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosGuardados);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago confirmado y registrado: Ref ${datosGuardados.referencia}` });
          return res.status(200).json({ status: 'pago_confirmado_y_registrado' });

        } else if (PALABRAS_NO.includes(respuesta)) {
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_PAGO');
          await enviarFormularioPago(fromPhone);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Usuario rechazó datos, se reinicia el formulario' });
          return res.status(200).json({ status: 'pago_rechazado_reintento' });

        } else {
          await enviarMensajeTexto(fromPhone,
            '❓ Por favor responde tocando uno de los botones (✅ Confirmar / ❌ Corregir datos) o escribe *Sí* / *No*. Escribe *cancelar* para volver al menú.');
          return res.status(200).json({ status: 'confirmacion_pendiente' });
        }
      }

      // ── ESTADO: ESPERANDO_COMPROBANTE ─ Paso 2: recibe la foto ──────────────
      if (estadoActual === 'ESPERANDO_COMPROBANTE') {
        const datosTemp = sesion.datos_temporales || {};

        if (messageType === 'image' && message.image?.id) {
          console.log('[WEBHOOK PASO2] Comprobante recibido, mediaId:', message.image.id);
          const comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
          console.log('[WEBHOOK PASO2] comprobanteUrl:', comprobanteUrl);

          const datosPago = { ...datosTemp };
          if (comprobanteUrl) datosPago.comprobante_url = comprobanteUrl;

          await actualizarEstadoSesionRest(fromPhone, 'CONFIRMANDO_PAGO', datosPago);
          await enviarResumenParaConfirmacion(fromPhone, datosPago);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Comprobante recibido, resumen enviado para confirmación' });
          return res.status(200).json({ status: 'comprobante_recibido_esperando_confirmacion' });

        } else if (textBody.toLowerCase().includes('sin foto') || textBody.toLowerCase().includes('no tengo')) {
          const datosPago = { ...datosTemp };
          await actualizarEstadoSesionRest(fromPhone, 'CONFIRMANDO_PAGO', datosPago);
          await enviarResumenParaConfirmacion(fromPhone, datosPago);
          return res.status(200).json({ status: 'sin_comprobante_esperando_confirmacion' });

        } else if (messageType === 'text') {
          await enviarMensajeTexto(fromPhone,
            '📸 Por favor envía la *foto del comprobante* de pago. Si no tienes la foto, escribe *sin foto*. Escribe *cancelar* para salir.');
          return res.status(200).json({ status: 'esperando_foto' });
        }
      }

      // ── ESTADO: ESPERANDO_DATOS_PAGO ─ Paso 1: recibe texto con datos ────────
      if (estadoActual === 'ESPERANDO_DATOS_PAGO') {
        if (messageType === 'image') {
          await enviarMensajeTexto(fromPhone,
            '✏️ Por favor envía primero los *datos del pago en texto* (cédula, referencia, monto, banco). Luego te pediré la foto.');
          return res.status(200).json({ status: 'imagen_en_paso1_rechazada' });
        }

        if (!textBody) {
          return res.status(200).json({ status: 'sin_texto' });
        }

        const datosPago = await extraerDatosPago(textBody, fromPhone);
        console.log('[WEBHOOK PASO1] datosPago extraídos:', JSON.stringify(datosPago));

        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE', datosPago);
        await enviarSolicitudComprobante(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Datos recibidos, solicitando comprobante (paso 2)' });
        return res.status(200).json({ status: 'datos_recibidos_esperando_comprobante' });
      }

      // ── ESTADO: ESPERANDO_DATOS_SUSCRIPCION ──────────────────────────────────
      if (estadoActual === 'ESPERANDO_DATOS_SUSCRIPCION' && textBody) {
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

      // Si el usuario escribe "suscribirme" desde cualquier estado
      const textLower = textBody.toLowerCase();
      if (textLower.includes('suscrib') || textLower.includes('comprar') || textLower === '1') {
        if (enFlujoActivo) {
          await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar la Suscripción.');
        }
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
        await enviarInstruccionesSuscripcion(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Instrucciones de suscripción enviadas' });
        return res.status(200).json({ status: 'instrucciones_enviadas' });
      }

      // ── Menú principal (estado INICIO o comando no reconocido) ────────────────
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
