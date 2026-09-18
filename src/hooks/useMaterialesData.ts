import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TarjetaDatosValores, TarjetaMaterialItem } from '../types/kanban';
import {
  CustodiaItem,
  MovimientoItem,
} from '../components/almacen/materiales/types';
import {
  clasificarMovimientoAlmacen,
  obtenerMiembroResponsable,
  normalizarTextoAlmacen,
  fetchTarjetasAlmacen,
} from '../services/almacenService';

export function useMaterialesData(
  empresaId: string | null,
  nombreCompleto: string | null,
  userId?: string | null
) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [custodiaList, setCustodiaList] = useState<CustodiaItem[]>([]);
  const [devueltosList, setDevueltosList] = useState<CustodiaItem[]>([]);
  const [movimientosList, setMovimientosList] = useState<MovimientoItem[]>([]);

  const fetchMaterialesData = useCallback(async () => {
    if (!nombreCompleto) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Cargar saldo de custodia directamente desde tabla indexada stock_custodia_personal
      let qCustodia = supabase
        .from('stock_custodia_personal')
        .select('codigo_material, nombre_material, modelo_material, cantidad')
        .gt('cantidad', 0);

      if (userId) {
        qCustodia = qCustodia.eq('usuario_id', userId);
      } else if (nombreCompleto) {
        qCustodia = qCustodia.ilike('usuario_nombre', `%${nombreCompleto}%`);
      }

      const { data: custodiaDb, error: errCustodia } = await qCustodia;

      // 2. Cargar tarjetas EXCLUSIVAMENTE de listas del tablero de almacén
      const data = await fetchTarjetasAlmacen(
        empresaId,
        'id, datos_valores, created_at, lista_id, listas(nombre)',
        'created_at',
        false
      );

      if (!data) return;

      const normTarget = normalizarTextoAlmacen(nombreCompleto);
      const mapaCustodia: Record<string, CustodiaItem> = {};
      const mapaDevueltos: Record<string, CustodiaItem> = {};
      const movimientos: Array<MovimientoItem & { createdAt?: string }> = [];

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
          v.asignado_a &&
          String(v.asignado_a).trim().toLowerCase() === String(userId).trim().toLowerCase()
        );
        const matchName = Boolean(
          normTarget &&
          normMiembro &&
          (normMiembro === normTarget ||
            normMiembro.includes(normTarget) ||
            normTarget.includes(normMiembro))
        );

        if (!matchId && !matchName) return;

        const isAsignacion = movTipo === 'MATERIAL_ASIGNADO';
        const isDevolucion = movTipo === 'DEVOLUCION_ASIGNACION';

        const rawItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
        const mappedItems: Array<{
          codigoMaterial: string;
          nombreMaterial: string;
          modeloMaterial: string;
          serialMaterial?: string;
          cantidad: number;
        }> = [];
        let cardTotal = 0;

        (rawItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((sub) => {
          const cod = (sub.codigoMaterial || '').trim().toUpperCase();
          const cant = parseFloat(String(sub.cantidadRecibida || sub.cantidad || '0')) || 0;
          if (cod || cant > 0) {
            const itemCod = cod || 'SIN-CÓDIGO';
            const itemName = (sub.nombreMaterial || 'Material').toUpperCase();
            const itemModel = (sub.modeloMaterial || 'GENERAL').toUpperCase();
            const serial = sub.serialMaterial || undefined;

            mappedItems.push({
              codigoMaterial: itemCod,
              nombreMaterial: itemName,
              modeloMaterial: itemModel,
              serialMaterial: serial,
              cantidad: cant,
            });
            cardTotal += cant;

            if (isAsignacion) {
              if (!mapaCustodia[itemCod]) {
                mapaCustodia[itemCod] = {
                  codigo: itemCod,
                  nombre: itemName,
                  modelo: itemModel,
                  serial,
                  cantidad: 0,
                };
              }
              mapaCustodia[itemCod].cantidad += cant;
            } else if (isDevolucion) {
              if (!mapaCustodia[itemCod]) {
                mapaCustodia[itemCod] = {
                  codigo: itemCod,
                  nombre: itemName,
                  modelo: itemModel,
                  serial,
                  cantidad: 0,
                };
              }
              mapaCustodia[itemCod].cantidad -= cant;

              if (!mapaDevueltos[itemCod]) {
                mapaDevueltos[itemCod] = {
                  codigo: itemCod,
                  nombre: itemName,
                  modelo: itemModel,
                  serial,
                  cantidad: 0,
                };
              }
              mapaDevueltos[itemCod].cantidad += cant;
            }
          }
        });

        movimientos.push({
          cardId: row.id,
          nroOrden: (v.nroOrdenEntrega as string) || 'S/N',
          fecha:
            (v.fechaRecibido as string) || row.created_at?.split('T')[0] || '—',
          createdAt: row.created_at || '',
          motivo:
            (v.motivoAsignacion as string) ||
            (isDevolucion ? 'Devolución de Material' : 'Asignación de Material'),
          tipoCarga: isDevolucion ? 'DEVOLUCION' : 'ASIGNACION',
          entregadoPor: ((v.entregadoPor as string) || '—').toUpperCase(),
          recibidoPor: (
            (v.recibidoPor as string) ||
            (v.asignadoA as string) ||
            '—'
          ).toUpperCase(),
          items: mappedItems,
          totalUnidades: cardTotal,
        });
      });

      const getTimestamp = (item: { createdAt?: string; fecha?: string }): number => {
        if (item.createdAt) {
          const t = new Date(item.createdAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        if (item.fecha && item.fecha.includes('/')) {
          const parts = item.fecha.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              return new Date(year, month, day).getTime();
            }
          }
        }
        if (item.fecha && item.fecha !== '—') {
          const t = new Date(item.fecha).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };

      if (!errCustodia && custodiaDb) {
        const mappedCustodia: CustodiaItem[] = custodiaDb.map((row) => ({
          codigo: row.codigo_material,
          nombre: row.nombre_material,
          modelo: row.modelo_material || 'GENERAL',
          cantidad: Number(row.cantidad) || 0,
        }));
        setCustodiaList(mappedCustodia);
      } else {
        setCustodiaList(Object.values(mapaCustodia).filter((i) => i.cantidad > 0));
      }

      setDevueltosList(Object.values(mapaDevueltos).filter((i) => i.cantidad > 0));
      setMovimientosList(movimientos);
    } catch (e) {
      console.error('Error al cargar pantalla de materiales:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, nombreCompleto, userId]);

  useEffect(() => {
    fetchMaterialesData();
  }, [fetchMaterialesData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterialesData();
  };

  return {
    isLoading,
    refreshing,
    onRefresh,
    custodiaList,
    devueltosList,
    movimientosList,
  };
}
