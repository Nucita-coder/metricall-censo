// Servicio de notificaciones salientes automáticas por WhatsApp Cloud API para eventos de pagos
import { supabase } from '../lib/supabase';

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EABCWkEzhIB0BSVmIhtsFl1mpzi2NdsgR8zjRioYmxmKZCv9ZBpfJPkgqunFGRdOYH7WVAETMQyQXI9N1tn4jnfahZCZCyga34ld1AZBAla866ybZA4IHaZACFUwZBBR2zzuHSvqpSj5brXnvZCMZC6xZBGRqtiaKJz7dQP7MjHH8Klo0xm8ZACUFPyqf9bV86eICUgZDZD';

export interface DatosTarjetaPago {
  datos_valores?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ResultadoNotificacion {
  success: boolean;
  noPhone?: boolean;
  error?: string;
  phoneUsed?: string;
}

/**
 * Normaliza un número telefónico venezolano al formato internacional E.164 (ej: 58412XXXXXXX)
 */
export function normalizarTelefonoVenezuela(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  // Si ya tiene prefijo 58 y longitud completa (ej: 584121234567 -> 12 dígitos)
  if (digits.startsWith('58') && digits.length >= 12) {
    return digits;
  }

  // Si empieza por 0 (ej: 04121234567 -> 11 dígitos)
  if (digits.startsWith('0') && digits.length === 11) {
    return '58' + digits.slice(1);
  }

  // Si empieza con 4 y tiene 10 dígitos (ej: 4121234567)
  if (digits.startsWith('4') && digits.length === 10) {
    return '58' + digits;
  }

  // Fallback con prefijo 58 si tiene al menos 10 dígitos
  if (digits.length >= 10 && !digits.startsWith('58')) {
    return '58' + digits;
  }

  return digits.length >= 10 ? digits : null;
}

/**
 * Envía un mensaje de texto plano a través de Meta WhatsApp Cloud API y registra el log
 */
async function enviarMensajeWhatsAppAPI(toPhone: string, mensajeTexto: string): Promise<boolean> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { body: mensajeTexto },
      }),
    });

    const data = (await res.json()) as { messages?: Array<{ id: string }>; error?: unknown };
    const success = !!data?.messages?.[0]?.id;

    await supabase.from('whatsapp_webhook_logs').insert({
      tipo: success ? 'outgoing' : 'error',
      numero_telefono: toPhone,
      mensaje_texto: mensajeTexto,
      contenido: (data as Record<string, unknown>) || {},
    });

    return success;
  } catch (err: unknown) {
    console.error('[WHATSAPP NOTIFICACION ERROR]:', err);
    await supabase.from('whatsapp_webhook_logs').insert({
      tipo: 'error',
      numero_telefono: toPhone,
      mensaje_texto: mensajeTexto,
      contenido: { error: String(err) },
    });
    return false;
  }
}

/**
 * Notifica al cliente por WhatsApp cuando su pago fue procesado exitosamente
 */
export async function notificarPagoProcesado(tarjeta: DatosTarjetaPago): Promise<ResultadoNotificacion> {
  const datos = tarjeta.datos_valores || {};
  const rawPhone = String(datos.telefonoMovil || datos.telefono || datos['TELEFONO'] || datos['telefono_movil'] || '');
  const cleanPhone = normalizarTelefonoVenezuela(rawPhone);

  if (!cleanPhone) {
    return { success: false, noPhone: true };
  }

  const nombre = String(datos.nombreApellido || datos.nombre || 'Cliente').trim();
  const referencia = String(datos.referencia || datos.nroReferencia || 'S/N').trim();
  const monto = String(datos.montoPago || datos.monto || '').trim();
  const banco = String(datos.bancoOrigen || datos.banco || '').trim();

  let detalles = `📋 *Referencia:* ${referencia}\n`;
  if (monto) detalles += `💵 *Monto:* ${monto}\n`;
  if (banco) detalles += `🏦 *Banco:* ${banco}\n`;

  const mensaje =
    `✅ *PAGO PROCESADO CON ÉXITO*\n\n` +
    `Estimado(a) *${nombre}*, le confirmamos que su reporte de pago ha sido verificado y procesado satisfactoriamente en nuestro sistema.\n\n` +
    detalles + '\n' +
    `¡Gracias por preferirnos! 🚀\n` +
    `*Fibex Telecom Anaco*`;

  const sent = await enviarMensajeWhatsAppAPI(cleanPhone, mensaje);
  return {
    success: sent,
    phoneUsed: cleanPhone,
    error: sent ? undefined : 'No se pudo entregar el mensaje a través de WhatsApp Cloud API',
  };
}

/**
 * Notifica al cliente por WhatsApp cuando su reporte de pago fue rechazado
 */
export async function notificarPagoRechazado(
  tarjeta: DatosTarjetaPago,
  motivoPersonalizado?: string
): Promise<ResultadoNotificacion> {
  const datos = tarjeta.datos_valores || {};
  const rawPhone = String(datos.telefonoMovil || datos.telefono || datos['TELEFONO'] || datos['telefono_movil'] || '');
  const cleanPhone = normalizarTelefonoVenezuela(rawPhone);

  if (!cleanPhone) {
    return { success: false, noPhone: true };
  }

  const nombre = String(datos.nombreApellido || datos.nombre || 'Cliente').trim();
  const referencia = String(datos.referencia || datos.nroReferencia || 'S/N').trim();
  const motivoTexto =
    motivoPersonalizado?.trim() ||
    'No se pudo verificar la transacción con los datos bancarios suministrados o el comprobante adjunto.';

  const mensaje =
    `⚠️ *REPORTE DE PAGO NO PROCESADO*\n\n` +
    `Estimado(a) *${nombre}*, le informamos que su reporte de pago con referencia *${referencia}* no pudo ser validado.\n\n` +
    `📌 *Causa:* ${motivoTexto}\n\n` +
    `Por favor, vuelva a enviar los datos y comprobante de su pago con la corrección indicada para procesar su solicitud.\n\n` +
    `*Fibex Telecom Anaco*`;

  const sent = await enviarMensajeWhatsAppAPI(cleanPhone, mensaje);

  // Resetear la sesión de WhatsApp del cliente para que pueda reportar de nuevo inmediatamente
  try {
    await supabase
      .from('whatsapp_sesiones')
      .upsert({
        numero_telefono: cleanPhone,
        estado: 'INICIO',
        datos_temporales: {},
        updated_at: new Date().toISOString(),
      });
  } catch {
    // Ignorar si no existe tabla o falla de red
  }

  return {
    success: sent,
    phoneUsed: cleanPhone,
    error: sent ? undefined : 'No se pudo entregar el mensaje a través de WhatsApp Cloud API',
  };
}
