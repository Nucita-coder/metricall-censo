// api/services/whatsappMedia.js
// Submódulo para gestión y envío de archivos multimedia (documentos PDF, imágenes) vía Meta WhatsApp Cloud API

import { getCredentials, apiPost } from './whatsappMessages.js';
import { insertarLog } from './logger.js';

// Sube un archivo binario directamente a los servidores de Meta Graph API
export async function subirMediaWhatsApp(buffer, mimeType = 'application/pdf', filename = 'documento.pdf') {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken || !phoneNumberId) {
    console.error('[WHATSAPP MEDIA ERROR]: Credenciales de WhatsApp no configuradas');
    return null;
  }

  try {
    const blob = new Blob([buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[WHATSAPP MEDIA UPLOAD ERROR]:', res.status, errText);
      return null;
    }

    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error('[WHATSAPP MEDIA EXCEPTION]:', err);
    return null;
  }
}

// Envía un documento PDF directamente al chat del cliente utilizando Meta Cloud API
export async function enviarDocumentoWhatsApp(toPhone, bufferPdf, filename = 'Factura_Fibex.pdf', caption = '') {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken || !phoneNumberId) {
    console.error('[WHATSAPP DOC ERROR]: Token o Phone ID no configurado');
    return false;
  }

  try {
    // 1. Subir binario a Meta para obtener mediaId
    const mediaId = await subirMediaWhatsApp(bufferPdf, 'application/pdf', filename);
    if (!mediaId) {
      console.error('[WHATSAPP DOC ERROR]: No se pudo obtener mediaId para el documento');
      return false;
    }

    // 2. Enviar mensaje de tipo document
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'document',
      document: {
        id: mediaId,
        filename: filename,
        caption: caption
      }
    };

    const res = await apiPost(phoneNumberId, accessToken, payload);
    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: toPhone,
      mensaje_texto: `Documento PDF enviado: ${filename}`,
      contenido: { mediaId, caption, res }
    });

    return !!(res && !res.error);
  } catch (err) {
    console.error('[WHATSAPP DOC SEND EXCEPTION]:', err);
    return false;
  }
}
