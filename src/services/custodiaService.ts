import { supabase } from '../lib/supabase';
import {
  fetchTarjetasAlmacen,
  clasificarMovimientoAlmacen,
  normalizarTextoAlmacen,
  obtenerMiembroResponsable,
  obtenerImpactoMovimiento,
} from './almacenService';
import { TarjetaMaterialItem } from '../types/kanban';

export interface ParametrosConsultaCustodia {
  userId?: string | null;
  nombreTecnico?: string | null;
  empresaId?: string | null;
}

/**
 * Obtiene el mapa de stock en custodia para un técnico:
 * 1. Primero intenta leer de la tabla indexada stock_custodia_personal
 * 2. Si está vacía o hay error, recurre al historial de tarjetas de almacén
 */
export async function obtenerStockCustodiaTecnico({
  userId,
  nombreTecnico,
  empresaId,
}: ParametrosConsultaCustodia): Promise<Record<string, number>> {
  try {
    const mapaStock: Record<string, number> = {};
    const normTarget = normalizarTextoAlmacen(nombreTecnico);

    // 1. Consulta directa a la tabla indexada
    let q = supabase
      .from('stock_custodia_personal')
      .select('codigo_material, nombre_material, cantidad')
      .gt('cantidad', 0);

    if (userId && normTarget) {
      q = q.or(`usuario_id.eq.${userId},usuario_nombre.ilike.%${normTarget}%`);
    } else if (userId) {
      q = q.eq('usuario_id', userId);
    } else if (normTarget) {
      q = q.ilike('usuario_nombre', `%${normTarget}%`);
    }

    const { data: cRows, error: errC } = await q;

    if (!errC && cRows && cRows.length > 0) {
      cRows.forEach((r) => {
        const cant = Number(r.cantidad) || 0;
        if (r.codigo_material) mapaStock[r.codigo_material.toUpperCase().trim()] = cant;
        if (r.nombre_material) mapaStock[r.nombre_material.toUpperCase().trim()] = cant;
      });
      return mapaStock;
    }

    // 2. Fallback defensivo a las tarjetas de almacén (idéntico a useMaterialesData)
    const data = await fetchTarjetasAlmacen(
      empresaId || null,
      'id, datos_valores, created_at, lista_id, listas(nombre)'
    );

    if (!data || data.length === 0) return mapaStock;

    data.forEach((row) => {
      const v = row.datos_valores || {};
      const listaNombre = (row as unknown as { listas?: { nombre?: string } })?.listas?.nombre;
      const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
      const movTipo = clasificarMovimientoAlmacen(tipo, listaNombre);
      if (movTipo !== 'MATERIAL_ASIGNADO' && movTipo !== 'DEVOLUCION_ASIGNACION') return;

      const miembro = obtenerMiembroResponsable(movTipo, v);
      const normMiembro = normalizarTextoAlmacen(miembro);

      const matchId = Boolean(
        userId &&
        (String(v.asignadoAId || v.recibidoPorId || '').trim().toLowerCase() === String(userId).trim().toLowerCase() ||
         String(v.asignado_a).trim().toLowerCase() === String(userId).trim().toLowerCase())
      );

      const matchName = Boolean(
        normTarget &&
        normMiembro &&
        (normMiembro === normTarget ||
         normMiembro.includes(normTarget) ||
         normTarget.includes(normMiembro))
      );

      if (!matchId && !matchName) return;

      const impacto = obtenerImpactoMovimiento(movTipo);
      const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

      (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((sub) => {
        const cod = (sub.codigoMaterial || '').trim().toUpperCase();
        const nom = (sub.nombreMaterial || '').trim().toUpperCase();
        const cant = parseFloat(String(sub.cantidadRecibida || sub.cantidad || '0')) || 0;

        if (cant > 0) {
          const delta = impacto.deltaEmpleado * cant;
          if (cod) mapaStock[cod] = (mapaStock[cod] || 0) + delta;
          if (nom) mapaStock[nom] = (mapaStock[nom] || 0) + delta;
        }
      });
    });

    // Filtrar saldos menores o iguales a 0
    Object.keys(mapaStock).forEach((k) => {
      if (mapaStock[k] <= 0) delete mapaStock[k];
    });

    return mapaStock;
  } catch (err) {
    console.error('[obtenerStockCustodiaTecnico] Excepción:', err);
    return {};
  }
}
