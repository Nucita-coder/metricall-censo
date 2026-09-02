import { Tarjeta } from '../../../types/kanban';
import {
  GestionOnlineStats,
  MesOnlineData,
  NOMBRES_MESES_DROPDOWN,
  PeriodoKey,
} from './types';

export function parseFechaAObjeto(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();
  if (!str) return null;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split(/[,\s]+/);
    const [d, m, y] = parts[0].split('/').map(Number);
    let hh = 0, mm = 0, ss = 0;
    if (parts.length > 1) {
      const timeStr = parts.slice(1).join(' ');
      const dummyDate = new Date(`1970-01-01 ${timeStr}`);
      if (!isNaN(dummyDate.getTime())) {
        hh = dummyDate.getHours();
        mm = dummyDate.getMinutes();
        ss = dummyDate.getSeconds();
      }
    }
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getTodayString(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function calcularStatsGestionOnline(
  sourceList: Tarjeta[],
  filtroPeriodo: PeriodoKey,
  targetMes: number,
  targetAnio: number,
  fechaInicio: string,
  fechaFin: string
): GestionOnlineStats {
  const ahora = new Date();
  const inicioObj = fechaInicio ? parseFechaAObjeto(fechaInicio) : null;
  if (inicioObj) inicioObj.setHours(0, 0, 0, 0);
  const finObj = fechaFin ? parseFechaAObjeto(fechaFin) : null;
  if (finObj) finObj.setHours(23, 59, 59, 999);

  const filtradas = sourceList.filter(t => {
    if (filtroPeriodo === 'todo') return true;
    const data = t.datos_valores || {};
    const rawF = data.fechaVenta || data.fechaUltimaGestionPago || t.created_at || t.updated_at;
    if (!rawF) return true;
    const fObj = parseFechaAObjeto(String(rawF));
    if (!fObj) return true;

    if (filtroPeriodo === 'hoy') return fObj.toDateString() === ahora.toDateString();
    if (filtroPeriodo === '7dias') {
      const h7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      return fObj >= h7;
    }
    if (filtroPeriodo === 'mes') {
      return fObj.getMonth() === ahora.getMonth() && fObj.getFullYear() === ahora.getFullYear();
    }
    if (filtroPeriodo === 'mes_especifico' || filtroPeriodo === 'comparativa') {
      return fObj.getMonth() === targetMes && fObj.getFullYear() === targetAnio;
    }
    if (filtroPeriodo === 'personalizado') {
      if (inicioObj && fObj < inicioObj) return false;
      if (finObj && fObj > finObj) return false;
      return true;
    }
    return true;
  });

  let efectivos = 0;
  let negativos = 0;
  let seguimiento = 0;
  let sinAtender = 0;

  const mapMeses = new Map<string, MesOnlineData>();
  const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  filtradas.forEach(t => {
    const d = t.datos_valores || {};
    const estadoG = String(d.estadoGestion || '').toLowerCase();
    const estadoCob = String(d.estadoCobranza || '').toLowerCase();
    const estadoSop = String(d.estadoSoporte || '').toLowerCase();

    const esEfectivo =
      estadoG === 'compra_efectiva' ||
      estadoCob === 'pago procesado' ||
      estadoSop.includes('procesado') ||
      estadoSop.includes('solventada') ||
      Boolean(d.fechaVenta && (d.plan_hogar || d.plan_pymes));

    const esNegativo =
      estadoG === 'no_quiso_servicio' ||
      estadoG === 'liberada_sin_caja' ||
      estadoCob === 'pago rechazado' ||
      Boolean(d.motivoLiberada || d.motivoNoDesea);

    const esSeguimiento =
      estadoG === 'comprara_luego' ||
      Boolean(d.motivoCompraraLuego);

    if (esEfectivo) efectivos++;
    else if (esNegativo) negativos++;
    else if (esSeguimiento) seguimiento++;
    else sinAtender++;

    const rawF2 = d.fechaVenta || d.fechaUltimaGestionPago || t.created_at || t.updated_at;
    const fObj = parseFechaAObjeto(rawF2 ? String(rawF2) : null) || new Date();
    const yr = fObj.getFullYear();
    const mIdx = fObj.getMonth();
    const claveMes = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;

    if (!mapMeses.has(claveMes)) {
      mapMeses.set(claveMes, {
        claveMes,
        nombreMes: `${NOMBRES_MESES_DROPDOWN[mIdx]} ${yr}`,
        nombreCorto: mesesCortos[mIdx],
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
    if (esEfectivo) mData.totalEfectivos++;
    else if (esNegativo) mData.totalNegativos++;
    else mData.totalSinAtender++;
  });

  const totalTotal = filtradas.length;
  const tasaEfectiva = totalTotal > 0 ? Math.round((efectivos / totalTotal) * 100) : 0;
  const tasaSA = totalTotal > 0 ? Math.round((sinAtender / totalTotal) * 100) : 0;

  const yearActual = ahora.getFullYear();
  const serie12Meses: MesOnlineData[] = mesesCortos.map((corto, i) => {
    const claveMes = `${yearActual}-${String(i + 1).padStart(2, '0')}`;
    const mData = mapMeses.get(claveMes);
    if (mData) {
      const tE = mData.totalGeneral > 0 ? Math.round((mData.totalEfectivos / mData.totalGeneral) * 100) : 0;
      const tS = mData.totalGeneral > 0 ? Math.round((mData.totalSinAtender / mData.totalGeneral) * 100) : 0;
      return { ...mData, tasaEfectividad: tE, tasaSinAtender: tS };
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

  return {
    totalCasos: totalTotal,
    totalEfectivos: efectivos,
    totalNegativos: negativos,
    totalSeguimiento: seguimiento,
    totalSinAtender: sinAtender,
    tasaEfectividad: tasaEfectiva,
    tasaSinAtender: tasaSA,
    serie12Meses,
  };
}
