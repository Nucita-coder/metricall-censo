import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tarjeta, GestionItem } from '../types/kanban';

export interface VendedorStats {
  vendedorNombre: string;
  totalVentas: number;
  totalCensos: number;
  totalLch: number;
  totalTarjetas: number;
  tasaConversion: number;
  tarjetas: Tarjeta[];
}

export interface CensadorStats {
  censadorNombre: string;
  totalCensados: number;
  conLch: number;
  conVenta: number;
  tarjetas: Tarjeta[];
}

export interface TecnicoStats {
  tecnicoNombre: string;
  totalAsignadas: number;
  completadas: number;
  liberadas: number;
  enProceso: number;
  tasaEficiencia: number;
  tarjetas: Tarjeta[];
}

export function useMetricasOperaciones(
  empresaId: string | null | undefined,
  filtroPeriodo: 'todo' | 'hoy' | '7dias' | 'mes'
) {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statsVendedores, setStatsVendedores] = useState<VendedorStats[]>([]);
  const [statsCensadores, setStatsCensadores] = useState<CensadorStats[]>([]);
  const [statsTecnicos, setStatsTecnicos] = useState<TecnicoStats[]>([]);

  const cargarMetricas = useCallback(async (isBackground = false) => {
    if (!empresaId) return;
    try {
      if (!isBackground) setIsLoading(true);

      const { data: sucursales, error: errorSuc } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      if (errorSuc) throw errorSuc;
      const sucursalIds = (sucursales || []).map(s => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: tableros, error: errorTab } = await supabase
        .from('tableros')
        .select('id')
        .in('sucursal_id', sucursalIds);

      if (errorTab) throw errorTab;
      const tableroIds = (tableros || []).map(t => t.id);
      if (tableroIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: listas, error: errorList } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id')
        .in('tablero_id', tableroIds);

      if (errorList) throw errorList;
      const listaIds = (listas || []).map(l => l.id);
      if (listaIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: tarjetasData, error: errorTar } = await supabase
        .from('tarjetas')
        .select('*')
        .in('lista_id', listaIds);

      if (errorTar) throw errorTar;
      const tarjetas = ((tarjetasData || []) as Tarjeta[]).filter(t => {
        const d = t.datos_valores || {};
        return (
          t.estado_archivo !== true &&
          !d.eliminada &&
          !d.eliminado &&
          !d.borrada &&
          !d.borrado &&
          d.estado_archivo !== true &&
          d.estado_archivo !== 'true'
        );
      });

      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, email')
        .eq('empresa_id', empresaId);

      const mapPerfiles = new Map<string, string>();
      (perfilesData || []).forEach(p => {
        if (p.id) mapPerfiles.set(p.id, p.nombre_completo || p.email);
      });

      const ahora = new Date();
      const tarjetasFiltradas = tarjetas.filter(t => {
        if (!t.created_at) return true;
        const fechaTarjeta = new Date(t.created_at);

        if (filtroPeriodo === 'hoy') {
          return fechaTarjeta.toDateString() === ahora.toDateString();
        }
        if (filtroPeriodo === '7dias') {
          const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          return fechaTarjeta >= hace7;
        }
        if (filtroPeriodo === 'mes') {
          return (
            fechaTarjeta.getMonth() === ahora.getMonth() &&
            fechaTarjeta.getFullYear() === ahora.getFullYear()
          );
        }
        return true;
      });

      const mapVendedores = new Map<string, VendedorStats>();
      const mapCensadores = new Map<string, CensadorStats>();
      const mapTecnicos = new Map<string, TecnicoStats>();

      tarjetasFiltradas.forEach(t => {
        const data = t.datos_valores || {};
        const listaNombre = listas?.find(l => l.id === t.lista_id)?.nombre || '';
        const cleanLista = listaNombre.toLowerCase();

        // VENDEDORES
        const vendedorRaw =
          data.vendedor ||
          data.asesorComercial ||
          data.supervisor ||
          'Sin Vendedor Asignado';
        const nombreVendedor = String(vendedorRaw).trim() || 'Sin Vendedor Asignado';

        const gestiones = (data.gestiones || []) as GestionItem[];
        const tieneVentaConcretada = gestiones.some((g: GestionItem) => g.resultado === 'Venta concretada');

        const esVenta =
          tieneVentaConcretada ||
          data.controlCalidad === 'Aprobado' ||
          cleanLista.includes('activo') ||
          cleanLista.includes('instalar') ||
          cleanLista.includes('activar');

        const esCenso =
          data.origen === 'censo' ||
          data.fechaCenso ||
          cleanLista.includes('censo') ||
          cleanLista.includes('desea');

        const tieneLch = !!data.lch_numero || !!data.lch_imagen;

        if (!mapVendedores.has(nombreVendedor)) {
          mapVendedores.set(nombreVendedor, {
            vendedorNombre: nombreVendedor,
            totalVentas: 0,
            totalCensos: 0,
            totalLch: 0,
            totalTarjetas: 0,
            tasaConversion: 0,
            tarjetas: [],
          });
        }
        const vStat = mapVendedores.get(nombreVendedor)!;
        vStat.totalTarjetas++;
        if (esVenta) vStat.totalVentas++;
        if (esCenso) vStat.totalCensos++;
        if (tieneLch) vStat.totalLch++;
        vStat.tarjetas.push(t);

        // CENSADORES
        const esPersonaCensada = esCenso || data.nombreApellido || data.cedula || data.direccion;
        if (esPersonaCensada) {
          const censadorRaw = data.vendedor || data.asesorComercial || data.censador || 'Sin Censador Asignado';
          const nombreCensador = String(censadorRaw).trim() || 'Sin Censador Asignado';

          if (!mapCensadores.has(nombreCensador)) {
            mapCensadores.set(nombreCensador, {
              censadorNombre: nombreCensador,
              totalCensados: 0,
              conLch: 0,
              conVenta: 0,
              tarjetas: [],
            });
          }
          const cStat = mapCensadores.get(nombreCensador)!;
          cStat.totalCensados++;
          if (tieneLch) cStat.conLch++;
          if (esVenta) cStat.conVenta++;
          cStat.tarjetas.push(t);
        }

        // TÉCNICOS
        const tecnicoRaw =
          data.tecnicoAsignado ||
          data.tecnico ||
          (t.asignado_a ? mapPerfiles.get(t.asignado_a as string) : null);

        if (tecnicoRaw) {
          const nombreTecnico = String(tecnicoRaw).trim();
          if (nombreTecnico && nombreTecnico !== 'Sin Vendedor Asignado') {
            const esInstalacionCompletada =
              cleanLista.includes('activar') ||
              cleanLista.includes('activo') ||
              data.reporteInstalacion ||
              data.fechaInstalacion ||
              gestiones.some((g: GestionItem) => g.resultado === 'Instalado' || g.resultado === 'Completado');

            const esInstalacionLiberada =
              data.motivoLiberacion ||
              data.estadoInstalacion === 'Liberada' ||
              cleanLista.includes('liberad') ||
              cleanLista.includes('rechazad') ||
              cleanLista.includes('no factible') ||
              gestiones.some((g: GestionItem) =>
                g.resultado === 'Liberada' ||
                g.resultado === 'Rechazada' ||
                g.resultado === 'No factible'
              );

            if (!mapTecnicos.has(nombreTecnico)) {
              mapTecnicos.set(nombreTecnico, {
                tecnicoNombre: nombreTecnico,
                totalAsignadas: 0,
                completadas: 0,
                liberadas: 0,
                enProceso: 0,
                tasaEficiencia: 0,
                tarjetas: [],
              });
            }

            const tStat = mapTecnicos.get(nombreTecnico)!;
            tStat.totalAsignadas++;
            if (esInstalacionCompletada) {
              tStat.completadas++;
            } else if (esInstalacionLiberada) {
              tStat.liberadas++;
            } else {
              tStat.enProceso++;
            }
            tStat.tarjetas.push(t);
          }
        }
      });

      const listaVendedores: VendedorStats[] = Array.from(mapVendedores.values()).map(v => {
        const totalBase = v.totalCensos > 0 ? v.totalCensos : v.totalTarjetas;
        const conversion = totalBase > 0 ? Math.round((v.totalVentas / totalBase) * 100) : 0;
        return { ...v, tasaConversion: conversion };
      });
      listaVendedores.sort((a, b) => b.totalVentas - a.totalVentas || b.totalCensos - a.totalCensos);

      const listaCensadores: CensadorStats[] = Array.from(mapCensadores.values());
      listaCensadores.sort((a, b) => b.totalCensados - a.totalCensados);

      const listaTecnicos: TecnicoStats[] = Array.from(mapTecnicos.values()).map(t => {
        const eficiencia = t.totalAsignadas > 0 ? Math.round((t.completadas / t.totalAsignadas) * 100) : 0;
        return { ...t, tasaEficiencia: eficiencia };
      });
      listaTecnicos.sort((a, b) => b.completadas - a.completadas || a.liberadas - b.liberadas);

      setStatsVendedores(listaVendedores);
      setStatsCensadores(listaCensadores);
      setStatsTecnicos(listaTecnicos);
    } catch (e: unknown) {
      console.error('[useMetricasOperaciones] Error:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, filtroPeriodo]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarMetricas(true);
  };

  return {
    isLoading,
    refreshing,
    onRefresh,
    cargarMetricas,
    statsVendedores,
    statsCensadores,
    statsTecnicos,
  };
}
