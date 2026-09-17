import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../types/kanban';
import { StockItemDisponible } from '../components/almacen/formulario/types';
import {
  clasificarMovimientoAlmacen,
  obtenerImpactoMovimiento,
  obtenerMiembroResponsable,
  normalizarTextoAlmacen,
} from '../services/almacenService';

export interface MiembroResumen {
  id: string;
  nombre: string;
}

interface UseFormularioStockParams {
  empresaId: string | null;
  nombreCompleto: string | null;
  isDevolucionMode: boolean;
  asignadoA?: string;
}

export function useFormularioStockDisponibles({
  empresaId,
  nombreCompleto,
  isDevolucionMode,
  asignadoA,
}: UseFormularioStockParams) {
  const [miembrosList, setMiembrosList] = useState<string[]>([]);
  const [miembrosDetallados, setMiembrosDetallados] = useState<MiembroResumen[]>([]);
  const [stockDisponibles, setStockDisponibles] = useState<StockItemDisponible[]>([]);
  const [stockCustodiaMiembro, setStockCustodiaMiembro] = useState<StockItemDisponible[]>([]);

  useEffect(() => {
    if (!empresaId) return;

    supabase
      .from('perfiles')
      .select('id, nombre_completo')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        if (data) {
          const list = (data as Array<{ id: string; nombre_completo: string }>)
            .filter((m) => Boolean(m.nombre_completo))
            .map((m) => ({ id: m.id, nombre: m.nombre_completo }));
          setMiembrosDetallados(list);
          setMiembrosList(list.map((m) => m.nombre));
        }
      });

    supabase
      .from('tarjetas')
      .select('datos_valores')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, StockItemDisponible> = {};
        (data as unknown as Tarjeta[]).forEach((row) => {
          const v = row.datos_valores || {};
          const movTipo = clasificarMovimientoAlmacen(v.tipoCarga);
          const impacto = obtenerImpactoMovimiento(movTipo);
          if (!impacto.afectaAlmacen) return;

          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const nombre = (subItem.nombreMaterial || '').trim().toUpperCase();
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            const key = nombre || cod;
            if (!key) return;
            const cant = parseFloat(String(subItem.cantidadRecibida || '0')) || 0;
            if (!mapa[key]) {
              mapa[key] = {
                codigo: cod || key,
                nombre: nombre || cod,
                modelo: (subItem.modeloMaterial || '').toUpperCase(),
                stock: 0,
              };
            }
            if (cod && (!mapa[key].codigo || mapa[key].codigo === key)) {
              mapa[key].codigo = cod;
            }

            mapa[key].stock += impacto.deltaAlmacen * cant;
          });
        });
        setStockDisponibles(Object.values(mapa).filter((m) => m.stock > 0));
      });
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId || !isDevolucionMode) return;

    const targetNorm = normalizarTextoAlmacen(asignadoA || nombreCompleto || '');
    supabase
      .from('tarjetas')
      .select('datos_valores')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, StockItemDisponible> = {};
        (data as unknown as Tarjeta[]).forEach((row) => {
          const v = row.datos_valores || {};
          const movTipo = clasificarMovimientoAlmacen(v.tipoCarga);
          if (movTipo !== 'MATERIAL_ASIGNADO' && movTipo !== 'DEVOLUCION_ASIGNACION') return;

          const miembroNorm = normalizarTextoAlmacen(obtenerMiembroResponsable(movTipo, v));
          const matchMiembro =
            targetNorm === '' ||
            miembroNorm === targetNorm ||
            (targetNorm !== '' &&
              miembroNorm !== '' &&
              (miembroNorm.includes(targetNorm) || targetNorm.includes(miembroNorm)));
          if (!matchMiembro) return;

          const impacto = obtenerImpactoMovimiento(movTipo);
          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const nombre = (subItem.nombreMaterial || '').trim().toUpperCase();
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            const key = nombre || cod;
            if (!key) return;
            const cant = parseFloat((subItem.cantidadRecibida as string) || '0') || 0;
            if (!mapa[key]) {
              mapa[key] = {
                codigo: cod || key,
                nombre: nombre || cod,
                modelo: (subItem.modeloMaterial || '').toUpperCase(),
                stock: 0,
              };
            }
            if (cod && (!mapa[key].codigo || mapa[key].codigo === key)) {
              mapa[key].codigo = cod;
            }

            mapa[key].stock += impacto.deltaEmpleado * cant;
          });
        });
        setStockCustodiaMiembro(Object.values(mapa).filter((m) => m.stock > 0));
      });
  }, [empresaId, isDevolucionMode, asignadoA, nombreCompleto]);

  return {
    miembrosList,
    miembrosDetallados,
    stockDisponibles,
    stockCustodiaMiembro,
  };
}
