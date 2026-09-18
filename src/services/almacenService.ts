import { supabase } from '../lib/supabase';
import { TarjetaDatosValores } from '../types/kanban';
import { fetchTodasLasTarjetas } from './tarjetasService';

export type TipoMovimientoAlmacen =
  | 'MATERIAL_RECIBIDO'
  | 'MATERIAL_ASIGNADO'
  | 'DEVOLUCION_ASIGNACION'
  | 'DEVOLUCION_CENTRAL'
  | 'RECUPERADOS'
  | 'OTRO';

export interface ImpactoMovimiento {
  tipo: TipoMovimientoAlmacen;
  deltaAlmacen: number; // +1 = suma al almacén, -1 = resta del almacén, 0 = neutro
  deltaEmpleado: number; // +1 = suma al empleado, -1 = resta del empleado, 0 = neutro
  afectaEmpleado: boolean;
  afectaAlmacen: boolean;
}

/**
 * Normaliza cualquier cadena eliminando acentos, espacios duplicados y convirtiendo a minúsculas
 */
export function normalizarTextoAlmacen(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Clasifica de forma determinista y tolerante el tipo de movimiento de almacén
 * basado en tipoCarga o el nombre de la lista Kanban.
 */
export function clasificarMovimientoAlmacen(
  tipoCarga?: string | null,
  nombreLista?: string | null
): TipoMovimientoAlmacen {
  const normTipo = normalizarTextoAlmacen(tipoCarga);
  const normLista = normalizarTextoAlmacen(nombreLista);
  const combinada = `${normTipo} ${normLista}`.trim();

  if (!combinada) return 'OTRO';

  // 1. Devolución al/a Almacén Central (Precedencia sobre devoluciones generales)
  const esCentral =
    combinada.includes('central') ||
    combinada.includes('almacen central') ||
    combinada.includes('almacen matriz');
  const esDevolucion =
    combinada.includes('devolucion') || combinada.includes('devolver');

  if (esCentral && (esDevolucion || combinada.includes('almacen central'))) {
    return 'DEVOLUCION_CENTRAL';
  }

  // 2. Devolución de Asignación (Personal hacia Almacén local)
  if (
    esDevolucion &&
    (combinada.includes('asignacion') ||
      combinada.includes('asignada') ||
      !esCentral)
  ) {
    return 'DEVOLUCION_ASIGNACION';
  }

  // 3. Material Asignado (Almacén local hacia Personal)
  const esAsignacionVentas =
    combinada.includes('asignado a') ||
    combinada.includes('por asignar') ||
    combinada.includes('asignar a') ||
    combinada.includes('por_asignar');

  if (
    !esDevolucion &&
    !esAsignacionVentas &&
    (combinada.includes('material asignad') ||
      combinada.includes('materiales asignad') ||
      combinada.includes('asignacion de material') ||
      combinada.includes('asignacion material') ||
      normTipo === 'material asignado' ||
      normTipo === 'materiales asignados' ||
      normLista === 'material asignado' ||
      normLista === 'materiales asignados' ||
      normLista === 'asignacion')
  ) {
    return 'MATERIAL_ASIGNADO';
  }

  // 4. Recuperados (Equipos retirados a clientes)
  if (combinada.includes('recuperad')) {
    return 'RECUPERADOS';
  }

  // 5. Material Recibido / Carga de Materiales (Ingreso al almacén local)
  if (
    combinada.includes('recibido') ||
    combinada.includes('recepcion') ||
    combinada.includes('carga de material') ||
    combinada.includes('carga')
  ) {
    return 'MATERIAL_RECIBIDO';
  }

  return 'OTRO';
}

/**
 * Determina de forma estricta si una tarjeta corresponde a un movimiento
 * de Almacén (evitando falsos positivos con tarjetas de Clientes, Ventas o Soporte).
 */
export function esTarjetaFormatoAlmacen(
  datosValores?: Record<string, unknown> | null,
  nombreLista?: string | null
): boolean {
  if (!datosValores && !nombreLista) return false;

  // 1. Si contiene campos propios de contratos, ventas o soporte técnico jamás es formato almacén
  if (
    Boolean(datosValores?.tipoServicio) ||
    Boolean(datosValores?.cedula) ||
    Boolean(datosValores?.tipoFalla) ||
    datosValores?.origenImportacion === 'COBRANZA-RECUPERO-CHURN'
  ) {
    return false;
  }

  // 2. Si tiene propiedades explícitas de una tarjeta de almacén
  if (
    datosValores?.codigoMaterial !== undefined ||
    datosValores?.nroOrdenEntrega !== undefined
  ) {
    return true;
  }

  if (
    datosValores?.tipoCarga &&
    clasificarMovimientoAlmacen(String(datosValores.tipoCarga)) !== 'OTRO'
  ) {
    return true;
  }

  // 3. Evaluar lista kanban descartando listas operativas de ventas
  if (nombreLista) {
    const cleanLista = normalizarTextoAlmacen(nombreLista);
    if (
      cleanLista.includes('asignado a') ||
      cleanLista.includes('por asignar') ||
      cleanLista.includes('en proceso') ||
      cleanLista.includes('por instalar')
    ) {
      return false;
    }
    return clasificarMovimientoAlmacen(undefined, nombreLista) !== 'OTRO';
  }

  return false;
}

/**
 * Retorna el impacto numérico estandarizado de cada operación:
 * - Material Recibido: suma almacén (+1), no afecta empleado (0)
 * - Material Asignado: resta almacén (-1), suma empleado (+1)
 * - Devolución de Asignación: suma almacén (+1), resta empleado (-1)
 * - Devolución al Almacén Central: resta almacén (-1), no afecta empleado (0)
 * - Recuperados: suma almacén (+1), no afecta empleado (0)
 */
export function obtenerImpactoMovimiento(
  tipo: TipoMovimientoAlmacen
): ImpactoMovimiento {
  switch (tipo) {
    case 'MATERIAL_RECIBIDO':
      return {
        tipo,
        deltaAlmacen: 1,
        deltaEmpleado: 0,
        afectaAlmacen: true,
        afectaEmpleado: false,
      };

    case 'MATERIAL_ASIGNADO':
      return {
        tipo,
        deltaAlmacen: -1,
        deltaEmpleado: 1,
        afectaAlmacen: true,
        afectaEmpleado: true,
      };

    case 'DEVOLUCION_ASIGNACION':
      return {
        tipo,
        deltaAlmacen: 1,
        deltaEmpleado: -1,
        afectaAlmacen: true,
        afectaEmpleado: true,
      };

    case 'DEVOLUCION_CENTRAL':
      return {
        tipo,
        deltaAlmacen: -1,
        deltaEmpleado: 0,
        afectaAlmacen: true,
        afectaEmpleado: false,
      };

    case 'RECUPERADOS':
      return {
        tipo,
        deltaAlmacen: 1,
        deltaEmpleado: 0,
        afectaAlmacen: true,
        afectaEmpleado: false,
      };

    default:
      return {
        tipo: 'OTRO',
        deltaAlmacen: 0,
        deltaEmpleado: 0,
        afectaAlmacen: false,
        afectaEmpleado: false,
      };
  }
}

/**
 * Determina con precisión el empleado responsable del movimiento de personal.
 * - Para asignaciones: el receptor (asignadoA o recibidoPor).
 * - Para devoluciones de personal: el emisor (entregadoPor o asignadoA).
 * - Para central o recibidos: cadena vacía (no aplica a custodia de personal).
 */
export function obtenerMiembroResponsable(
  tipo: TipoMovimientoAlmacen,
  v: TarjetaDatosValores
): string {
  if (tipo === 'MATERIAL_ASIGNADO') {
    return (
      (v.asignadoA as string) ||
      (v.tecnicoAsignado as string) ||
      (v.recibidoPor as string) ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
  }

  if (tipo === 'DEVOLUCION_ASIGNACION') {
    return (
      (v.entregadoPor as string) ||
      (v.asignadoA as string) ||
      (v.tecnicoAsignado as string) ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
  }

  return '';
}

export interface TarjetaAlmacenRow {
  id: string;
  datos_valores: TarjetaDatosValores | null;
  created_at: string | null;
  lista_id?: string;
  listas?: { nombre?: string };
}

/**
 * Consulta de alto rendimiento para Almacén:
 * Obtiene únicamente las tarjetas de las listas del tablero de Almacén.
 */
export async function fetchTarjetasAlmacen(
  empresaId: string | null,
  select = 'id, datos_valores, created_at, lista_id, listas(nombre)',
  orderBy = 'created_at',
  ascending = false
): Promise<TarjetaAlmacenRow[]> {
  try {
    let qListas = supabase
      .from('listas')
      .select('id, tableros!inner(tipo, empresa_id)')
      .eq('tableros.tipo', 'almacen');

    if (empresaId) {
      qListas = qListas.eq('tableros.empresa_id', empresaId);
    }

    const { data: listasAlmacen, error: errListas } = await qListas;
    if (errListas) {
      console.warn('[fetchTarjetasAlmacen] Error obteniendo listas almacén:', errListas);
    }

    const listaIds = (listasAlmacen || []).map((l) => (l as { id: string }).id);

    if (listaIds.length > 0) {
      let qTarjetas = supabase
        .from('tarjetas')
        .select(select)
        .in('lista_id', listaIds)
        .order(orderBy, { ascending });

      if (empresaId) {
        qTarjetas = qTarjetas.eq('empresa_id', empresaId);
      }

      const { data: tarjetas, error: errTarjetas } = await qTarjetas;
      if (errTarjetas) {
        console.error('[fetchTarjetasAlmacen] Error obteniendo tarjetas:', errTarjetas);
        return [];
      }
      return (tarjetas || []) as unknown as TarjetaAlmacenRow[];
    }

    // Fallback defensivo si aún no existen listas clasificadas como 'almacen'
    const fallback = await fetchTodasLasTarjetas({
      empresaId,
      select,
      orderBy,
      ascending,
    });
    return (fallback || []) as unknown as TarjetaAlmacenRow[];
  } catch (err) {
    console.error('[fetchTarjetasAlmacen] Excepción:', err);
    return [];
  }
}

