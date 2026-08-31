import { Lista, Tarjeta } from '../../../types/kanban';

export interface Miembro {
  id?: string;
  nombre_completo: string;
  rol?: string;
  [key: string]: any;
}

export interface FaseProps {
  tarjeta: Tarjeta;
  miembros?: Miembro[];
  onUpdateTarjeta: (updates: any) => Promise<void>;
  autoMoverTarjeta: (tarjetaActual: Tarjeta, listaDestinoId: string) => Promise<void>;
  listasGlobales?: Lista[];
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setImagenExpandida?: (url: string | null) => void;
  onSolicitarConversionVenta?: (gestionData: any) => void;
  soloHistorial?: boolean;
  readOnly?: boolean;
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  setTarjetaSeleccionada?: (t: any | null) => void;
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

export function checkIsCensoFormat(listaNombre?: string, tarjeta?: any, tableroTipo?: string): boolean {
  if (tableroTipo === 'censo') return true;
  const vals = tarjeta?.datos_valores || {};
  if (vals.origen === 'censo' || vals.fechaCenso || vals.dispuestoCambiar || vals.cuentaConInternet || vals.observacionesCenso) return true;
  if (!listaNombre) return false;

  const clean = listaNombre.toLowerCase().trim().replace(/_/g, ' ');
  return ['censo', 'si desea', 'no desea', 'es posible', 'sí desea'].includes(clean);
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

    if (empresaId && Array.isArray(tableros)) {
      const tabEmpresa = tableros.filter((t: any) => t.empresa_id === empresaId);
      if (tabEmpresa.length > 0) tableros = tabEmpresa;
    }

    if (tableros && tableros.length > 0) {
      for (const t of tableros) {
        if (Array.isArray(t.listas)) {
          const matchList = t.listas.find((l: any) => {
            const n = (l.nombre || '').toLowerCase().trim().replace(/_/g, ' ');
            return n.includes(targetClean) || targetClean.includes(n);
          });
          if (matchList) return matchList.id;
        }
      }
    }

    let queryListas = supabase
      .from('listas')
      .select('id, nombre, tablero_id, tableros!inner(nombre, tipo)')
      .ilike('nombre', `%${nombreListaTarget}%`);

    const { data: listasBd } = await queryListas;

    if (listasBd && listasBd.length > 0) {
      const matchSoporte = listasBd.find((l: any) =>
        l.tableros?.tipo === 'soporte' ||
        (l.tableros?.nombre || '').toLowerCase().includes('atenci') ||
        (l.tableros?.nombre || '').toLowerCase().includes('falla')
      );
      if (matchSoporte) return matchSoporte.id;
      return listasBd[0].id;
    }

    return null;
  } catch (err) {
    console.error('[getAtencionFallasListaId EXCEPTION]', err);
    return null;
  }
}
