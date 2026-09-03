import { supabase } from '../../lib/supabase';
import { WhatsAppContacto, WhatsAppMensaje } from './types';

/**
 * Carga contactos desde whatsapp_contactos o con fallback automático desde whatsapp_webhook_logs
 */
export async function fetchContactosConFallback(): Promise<WhatsAppContacto[]> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_contactos')
      .select('*')
      .order('ultimo_contacto', { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as unknown as WhatsAppContacto[]) || [];
    }

    // Fallback: derivar contactos desde whatsapp_webhook_logs agrupados por teléfono
    const { data: logsData } = await supabase
      .from('whatsapp_webhook_logs')
      .select('numero_telefono, mensaje_texto, tipo, contenido, created_at')
      .not('numero_telefono', 'is', null)
      .order('created_at', { ascending: false })
      .limit(400);

    if (!logsData || logsData.length === 0) return [];

    const mapa = new Map<string, WhatsAppContacto>();

    for (const row of logsData) {
      const tel = (row.numero_telefono || '').replace(/\D/g, '');
      if (!tel) continue;

      let nombreExtraido = '';
      const cont = row.contenido as Record<string, unknown> | undefined;
      if (cont) {
        const entry = (cont.entry as unknown[])?.[0] as Record<string, unknown> | undefined;
        const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown> | undefined;
        const val = changes?.value as Record<string, unknown> | undefined;
        const contacts = val?.contacts as Record<string, unknown>[] | undefined;
        nombreExtraido = ((contacts?.[0]?.profile as Record<string, unknown> | undefined)?.name as string) || '';
      }

      if (!mapa.has(tel)) {
        mapa.set(tel, {
          numero_telefono: tel,
          nombre: nombreExtraido || `Usuario ${tel.slice(-4)}`,
          bloqueado: row.tipo === 'blocked',
          total_mensajes: 1,
          ultimo_mensaje: row.mensaje_texto || 'Mensaje registrado',
          primer_contacto: row.created_at,
          ultimo_contacto: row.created_at,
        });
      } else {
        const existente = mapa.get(tel)!;
        existente.total_mensajes += 1;
        if (row.tipo === 'blocked') existente.bloqueado = true;
        if (existente.nombre.startsWith('Usuario') && nombreExtraido) {
          existente.nombre = nombreExtraido;
        }
        if (new Date(row.created_at) < new Date(existente.primer_contacto)) {
          existente.primer_contacto = row.created_at;
        }
      }
    }

    return Array.from(mapa.values());
  } catch (err) {
    console.warn('Error al cargar contactos:', err);
    return [];
  }
}

/**
 * Carga el historial de mensajes de un contacto específico
 */
export async function fetchMensajesContacto(telefono: string): Promise<WhatsAppMensaje[]> {
  try {
    const cleanPhone = telefono.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('whatsapp_webhook_logs')
      .select('id, tipo, numero_telefono, mensaje_texto, contenido, created_at')
      .eq('numero_telefono', cleanPhone)
      .order('created_at', { ascending: true })
      .limit(250);

    if (error) {
      console.warn('Error al cargar mensajes:', error.message);
      return [];
    }
    return (data as unknown as WhatsAppMensaje[]) || [];
  } catch (err) {
    console.warn('Excepción al cargar mensajes:', err);
    return [];
  }
}

/**
 * Actualiza el estatus de bloqueo en la base de datos y registra el evento
 */
export async function toggleBloqueoContacto(
  telefono: string,
  nombre: string,
  nuevoEstado: boolean
): Promise<void> {
  const phone = telefono.replace(/\D/g, '');

  // 1. Intentar actualizar whatsapp_contactos si la tabla existe
  try {
    await supabase
      .from('whatsapp_contactos')
      .upsert({
        numero_telefono: phone,
        nombre,
        bloqueado: nuevoEstado,
        ultimo_contacto: new Date().toISOString(),
      });
  } catch {
    // Ignorar si la tabla aún no existe en Supabase
  }

  // 2. Registrar evento en whatsapp_webhook_logs
  await supabase.from('whatsapp_webhook_logs').insert({
    tipo: nuevoEstado ? 'blocked' : 'sistema',
    numero_telefono: phone,
    mensaje_texto: `Usuario ${nombre} ${nuevoEstado ? 'BLOQUEADO' : 'DESBLOQUEADO'} por Developer`,
    contenido: { accion: nuevoEstado ? 'bloqueo' : 'desbloqueo', moderador: 'developer' },
  });
}
