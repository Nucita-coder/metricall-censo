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
    console.log('[CREAR TARJETA] Buscando listas disponibles...');

    // Consulta simple sin JOIN para evitar problemas de RLS/permisos
    const { data: listas, error: fetchError } = await supabase
      .from('listas')
      .select('id, nombre, empresa_id')
      .limit(100);

    console.log('[CREAR TARJETA] Resultado consulta listas:', JSON.stringify({ listas, fetchError }));

    if (fetchError) {
      console.error('[CREAR TARJETA ERROR] Error al consultar listas:', fetchError);
      return false;
    }

    if (!listas || listas.length === 0) {
      console.error('[CREAR TARJETA ERROR] No hay listas registradas en la BD');
      return false;
    }

    const targetLista =
      listas.find((l: any) => (l.nombre || '').toLowerCase().includes('ventas online')) ||
      listas.find((l: any) => (l.nombre || '').toLowerCase().includes('ventas')) ||
      listas[0];

    console.log('[CREAR TARJETA] Lista seleccionada:', JSON.stringify(targetLista));

    const targetListaId = targetLista.id;
    const empresaId = targetLista.empresa_id || null;

    const cardData = {
      lista_id: targetListaId,
      empresa_id: empresaId,
      datos_valores: {
        nombreApellido: datos.nombre,
        sector: datos.sector,
        telefonoMovil: datos.telefono,
        origen: 'WhatsApp Bot',
        fechaVenta: new Date().toISOString().split('T')[0],
      },
    };

    console.log('[CREAR TARJETA] Insertando tarjeta:', JSON.stringify(cardData));

    const { data: tarjetaInsertada, error: insertError } = await supabase
      .from('tarjetas')
      .insert(cardData)
      .select('id')
      .single();

    console.log('[CREAR TARJETA] Resultado inserción:', JSON.stringify({ tarjetaInsertada, insertError }));

    if (insertError) {
      console.error('[CREAR TARJETA ERROR] Error al insertar tarjeta:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CREAR TARJETA EXCEPTION]:', error);
    return false;
  }
}
