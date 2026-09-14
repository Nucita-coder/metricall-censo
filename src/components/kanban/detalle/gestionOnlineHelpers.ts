import { supabase } from '../../../lib/supabase';
import { Lista } from '../../../types/kanban';
import { findListaTarget } from './types';

export async function resolverListaDestino(
  patron: string,
  listasGlobales: Lista[] = [],
  empresaId?: string
): Promise<string | null> {
  const patronNorm = patron.toLowerCase();
  const encontrada =
    findListaTarget(listasGlobales, patronNorm)?.id ||
    listasGlobales.find(l => (l.nombre || '').toLowerCase().includes(patronNorm))?.id;

  if (encontrada) return encontrada;

  let query = supabase
    .from('listas')
    .select('id, nombre')
    .ilike('nombre', `%${patron}%`);

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data: listasBd, error: errBd } = await query.limit(1);
  if (errBd) console.error(`[GESTION ONLINE] Error buscando lista ${patron} en BD:`, errBd);
  if (listasBd && listasBd.length > 0) return listasBd[0].id;

  return null;
}
