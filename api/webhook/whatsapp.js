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
  crearTarjetaFallaRest,
  procesarImagenWhatsApp,
  verificarContactoBloqueado,
  registrarContactoWhatsApp
} from '../services/whatsapp.js';
import { extraerDatosSuscripcion, extraerDatosFalla } from '../services/gemini.js';
import { insertarLog } from '../services/logger.js';

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

      const value   = body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];
      const profileName = contact?.profile?.name || '';
      const fromPhone   = message?.from || contact?.wa_id || null;

      await insertarLog({
        tipo: 'raw_incoming',
        numero_telefono: fromPhone,
        mensaje_texto: 'Evento recibido de Meta',
        contenido: { profileName, ...body }
      });

      if (!message) {
        await insertarLog({ tipo: 'info', numero_telefono: fromPhone, mensaje_texto: 'Evento sin mensaje (status update o notificación)', contenido: value || {} });
        return res.status(200).json({ status: 'no_message' });
      }

      const messageType = message.type;
      const textBody    = (message.text?.body || '').trim();

      // Moderación de seguridad: verificar si el remitente está bloqueado
      const estaBloqueado = await verificarContactoBloqueado(fromPhone);
      if (estaBloqueado) {
        await insertarLog({
          tipo: 'blocked',
          numero_telefono: fromPhone,
          mensaje_texto: `Mensaje bloqueado de usuario suspendido: ${textBody || messageType}`,
          contenido: { fromPhone, profileName, messageType }
        });
        return res.status(200).json({ status: 'contacto_bloqueado' });
      }

      // Registrar o actualizar datos del contacto de forma asíncrona
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
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_PAGO');
          await enviarFormularioPago(fromPhone);

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

          if (datosConFecha.comprobante_url) {
            await crearTarjetaCobranzaRest({ ...datosConFecha, telefono: fromPhone });
            await actualizarEstadoSesionRest(fromPhone, 'INICIO');
            await enviarConfirmacionPago(fromPhone, datosConFecha);
            return res.status(200).json({ status: 'pago_registrado_directo' });
          }

          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE', datosConFecha);
          await enviarSolicitudComprobante(fromPhone, fechaElegida);
          return res.status(200).json({ status: 'fecha_seleccionada_esperando_comprobante' });
        }

        // Selección de tipo de falla técnica
        const label = FALLA_LABELS[itemId] || itemTitle;
        await insertarLog({ tipo: 'button', numero_telefono: fromPhone, mensaje_texto: `Falla seleccionada: ${label}`, contenido: { itemId } });

        const datosCliente = sesion.datos_temporales || {};
        const datosCompletosFalla = {
          ...datosCliente,
          tipoFalla: label
        };

        // Crear la tarjeta de falla en la base de datos para el técnico
        await crearTarjetaFallaRest(datosCompletosFalla);
        await actualizarEstadoSesionRest(fromPhone, 'INICIO');
        await enviarConfirmacionFalla(fromPhone, label, datosCompletosFalla);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Tarjeta de falla creada y confirmada: ${label}` });
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

      // ── ESTADO: CONFIRMANDO_PAGO ─ usuario responde por texto (Sí / No) ─────
      // ── ESTADO: ESPERANDO_CEDULA_PAGO (Paso 1: Cédula / Abonado) ────────────
      if (estadoActual === 'ESPERANDO_CEDULA_PAGO' || estadoActual === 'ESPERANDO_DATOS_PAGO') {
        if (messageType === 'image' && message.image?.id) {
          const comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
          await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_PAGO', { comprobante_url: comprobanteUrl || '' });
          await enviarMensajeTexto(fromPhone, '📸 ¡Captura recibida! Ahora por favor indícanos tu número de *Cédula de Identidad* o *Abonado*:');
          return res.status(200).json({ status: 'comprobante_recibido_esperando_cedula' });
        }

        if (!textBody) return res.status(200).json({ status: 'sin_texto_cedula' });

        const matchCedula = textBody.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
        const cedulaLimpia = matchCedula ? matchCedula[1] : textBody.replace(/\D/g, '');

        if (!cedulaLimpia || cedulaLimpia.length < 5) {
          await enviarMensajeTexto(fromPhone, '⚠️ Por favor envía un número de cédula válido (ejemplo: *24555666*).');
          return res.status(200).json({ status: 'cedula_invalida' });
        }

        const datosActualizados = { ...(sesion.datos_temporales || {}), cedula: cedulaLimpia };
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_FECHA_PAGO', datosActualizados);
        await enviarSelectorFechaPago(fromPhone, cedulaLimpia);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Cédula ${cedulaLimpia} recibida, enviando selector de fecha` });
        return res.status(200).json({ status: 'cedula_recibida_esperando_fecha' });
      }

      // ── ESTADO: ESPERANDO_FECHA_MANUAL o ESPERANDO_FECHA_PAGO (Paso 2: Fecha) ─
      if (estadoActual === 'ESPERANDO_FECHA_MANUAL' || estadoActual === 'ESPERANDO_FECHA_PAGO') {
        if (!textBody) return res.status(200).json({ status: 'sin_texto_fecha' });
        const fechaIngresada = textBody.trim();
        const datosActualizados = { ...(sesion.datos_temporales || {}), fechaPago: fechaIngresada };

        if (datosActualizados.comprobante_url) {
          await crearTarjetaCobranzaRest({ ...datosActualizados, telefono: fromPhone });
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosActualizados);
          return res.status(200).json({ status: 'pago_completado_con_fecha_manual' });
        }

        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE', datosActualizados);
        await enviarSolicitudComprobante(fromPhone, fechaIngresada);
        return res.status(200).json({ status: 'fecha_manual_recibida_esperando_comprobante' });
      }

      // ── ESTADO: ESPERANDO_COMPROBANTE (Paso 3: Foto del Comprobante) ──────────
      if (estadoActual === 'ESPERANDO_COMPROBANTE') {
        const datosTemp = sesion.datos_temporales || {};
        const esSinFoto = textBody.toLowerCase().includes('sin foto') || textBody.toLowerCase().includes('no tengo');

        if ((messageType === 'image' && message.image?.id) || esSinFoto) {
          const comprobanteUrl = (messageType === 'image' && message.image?.id)
            ? await procesarImagenWhatsApp(message.image.id, fromPhone)
            : '';
          const datosFinales = { ...datosTemp, comprobante_url: comprobanteUrl || '', telefono: fromPhone };

          await crearTarjetaCobranzaRest(datosFinales);
          await actualizarEstadoSesionRest(fromPhone, 'INICIO');
          await enviarConfirmacionPago(fromPhone, datosFinales);
          await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: `Pago registrado para CI: ${datosFinales.cedula}` });
          return res.status(200).json({ status: 'pago_registrado_exitoso' });

        } else if (messageType === 'text') {
          await enviarMensajeTexto(fromPhone,
            '📸 Por favor envía la *foto o captura* del comprobante de pago. Si no la tienes, escribe *sin foto*. Escribe *cancelar* para salir.');
          return res.status(200).json({ status: 'esperando_foto' });
        }
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
          await enviarMensajeTexto(fromPhone, `Gracias *${datosExtrada.nombre}*, recibimos tus datos. Un asesor te contactará en un plazo de 24 a 48 horas.`);
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

      // Si el usuario escribe "pago", "pagar", "reportar pago" o "2" desde cualquier estado
      if (textLower.includes('pago') || textLower.includes('pagar') || textLower === '2') {
        if (enFlujoActivo) await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un nuevo Reporte de Pago.');
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_PAGO');
        await enviarFormularioPago(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Formulario de pago enviado por comando de texto' });
        return res.status(200).json({ status: 'formulario_pago_enviado' });
      }

      // Si el usuario escribe "falla", "soporte", "avería" o "3" desde cualquier estado
      if (textLower.includes('falla') || textLower.includes('averia') || textLower.includes('avería') || textLower.includes('soporte') || textLower === '3') {
        if (enFlujoActivo) await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un Reporte de Falla.');
        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_DATOS_FALLA');
        await enviarFormularioFalla(fromPhone);
        await insertarLog({ tipo: 'outgoing', numero_telefono: fromPhone, mensaje_texto: 'Formulario de falla enviado por comando de texto' });
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
