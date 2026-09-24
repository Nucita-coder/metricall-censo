import { Linking, Platform } from 'react-native';
import { TarjetaDatosValores } from '../types/kanban';
import { normalizarTelefonoVenezuela } from './whatsappNotificacionesService';

const cleanEmojis = (str: string) =>
  !str
    ? ''
    : str
        .replace(
          /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu,
          ''
        )
        .replace(/\s{2,}/g, ' ')
        .trim();

const toTitleCase = (str: string) =>
  !str ? '' : str.toLowerCase().replace(/(?:^|\s)\S/g, (m) => m.toUpperCase());

const formatCedula = (doc?: string | number) => {
  if (!doc) return '';
  const clean = String(doc).replace(/\D/g, '');
  return clean ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(doc);
};

export const formatMonto = (val?: unknown): string => {
  if (val === undefined || val === null || val === '') return '';
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return `$${String(val)}`;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Genera el mensaje predeterminado de cobranza para WhatsApp
 */
export function generarMensajeCobranza(datos: TarjetaDatosValores): string {
  const nombreRaw = String(datos.nombreApellido || datos.nombre || datos['NOMBRE Y APELLIDO'] || 'Estimado(a) Cliente');
  const nombre = toTitleCase(cleanEmojis(nombreRaw));

  const abonado = String(datos.nroAbonado || datos['NRO SUSCRIPTOR'] || datos.abonado || '').trim();
  const abonadoTxt = abonado ? (abonado.startsWith('#') ? abonado : `#${abonado}`) : '';

  const rawSaldo = datos.saldo ?? datos['SALDO'] ?? datos.monto ?? datos.Monto ?? datos['MONTO'] ?? datos.montoDeuda;
  const saldoTxt = formatMonto(rawSaldo);

  const cedula = String(datos.documentoIdentidad || datos.nroIdentidad || datos['DOC IDENTIDAD'] || '').trim();
  const cedulaTxt = cedula ? formatCedula(cedula) : '';

  let mensaje = `Hola, estimado(a) *${nombre}*, le saludamos del Departamento de Cobranzas de *Metricall*.\n\n`;
  mensaje += `Le contactamos para recordarle que su servicio de internet`;
  if (abonadoTxt) {
    mensaje += ` con número de abonado *${abonadoTxt}*`;
  }
  if (cedulaTxt) {
    mensaje += ` (C.I. *${cedulaTxt}*)`;
  }
  if (saldoTxt) {
    mensaje += ` presenta un saldo pendiente de *${saldoTxt}*.`;
  } else {
    mensaje += ` presenta una factura pendiente por saldar.`;
  }
  mensaje += `\n\nLe invitamos a realizar su pago para mantener su servicio activo y evitar suspensiones.\n\n`;
  mensaje += `Si ya realizó el pago, por favor compártanos el comprobante por este medio para conciliarlo en nuestro sistema.\n\n`;
  mensaje += `¡Muchas gracias por su atención y que tenga un feliz día!`;

  return mensaje;
}

/**
 * Abre el chat de WhatsApp con el cliente y el mensaje predeterminado de cobranza
 */
export async function contactarClientePorWhatsApp(datos: TarjetaDatosValores): Promise<{ success: boolean; error?: string }> {
  const rawPhone = datos.telefonoMovil || datos.nroTelefonoMovil || datos.telefono || datos['TELEFONO'];
  if (!rawPhone) {
    return { success: false, error: 'Esta tarjeta no tiene un número telefónico registrado.' };
  }

  const phoneNorm = normalizarTelefonoVenezuela(String(rawPhone));
  if (!phoneNorm) {
    return { success: false, error: 'El número de teléfono registrado no es válido para WhatsApp.' };
  }

  const mensaje = generarMensajeCobranza(datos);
  const url = `https://wa.me/${phoneNorm}?text=${encodeURIComponent(mensaje)}`;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
        return { success: true };
      }
    }
    await Linking.openURL(url);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'No se pudo abrir WhatsApp en este dispositivo.' };
  }
}
