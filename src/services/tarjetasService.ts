import { supabase } from '../lib/supabase';

export interface FetchTarjetasOptions {
  listaIds?: string[];
  empresaId?: string | null;
  estadoArchivo?: boolean;
  select?: string;
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Realiza consultas paginadas en lotes a la tabla 'tarjetas'
 * eliminando el límite por defecto de 1000 filas impuesto por Supabase PostgREST.
 */
export async function fetchTodasLasTarjetas(options: FetchTarjetasOptions = {}): Promise<any[]> {
  const {
    listaIds,
    empresaId,
    estadoArchivo,
    select = '*, perfiles(nombre_completo)',
    orderBy = 'created_at',
    ascending = false,
  } = options;

  const PAGE_SIZE = 1000;
  const allTarjetas: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('tarjetas')
      .select(select)
      .order(orderBy, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (listaIds && listaIds.length > 0) {
      query = query.in('lista_id', listaIds);
    }
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    if (typeof estadoArchivo === 'boolean') {
      query = query.eq('estado_archivo', estadoArchivo);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allTarjetas.push(...data);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  return allTarjetas;
}
