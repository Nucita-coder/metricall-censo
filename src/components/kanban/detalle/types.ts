import { Lista, Tarjeta } from '../../../types/kanban';

export interface Miembro {
  id?: string;
  nombre_completo: string;
  rol?: string;
  avatar_url?: string | null;
  [key: string]: unknown;
}

export interface FaseProps {
  tarjeta: Tarjeta;
  miembros?: Miembro[];
  onUpdateTarjeta: (updates: Record<string, unknown>) => Promise<void>;
  autoMoverTarjeta: (tarjetaActual: Tarjeta, listaDestinoId: string) => Promise<void>;
  listasGlobales?: Lista[];
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setImagenExpandida?: (url: string | null) => void;
  onSolicitarConversionVenta?: (gestionData: Record<string, unknown>) => void;
  soloHistorial?: boolean;
  readOnly?: boolean;
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  setTarjetaSeleccionada?: (t: Tarjeta | null) => void;
}

export function findListaTarget(listas: Lista[] = [], target: string): Lista | undefined {
  if (!listas || listas.length === 0) return undefined;
  const targetClean = target.toLowerCase().trim().replace(/_/g, ' ');

  return listas.find(l => {
    if (!l) return false;
    if (l.slug && l.slug.toLowerCase().trim().replace(/_/g, ' ') === targetClean) return true;
    if (l.nombre && l.nombre.toLowerCase().trim().replace(/_/g, ' ') === targetClean) return true;
    return false;
  });
}

import { supabase } from '../../../lib/supabase';

export function checkIsCensoFormat(listaNombre?: string, tarjeta?: Tarjeta | null, tableroTipo?: string): boolean {
  if (tableroTipo === 'censo') return true;
  const vals = tarjeta?.datos_valores || {};
  if (vals.origen === 'censo' || vals.fechaCenso || vals.dispuestoCambiar || vals.cuentaConInternet || vals.observacionesCenso) return true;
  if (!listaNombre) return false;

  const clean = listaNombre.toLowerCase().trim().replace(/_/g, ' ');
  return ['censo', 'si desea', 'no desea', 'es posible', 'sí desea'].includes(clean);
}

interface TableroSoporteRow {
  id: string;
  nombre: string;
  tipo?: string;
  empresa_id?: string;
  listas?: { id: string; nombre: string }[];
}

interface ListaSoporteRow {
  id: string;
  nombre: string;
  tablero_id?: string;
  tableros?: { nombre?: string; tipo?: string } | null;
}

export async function getAtencionFallasListaId(
  nombreListaTarget: string,
  empresaId?: string,
  sucursalId?: string
): Promise<string | null> {
  try {
    const targetClean = nombreListaTarget.toLowerCase().trim().replace(/_/g, ' ');

    let { data: tableros } = await supabase
      .from('tableros')
      .select('id, nombre, tipo, listas(id, nombre)')
      .or('tipo.eq.soporte,nombre.ilike.%atenci%falla%');

    const tablerosList = (tableros || []) as unknown as TableroSoporteRow[];

    let filteredTableros = tablerosList;
    if (empresaId && Array.isArray(tablerosList)) {
      const tabEmpresa = tablerosList.filter(t => t.empresa_id === empresaId);
      if (tabEmpresa.length > 0) filteredTableros = tabEmpresa;
    }

    if (filteredTableros.length > 0) {
      for (const t of filteredTableros) {
        if (Array.isArray(t.listas)) {
          const matchList = t.listas.find(l => {
            const n = (l.nombre || '').toLowerCase().trim().replace(/_/g, ' ');
            return n.includes(targetClean) || targetClean.includes(n);
          });
          if (matchList) return matchList.id;
        }
      }
    }

    const { data: listasBd } = await supabase
      .from('listas')
      .select('id, nombre, tablero_id, tableros!inner(nombre, tipo)')
      .ilike('nombre', `%${nombreListaTarget}%`);

    const listasRows = (listasBd || []) as unknown as ListaSoporteRow[];

    if (listasRows.length > 0) {
      const matchSoporte = listasRows.find(l =>
        l.tableros?.tipo === 'soporte' ||
        (l.tableros?.nombre || '').toLowerCase().includes('atenci') ||
        (l.tableros?.nombre || '').toLowerCase().includes('falla')
      );
      if (matchSoporte) return matchSoporte.id;
      return listasRows[0].id;
    }

    return null;
  } catch (err) {
    console.error('[getAtencionFallasListaId EXCEPTION]', err);
    return null;
  }
}

export async function getListaInstalacionesId(
  nombreListaTarget: string,
  empresaId?: string
): Promise<string | null> {
  try {
    const targetClean = nombreListaTarget.toLowerCase().trim().replace(/_/g, ' ');

    const { data: tableros } = await supabase
      .from('tableros')
      .select('id, nombre, tipo, listas(id, nombre)')
      .or('tipo.eq.instalaciones,nombre.ilike.%instalaci%');

    const tablerosList = (tableros || []) as unknown as TableroSoporteRow[];

    let filteredTableros = tablerosList;
    if (empresaId && Array.isArray(tablerosList)) {
      const tabEmpresa = tablerosList.filter(t => t.empresa_id === empresaId);
      if (tabEmpresa.length > 0) filteredTableros = tabEmpresa;
    }

    if (filteredTableros.length > 0) {
      for (const t of filteredTableros) {
        if (Array.isArray(t.listas)) {
          const matchList = t.listas.find(l => {
            const n = (l.nombre || '').toLowerCase().trim().replace(/_/g, ' ');
            return n.includes(targetClean) || targetClean.includes(n);
          });
          if (matchList) return matchList.id;
        }
      }
    }

    const { data: listasBd } = await supabase
      .from('listas')
      .select('id, nombre, tablero_id, tableros!inner(nombre, tipo)')
      .ilike('nombre', `%${nombreListaTarget}%`);

    const listasRows = (listasBd || []) as unknown as ListaSoporteRow[];

    if (listasRows.length > 0) {
      const matchInst = listasRows.find(l =>
        l.tableros?.tipo === 'instalaciones' ||
        (l.tableros?.nombre || '').toLowerCase().includes('instalaci')
      );
      if (matchInst) return matchInst.id;
      return listasRows[0].id;
    }

    return null;
  } catch (err) {
    console.error('[getListaInstalacionesId EXCEPTION]', err);
    return null;
  }
}
