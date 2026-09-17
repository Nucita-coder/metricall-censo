import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../types/kanban';
import { StockItemDisponible } from '../components/almacen/formulario/types';

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
  const [stockDisponibles, setStockDisponibles] = useState<StockItemDisponible[]>([]);
  const [stockCustodiaMiembro, setStockCustodiaMiembro] = useState<StockItemDisponible[]>([]);

  useEffect(() => {
    if (!empresaId) return;

    supabase
      .from('perfiles')
      .select('nombre_completo')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        if (data) {
          setMiembrosList(
            (data as Array<{ nombre_completo: string }>).map((m) => m.nombre_completo).filter(Boolean)
          );
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
          const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
          const isDevolucionAlmacen =
            tipo.includes('ALMACÉN CENTRAL') || tipo.includes('ALMACEN CENTRAL');
          const isDevolucionAsig =
            !isDevolucionAlmacen &&
            (tipo.includes('DEVOLUCIÓN') || tipo.includes('DEVOLUCION'));
          const isAsignado =
            !isDevolucionAsig &&
            !isDevolucionAlmacen &&
            (tipo ? tipo.includes('ASIGNA') : Boolean(v.asignadoA && v.asignadoA.toString().trim()));

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

            if (isAsignado) {
              mapa[key].stock -= cant;
            } else if (isDevolucionAsig) {
              mapa[key].stock += cant;
            } else if (isDevolucionAlmacen) {
              mapa[key].stock -= cant;
            } else {
              mapa[key].stock += cant;
            }
          });
        });
        setStockDisponibles(Object.values(mapa).filter((m) => m.stock > 0));
      });
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId || !isDevolucionMode) return;

    const targetMiembro = (asignadoA || nombreCompleto || '').trim().toUpperCase();
    supabase
      .from('tarjetas')
      .select('datos_valores')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, StockItemDisponible> = {};
        (data as unknown as Tarjeta[]).forEach((row) => {
          const v = row.datos_valores || {};
          const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
          const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
          const isAsignado =
            !isDevolucion &&
            (tipo ? tipo.includes('ASIGNA') : Boolean(v.asignadoA && v.asignadoA.toString().trim()));

          if (!isAsignado && !isDevolucion) return;

          const tecnicoAsignado = (v.asignadoA || (v.recibidoPor as string) || '').toString().trim().toUpperCase();
          const tecnicoDevolucion = (v.entregadoPor || v.asignadoA || '').toString().trim().toUpperCase();
          const miembro = isDevolucion ? tecnicoDevolucion : tecnicoAsignado;

          const matchMiembro =
            targetMiembro === '' ||
            miembro === targetMiembro ||
            (targetMiembro &&
              miembro &&
              (miembro.includes(targetMiembro) || targetMiembro.includes(miembro)));
          if (!matchMiembro) return;

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

            if (isAsignado) {
              mapa[key].stock += cant;
            } else if (isDevolucion) {
              mapa[key].stock -= cant;
            }
          });
        });
        setStockCustodiaMiembro(Object.values(mapa).filter((m) => m.stock > 0));
      });
  }, [empresaId, isDevolucionMode, asignadoA, nombreCompleto]);

  return {
    miembrosList,
    stockDisponibles,
    stockCustodiaMiembro,
  };
}
