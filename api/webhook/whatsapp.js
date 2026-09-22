import {
  enviarMenuPrincipal,
  enviarFormularioPago,
  enviarSelectorFechaPago,
  enviarFormularioFalla,
  enviarMenuFallas,
  enviarInstruccionesSuscripcion,
  enviarConfirmacionSuscripcion,
  enviarConfirmacionPago,
  enviarConfirmacionFalla,
  enviarMensajeTexto,
  enviarSolicitudComprobante,
  obtenerEstadoSesionRest,
  actualizarEstadoSesionRest,
  crearTarjetaVentaOnlineRest,
  crearTarjetaCobranzaRest,
  actualizarFechaPagoTarjetaRest,
  crearTarjetaFallaRest,
  procesarImagenWhatsApp,
  verificarContactoBloqueado,
  registrarContactoWhatsApp
} from '../services/whatsapp.js';
import { extraerDatosSuscripcion, extraerDatosFalla } from '../services/gemini.js';
import { insertarLog } from '../services/logger.js';

const getFechaHoy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Etiquetas legibles para tipos de falla
const FALLA_LABELS = {
  falla_luz_roja:      '🔴 Luz roja en equipo',
  falla_intermitencia: '📶 Intermitencia de servicio',
  falla_lento:         '🐌 Internet lento',
  falla_paginas:       '🚫 No abren algunas páginas',
  falla_sin_datos:     '📵 No recibe datos'
};

// Palabras clave para salir o cancelar cualquier flujo activo
const PALABRAS_CANCELAR = ['cancelar', 'salir', 'menu', 'menú', 'inicio', '0'];

export default async function handler(req, res) {

  // ── GET: Verificación del Webhook por Meta ──────────────────────────────────
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    const VERIFY = process.env.WHATSAPP_VERIFY_TOKEN || 'metricall_bot_secret_2026';
    if (mode === 'subscribe' && (token === VERIFY || token === 'metricall_bot_verify_token_2026')) {
      await insertarLog({ tipo: 'sistema', mensaje_texto: 'Webhook verificado con Meta' });
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Token inválido');
  }

  // ── POST: Recepción de mensajes ─────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body;

      const value   = body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];
      const profileName = contact?.profile?.name || '';
      const fromPhone   = message?.from || contact?.wa_id || null;

      await insertarLog({ tipo: 'raw_incoming', numero_telefono: fromPhone, mensaje_texto: 'Evento recibido de Meta', contenido: { profileName, ...body } });

      if (!message) {
        await insertarLog({ tipo: 'info', numero_telefono: fromPhone, mensaje_texto: 'Evento sin mensaje (status update o notificación)', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const messageType = message.type;
      const textBody    = (message.text?.body || '').trim();

      if (await verificarContactoBloqueado(fromPhone)) {
        await insertarLog({ tipo: 'blocked', numero_telefono: fromPhone, mensaje_texto: `Mensaje bloqueado: ${textBody || messageType}` });
        return res.status(200).json({ status: 'contacto_bloqueado' });
      }

      registrarContactoWhatsApp(fromPhone, profileName, textBody || messageType).catch(() => {});

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

        // ── Botones del menú principal ────────────────────────────────────────
        if (buttonId === 'btn_reporte_pago') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un nuevo Reporte de Pago.');
          }
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO');
          await enviarFormularioPago(fromPhone);

        } else if (buttonId === 'btn_cambiar_fecha_pago') {
          const cedula = sesion.datos_temporales?.cedula || '';
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_FECHA_PAGO', sesion.datos_temporales || {});
          await enviarSelectorFechaPago(fromPhone, cedula);
          return res.status(200).json({ status: 'selector_fecha_enviado' });

        } else if (buttonId === 'btn_reporte_falla') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un Reporte de Falla.');
          }
          // Paso 1 de Falla: solicitar datos de cliente (Nombre, Cédula, Teléfono)
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_FALLA');
          await enviarFormularioFalla(fromPhone);

        } else if (buttonId === 'btn_suscribirse') {
          if (enFlujoActivo) {
            await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar la Suscripción.');
          }
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
          await enviarInstruccionesSuscripcion(fromPhone);
        }

        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Respuesta a botón: ${buttonId}` });
        return res.status(200).json({ status: 'button_handled' });
      }

      // ── 4. Selección de lista (fallas y almanaque de fechas de pago) ─────────
      if (messageType === 'interactive' && message.interactive?.type === 'list_reply') {
        const itemId    = message.interactive.list_reply.id;
        const itemTitle = message.interactive.list_reply.title;

        // Selección de fecha de pago en el almanaque
        if (itemId.startsWith('pago_fecha_')) {
          const datosTemp = sesion.datos_temporales || {};
          await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Fecha pago seleccionada: ${itemTitle}`, contenido: { itemId } });

          if (itemId === 'pago_fecha_otra') {
            await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_FECHA_MANUAL', datosTemp);
            await enviarMensajeTexto(fromPhone, '📅 Por favor escribe la fecha en que realizaste el pago (ejemplo: 15/09/2026):');
            return res.status(200).json({ status: 'esperando_fecha_manual' });
          }

          const fechaElegida = message.interactive.list_reply.description || itemId.replace('pago_fecha_', '');
          const datosConFecha = { ...datosTemp, fechaPago: fechaElegida };

          if (datosTemp.tarjeta_id) {
            await actualizarFechaPagoTarjetaRest(datosTemp.tarjeta_id, fromPhone, fechaElegida);
            await actualizarEstadoSesionRest(fromPhone, 'INICIO', datosConFecha);
            await enviarMensajeTexto(fromPhone, `✅ Fecha de pago actualizada a: *${fechaElegida}*. ¡Muchas gracias!`);
            return res.status(200).json({ status: 'fecha_actualizada_tarjeta_existente' });
          }

          if (datosConFecha.comprobante_url && datosConFecha.cedula) {
            const tid = await crearTarjetaCobranzaRest({ ...datosConFecha, telefono: fromPhone });
            await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosConFecha, tarjeta_id: tid });
            await enviarConfirmacionPago(fromPhone, datosConFecha);
            return res.status(200).json({ status: 'pago_registrado_directo' });
          }

          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO', datosConFecha);
          await enviarMensajeTexto(fromPhone, `📅 Fecha registrada: *${fechaElegida}*.\n\nPor favor envía la *captura de tu comprobante* con tu número de *Cédula*:`);
          return res.status(200).json({ status: 'fecha_seleccionada' });
        }

        // Selección de tipo de falla técnica
        const label = FALLA_LABELS[itemId] || itemTitle;
        const datosCompletosFalla = { ...(sesion.datos_temporales || {}), tipoFalla: label };
        await crearTarjetaFallaRest(datosCompletosFalla);
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');
        await enviarConfirmacionFalla(fromPhone, label, datosCompletosFalla);
        return res.status(200).json({ status: 'falla_registrada' });
      }

      // ── 5. Procesamiento de mensajes según Estado Actual ────────────────────
      await insertarLog({
        tipo: 'incoming',
        numero_telefono: fromPhone,
        mensaje_texto: textBody || `[${messageType.toUpperCase()}]`,
        contenido: { messageType, textBody, profileName, pushName: profileName }
      });

      // ── ESTADO: ESPERANDO_DATOS_FALLA ─ Paso 1 de Falla: recibe texto con datos ──
      if (estadoActual === 'ESPERANDO_DATOS_FALLA') {
        if (!textBody) {
          await enviarMensajeTexto(fromPhone, '✏️ Por favor envía tus datos en texto (Nombre, Cédula y Teléfono de contacto).');
          return res.status(200).json({ status: 'sin_texto_falla' });
        }

        const datosFalla = await extraerDatosFalla(textBody, fromPhone);
        console.log('[WEBHOOK FALLA PASO1] datosFalla extraídos:', JSON.stringify(datosFalla));

        // Guardar datos del cliente y desplegar la lista de fallas (Paso 2)
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_TIPO_FALLA', datosFalla);
        await enviarMenuFallas(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Datos de cliente para falla recibidos, desplegando lista de fallas' });
        return res.status(200).json({ status: 'datos_falla_recibidos_esperando_tipo' });
      }

      // ── ESTADO: ESPERANDO_FECHA_MANUAL ──────────────────────────────────────
      if (estadoActual === 'ESPERANDO_FECHA_MANUAL' && textBody) {
        const fechaManual = textBody.trim();
        const datosTemp = sesion.datos_temporales || {};
        const datosConFecha = { ...datosTemp, fechaPago: fechaManual };

        if (datosTemp.tarjeta_id) {
          await actualizarFechaPagoTarjetaRest(datosTemp.tarjeta_id, fromPhone, fechaManual);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO', datosConFecha);
          await enviarMensajeTexto(fromPhone, `✅ Fecha de pago actualizada a: *${fechaManual}*. ¡Muchas gracias!`);
          return res.status(200).json({ status: 'fecha_manual_actualizada' });
        }

        if (datosConFecha.comprobante_url && datosConFecha.cedula) {
          const tid = await crearTarjetaCobranzaRest({ ...datosConFecha, telefono: fromPhone });
          await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosConFecha, tarjeta_id: tid });
          await enviarConfirmacionPago(fromPhone, datosConFecha);
          return res.status(200).json({ status: 'pago_completado_con_fecha_manual' });
        }

        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO', datosConFecha);
        await enviarMensajeTexto(fromPhone, `📅 Fecha registrada: *${fechaManual}*.\n\nPor favor envía la *captura de tu comprobante* con tu número de *Cédula*:`);
        return res.status(200).json({ status: 'fecha_manual_guardada' });
      }

      // ── ESTADO: FLUJO DE PAGO DIRECTO ───────────────────────────────────────
      const estadosPago = ['ESPERANDO_PAGO_DIRECTO', 'ESPERANDO_CEDULA_PAGO', 'ESPERANDO_COMPROBANTE', 'ESPERANDO_DATOS_PAGO', 'ESPERANDO_FECHA_PAGO'];
      if (estadosPago.includes(estadoActual)) {
        const datosTemp = sesion.datos_temporales || {};
        const fechaPago = datosTemp.fechaPago || getFechaHoy();

        // 1. Imagen recibida
        if (messageType === 'image' && message.image?.id) {
          const comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
          const caption = (message.image.caption || '').trim();
          const matchCedula = caption.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
          const cedula = matchCedula ? matchCedula[1] : (datosTemp.cedula || '');

          if (cedula) {
            const datosPago = { cedula, comprobante_url: comprobanteUrl || '', fechaPago, telefono: fromPhone };
            const tid = await crearTarjetaCobranzaRest(datosPago);
            await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosPago, tarjeta_id: tid });
            await enviarConfirmacionPago(fromPhone, datosPago);
            await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago registrado para CI: ${cedula}` });
            return res.status(200).json({ status: 'pago_registrado_directo' });
          }

          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO', { ...datosTemp, comprobante_url: comprobanteUrl || '', fechaPago });
          await enviarMensajeTexto(fromPhone, '📸 ¡Captura recibida!\n\nPor favor indícanos tu número de *Cédula de Identidad* o *Abonado*:');
          return res.status(200).json({ status: 'comprobante_recibido_esperando_cedula' });
        }

        // 2. Texto recibido
        if (textBody) {
          const matchCedula = textBody.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
          const esSinFoto = textBody.toLowerCase().includes('sin foto') || textBody.toLowerCase().includes('no tengo');

          if (matchCedula) {
            const cedula = matchCedula[1];
            if (datosTemp.comprobante_url || esSinFoto) {
              const datosPago = { cedula, comprobante_url: datosTemp.comprobante_url || '', fechaPago, telefono: fromPhone };
              const tid = await crearTarjetaCobranzaRest(datosPago);
              await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosPago, tarjeta_id: tid });
              await enviarConfirmacionPago(fromPhone, datosPago);
              await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago registrado para CI: ${cedula}` });
              return res.status(200).json({ status: 'pago_registrado_con_cedula' });
            }

            await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO', { ...datosTemp, cedula, fechaPago });
            await enviarMensajeTexto(fromPhone, `📸 Cédula *${cedula}* registrada.\n\nPor favor envía la *foto o captura* del comprobante de pago:`);
            return res.status(200).json({ status: 'cedula_recibida_esperando_comprobante' });
          }

          if (esSinFoto && datosTemp.cedula) {
            const datosPago = { cedula: datosTemp.cedula, comprobante_url: '', fechaPago, telefono: fromPhone };
            const tid = await crearTarjetaCobranzaRest(datosPago);
            await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosPago, tarjeta_id: tid });
            await enviarConfirmacionPago(fromPhone, datosPago);
            return res.status(200).json({ status: 'pago_registrado_sin_foto' });
          }

          await enviarMensajeTexto(fromPhone, '⚠️ Por favor envía la *foto o captura* de tu comprobante con tu número de *Cédula* (ejemplo: *24555666*). Escribe *cancelar* para salir.');
          return res.status(200).json({ status: 'esperando_datos_validos' });
        }
      }

      // ── ESTADO: ESPERANDO_DATOS_SUSCRIPCION ──────────────────────────────────
      if (estadoActual === 'ESPERANDO_DATOS_SUSCRIPCION' && textBody) {
        const datosExtrada = await extraerDatosSuscripcion(textBody, fromPhone);
        const ok = await crearTarjetaVentaOnlineRest(datosExtrada);
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');
        if (ok) {
          await enviarConfirmacionSuscripcion(fromPhone, datosExtrada);
        } else {
          await enviarMensajeTexto(fromPhone, `Gracias *${datosExtrada.nombre}*, recibimos tus datos. Un asesor te contactará en un plazo de 24 a 48 horas.`);
        }
        return res.status(200).json({ status: ok ? 'suscripcion_registrada' : 'suscripcion_fallback' });
      }

      // Si el usuario escribe comandos directos por texto
      const textLower = textBody.toLowerCase();
      if (textLower.includes('suscrib') || textLower.includes('comprar') || textLower === '1') {
        if (enFlujoActivo) await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar la Suscripción.');
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_SUSCRIPCION');
        await enviarInstruccionesSuscripcion(fromPhone);
        return res.status(200).json({ status: 'instrucciones_enviadas' });
      }

      if (textLower.includes('pago') || textLower.includes('pagar') || textLower === '2') {
        if (enFlujoActivo) await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un nuevo Reporte de Pago.');
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_PAGO_DIRECTO');
        await enviarFormularioPago(fromPhone);
        return res.status(200).json({ status: 'formulario_pago_enviado' });
      }

      if (textLower.includes('falla') || textLower.includes('averia') || textLower.includes('avería') || textLower.includes('soporte') || textLower === '3') {
        if (enFlujoActivo) await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un Reporte de Falla.');
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_FALLA');
        await enviarFormularioFalla(fromPhone);
        return res.status(200).json({ status: 'formulario_falla_enviado' });
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
