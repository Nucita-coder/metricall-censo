import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { VentasStats, PeriodoVentasTipo } from './types';
import { isFechaVentaEnPeriodo, parseFechaVenta } from './ventasConstants';
import { procesarMetricasVentas } from './ventasCalculos';
import {
  PerfilRowVentas,
  esAsesorPerfilVentas,
  esTarjetaDeVenta,
} from './ventasExtraccion';

export function useVentasData(
  empresaId: string | null | undefined,
  periodoLocal: PeriodoVentasTipo,
  mesEspecificoNum: number,
  anioEspecificoStr: string,
  asesorFiltro: string = 'Todos los Asesores'
) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [listaAsesores, setListaAsesores] = useState<string[]>(['Todos los Asesores']);
  const [stats, setStats] = useState<VentasStats>({
    kpis: {
      totalVentas: 0,
      ventasFactibles: 0,
      ventasPorInstalar: 0,
      ventasInstaladas: 0,
      ventasRechazadas: 0,
      ventasEnVerificacion: 0,
      tasaFactibilidad: 0,
    },
    porAsesor: [],
    porFactibilidad: [],
    porZona: [],
    porTipo: [],
    porPlan: [],
    rawTarjetas: [],
  });

  const cargarDatosVentas = useCallback(async () => {
    try {
      setIsLoading(true);

      let targetEmpresaId = empresaId;
      if (!targetEmpresaId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: miPerfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('id', session.user.id)
            .maybeSingle();
          targetEmpresaId = miPerfil?.empresa_id;
        }
      }

      if (!targetEmpresaId) {
        setIsLoading(false);
        return;
      }

      // 1. Consultar todos los perfiles de la empresa con etiqueta o rol comercial
      const { data: perfilesData, error: errPerfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol, etiquetas')
        .eq('empresa_id', targetEmpresaId)
        .order('nombre_completo', { ascending: true });

      if (errPerfiles) {
        console.warn('Error al consultar perfiles en ventas:', errPerfiles);
      }

      const asesoresPerfiles = ((perfilesData || []) as PerfilRowVentas[]).filter(esAsesorPerfilVentas);
      const nombresAsesoresSet = new Set<string>();
      asesoresPerfiles.forEach((p) => {
        const nombre = (p.nombre_completo || '').trim();
        if (nombre) nombresAsesoresSet.add(nombre);
      });

      // 2. Consultar sucursales y tableros
      const { data: sucursales, error: errSuc } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', targetEmpresaId);

      if (errSuc) throw errSuc;
      const sucursalIds = (sucursales || []).map((s) => s.id);

      let listaMap = new Map<string, string>();
      let tarjetasRaw: Tarjeta[] = [];

      if (sucursalIds.length > 0) {
        const { data: tableros, error: errTab } = await supabase
          .from('tableros')
          .select('id, nombre, tipo')
          .in('sucursal_id', sucursalIds);

        if (errTab) throw errTab;
        const tableroIds = (tableros || []).map((t) => t.id);

        if (tableroIds.length > 0) {
          const { data: listas, error: errLis } = await supabase
            .from('listas')
            .select('id, nombre, tablero_id')
            .in('tablero_id', tableroIds);

          if (errLis) throw errLis;
          (listas || []).forEach((l) => listaMap.set(l.id, l.nombre));
        }

        const { data: tarData, error: errTar } = await supabase
          .from('tarjetas')
          .select('*')
          .eq('empresa_id', targetEmpresaId);

        if (errTar) throw errTar;
        tarjetasRaw = (tarData || []) as Tarjeta[];
      }

      // 3. Filtrar tarjetas activas y correspondientes a ventas
      const tarjetasValidas = tarjetasRaw.filter((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const noBorrada =
          t.estado_archivo !== true &&
          !d.eliminada &&
          !d.eliminado &&
          !d.borrada &&
          !d.borrado &&
          d.estado_archivo !== true &&
          d.estado_archivo !== 'true';

        return noBorrada && esTarjetaDeVenta(t, listaMap);
      });

      // Deduplicar prospectos que hayan sido clonados en diferentes fases
      const deduplicatedMap = new Map<string, Tarjeta>();
      tarjetasValidas.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const keyDoc = (
          d.documentoIdentidad ||
          d.cedula ||
          d.telefonoMovil ||
          d.nombreApellido ||
          t.id
        ).trim().toLowerCase();

        const existing = deduplicatedMap.get(keyDoc);
        if (!existing) {
          deduplicatedMap.set(keyDoc, t);
        } else {
          // Preferir la que esté en etapa más avanzada (cliente activo > instalar > factibilidad > venta)
          const actualLn = (listaMap.get(t.lista_id) || '').toLowerCase();
          const existLn = (listaMap.get(existing.lista_id) || '').toLowerCase();
          if (actualLn.includes('activo') || actualLn.includes('instalar')) {
            deduplicatedMap.set(keyDoc, t);
          }
        }
      });

      const tarjetasUnicas = Array.from(deduplicatedMap.values());

      // Filtrado por fecha de venta o creación
      const anioNum = Number(anioEspecificoStr) || new Date().getFullYear();
      const tarjetasFiltradas = tarjetasUnicas.filter((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const fecha = parseFechaVenta(d.fechaVenta || d.fechaInstalacion || t.created_at);
        return isFechaVentaEnPeriodo(fecha, periodoLocal, mesEspecificoNum, anioNum);
      });

      // Añadir asesores que aparezcan en las tarjetas a la lista
      tarjetasFiltradas.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const asesor = String(d.vendedor || d.asesorComercial || d.supervisor || '').trim();
        if (asesor) nombresAsesoresSet.add(asesor);
      });

      const nombresAsesoresOrdenados = Array.from(nombresAsesoresSet).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      setListaAsesores(['Todos los Asesores', ...nombresAsesoresOrdenados]);

      // Filtrar por asesor seleccionado si no es 'Todos los Asesores'
      const isTodosLosAsesores = !asesorFiltro || asesorFiltro === 'Todos los Asesores';
      const tarjetasParaCalculo = isTodosLosAsesores
        ? tarjetasFiltradas
        : tarjetasFiltradas.filter((t) => {
            const d = (t.datos_valores || {}) as TarjetaDatosValores;
            const asesor = String(d.vendedor || d.asesorComercial || d.supervisor || 'Sin Asesor Asignado').trim();
            return asesor.toLowerCase() === asesorFiltro.toLowerCase();
          });

      // 4. Procesar estadísticas agrupadas
      const resultado = procesarMetricasVentas(
        tarjetasParaCalculo,
        nombresAsesoresOrdenados,
        listaMap,
        asesorFiltro,
        isTodosLosAsesores
      );

      setStats(resultado);
    } catch (err) {
      console.error('Error al cargar métricas de ventas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, periodoLocal, mesEspecificoNum, anioEspecificoStr, asesorFiltro]);

  useEffect(() => {
    cargarDatosVentas();
  }, [cargarDatosVentas]);

  return {
    isLoading,
    stats,
    listaAsesores,
    recargar: cargarDatosVentas,
  };
}
