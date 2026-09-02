import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tarjeta } from '../../../types/kanban';
import {
  calcularStatsGestionOnline,
  parseFechaAObjeto,
} from './gestionOnlineUtils';
import {
  CANALES_GESTION_HEADERS,
  GestionOnlineStats,
  HORAS_JORNADA,
  MatrizOnlineData,
  MatrixResultadosOnlineData,
  PALETA_COLORES_CANALES,
  PALETA_COLORES_RESULTADOS,
  PeriodoKey,
  SliceDataItem,
  TODOS_LOS_RESULTADOS_ONLINE,
} from './types';

interface UseGestionOnlineDataProps {
  empresaId: string | null;
  periodoLocal: PeriodoKey;
  fechaInicio: string;
  fechaFin: string;
  mesEspecificoNum: number;
  anioEspecificoStr: string;
  mesCompararNum: number;
  anioCompararStr: string;
  periodoMatriz: string;
  fechaMatriz: string;
  mesMatrizNum: number;
  anioMatrizStr: string;
}

export function useGestionOnlineData({
  empresaId,
  periodoLocal,
  fechaInicio,
  fechaFin,
  mesEspecificoNum,
  anioEspecificoStr,
  mesCompararNum,
  anioCompararStr,
  periodoMatriz,
  fechaMatriz,
  mesMatrizNum,
  anioMatrizStr,
}: UseGestionOnlineDataProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rawTarjetas, setRawTarjetas] = useState<Tarjeta[]>([]);

  const [stats, setStats] = useState<GestionOnlineStats>({
    totalCasos: 0,
    totalEfectivos: 0,
    totalNegativos: 0,
    totalSeguimiento: 0,
    totalSinAtender: 0,
    tasaEfectividad: 0,
    tasaSinAtender: 0,
    serie12Meses: [],
  });

  const [statsComparativa, setStatsComparativa] = useState<GestionOnlineStats | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);

      const { data: sucursales } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      const sucursalIds = (sucursales || []).map(s => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: tableros } = await supabase
        .from('tableros')
        .select('id, nombre, tipo')
        .in('sucursal_id', sucursalIds);

      const tablerosOnline = (tableros || []).filter(t => {
        const n = (t.nombre || '').toLowerCase();
        return (
          t.tipo === 'gestion_online' ||
          t.tipo === 'atencion_fallas' ||
          n.includes('gestion online') ||
          n.includes('gestión online') ||
          n.includes('online') ||
          n.includes('whatsapp') ||
          n.includes('falla')
        );
      });

      const tableroIds = tablerosOnline.map(t => t.id);
      let tarjetasFound: Tarjeta[] = [];

      if (tableroIds.length > 0) {
        const { data: listas } = await supabase
          .from('listas')
          .select('id')
          .in('tablero_id', tableroIds);

        const listaIds = (listas || []).map(l => l.id);
        if (listaIds.length > 0) {
          const { data: tarjTableros } = await supabase
            .from('tarjetas')
            .select('*')
            .in('lista_id', listaIds);

          tarjetasFound = (tarjTableros || []) as Tarjeta[];
        }
      }

      const { data: tarjWhatsapp } = await supabase
        .from('tarjetas')
        .select('*')
        .eq('empresa_id', empresaId)
        .or('datos_valores->>origen.ilike.%whatsapp%,datos_valores->>origen.ilike.%online%,datos_valores->>origenImportacion.ilike.%whatsapp%')
        .limit(300);

      const mapTarjetas = new Map<string, Tarjeta>();
      tarjetasFound.forEach(t => mapTarjetas.set(t.id, t));
      (tarjWhatsapp || []).forEach(t => mapTarjetas.set(t.id, t as Tarjeta));

      const tarjetas = Array.from(mapTarjetas.values());
      setRawTarjetas(tarjetas);

      const baseAnio = parseInt(anioEspecificoStr, 10) || new Date().getFullYear();
      const statsPrincipal = calcularStatsGestionOnline(
        tarjetas,
        periodoLocal,
        mesEspecificoNum,
        baseAnio,
        fechaInicio,
        fechaFin
      );
      setStats(statsPrincipal);

      if (periodoLocal === 'comparativa') {
        const compAnio = parseInt(anioCompararStr, 10) || new Date().getFullYear();
        const statsComp = calcularStatsGestionOnline(
          tarjetas,
          'comparativa',
          mesCompararNum,
          compAnio,
          fechaInicio,
          fechaFin
        );
        setStatsComparativa(statsComp);
      } else {
        setStatsComparativa(null);
      }
    } catch (e: unknown) {
      console.error('[useGestionOnlineData] Error cargando métricas:', e);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, periodoLocal, fechaInicio, fechaFin, mesEspecificoNum, anioEspecificoStr, mesCompararNum, anioCompararStr]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const matrixData: MatrizOnlineData = useMemo(() => {
    const grid: number[][] = Array(HORAS_JORNADA.length)
      .fill(0)
      .map(() => Array(5).fill(0));
    const columnTotals: number[] = Array(5).fill(0);
    let totalActividadesPeriodo = 0;

    const ahora = new Date();
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    hace7.setHours(0, 0, 0, 0);
    const hace15 = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    hace15.setHours(0, 0, 0, 0);

    const targetDateObj = parseFechaAObjeto(fechaMatriz);
    const targetDayStr = targetDateObj ? targetDateObj.toDateString() : '';

    rawTarjetas.forEach(t => {
      const d = t.datos_valores || {};
      const rawF = d.fechaVenta || d.fechaUltimaGestionPago || t.created_at || t.updated_at;
      if (!rawF) return;
      const fObj = parseFechaAObjeto(String(rawF));
      if (!fObj) return;

      if (periodoMatriz === 'Hoy' && fObj.toDateString() !== ahora.toDateString()) return;
      if (periodoMatriz === 'Semanal (7 días)' && fObj < hace7) return;
      if (periodoMatriz === 'Quincenal (15 días)' && fObj < hace15) return;
      if (periodoMatriz === 'Mensual (Este Mes)' && (fObj.getMonth() !== ahora.getMonth() || fObj.getFullYear() !== ahora.getFullYear())) return;
      if (periodoMatriz.includes('Mes Específico')) {
        const yMat = parseInt(anioMatrizStr, 10) || ahora.getFullYear();
        if (fObj.getMonth() !== mesMatrizNum || fObj.getFullYear() !== yMat) return;
      }
      if (periodoMatriz === 'Almanaque' && targetDayStr && fObj.toDateString() !== targetDayStr) return;

      const hour = fObj.getHours();
      const rIdx = hour >= 8 && hour <= 17 ? hour - 8 : (hour < 8 ? 0 : 9);

      let cIdx = 0;
      if (Boolean(d.comprobantePagoUrl || d.montoPago || d.estadoCobranza)) cIdx = 1;
      else if (Boolean(d.tipoFalla || d.estadoSoporte)) cIdx = 2;
      else if (d.origen === 'WhatsApp Bot' && !d.plan_hogar && !d.plan_pymes) cIdx = 3;
      else if (d.estadoGestion === 'compra_efectiva') cIdx = 4;

      grid[rIdx][cIdx]++;
      columnTotals[cIdx]++;
      totalActividadesPeriodo++;
    });

    return { grid, columnTotals, totalActividadesPeriodo };
  }, [rawTarjetas, periodoMatriz, fechaMatriz, mesMatrizNum, anioMatrizStr]);

  const matrixResultadosData: MatrixResultadosOnlineData = useMemo(() => {
    const countsMap = new Map<string, number>();
    let totalResultadosPeriodo = 0;

    rawTarjetas.forEach(t => {
      const d = t.datos_valores || {};
      const estadoG = String(d.estadoGestion || '').toLowerCase();
      const estadoCob = String(d.estadoCobranza || '').toLowerCase();
      const estadoSop = String(d.estadoSoporte || '').toLowerCase();

      let clave = 'sin_atender';

      if (estadoG === 'compra_efectiva' || Boolean(d.fechaVenta && (d.plan_hogar || d.plan_pymes))) {
        clave = 'compra_efectiva';
      } else if (estadoCob === 'pago procesado') {
        clave = 'pago_procesado';
      } else if (estadoSop.includes('procesado') || estadoSop.includes('sae')) {
        clave = 'procesado_en_sae';
      } else if (estadoG === 'comprara_luego') {
        clave = 'comprara_luego';
      } else if (estadoCob === 'pago en revisión' || estadoCob.includes('revisión')) {
        clave = 'pago_en_revision';
      } else if (estadoCob === 'pago rechazado') {
        clave = 'pago_rechazado';
      } else if (estadoG === 'no_quiso_servicio') {
        clave = 'no_quiso_servicio';
      } else if (estadoG === 'liberada_sin_caja' || Boolean(d.motivoLiberada)) {
        clave = 'liberada_sin_caja';
      }

      countsMap.set(clave, (countsMap.get(clave) || 0) + 1);
      totalResultadosPeriodo++;
    });

    return { countsMap, totalResultadosPeriodo };
  }, [rawTarjetas]);

  const pieDataCanales: SliceDataItem[] = useMemo(() => {
    return CANALES_GESTION_HEADERS.map((header, idx) => ({
      label: header,
      count: matrixData.columnTotals[idx] || 0,
      color: PALETA_COLORES_CANALES[idx % PALETA_COLORES_CANALES.length],
    }));
  }, [matrixData]);

  const pieDataResultados: SliceDataItem[] = useMemo(() => {
    return TODOS_LOS_RESULTADOS_ONLINE.map((res, idx) => ({
      label: res.label,
      count: matrixResultadosData.countsMap.get(res.clave) || 0,
      color: PALETA_COLORES_RESULTADOS[idx % PALETA_COLORES_RESULTADOS.length],
    }));
  }, [matrixResultadosData]);

  return {
    isLoading,
    rawTarjetas,
    stats,
    statsComparativa,
    matrixData,
    matrixResultadosData,
    pieDataCanales,
    pieDataResultados,
    refetch: cargarDatos,
  };
}
