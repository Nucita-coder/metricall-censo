import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { CensoStats, PeriodoCensoTipo } from './types';
import { isFechaEnPeriodo, parseFechaCenso } from './censoConstants';
import {
  PerfilRow,
  esAsesorPerfil,
  deduplicarTarjetasCenso,
  procesarMetricasCenso,
} from './censoCalculos';

export function useCensoData(
  empresaId: string | null | undefined,
  periodoLocal: PeriodoCensoTipo,
  mesEspecificoNum: number,
  anioEspecificoStr: string,
  asesorFiltro: string = 'Todos los Asesores'
) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [listaAsesores, setListaAsesores] = useState<string[]>(['Todos los Asesores']);
  const [stats, setStats] = useState<CensoStats>({
    kpis: {
      totalCensados: 0,
      totalInteresados: 0,
      totalIndecisos: 0,
      totalNoInteresados: 0,
      totalGestiones: 0,
      tasaInteres: 0,
      tasaIndecision: 0,
      tasaNoInteres: 0,
    },
    porAsesor: [],
    porSector: [],
    rawTarjetas: [],
  });

  const cargarDatosCenso = useCallback(async () => {
    try {
      setIsLoading(true);

      // Obtener o asegurar empresaId desde la sesión si viene vacío
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

      // 1. Consultar todos los perfiles de la empresa con etiqueta o rol de asesor
      const { data: perfilesData, error: errPerfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol, etiquetas')
        .eq('empresa_id', targetEmpresaId)
        .order('nombre_completo', { ascending: true });

      if (errPerfiles) {
        console.warn('Error al consultar perfiles en censo:', errPerfiles);
      }

      const idToNombreMap = new Map<string, string>();
      ((perfilesData || []) as PerfilRow[]).forEach((p) => {
        const n = (p.nombre_completo || '').trim();
        if (p.id && n) idToNombreMap.set(p.id, n);
      });

      const asesoresPerfiles = ((perfilesData || []) as PerfilRow[]).filter(esAsesorPerfil);
      const nombresAsesoresSet = new Set<string>();
      asesoresPerfiles.forEach((p) => {
        const nombre = (p.nombre_completo || '').trim();
        if (nombre) nombresAsesoresSet.add(nombre);
      });

      // 2. Consultar sucursales y tableros de censo
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

        const tablerosCenso = (tableros || []).filter((t) => {
          const n = (t.nombre || '').toLowerCase();
          return t.tipo === 'censo' || n.includes('censo');
        });

        const tableroIds = tablerosCenso.map((t) => t.id);

        if (tableroIds.length > 0) {
          const { data: listas, error: errLis } = await supabase
            .from('listas')
            .select('id, nombre, tablero_id')
            .in('tablero_id', tableroIds);

          if (errLis) throw errLis;
          (listas || []).forEach((l) => listaMap.set(l.id, l.nombre));
        }

        const listaIds = Array.from(listaMap.keys());
        let query = supabase
          .from('tarjetas')
          .select('*')
          .eq('empresa_id', targetEmpresaId);

        if (listaIds.length > 0) {
          query = query.or(`lista_id.in.(${listaIds.join(',')}),datos_valores->>origen.eq.censo`);
        } else {
          query = query.filter('datos_valores->>origen', 'eq', 'censo');
        }

        const { data: tarData, error: errTar } = await query;
        if (errTar) throw errTar;
        tarjetasRaw = (tarData || []) as Tarjeta[];
      }

      // 3. Filtrar tarjetas activas (no eliminadas ni archivadas)
      const tarjetasValidas = tarjetasRaw.filter((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
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

      // Deduplicar prospectos
      const tarjetasUnicas = deduplicarTarjetasCenso(tarjetasValidas, listaMap);

      // Filtrado por fecha de censo/creación
      const anioNum = Number(anioEspecificoStr) || new Date().getFullYear();
      const tarjetasFiltradas = tarjetasUnicas.filter((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const fecha = parseFechaCenso(d.fechaCenso || d.fechaVenta || t.created_at);
        return isFechaEnPeriodo(fecha, periodoLocal, mesEspecificoNum, anioNum);
      });

      // Agregar cualquier asesor que aparezca en tarjetas existentes a la lista
      tarjetasFiltradas.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        if (!d.asesorComercial && !d.asignadoA && !d.vendedor && t.creador_id && idToNombreMap.has(t.creador_id)) {
          d.asesorComercial = idToNombreMap.get(t.creador_id);
        }
        const asesor = String(d.asesorComercial || d.asignadoA || d.vendedor || d.censador || '').trim();
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
            const asesor = String(d.asesorComercial || d.asignadoA || d.vendedor || d.censador || 'Sin Asesor Asignado').trim();
            return asesor.toLowerCase() === asesorFiltro.toLowerCase();
          });

      // 4. Procesar estadísticas agrupadas
      const { kpis, porAsesor, porSector } = procesarMetricasCenso(
        tarjetasParaCalculo,
        nombresAsesoresOrdenados,
        listaMap,
        asesorFiltro,
        isTodosLosAsesores
      );

      setStats({
        kpis,
        porAsesor,
        porSector,
        rawTarjetas: tarjetasParaCalculo,
      });
    } catch (err) {
      console.error('Error al cargar métricas de censo:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, periodoLocal, mesEspecificoNum, anioEspecificoStr, asesorFiltro]);

  useEffect(() => {
    cargarDatosCenso();
  }, [cargarDatosCenso]);

  return {
    isLoading,
    stats,
    listaAsesores,
    recargar: cargarDatosCenso,
  };
}
