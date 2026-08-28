import { supabase } from '../lib/supabase';

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1327272020463323';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EABCWkEzhIB0BSVmIhtsFl1mpzi2NdsgR8zjRioYmxmKZCv9ZBpfJPkgqunFGRdOYH7WVAETMQyQXI9N1tn4jnfahZCZCyga34ld1AZBAla866ybZA4IHaZACFUwZBBR2zzuHSvqpSj5brXnvZCMZC6xZBGRqtiaKJz7dQP7MjHH8Klo0xm8ZACUFPyqf9bV86eICUgZDZD';

export interface SesionWhatsApp {
  numero_telefono: string;
  estado: 'INICIO' | 'ESPERANDO_DATOS_SUSCRIPCION' | string;
  datos_temporales?: any;
}

export async function enviarMensajeTextoWhatsApp(to: string, texto: string): Promise<boolean> {
  const cleanNumber = to.replace(/\D/g, '');
  if (!cleanNumber) return false;

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
        to: cleanNumber,
        type: 'text',
        text: { body: texto },
      }),
    });

    const data = await res.json();

    await supabase.from('whatsapp_webhook_logs').insert({
      tipo: 'outgoing',
      numero_telefono: cleanNumber,
      mensaje_texto: texto,
      contenido: data,
    });

    return !!data?.messages?.[0]?.id;
  } catch (error) {
    console.error('[WHATSAPP API ERROR]:', error);
    await supabase.from('whatsapp_webhook_logs').insert({
      tipo: 'error',
      numero_telefono: cleanNumber,
      mensaje_texto: texto,
      contenido: { error: String(error) },
    });
    return false;
  }
}

export async function obtenerEstadoSesion(numeroTelefono: string): Promise<SesionWhatsApp> {
  const cleanNumber = numeroTelefono.replace(/\D/g, '');
  try {
    const { data } = await supabase
      .from('whatsapp_sesiones')
      .select('*')
      .eq('numero_telefono', cleanNumber)
      .single();

    if (data) return data as SesionWhatsApp;

    const nuevaSesion: SesionWhatsApp = {
      numero_telefono: cleanNumber,
      estado: 'INICIO',
      datos_temporales: {},
    };

    await supabase.from('whatsapp_sesiones').upsert(nuevaSesion);
    return nuevaSesion;
  } catch {
    return { numero_telefono: cleanNumber, estado: 'INICIO', datos_temporales: {} };
  }
}

export async function actualizarEstadoSesion(
  numeroTelefono: string,
  nuevoEstado: string,
  datosTemporales?: any
): Promise<void> {
  const cleanNumber = numeroTelefono.replace(/\D/g, '');
  try {
    await supabase.from('whatsapp_sesiones').upsert({
      numero_telefono: cleanNumber,
      estado: nuevoEstado,
      datos_temporales: datosTemporales || {},
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SESION UPDATE ERROR]:', error);
  }
}

export async function crearTarjetaVentaOnline(datos: {
  nombre: string;
  sector: string;
  telefono: string;
}): Promise<boolean> {
  try {
    // 1. Buscar la lista 'ventas online'
    const { data: listas } = await supabase
      .from('listas')
      .select('id, tablero_id, empresa_id, tableros(nombre, tipo)')
      .ilike('nombre', '%ventas online%')
      .limit(10);

    let targetListaId = listas?.[0]?.id;

    // Buscar preferentemente la lista dentro de un tablero de tipo 'gestion_online' o 'Gestión Online'
    if (listas && listas.length > 0) {
      const matchBoard = listas.find(
        (l: any) =>
          l.tableros?.tipo === 'gestion_online' ||
          (l.tableros?.nombre || '').toLowerCase().includes('gestión online') ||
          (l.tableros?.nombre || '').toLowerCase().includes('gestion online')
      );
      if (matchBoard) {
        targetListaId = matchBoard.id;
      }
    }

    if (!targetListaId) {
      // Fallback: Si no existe aún la lista, buscar cualquier lista del tablero Gestión Online
      const { data: tableros } = await supabase
        .from('tableros')
        .select('id, empresa_id, listas(id, nombre)')
        .or('tipo.eq.gestion_online,nombre.ilike.%gestión online%,nombre.ilike.%gestion online%')
        .limit(1);

      if (tableros?.[0]?.listas?.[0]) {
        targetListaId = tableros[0].listas[0].id;
      }
    }

    if (!targetListaId) {
      console.error('[CREAR TARJETA ERROR]: No se encontró ninguna lista de ventas online.');
      return false;
    }

    const { data: listaActual } = await supabase
      .from('listas')
      .select('empresa_id')
      .eq('id', targetListaId)
      .single();

    const { error: insertError } = await supabase.from('tarjetas').insert({
      lista_id: targetListaId,
      empresa_id: listaActual?.empresa_id || null,
      datos_valores: {
        nombreApellido: datos.nombre,
        sector: datos.sector,
        telefonoMovil: datos.telefono,
        origen: 'WhatsApp Bot',
        fechaVenta: new Date().toISOString().split('T')[0],
      },
    });

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('[CREAR TARJETA EXCEPTION]:', error);
    return false;
  }
}
