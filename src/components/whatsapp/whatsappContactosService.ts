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

    // 1. Obtener mapa de identidades desde tarjetas de Metricall
    const identidadesMap = new Map<string, { nombre: string; cedula?: string }>();
    try {
      const { data: tarjetasData } = await supabase
        .from('tarjetas')
        .select('titulo, datos_valores')
        .not('datos_valores', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(300);

      if (tarjetasData && tarjetasData.length > 0) {
        for (const t of tarjetasData) {
          const dv = (t.datos_valores as Record<string, unknown>) || {};
          const rawPhone = String(
            dv.telefonoMovil || dv.telefono || dv.TELEFONO || dv.telefono_movil || ''
          );
          const digits = rawPhone.replace(/\D/g, '');
          const nombreVal = String(
            dv.nombreApellido || dv.nombre || dv.cliente_nombre || t.titulo || ''
          ).trim();
          const cedulaVal = String(dv.cedula || dv.cedulaAbonado || '').trim();

          if (digits.length >= 10 && nombreVal && !nombreVal.toLowerCase().startsWith('cliente pago')) {
            const identidad = { nombre: nombreVal, cedula: cedulaVal || undefined };
            identidadesMap.set(digits, identidad);
            identidadesMap.set(digits.slice(-10), identidad);
            if (digits.startsWith('0')) {
              identidadesMap.set('58' + digits.slice(1), identidad);
            }
          }
        }
      }
    } catch {
      // Continuar con fallback de logs si falla la consulta de tarjetas
    }

    // 2. Fallback: derivar contactos desde whatsapp_webhook_logs agrupados por teléfono
    const { data: logsData } = await supabase
      .from('whatsapp_webhook_logs')
      .select('numero_telefono, mensaje_texto, tipo, contenido, created_at')
      .not('numero_telefono', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!logsData || logsData.length === 0) return [];

    const mapa = new Map<string, WhatsAppContacto>();

    for (const row of logsData) {
      const tel = (row.numero_telefono || '').replace(/\D/g, '');
      if (!tel) continue;

      let nombreExtraido = '';
      let origenNombre = 'defecto';
      const cont = row.contenido as Record<string, unknown> | undefined;

      // Prioridad 1: Nombre real registrado en tarjetas del sistema
      const identidad = identidadesMap.get(tel) || identidadesMap.get(tel.slice(-10));
      if (identidad?.nombre) {
        nombreExtraido = identidad.nombre;
        origenNombre = 'tarjeta';
      }

      // Prioridad 2: Nombre de perfil de WhatsApp en el payload de Meta
      if (!nombreExtraido && cont) {
        if (typeof cont.profileName === 'string' && cont.profileName.trim()) {
          nombreExtraido = cont.profileName.trim();
          origenNombre = 'whatsapp';
        } else if (typeof cont.pushName === 'string' && cont.pushName.trim()) {
          nombreExtraido = cont.pushName.trim();
          origenNombre = 'whatsapp';
        } else {
          const entry = (cont.entry as unknown[])?.[0] as Record<string, unknown> | undefined;
          const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown> | undefined;
          const val = changes?.value as Record<string, unknown> | undefined;
          const contacts = val?.contacts as Record<string, unknown>[] | undefined;
          const push = ((contacts?.[0]?.profile as Record<string, unknown> | undefined)?.name as string) || '';
          if (push.trim()) {
            nombreExtraido = push.trim();
            origenNombre = 'whatsapp';
          }
        }
      }

      const cedulaExtraida = identidad?.cedula || null;

      if (!mapa.has(tel)) {
        mapa.set(tel, {
          numero_telefono: tel,
          nombre: nombreExtraido || `Usuario ${tel.slice(-4)}`,
          cedula: cedulaExtraida,
          origen_nombre: origenNombre,
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
        if (
          (existente.nombre.startsWith('Usuario') || existente.origen_nombre === 'whatsapp') &&
          nombreExtraido &&
          origenNombre === 'tarjeta'
        ) {
          existente.nombre = nombreExtraido;
          existente.cedula = cedulaExtraida;
          existente.origen_nombre = 'tarjeta';
        } else if (existente.nombre.startsWith('Usuario') && nombreExtraido) {
          existente.nombre = nombreExtraido;
          existente.origen_nombre = origenNombre;
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
