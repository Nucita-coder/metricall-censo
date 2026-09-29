import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { CensoStats, PeriodoCensoTipo, AsesorCensoStat, SectorCensoStat } from './types';
import { isFechaEnPeriodo, parseFechaCenso } from './censoConstants';

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
    if (!empresaId) return;
    try {
      setIsLoading(true);

      const { data: sucursales, error: errSuc } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      if (errSuc) throw errSuc;
      const sucursalIds = (sucursales || []).map((s) => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

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
      let listaMap = new Map<string, string>(); // listaId -> nombre

      if (tableroIds.length > 0) {
        const { data: listas, error: errLis } = await supabase
          .from('listas')
          .select('id, nombre, tablero_id')
          .in('tablero_id', tableroIds);

        if (errLis) throw errLis;
        (listas || []).forEach((l) => listaMap.set(l.id, l.nombre));
      }

      // Consultar tarjetas de la empresa
      const listaIds = Array.from(listaMap.keys());
      let query = supabase
        .from('tarjetas')
        .select('*')
        .eq('empresa_id', empresaId);

      if (listaIds.length > 0) {
        query = query.or(`lista_id.in.(${listaIds.join(',')}),datos_valores->>origen.eq.censo`);
      } else {
        query = query.filter('datos_valores->>origen', 'eq', 'censo');
      }

      const { data: tarjetasRaw, error: errTar } = await query;
      if (errTar) throw errTar;

      // Filtrar no borradas
      const tarjetasValidas = ((tarjetasRaw || []) as Tarjeta[]).filter((t) => {
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

      // Deduplicar prospectos que hayan sido clonados entre Censo y columnas de destino
      const deduplicatedMap = new Map<string, Tarjeta>();
      tarjetasValidas.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const keyDoc = (d.documentoIdentidad || d.cedula || d.telefonoMovil || d.nombreApellido || t.id).trim().toLowerCase();
        const existing = deduplicatedMap.get(keyDoc);

        if (!existing) {
          deduplicatedMap.set(keyDoc, t);
        } else {
          // Si ya existe, preferir la tarjeta con lista más específica o con más gestiones
          const listaActual = (listaMap.get(t.lista_id) || '').toLowerCase();
          const listaExistente = (listaMap.get(existing.lista_id) || '').toLowerCase();
          if (listaActual !== 'censo' && listaExistente === 'censo') {
            deduplicatedMap.set(keyDoc, t);
          }
        }
      });

      const tarjetasUnicas = Array.from(deduplicatedMap.values());

      // Filtrado por fecha de censo/creación
      const anioNum = Number(anioEspecificoStr) || new Date().getFullYear();
      const tarjetasFiltradas = tarjetasUnicas.filter((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const fecha = parseFechaCenso(d.fechaCenso || d.fechaVenta || t.created_at);
        return isFechaEnPeriodo(fecha, periodoLocal, mesEspecificoNum, anioNum);
      });

      // Extraer lista de asesores activos en el período
      const nombresAsesores = new Set<string>();
      tarjetasFiltradas.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const asesor = String(d.asesorComercial || d.vendedor || d.censador || '').trim();
        if (asesor) nombresAsesores.add(asesor);
      });
      setListaAsesores(['Todos los Asesores', ...Array.from(nombresAsesores).sort()]);

      // Filtrar por asesor seleccionado si no es 'Todos los Asesores'
      const tarjetasParaCalculo = (asesorFiltro && asesorFiltro !== 'Todos los Asesores')
        ? tarjetasFiltradas.filter((t) => {
            const d = (t.datos_valores || {}) as TarjetaDatosValores;
            const asesor = String(d.asesorComercial || d.vendedor || d.censador || 'Sin Asesor Asignado').trim();
            return asesor === asesorFiltro;
          })
        : tarjetasFiltradas;

      // Calcular Indicadores
      let totalCensados = 0;
      let totalInteresados = 0;
      let totalIndecisos = 0;
      let totalNoInteresados = 0;
      let totalGestiones = 0;

      const mapaAsesores = new Map<string, AsesorCensoStat>();
      const mapaSectores = new Map<string, number>();

      tarjetasParaCalculo.forEach((t) => {
        const d = (t.datos_valores || {}) as TarjetaDatosValores;
        const listaNombre = (listaMap.get(t.lista_id) || '').toLowerCase().trim();
        const dispuesto = String(d.dispuestoCambiar || '').toLowerCase().trim();

        totalCensados++;

        // Clasificar interés
        let tipoInteres: 'interesado' | 'indeciso' | 'noInteresado';
        if (dispuesto === 'sí' || dispuesto === 'si' || listaNombre.includes('si desea') || listaNombre.includes('sí desea')) {
          totalInteresados++;
          tipoInteres = 'interesado';
        } else if (dispuesto === 'no' || listaNombre.includes('no desea')) {
          totalNoInteresados++;
          tipoInteres = 'noInteresado';
        } else {
          // 'es posible' o indeciso
          totalIndecisos++;
          tipoInteres = 'indeciso';
        }

        // Conteo de gestiones
        const gestiones = Array.isArray(d.gestiones) ? d.gestiones : [];
        const cantGestionesTarjeta = gestiones.length;
        totalGestiones += cantGestionesTarjeta;

        // Agrupación por Asesor
        const asesorRaw = String(d.asesorComercial || d.vendedor || d.censador || 'Sin Asesor Asignado').trim();
        const asesorNombre = asesorRaw || 'Sin Asesor Asignado';

        if (!mapaAsesores.has(asesorNombre)) {
          mapaAsesores.set(asesorNombre, {
            asesorNombre,
            totalCensados: 0,
            interesados: 0,
            indecisos: 0,
            noInteresados: 0,
            gestiones: 0,
          });
        }
        const asStat = mapaAsesores.get(asesorNombre)!;
        asStat.totalCensados++;
        asStat.gestiones += cantGestionesTarjeta;
        if (tipoInteres === 'interesado') asStat.interesados++;
        else if (tipoInteres === 'indeciso') asStat.indecisos++;
        else asStat.noInteresados++;

        // Agrupación por Sector
        const sectorRaw = String(d.sector || d.urbanizacion || d.zona || d.ciudad || 'Sector No Especificado').trim();
        const sectorNombre = sectorRaw || 'Sector No Especificado';
        mapaSectores.set(sectorNombre, (mapaSectores.get(sectorNombre) || 0) + 1);
      });

      // Ordenar Asesores por volumen de censados descendente
      const porAsesor = Array.from(mapaAsesores.values()).sort(
        (a, b) => b.totalCensados - a.totalCensados
      );

      // Ordenar Sectores por volumen descendente
      const porSector: SectorCensoStat[] = Array.from(mapaSectores.entries())
        .map(([sectorNombre, count]) => ({
          sectorNombre,
          totalCensados: count,
          porcentaje: totalCensados > 0 ? (count / totalCensados) * 100 : 0,
        }))
        .sort((a, b) => b.totalCensados - a.totalCensados);

      // Tasas porcentuales
      const tasaInteres = totalCensados > 0 ? (totalInteresados / totalCensados) * 100 : 0;
      const tasaIndecision = totalCensados > 0 ? (totalIndecisos / totalCensados) * 100 : 0;
      const tasaNoInteres = totalCensados > 0 ? (totalNoInteresados / totalCensados) * 100 : 0;

      setStats({
        kpis: {
          totalCensados,
          totalInteresados,
          totalIndecisos,
          totalNoInteresados,
          totalGestiones,
          tasaInteres,
          tasaIndecision,
          tasaNoInteres,
        },
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
