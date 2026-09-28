// api/notificar_pago.js
// Endpoint Serverless en Vercel para despacho automático de confirmación de pago y envío de comprobante oficial (Copia de Recibo) en PDF vía WhatsApp

import { obtenerDatosReciboFiscal } from './_services/reciboFiscalService.js';
import { generarReciboPagoPdf } from './_services/reciboPdfService.js';
import { enviarDocumentoWhatsApp } from './_services/whatsappMedia.js';
import { getCredentials, apiPost } from './_services/whatsappMessages.js';
import { insertarLog } from './_services/logger.js';

export default async function handler(req, res) {
  // CORS para permitir peticiones desde la app web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Solo se admite POST.' });
  }

  try {
    const { phone, tarjeta } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Número de teléfono requerido' });
    }

    const { accessToken, phoneNumberId } = getCredentials();
    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({ error: 'Credenciales de WhatsApp no configuradas en el servidor' });
    }

    const datos = tarjeta?.datos_valores || tarjeta || {};

    // 1. Extraer cédula de cualquier campo posible
    let rawCedula = String(
      datos.documentoIdentidad ||
      datos.cedula ||
      datos.cedulaRif ||
      datos.nroAbonado ||
      datos.cedula_cliente ||
      datos.cedulaIdentidad ||
      datos.ci ||
      datos['CEDULA'] ||
      datos['Cédula'] ||
      tarjeta?.cedula ||
      ''
    ).replace(/\D/g, '').trim();

    // Fallback: Buscar patrón de cédula de 5 a 9 dígitos en título o nombre
    if (!rawCedula || rawCedula.length < 5) {
      const matchCedula =
        String(datos.nombreApellido || '').match(/\b(\d{5,9})\b/) ||
        String(tarjeta?.titulo || '').match(/\b(\d{5,9})\b/);
      if (matchCedula) rawCedula = matchCedula[1];
    }

    // 2. Extraer número de contrato o referencia técnica
    let rawContrato = String(
      datos.nroContrato ||
      datos.contrato ||
      datos.numero_contrato ||
      datos.nro_contrato ||
      datos['CONTRATO'] ||
      ''
    ).trim();

    if (rawContrato && rawContrato.length > 15) {
      rawContrato = '';
    }

    // 3. Obtener los datos del comprobante fiscal oficial en Bolívares (desde SAEplus o tarjeta)
    let datosRecibo = null;
    let pdfBuffer = null;
    let facturaEnviada = false;
    let nroRecibo = null;

    try {
      datosRecibo = await obtenerDatosReciboFiscal({
        cedula: rawCedula,
        nroContrato: rawContrato,
        tarjeta
      });

      if (datosRecibo) {
        nroRecibo = datosRecibo.nroRecibo;
        pdfBuffer = await generarReciboPagoPdf(datosRecibo);
      }
    } catch (errRecibo) {
      console.error('[NOTIFICAR PAGO] Error estructurando o generando recibo PDF:', errRecibo);
      await insertarLog({
        tipo: 'error',
        numero_telefono: phone,
        mensaje_texto: `Fallo al generar comprobante de pago PDF (cédula: ${rawCedula || 'N/A'}): ${errRecibo.message}`
      });
    }

    // 4. Formatear nombre del cliente con cortesía profesional
    let nombre = String(datos.nombreCliente || datos.nombreApellido || datos.nombre || '').trim();
    if (!nombre || /^pago(\s*\([^)]*\))?$/i.test(nombre) || /^\d+$/.test(nombre)) {
      if (datosRecibo?.cliente) {
        nombre = datosRecibo.cliente
          .toLowerCase()
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      } else {
        nombre = 'Cliente';
      }
    }

    const referencia = String(datos.referencia || datos.nroReferencia || nroRecibo || 'S/N').trim();
    const montoBsTexto = datosRecibo?.totalPagoBs || (datos.montoPago ? `Bs. ${datos.montoPago}` : '');
    const formaPagoTexto = datosRecibo?.formasPago?.[0]?.tipo || datos.bancoOrigen || datos.banco || 'Pago Móvil / Transferencia';

    let detalles = `📋 *Nro. de Recibo:* ${nroRecibo || 'S/N'}\n`;
    if (referencia && referencia !== nroRecibo) detalles += `🔢 *Referencia:* ${referencia}\n`;
    if (montoBsTexto) detalles += `💵 *Monto:* ${montoBsTexto}\n`;
    if (formaPagoTexto) detalles += `💳 *Forma de Pago:* ${formaPagoTexto}\n`;

    const mensajeTexto =
      `✅ *PAGO PROCESADO CON ÉXITO*\n\n` +
      `Estimado(a) *${nombre}*, le confirmamos que su reporte de pago ha sido verificado y procesado satisfactoriamente en nuestro sistema.\n\n` +
      detalles + '\n' +
      (pdfBuffer
        ? `Adjunto a este mensaje encontrará su comprobante oficial de pago (Copia de Recibo) en formato PDF.\n\n`
        : `Su pago ha sido registrado y acreditado satisfactoriamente en su estado de cuenta.\n\n`) +
      `¡Gracias por preferirnos!\n` +
      `_Fibex Telecom Anaco_`;

    // 5. Enviar mensaje de texto de confirmación vía WhatsApp
    const resTexto = await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { body: mensajeTexto }
    });

    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: phone,
      mensaje_texto: `Confirmación de pago procesado enviada a ${nombre} (recibo: ${nroRecibo})`,
      contenido: { resTexto, nroRecibo }
    });

    // 6. Enviar documento PDF oficial vía WhatsApp
    if (pdfBuffer && nroRecibo) {
      try {
        const filename = `Recibo_Fibex_${nroRecibo}.pdf`;
        const caption = `Comprobante Oficial Fibex Telecom - Recibo Nro. ${nroRecibo}`;
        facturaEnviada = await enviarDocumentoWhatsApp(phone, pdfBuffer, filename, caption);
      } catch (errSendPdf) {
        console.error('[NOTIFICAR PAGO] Error enviando recibo PDF por WhatsApp:', errSendPdf);
      }
    }

    return res.status(200).json({
      success: true,
      mensajeEnviado: !!(resTexto && !resTexto.error),
      facturaEnviada,
      nroRecibo,
      nroFactura: nroRecibo
    });

  } catch (err) {
    console.error('[NOTIFICAR PAGO EXCEPTION]:', err);
    return res.status(500).json({ error: err.message });
  }
}
