import { PeriodoCensoTipo } from './types';

export const OPCIONES_PERIODO_CENSO = [
  'Todo el Historial',
  'Este Mes',
  'Mes Específico (Selector)',
  'Últimos 7 días',
  'Hoy',
];

export const PERIODO_CENSO_MAP_TO_KEY: Record<string, PeriodoCensoTipo> = {
  'Todo el Historial': 'todo',
  'Este Mes': 'mes',
  'Mes Específico (Selector)': 'mes_especifico',
  'Últimos 7 días': '7dias',
  'Hoy': 'hoy',
};

export const PERIODO_CENSO_MAP_TO_LABEL: Record<PeriodoCensoTipo, string> = {
  todo: 'Todo el Historial',
  mes: 'Este Mes',
  mes_especifico: 'Mes Específico (Selector)',
  '7dias': 'Últimos 7 días',
  hoy: 'Hoy',
};

export const NOMBRES_MESES_CENSO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const OPCIONES_ANIO_CENSO = ['2026', '2025', '2024', '2023'];

export const COLORES_CENSO = {
  interesados: '#4A7C59',
  indecisos: '#C49B45',
  noInteresados: '#B85D5D',
  gestiones: '#5B8FB9',
  neutral: '#7B8B9A',
  paletaSectores: ['#5B8FB9', '#7B8B9A', '#6D72A3', '#5E8E72', '#C49B45', '#9C7A97', '#8A95A5'],
};

export function parseFechaCenso(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();
  if (!str) return null;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split(/[,\s]+/);
    const [d, m, y] = parts[0].split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function isFechaEnPeriodo(
  fecha: Date | null,
  periodo: PeriodoCensoTipo,
  mesEsp: number,
  anioEsp: number
): boolean {
  if (!fecha) return periodo === 'todo';

  const ahora = new Date();
  if (periodo === 'hoy') {
    return fecha.toDateString() === ahora.toDateString();
  }
  if (periodo === '7dias') {
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    return fecha >= hace7;
  }
  if (periodo === 'mes') {
    return (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  }
  if (periodo === 'mes_especifico') {
    return fecha.getMonth() === mesEsp && fecha.getFullYear() === anioEsp;
  }
  return true;
}
