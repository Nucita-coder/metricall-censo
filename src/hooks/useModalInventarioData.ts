import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTodasLasTarjetas } from '../services/tarjetasService';
import { TarjetaMaterialItem } from '../types/kanban';
import { MaterialStockItem } from '../components/kanban/modals/inventario/types';
import {
  clasificarMovimientoAlmacen,
  obtenerImpactoMovimiento,
} from '../services/almacenService';

export function useModalInventarioData(visible: boolean, empresaId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [materiales, setMateriales] = useState<MaterialStockItem[]>([]);

  const fetchStock = useCallback(async () => {
    if (!empresaId) return;
    setIsLoading(true);
    try {
      const data = await fetchTodasLasTarjetas({
        empresaId,
        select: 'id, datos_valores, created_at',
      });
      if (!data) return;

      const mapa: Record<string, MaterialStockItem> = {};
      data.forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

        (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
          const nombre = (subItem.nombreMaterial || '').trim().toUpperCase();
          const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
          const key = nombre || cod;
          if (!key) return;
          const cant = parseFloat((subItem.cantidadRecibida as string) || '0') || 0;
          const fechaIngreso = v.fechaRecibido || row.created_at || '';

          if (!mapa[key]) {
            mapa[key] = {
              codigoMaterial: cod || key,
              nombreMaterial: nombre || cod,
              modeloMaterial: (subItem.modeloMaterial || 'GENERAL').toUpperCase(),
              stockTotal: 0,
              numRegistros: 0,
              ultimoIngreso: fechaIngreso,
              cargas: [],
            };
          }

          mapa[key].numRegistros += 1;
          if (cod && (!mapa[key].codigoMaterial || mapa[key].codigoMaterial === key)) {
            mapa[key].codigoMaterial = cod;
          }
          if (nombre && (mapa[key].nombreMaterial === '—' || mapa[key].nombreMaterial === cod)) {
            mapa[key].nombreMaterial = nombre;
          }

          mapa[key].cargas?.push({
            id: String(row.id || ''),
            nroOrden: (v.nroOrdenEntrega as string) || 'S/N',
            fecha: (v.fechaRecibido as string) || (row.created_at ? row.created_at.split('T')[0] : '—'),
            tipoCarga: tipo || 'MATERIAL RECIBIDO',
            origen: (v.origen as string) || 'ALMACÉN',
            entregadoPor: (v.entregadoPor as string) || '—',
            recibidoPor: (v.recibidoPor as string) || (v.asignadoA as string) || '—',
            motivo: (v.motivoAsignacion as string) || (v.motivoDevolucion as string) || (v.motivo as string) || 'Sin motivo registrado',
            codigoMaterial: cod || key,
            nombreMaterial: nombre || cod,
            modeloMaterial: (subItem.modeloMaterial || 'GENERAL').toUpperCase(),
            serialMaterial: subItem.serialMaterial || undefined,
            cantidad: cant,
            adjuntos: Array.isArray(v.adjuntos) ? (v.adjuntos as string[]) : [],
          });

          const movTipo = clasificarMovimientoAlmacen(tipo);
          const impacto = obtenerImpactoMovimiento(movTipo);
          mapa[key].stockTotal += impacto.deltaAlmacen * cant;
        });
      });
      setMateriales(Object.values(mapa));
    } catch (e) {
      console.error('Error inventario:', e);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (visible && empresaId) {
      fetchStock();
    }
  }, [visible, empresaId, fetchStock]);

  const nombresMaterialesUnicos = useMemo(() => {
    const set = new Set<string>();
    materiales.forEach((m) => {
      if (m.nombreMaterial && m.nombreMaterial.trim()) {
        set.add(m.nombreMaterial.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [materiales]);

  const modelosUnicos = useMemo(
    () => Array.from(new Set(materiales.map((m) => m.modeloMaterial).filter(Boolean))),
    [materiales]
  );

  const totalUnd = useMemo(
    () => materiales.reduce((s, m) => s + m.stockTotal, 0),
    [materiales]
  );

  const maxStock = useMemo(
    () => Math.max(...materiales.map((m) => m.stockTotal), 1),
    [materiales]
  );

  return {
    materiales,
    isLoading,
    fetchStock,
    nombresMaterialesUnicos,
    modelosUnicos,
    totalUnd,
    maxStock,
  };
}
