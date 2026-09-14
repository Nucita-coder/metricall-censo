import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tarjeta } from '../../../types/kanban';
import { CobranzaStats, MesCobranzaData, PeriodoTipo } from './types';
import { NOMBRES_MESES_DROPDOWN, parseFechaAObjeto } from './cobranzaConstants';

export function useCobranzaData(
  empresaId: string | null,
  periodoLocal: PeriodoTipo,
  mesEspecificoNum: number,
  anioEspecificoStr: string,
  mesCompararNum: number,
  anioCompararStr: string,
  fechaInicio: string,
  fechaFin: string
) {
  const [isLoading, setIsLoading] = useState(true);
  const [rawTarjetasCobranza, setRawTarjetasCobranza] = useState<Tarjeta[]>([]);
  const [stats, setStats] = useState<CobranzaStats>({
    totalCortados: 0,
    totalEfectivos: 0,
    totalNegativos: 0,
    totalSinAtender: 0,
    tasaRecuperacion: 0,
    tasaSinAtender: 0,
    serie12Meses: [],
  });

  const cargarDatosCobranza = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);

      const { data: sucursales } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      const sucursalIds = (sucursales || []).map((s) => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: tableros } = await supabase
        .from('tableros')
        .select('id, nombre, tipo, archivado, mes_periodo')
        .in('sucursal_id', sucursalIds);

      const tablerosCobranza = (tableros || []).filter((t) => {
        const n = (t.nombre || '').toLowerCase();
        return (
          t.tipo === 'cobranza' ||
          n.includes('cobranza') ||
          n.includes('recupero') ||
          n.includes('cortado')
        );
      });

      const tableroIds = tablerosCobranza.map((t) => t.id);
      if (tableroIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: listas } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id')
        .in('tablero_id', tableroIds);

      if (!listas || listas.length === 0) {
        setIsLoading(false);
        return;
      }

      const listaIdsCobranza = listas.map((l) => l.id);
      const { data: tarjetasData, error } = await supabase
        .from('tarjetas')
        .select('*')
        .in('lista_id', listaIdsCobranza);

      if (error) throw error;
      const tarjetas = ((tarjetasData || []) as Tarjeta[]).filter((t) => {
        const data = t.datos_valores || {};
        return (
          t.estado_archivo !== true &&
          !data.eliminada &&
          !data.eliminado &&
          !data.borrada &&
          !data.borrado &&
          data.estado_archivo !== true &&
          data.estado_archivo !== 'true'
        );
      });
      setRawTarjetasCobranza(tarjetas);

      const ahora = new Date();
      const inicioObj = fechaInicio ? parseFechaAObjeto(fechaInicio) : null;
      if (inicioObj) inicioObj.setHours(0, 0, 0, 0);

      const finObj = fechaFin ? parseFechaAObjeto(fechaFin) : null;
      if (finObj) finObj.setHours(23, 59, 59, 999);

      const tarjetasFiltradas = tarjetas.filter((t) => {
        if (periodoLocal === 'todo') return true;
        const data = t.datos_valores || {};
        const fechaStr = data.fechaCobroReconciliacion || t.created_at || t.updated_at;
        if (!fechaStr) return true;
        const fechaTarjeta = parseFechaAObjeto(fechaStr);
        if (!fechaTarjeta) return true;

        if (periodoLocal === 'hoy') {
          return fechaTarjeta.toDateString() === ahora.toDateString();
        }
        if (periodoLocal === '7dias') {
          const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          return fechaTarjeta >= hace7;
        }
        if (periodoLocal === 'mes') {
          return (
            fechaTarjeta.getMonth() === ahora.getMonth() &&
            fechaTarjeta.getFullYear() === ahora.getFullYear()
          );
        }
        if (periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') {
          const targetYear = parseInt(anioEspecificoStr, 10) || ahora.getFullYear();
          return (
            fechaTarjeta.getMonth() === mesEspecificoNum &&
            fechaTarjeta.getFullYear() === targetYear
          );
        }
        if (periodoLocal === 'personalizado') {
          if (inicioObj && fechaTarjeta < inicioObj) return false;
          if (finObj && fechaTarjeta > finObj) return false;
          return true;
        }
        return true;
      });

      let efectivos = 0;
      let negativos = 0;
      let sinAtender = 0;

      const mapMeses = new Map<string, MesCobranzaData>();
      const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      tarjetasFiltradas.forEach((t) => {
        const data = t.datos_valores || {};
        const listaObj = listas.find((l) => l.id === t.lista_id);
        const listaNombre = (listaObj?.nombre || '').toLowerCase();
        const resStr = (data.resultadoContacto || data.RESULTADO || data.resultado || '')
          .toString()
          .trim()
          .toUpperCase();

        const esCobroExitoso = resStr === 'COBRO EFECTIVO' || resStr === 'RECUPERADO';
        const esNegativa =
          listaNombre.includes('negativa') ||
          resStr === 'FUERA DE ZONA' ||
          (Boolean(data.resultadoContacto) && !esCobroExitoso);

        if (esCobroExitoso) {
          efectivos++;
        } else if (esNegativa) {
          negativos++;
        } else {
          sinAtender++;
        }

        const fechaStr = data.fechaCobroReconciliacion || t.updated_at || t.created_at;
        const fechaObj = fechaStr ? new Date(fechaStr) : new Date();
        const year = fechaObj.getFullYear();
        const monthIndex = fechaObj.getMonth();
        const claveMes = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const nombreMes = `${NOMBRES_MESES_DROPDOWN[monthIndex]} ${year}`;
        const nombreCorto = mesesCortos[monthIndex];

        if (!mapMeses.has(claveMes)) {
          mapMeses.set(claveMes, {
            claveMes,
            nombreMes,
            nombreCorto,
            totalEfectivos: 0,
            totalNegativos: 0,
            totalSinAtender: 0,
            totalGeneral: 0,
            tasaEfectividad: 0,
            tasaSinAtender: 0,
          });
        }

        const mData = mapMeses.get(claveMes)!;
        mData.totalGeneral++;
        if (esCobroExitoso) {
          mData.totalEfectivos++;
        } else if (esNegativa) {
          mData.totalNegativos++;
        } else {
          mData.totalSinAtender++;
        }
      });

      const totalTotal = tarjetasFiltradas.length;
      const tasaEfectivaGeneral = totalTotal > 0 ? Math.round((efectivos / totalTotal) * 100) : 0;
      const tasaSinAtenderGeneral = totalTotal > 0 ? Math.round((sinAtender / totalTotal) * 100) : 0;

      const yearActual = ahora.getFullYear();
      const serie12Meses: MesCobranzaData[] = mesesCortos.map((corto, i) => {
        const claveMes = `${yearActual}-${String(i + 1).padStart(2, '0')}`;
        const mData = mapMeses.get(claveMes);
        if (mData) {
          const tasaM = mData.totalGeneral > 0 ? Math.round((mData.totalEfectivos / mData.totalGeneral) * 100) : 0;
          const tasaSA = mData.totalGeneral > 0 ? Math.round((mData.totalSinAtender / mData.totalGeneral) * 100) : 0;
          return { ...mData, tasaEfectividad: tasaM, tasaSinAtender: tasaSA };
        }
        return {
          claveMes,
          nombreMes: `${NOMBRES_MESES_DROPDOWN[i]} ${yearActual}`,
          nombreCorto: corto,
          totalEfectivos: 0,
          totalNegativos: 0,
          totalSinAtender: 0,
          totalGeneral: 0,
          tasaEfectividad: 0,
          tasaSinAtender: 0,
        };
      });

      setStats({
        totalCortados: totalTotal,
        totalEfectivos: efectivos,
        totalNegativos: negativos,
        totalSinAtender: sinAtender,
        tasaRecuperacion: tasaEfectivaGeneral,
        tasaSinAtender: tasaSinAtenderGeneral,
        serie12Meses,
      });
    } catch (err) {
      console.error('Error al cargar métricas cuantitativas de cobranza:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, periodoLocal, fechaInicio, fechaFin, mesEspecificoNum, anioEspecificoStr]);

  useEffect(() => {
    cargarDatosCobranza();
  }, [cargarDatosCobranza]);

  const statsComparativa = useMemo(() => {
    if (periodoLocal !== 'comparativa' || !rawTarjetasCobranza.length) {
      return null;
    }

    const targetYear = parseInt(anioCompararStr, 10) || new Date().getFullYear();
    let efectivos = 0;
    let negativos = 0;
    let sinAtender = 0;

    const tarjetasMesB = rawTarjetasCobranza.filter((t) => {
      const data = t.datos_valores || {};
      const fechaStr = data.fechaCobroReconciliacion || t.created_at || t.updated_at;
      if (!fechaStr) return false;
      const fechaTarjeta = parseFechaAObjeto(fechaStr);
      if (!fechaTarjeta) return false;

      return (
        fechaTarjeta.getMonth() === mesCompararNum &&
        fechaTarjeta.getFullYear() === targetYear
      );
    });

    tarjetasMesB.forEach((t) => {
      const data = t.datos_valores || {};
      const resStr = (data.resultadoContacto || data.RESULTADO || data.resultado || '')
        .toString()
        .trim()
        .toUpperCase();
      const esCobroExitoso = resStr === 'COBRO EFECTIVO' || resStr === 'RECUPERADO';

      if (esCobroExitoso) {
        efectivos++;
      } else if (resStr === 'FUERA DE ZONA' || Boolean(data.resultadoContacto)) {
        negativos++;
      } else {
        sinAtender++;
      }
    });

    const totalTotal = tarjetasMesB.length;
    const tasaRecuperacion = totalTotal > 0 ? Math.round((efectivos / totalTotal) * 100) : 0;
    const tasaSinAtender = totalTotal > 0 ? Math.round((sinAtender / totalTotal) * 100) : 0;

    return {
      totalCortados: totalTotal,
      totalEfectivos: efectivos,
      totalNegativos: negativos,
      totalSinAtender: sinAtender,
      tasaRecuperacion,
      tasaSinAtender,
    };
  }, [rawTarjetasCobranza, periodoLocal, mesCompararNum, anioCompararStr]);

  return {
    isLoading,
    rawTarjetasCobranza,
    stats,
    statsComparativa,
    cargarDatosCobranza,
  };
}
