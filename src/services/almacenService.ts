import { TarjetaDatosValores } from '../types/kanban';

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
  if (
    !esDevolucion &&
    (combinada.includes('asignad') ||
      combinada.includes('asigna') ||
      combinada.includes('material asignado'))
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
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
  }

  return '';
}
