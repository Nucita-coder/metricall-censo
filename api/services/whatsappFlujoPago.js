// api/services/whatsappFlujoPago.js
// Submódulo para orquestar el flujo de consulta de deuda en SAEPLUS y reporte de pago vía WhatsApp

import { saeplusService } from './saeplus.js';
import {
  enviarMensajeTexto,
  actualizarEstadoSesionRest,
  crearTarjetaCobranzaRest,
  procesarImagenWhatsApp
} from './whatsapp.js';
import { insertarLog } from './logger.js';

const getFechaHoy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Inicia el flujo de reporte solicitando la cédula al cliente
export async function iniciarFlujoReportePago(fromPhone, enFlujoActivo = false) {
  if (enFlujoActivo) {
    await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar tu Reporte de Pago.');
  }

  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_PAGO', {
    fechaPago: getFechaHoy()
  });

  const texto =
`💰 *REPORTE DE PAGO*

Por favor escribe tu número de *Cédula de Identidad* (solo números, ejemplo: *8693154*) para verificar tu contrato y saldo adeudado:`;

  await enviarMensajeTexto(fromPhone, texto);
  await insertarLog({
    tipo: 'outgoing',
    numero_telefono: fromPhone,
    mensaje_texto: 'Solicitud de cédula para reporte de pago enviada'
  });
}

// Procesa la cédula enviada, consulta SAEPLUS y responde con nombre, contrato, estatus y saldo
export async function procesarCedulaReportePago(fromPhone, textBody, sesion) {
  const matchCedula = textBody.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
  if (!matchCedula) {
    await enviarMensajeTexto(
      fromPhone,
      '⚠️ No reconocimos un número de cédula válido. Por favor escribe solo tu número de *Cédula de Identidad* (ejemplo: *8693154*):'
    );
    return;
  }

  const cedula = matchCedula[1];
  const datosTemp = sesion.datos_temporales || {};
  const fechaPago = datosTemp.fechaPago || getFechaHoy();

  await enviarMensajeTexto(fromPhone, `🔎 Consultando datos para la cédula *${cedula}*...`);

  try {
    const contratos = await saeplusService.consultarAbonadoPorCedula(cedula);

    if (contratos && contratos.length > 0) {
      if (contratos.length === 1) {
        const c = contratos[0];
        const nuevoTemp = {
          ...datosTemp,
          cedula: c.cedula,
          nombre: c.nombreCompleto,
          nroContrato: c.nroContrato,
          estatus: c.estatus,
          saldo: c.saldoPendienteUsd,
          plan: c.plan,
          fechaPago
        };

        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE_PAGO', nuevoTemp);

        const respuesta =
`👤 *Abonado:* ${c.nombreCompleto}
📄 *Nro. de Contrato:* ${c.nroContrato} (${c.plan})
📊 *Estatus:* ${c.estatus}
💵 *Saldo Pendiente:* $${c.saldoPendienteUsd} USD

📸 Por favor adjunta la *foto o captura del comprobante de pago* para ser procesado.`;

        await enviarMensajeTexto(fromPhone, respuesta);
      } else {
        // Múltiples contratos
        const principal = contratos[0];
        let detalleContratos = '';
        let sumaTotal = 0;

        contratos.forEach((c, idx) => {
          const saldoNum = parseFloat(c.saldoPendienteUsd) || 0;
          sumaTotal += saldoNum;
          detalleContratos += `\n${idx + 1}️⃣ *Contrato ${c.nroContrato}* (${c.plan})\n   • Estatus: ${c.estatus}\n   • Saldo: $${c.saldoPendienteUsd} USD\n`;
        });

        const nuevoTemp = {
          ...datosTemp,
          cedula: principal.cedula,
          nombre: principal.nombreCompleto,
          nroContrato: contratos.map(c => c.nroContrato).join(', '),
          estatus: principal.estatus,
          saldo: sumaTotal.toFixed(2),
          plan: principal.plan,
          fechaPago
        };

        await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE_PAGO', nuevoTemp);

        const respuesta =
`👤 *Abonado:* ${principal.nombreCompleto}
Hemos encontrado *${contratos.length} contratos* asociados a tu cédula:
${detalleContratos}
💵 *Total Saldo Adeudado:* $${sumaTotal.toFixed(2)} USD

📸 Por favor adjunta la *foto o captura del comprobante de pago* para ser procesado.`;

        await enviarMensajeTexto(fromPhone, respuesta);
      }
    } else {
      // No encontrado en SAEPLUS
      const nuevoTemp = { ...datosTemp, cedula, fechaPago };
      await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE_PAGO', nuevoTemp);

      const respuesta =
`⚠️ No encontramos contratos activos con la cédula *${cedula}* en el sistema.

Si estás seguro de tu número, por favor envía la *foto o captura de tu comprobante de pago* directamente para que un asesor valide tu cuenta:`;

      await enviarMensajeTexto(fromPhone, respuesta);
    }
  } catch (err) {
    console.error('[SAEPLUS ERROR EN BOT]:', err);
    const nuevoTemp = { ...datosTemp, cedula, fechaPago };
    await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_COMPROBANTE_PAGO', nuevoTemp);

    await enviarMensajeTexto(
      fromPhone,
      `Cédula *${cedula}* registrada.\n\nPor favor envía la *foto o captura de tu comprobante de pago* para procesar tu solicitud:`
    );
  }
}

// Procesa el comprobante de pago recibido (imagen o sin foto)
export async function procesarComprobantePago(fromPhone, message, sesion) {
  const datosTemp = sesion.datos_temporales || {};
  const fechaPago = datosTemp.fechaPago || getFechaHoy();
  const messageType = message.type;

  if (messageType === 'image' && message.image?.id) {
    const comprobanteUrl = await procesarImagenWhatsApp(message.image.id, fromPhone);
    const caption = (message.image.caption || '').trim();
    const matchCedula = caption.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
    const cedula = datosTemp.cedula || (matchCedula ? matchCedula[1] : '');

    const datosPago = {
      cedula,
      nombre: datosTemp.nombre || '',
      monto: datosTemp.saldo || '',
      referencia: datosTemp.nroContrato || '',
      comprobante_url: comprobanteUrl || '',
      fechaPago,
      telefono: fromPhone
    };

    const tid = await crearTarjetaCobranzaRest(datosPago);
    await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosPago, tarjeta_id: tid });

    const msgConfirmacion =
`✅ *¡Comprobante de Pago Recibido!*

👤 *Abonado:* ${datosTemp.nombre || 'Cliente'}
📄 *Contrato:* ${datosTemp.nroContrato || 'Registrado'}
💵 *Monto reportado:* $${datosTemp.saldo || '0.00'} USD

Tu pago está en proceso de aprobación y prontamente se te estará dando respuesta.

¡Muchas gracias por preferirnos!
_Fibex Telecom Anaco_`;

    await enviarMensajeTexto(fromPhone, msgConfirmacion);
    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: fromPhone,
      mensaje_texto: `Pago completado para ${datosPago.nombre || datosPago.cedula}`
    });
    return true;
  }

  const textBody = (message.text?.body || '').trim().toLowerCase();
  if (textBody.includes('sin foto') || textBody.includes('no tengo')) {
    const datosPago = {
      cedula: datosTemp.cedula || '',
      nombre: datosTemp.nombre || '',
      monto: datosTemp.saldo || '',
      referencia: datosTemp.nroContrato || '',
      comprobante_url: '',
      fechaPago,
      telefono: fromPhone
    };

    const tid = await crearTarjetaCobranzaRest(datosPago);
    await actualizarEstadoSesionRest(fromPhone, 'INICIO', { ...datosPago, tarjeta_id: tid });

    await enviarMensajeTexto(
      fromPhone,
      '✅ Tu reporte ha sido recibido y está en proceso de aprobación. Prontamente se te estará dando respuesta.\n\n¡Muchas gracias por preferirnos!\n_Fibex Telecom Anaco_'
    );
    return true;
  }

  await enviarMensajeTexto(
    fromPhone,
    '📸 Por favor envía la *foto o captura* de tu comprobante de pago. Escribe *cancelar* si deseas salir.'
  );
  return false;
}
