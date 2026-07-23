import { supabase } from '../lib/supabase';

export interface ElementoAdjunto {
  tipo: 'tablero' | 'lista' | 'tarjeta';
  id: string;
  titulo: string;
  detalles?: string;
  tableroId?: string;
  listaId?: string;
}

export interface MensajeGlobal {
  id: string;
  empresa_id: string;
  emisor_id: string;
  receptor_id: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
  tarjeta_id?: string;
  lista_id?: string;
  tablero_id?: string;
  adjunto?: ElementoAdjunto | null;
}

export interface UsuarioConversacion {
  usuario_id: string;
  nombre_completo: string;
  rol?: string;
  ultimo_mensaje: string;
  created_at: string;
  sin_leer: number;
  adjunto?: ElementoAdjunto | null;
}

export interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  rol?: string;
}

export async function obtenerConversaciones(
  currentUserId: string,
  empresaId: string
): Promise<UsuarioConversacion[]> {
  try {
    const { data: msgs, error } = await supabase
      .from('soporte_mensajes')
      .select('id, emisor_id, receptor_id, mensaje, created_at, leido, adjunto, perfiles_emisor:emisor_id(nombre_completo, rol), perfiles_receptor:receptor_id(nombre_completo, rol)')
      .or(`receptor_id.eq.${currentUserId},emisor_id.eq.${currentUserId}`)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!msgs) return [];

    const map = new Map<string, UsuarioConversacion>();
    for (const m of msgs as any[]) {
      const esEmisor = m.emisor_id === currentUserId;
      const otroId = esEmisor ? m.receptor_id : m.emisor_id;
      const perfilOtro = esEmisor ? m.perfiles_receptor : m.perfiles_emisor;
      const nombreOtro = perfilOtro?.nombre_completo || 'Usuario';
      const rolOtro = perfilOtro?.rol || '';

      if (!map.has(otroId)) {
        map.set(otroId, {
          usuario_id: otroId,
          nombre_completo: nombreOtro,
          rol: rolOtro,
          ultimo_mensaje: m.mensaje,
          created_at: m.created_at,
          sin_leer: !m.leido && m.receptor_id === currentUserId ? 1 : 0,
          adjunto: m.adjunto || null,
        });
      } else if (!m.leido && m.receptor_id === currentUserId) {
        const item = map.get(otroId)!;
        item.sin_leer += 1;
      }
    }
    return Array.from(map.values());
  } catch (e: any) {
    console.error('Error al obtener conversaciones:', e.message);
    return [];
  }
}

export async function obtenerMiembrosEmpresa(
  empresaId: string,
  currentUserId: string
): Promise<PerfilUsuario[]> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rol')
      .eq('empresa_id', empresaId)
      .neq('id', currentUserId)
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return (data || []).map((p) => ({
      id: p.id,
      nombre_completo: p.nombre_completo || 'Usuario sin nombre',
      rol: p.rol,
    }));
  } catch (e: any) {
    console.error('Error obteniendo miembros de empresa:', e.message);
    return [];
  }
}

export async function obtenerMensajesChat(
  user1: string,
  user2: string
): Promise<MensajeGlobal[]> {
  try {
    const { data, error } = await supabase
      .from('soporte_mensajes')
      .select('*')
      .or(`and(emisor_id.eq.${user1},receptor_id.eq.${user2}),and(emisor_id.eq.${user2},receptor_id.eq.${user1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MensajeGlobal[];
  } catch (e: any) {
    console.error('Error al obtener mensajes:', e.message);
    return [];
  }
}

export async function marcarMensajesLeidos(currentUserId: string, emisorId: string): Promise<void> {
  try {
    await supabase
      .from('soporte_mensajes')
      .update({ leido: true })
      .eq('receptor_id', currentUserId)
      .eq('emisor_id', emisorId)
      .eq('leido', false);
  } catch (e: any) {
    console.error('Error marcando leídos:', e.message);
  }
}

export async function enviarMensaje(
  empresaId: string,
  emisorId: string,
  receptorId: string,
  texto: string,
  adjunto?: ElementoAdjunto
): Promise<boolean> {
  try {
    const payload: any = {
      empresa_id: empresaId,
      emisor_id: emisorId,
      receptor_id: receptorId,
      mensaje: texto,
    };

    if (adjunto) {
      payload.adjunto = adjunto;
      if (adjunto.tipo === 'tarjeta') payload.tarjeta_id = adjunto.id;
      if (adjunto.tipo === 'lista') payload.lista_id = adjunto.id;
      if (adjunto.tipo === 'tablero') payload.tablero_id = adjunto.id;
    }

    const { error } = await supabase.from('soporte_mensajes').insert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    console.error('Error enviando mensaje:', e.message);
    return false;
  }
}

// Funciones para navegación por contenedores (Sucursales -> Tableros -> Listas -> Tarjetas)

export async function obtenerSucursales(empresaId: string) {
  try {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, nombre, ubicacion')
      .eq('empresa_id', empresaId)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function obtenerTablerosDeSucursal(empresaId: string, sucursalId: string) {
  try {
    const { data, error } = await supabase
      .from('tableros')
      .select('id, nombre, descripcion')
      .eq('empresa_id', empresaId)
      .eq('sucursal_id', sucursalId)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function obtenerListasDeTablero(empresaId: string, tableroId: string) {
  try {
    const { data, error } = await supabase
      .from('listas')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .eq('tablero_id', tableroId)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function obtenerTarjetasDeLista(empresaId: string, listaId: string) {
  try {
    const { data, error } = await supabase
      .from('tarjetas')
      .select('id, titulo')
      .eq('empresa_id', empresaId)
      .eq('lista_id', listaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function buscarElementosParaAdjuntar(
  empresaId: string,
  query: string
): Promise<ElementoAdjunto[]> {
  const resultados: ElementoAdjunto[] = [];
  const q = query.trim().toLowerCase();

  try {
    let tabQuery = supabase
      .from('tableros')
      .select('id, nombre, descripcion, sucursales(nombre)')
      .eq('empresa_id', empresaId)
      .limit(10);
    if (q) tabQuery = tabQuery.ilike('nombre', `%${q}%`);
    const { data: tableros } = await tabQuery;

    (tableros || []).forEach((t: any) => {
      const sucNom = Array.isArray(t.sucursales) ? t.sucursales[0]?.nombre : t.sucursales?.nombre;
      resultados.push({
        tipo: 'tablero',
        id: t.id,
        titulo: t.nombre,
        detalles: sucNom ? `Sucursal: ${sucNom}` : 'Tablero operativo',
        tableroId: t.id,
      });
    });

    let lisQuery = supabase
      .from('listas')
      .select('id, nombre, tablero_id, tableros(nombre, sucursales(nombre))')
      .eq('empresa_id', empresaId)
      .limit(10);
    if (q) lisQuery = lisQuery.ilike('nombre', `%${q}%`);
    const { data: listas } = await lisQuery;

    (listas || []).forEach((l: any) => {
      const tabData = Array.isArray(l.tableros) ? l.tableros[0] : l.tableros;
      const tabNombre = tabData?.nombre || '';
      const sucNombre = Array.isArray(tabData?.sucursales) ? tabData?.sucursales[0]?.nombre : tabData?.sucursales?.nombre;
      const pathStr = [sucNombre, tabNombre].filter(Boolean).join(' > ');
      resultados.push({
        tipo: 'lista',
        id: l.id,
        titulo: l.nombre,
        detalles: pathStr ? `En: ${pathStr}` : 'Lista de procesos',
        tableroId: l.tablero_id,
        listaId: l.id,
      });
    });

    let tarQuery = supabase
      .from('tarjetas')
      .select('id, titulo, lista_id, listas(nombre, tablero_id, tableros(nombre))')
      .eq('empresa_id', empresaId)
      .limit(15);
    if (q) tarQuery = tarQuery.ilike('titulo', `%${q}%`);
    const { data: tarjetas } = await tarQuery;

    (tarjetas || []).forEach((t: any) => {
      const lisData = Array.isArray(t.listas) ? t.listas[0] : t.listas;
      const lisNombre = lisData?.nombre || '';
      const tabData = Array.isArray(lisData?.tableros) ? lisData?.tableros[0] : lisData?.tableros;
      const tabNombre = tabData?.nombre || '';
      const tabId = lisData?.tablero_id || '';
      const pathStr = [tabNombre, lisNombre].filter(Boolean).join(' > ');
      resultados.push({
        tipo: 'tarjeta',
        id: t.id,
        titulo: t.titulo || 'Sin título',
        detalles: pathStr ? `En: ${pathStr}` : 'Registro de tarjeta',
        tableroId: tabId,
        listaId: t.lista_id,
      });
    });

    return resultados;
  } catch (e: any) {
    console.error('Error buscando elementos para adjuntar:', e.message);
    return resultados;
  }
}
