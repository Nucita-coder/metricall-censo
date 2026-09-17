import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../types/kanban';
import { StockItemDisponible } from '../components/almacen/formulario/types';
import { fetchTodasLasTarjetas } from '../services/tarjetasService';
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
  const [todosLosMateriales, setTodosLosMateriales] = useState<StockItemDisponible[]>([]);
  const [stockCustodiaMiembro, setStockCustodiaMiembro] = useState<StockItemDisponible[]>([]);

  useEffect(() => {
    let isMounted = true;

    const cargarMiembros = async () => {
      try {
        let q = supabase.from('perfiles').select('id, nombre_completo');
        if (empresaId) {
          q = q.eq('empresa_id', empresaId);
        }
        const { data, error } = await q;
        if (error) {
          console.warn('Error cargando miembros en formulario almacén:', error);
          return;
        }
        if (data && isMounted) {
          const list = (data as Array<{ id: string; nombre_completo: string }>)
            .filter((m) => Boolean(m.nombre_completo))
            .map((m) => ({ id: m.id, nombre: m.nombre_completo }));
          setMiembrosDetallados(list);
          setMiembrosList(list.map((m) => m.nombre));
        }
      } catch (err) {
        console.warn('Excepción al cargar miembros:', err);
      }
    };

    const cargarStockAlmacen = async () => {
      try {
        const data = await fetchTodasLasTarjetas({
          empresaId,
          select: 'id, datos_valores, created_at, lista_id, listas(nombre)',
        });
        if (!data || !isMounted) return;

        const mapa: Record<string, StockItemDisponible> = {};
        data.forEach((row) => {
          const v = row.datos_valores || {};
          const listaNombre = (row as unknown as { listas?: { nombre?: string } })?.listas?.nombre;
          const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
          const movTipo = clasificarMovimientoAlmacen(tipo, listaNombre);
          const impacto = obtenerImpactoMovimiento(movTipo);
          if (!impacto.afectaAlmacen) return;

          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const nombre = (subItem.nombreMaterial || '').trim().toUpperCase();
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            const key = cod || nombre;
            if (!key) return;
            const cant = parseFloat(String(subItem.cantidadRecibida || subItem.cantidad || '0')) || 0;
            const modUpper = (subItem.modeloMaterial || 'GENERAL').toString().toUpperCase();

            if (!mapa[key]) {
              mapa[key] = {
                codigo: cod || key,
                nombre: nombre || cod || 'MATERIAL',
                modelo: modUpper,
                stock: 0,
              };
            }
            if (cod && (!mapa[key].codigo || mapa[key].codigo === key)) {
              mapa[key].codigo = cod;
            }
            if (nombre && (mapa[key].nombre === '—' || mapa[key].nombre === cod)) {
              mapa[key].nombre = nombre;
            }

            mapa[key].stock += impacto.deltaAlmacen * cant;
          });
        });

        if (isMounted) {
          const todos = Object.values(mapa);
          setTodosLosMateriales(todos);
          setStockDisponibles(todos.filter((m) => m.stock > 0));
        }
      } catch (err) {
        console.error('Error calculando stock disponibles:', err);
      }
    };

    cargarMiembros();
    cargarStockAlmacen();

    return () => {
      isMounted = false;
    };
  }, [empresaId]);

  useEffect(() => {
    if (!isDevolucionMode) return;

    let isMounted = true;
    const cargarCustodia = async () => {
      try {
        const targetNorm = normalizarTextoAlmacen(asignadoA || nombreCompleto || '');
        const data = await fetchTodasLasTarjetas({
          empresaId,
          select: 'id, datos_valores, created_at, lista_id, listas(nombre)',
        });
        if (!data || !isMounted) return;

        const mapa: Record<string, StockItemDisponible> = {};
        data.forEach((row) => {
          const v = row.datos_valores || {};
          const listaNombre = (row as unknown as { listas?: { nombre?: string } })?.listas?.nombre;
          const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
          const movTipo = clasificarMovimientoAlmacen(tipo, listaNombre);
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
            const key = cod || nombre;
            if (!key) return;
            const cant = parseFloat(String(subItem.cantidadRecibida || subItem.cantidad || '0')) || 0;
            const modUpper = (subItem.modeloMaterial || 'GENERAL').toString().toUpperCase();

            if (!mapa[key]) {
              mapa[key] = {
                codigo: cod || key,
                nombre: nombre || cod,
                modelo: modUpper,
                stock: 0,
              };
            }
            if (cod && (!mapa[key].codigo || mapa[key].codigo === key)) {
              mapa[key].codigo = cod;
            }
            if (nombre && (mapa[key].nombre === '—' || mapa[key].nombre === cod)) {
              mapa[key].nombre = nombre;
            }

            mapa[key].stock += impacto.deltaEmpleado * cant;
          });
        });

        if (isMounted) {
          setStockCustodiaMiembro(Object.values(mapa).filter((m) => m.stock > 0));
        }
      } catch (err) {
        console.error('Error calculando custodia en formulario:', err);
      }
    };

    cargarCustodia();

    return () => {
      isMounted = false;
    };
  }, [empresaId, isDevolucionMode, asignadoA, nombreCompleto]);

  return {
    miembrosList,
    miembrosDetallados,
    stockDisponibles,
    todosLosMateriales,
    stockCustodiaMiembro,
  };
}
