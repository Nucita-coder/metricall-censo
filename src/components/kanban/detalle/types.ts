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

export function checkIsCensoFormat(listaNombre?: string, tarjeta?: any, tableroTipo?: string): boolean {
  if (tableroTipo === 'censo') return true;
  const vals = tarjeta?.datos_valores || {};
  if (vals.origen === 'censo' || vals.fechaCenso || vals.dispuestoCambiar || vals.cuentaConInternet || vals.observacionesCenso) return true;
  if (!listaNombre) return false;

  const clean = listaNombre.toLowerCase().trim().replace(/_/g, ' ');
  return ['censo', 'si desea', 'no desea', 'es posible', 'sí desea'].includes(clean);
}
