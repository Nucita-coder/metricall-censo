// api/notificar_pago.js
// Endpoint Serverless en Vercel para despacho automático de confirmación de pago y envío de factura en PDF vía WhatsApp

import { saeplusService } from './_services/saeplus.js';
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
    const nombre = String(datos.nombreApellido || datos.nombre || 'Cliente').trim();
    const referencia = String(datos.referencia || datos.nroReferencia || 'S/N').trim();
    const monto = String(datos.montoPago || datos.monto || '').trim();
    const banco = String(datos.bancoOrigen || datos.banco || '').trim();

    let detalles = `📋 *Referencia:* ${referencia}\n`;
    if (monto) detalles += `💵 *Monto:* ${monto}\n`;
    if (banco) detalles += `🏦 *Banco:* ${banco}\n`;

    const mensajeTexto =
      `✅ *PAGO PROCESADO CON ÉXITO*\n\n` +
      `Estimado(a) *${nombre}*, le confirmamos que su reporte de pago ha sido verificado y procesado satisfactoriamente en nuestro sistema.\n\n` +
      detalles + '\n' +
      `Adjunto a este mensaje encontrará su factura / aviso de cobro oficial en formato PDF.\n\n` +
      `¡Gracias por preferirnos!\n` +
      `_Fibex Telecom Anaco_`;

    // 1. Enviar mensaje de texto de confirmación
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
      mensaje_texto: `Confirmación de pago procesado enviada: ref ${referencia}`,
      contenido: { resTexto }
    });

    // 2. Extraer cédula para buscar y enviar la factura oficial de SAEplus
    const rawCedula = String(
      datos.cedula ||
      datos.cedulaRif ||
      datos['CEDULA'] ||
      datos['Cédula'] ||
      datos.cedula_cliente ||
      ''
    ).replace(/\D/g, '').trim();

    let facturaEnviada = false;
    let nroFactura = null;

    if (rawCedula) {
      try {
        const factura = await saeplusService.consultarUltimaFactura(rawCedula);
        if (factura && factura.idPago && factura.archivoFormatoFactura) {
          const pdfBuffer = await saeplusService.descargarFacturaPdf(
            factura.idPago,
            factura.archivoFormatoFactura
          );

          const filename = `Factura_Fibex_${factura.nroFactura}.pdf`;
          const caption = `Factura Oficial Fibex Telecom - Nro. ${factura.nroFactura}`;
          facturaEnviada = await enviarDocumentoWhatsApp(phone, pdfBuffer, filename, caption);
          nroFactura = factura.nroFactura;
        }
      } catch (errFactura) {
        console.error('[NOTIFICAR PAGO] Error obteniendo o enviando factura PDF:', errFactura);
        await insertarLog({
          tipo: 'error',
          numero_telefono: phone,
          mensaje_texto: `Fallo al adjuntar factura PDF para cédula ${rawCedula}: ${errFactura.message}`
        });
      }
    }

    return res.status(200).json({
      success: true,
      mensajeEnviado: !!(resTexto && !resTexto.error),
      facturaEnviada,
      nroFactura
    });

  } catch (err) {
    console.error('[NOTIFICAR PAGO EXCEPTION]:', err);
    return res.status(500).json({ error: err.message });
  }
}
