// api/services/whatsappFlujoFactura.js
// Submódulo para orquestar la consulta y envío de facturas / avisos de cobro en PDF oficial de Fibex Telecom vía WhatsApp

import { saeplusService } from './saeplus.js';
import {
  enviarMensajeTexto,
  actualizarEstadoSesionRest,
  enviarMenuPrincipal
} from './whatsapp.js';
import { enviarDocumentoWhatsApp } from './whatsappMedia.js';
import { insertarLog } from './logger.js';

// Inicia el flujo de consulta de factura solicitando la cédula al cliente
export async function iniciarFlujoFactura(fromPhone, enFlujoActivo = false) {
  if (enFlujoActivo) {
    await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para consultar tu Factura.');
  }

  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_FACTURA', {});

  const texto =
`📄 *CONSULTA DE FACTURA / AVISO DE COBRO*

Por favor escribe tu número de *Cédula de Identidad* (solo números, ejemplo: *8693154*) para descargar tu última factura emitida:`;

  await enviarMensajeTexto(fromPhone, texto);
  await insertarLog({
    tipo: 'outgoing',
    numero_telefono: fromPhone,
    mensaje_texto: 'Solicitud de cédula para factura enviada'
  });
}

// Procesa la cédula, busca la factura en SAEplus, descarga el PDF y lo envía al usuario
export async function procesarCedulaFactura(fromPhone, textBody, sesion) {
  const matchCedula = textBody.match(/(?:[VvEeJjPp]-?)?(\d{5,9})/);
  if (!matchCedula) {
    await enviarMensajeTexto(
      fromPhone,
      '⚠️ No reconocimos un número de cédula válido. Por favor escribe solo tu número de *Cédula de Identidad* (ejemplo: *8693154*):'
    );
    return;
  }

  const cedula = matchCedula[1];
  await enviarMensajeTexto(fromPhone, `🔎 Buscando última factura emitida para la cédula *${cedula}*...`);

  try {
    const factura = await saeplusService.consultarUltimaFactura(cedula);

    if (!factura || !factura.idPago || !factura.archivoFormatoFactura) {
      await enviarMensajeTexto(
        fromPhone,
        `📄 No encontramos facturas o avisos de cobro disponibles en el sistema para la cédula *${cedula}*.\n\nSi tu contrato es muy reciente o requieres soporte personalizado, nuestro equipo de atención con gusto te asistirá.`
      );
      await actualizarEstadoSesionRest(fromPhone, 'INICIO');
      await enviarMenuPrincipal(fromPhone);
      return;
    }

    // 1. Enviar resumen informativo al cliente
    const resumen =
`📄 *FACTURA EMITIDA ENCONTRADA*

👤 *Abonado:* ${factura.cliente || 'CLIENTE'}
📄 *Nro. de Factura:* ${factura.nroFactura}
📅 *Fecha de Emisión:* ${factura.fechaEmision}
📝 *Concepto:* ${factura.concepto}
💵 *Monto:* $${factura.monto} USD
📑 *Contrato:* ${factura.nroContrato}

⏳ Generando y enviando tu archivo PDF oficial de Fibex Telecom...`;

    await enviarMensajeTexto(fromPhone, resumen);

    // 2. Descargar el archivo binario PDF oficial desde SAEplus
    const pdfBuffer = await saeplusService.descargarFacturaPdf(
      factura.idPago,
      factura.archivoFormatoFactura
    );

    // 3. Enviar el documento directamente a WhatsApp mediante Meta Media API
    const filename = `Factura_Fibex_${factura.nroFactura}.pdf`;
    const caption = `Factura Oficial Fibex Telecom - Nro. ${factura.nroFactura}`;
    const enviado = await enviarDocumentoWhatsApp(fromPhone, pdfBuffer, filename, caption);

    if (enviado) {
      await enviarMensajeTexto(
        fromPhone,
        `✅ *Factura enviada con éxito.*\n\nPuedes abrir o guardar el documento PDF directamente en tu teléfono.\n\n_Fibex Telecom, sede Anaco_`
      );
    } else {
      await enviarMensajeTexto(
        fromPhone,
        `⚠️ Tuvimos un inconveniente al transferir el archivo PDF a WhatsApp. Por favor intenta de nuevo en unos minutos.`
      );
    }

    await actualizarEstadoSesionRest(fromPhone, 'INICIO');
  } catch (err) {
    console.error('[PROCESAR FACTURA ERROR]:', err);
    await enviarMensajeTexto(
      fromPhone,
      '⚠️ Ocurrió un error al procesar tu factura en el sistema. Por favor intenta nuevamente.'
    );
    await actualizarEstadoSesionRest(fromPhone, 'INICIO');
  }
}

// Envío directo cuando ya se cuenta con la cédula en sesión (ej. desde el reporte de pago)
export async function enviarFacturaDirectaPorCedula(fromPhone, cedula) {
  return await procesarCedulaFactura(fromPhone, cedula, {});
}
