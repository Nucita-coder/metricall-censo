import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../types/kanban';
import {
  CustodiaItem,
  MovimientoItem,
  ListaAlmacenRel,
} from '../components/almacen/materiales/types';
import {
  clasificarMovimientoAlmacen,
  obtenerMiembroResponsable,
} from '../services/almacenService';

export function useMaterialesData(empresaId: string | null, nombreCompleto: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [custodiaList, setCustodiaList] = useState<CustodiaItem[]>([]);
  const [devueltosList, setDevueltosList] = useState<CustodiaItem[]>([]);
  const [movimientosList, setMovimientosList] = useState<MovimientoItem[]>([]);

  const handleDevolverMaterial = async (item: CustodiaItem) => {
    if (!empresaId) return;
    try {
      const { data: listasData, error } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id, tableros!inner(tipo, empresa_id)')
        .eq('tableros.empresa_id', empresaId);

      if (error) throw error;

      const devList =
        (listasData as unknown as ListaAlmacenRel[])?.find(
          (l) =>
            l.tableros?.tipo === 'almacen' &&
            (l.nombre.toLowerCase().includes('devolución de asignación') ||
              l.nombre.toLowerCase().includes('devolucion de asignacion') ||
              l.nombre.toLowerCase().includes('devolucion'))
        ) ||
        (listasData as unknown as ListaAlmacenRel[])?.find((l) =>
          l.nombre.toLowerCase().includes('devolucion')
        );

      if (!devList) {
        Alert.alert(
          'Almacén no encontrado',
          'No se encontró la lista de Devolución de Asignación en los tableros de Almacén de tu empresa.'
        );
        return;
      }

      router.push({
        pathname: '/tarjeta/nueva',
        params: {
          lista_id: devList.id,
          lista_nombre: devList.nombre,
          tipoCarga: 'DEVOLUCIÓN DE ASIGNACIÓN',
          codigoMaterial: item.codigo,
          nombreMaterial: item.nombre,
          modeloMaterial: item.modelo,
          serialMaterial: item.serial || '',
          cantidad: String(item.cantidad),
        },
      });
    } catch (e: unknown) {
      console.error('Error al buscar lista de devolución:', e);
      Alert.alert(
        'Error',
        (e as Error).message || 'No se pudo abrir el formulario de devolución.'
      );
    }
  };

  const fetchMaterialesData = useCallback(async () => {
    if (!empresaId || !nombreCompleto) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('id, datos_valores, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return;

      const targetName = nombreCompleto.trim().toUpperCase();
      const mapaCustodia: Record<string, CustodiaItem> = {};
      const mapaDevueltos: Record<string, CustodiaItem> = {};
      const movimientos: Array<MovimientoItem & { createdAt?: string }> = [];

      (data as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const movTipo = clasificarMovimientoAlmacen(v.tipoCarga);
        if (movTipo !== 'MATERIAL_ASIGNADO' && movTipo !== 'DEVOLUCION_ASIGNACION') return;

        const miembro = obtenerMiembroResponsable(movTipo, v);
        const matchMiembro =
          miembro === targetName ||
          (targetName &&
            miembro &&
            (miembro.includes(targetName) || targetName.includes(miembro)));
        if (!matchMiembro) return;

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
          const cant = parseFloat(String(sub.cantidadRecibida || '0')) || 0;
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

      movimientos.sort((a, b) => getTimestamp(b) - getTimestamp(a));

      setCustodiaList(Object.values(mapaCustodia).filter((i) => i.cantidad > 0));
      setDevueltosList(Object.values(mapaDevueltos).filter((i) => i.cantidad > 0));
      setMovimientosList(movimientos);
    } catch (e) {
      console.error('Error al cargar pantalla de materiales:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, nombreCompleto]);

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
    handleDevolverMaterial,
  };
}
