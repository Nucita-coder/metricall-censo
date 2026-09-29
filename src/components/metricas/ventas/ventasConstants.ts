import { PeriodoVentasTipo } from './types';

export const OPCIONES_PERIODO_VENTAS: { label: string; value: PeriodoVentasTipo }[] = [
  { label: 'Este Mes', value: 'mes' },
  { label: 'Mes Específico', value: 'mes_especifico' },
  { label: 'Últimos 7 Días', value: '7dias' },
  { label: 'Hoy', value: 'hoy' },
  { label: 'Todo el Historial', value: 'todo' },
];

export const MESES_VENTAS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const COLORES_VENTAS = {
  factible: '#4A7C59',
  verificacion: '#C49B45',
  rechazada: '#B85D5D',
  porInstalar: '#5C7C99',
  instalada: '#7A8B99',
  hogar: '#4A7C59',
  pymes: '#5C7C99',
  dedicado: '#8A6B9C',
  isp: '#C49B45',
  otro: '#8C9BAB',
};

export function parseFechaVenta(fechaStr: unknown): Date | null {
  if (!fechaStr) return null;
  if (fechaStr instanceof Date) return isNaN(fechaStr.getTime()) ? null : fechaStr;
  if (typeof fechaStr !== 'string') return null;

  const raw = fechaStr.trim();
  if (!raw) return null;

  // Formato DD/MM/YYYY o DD-MM-YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(raw)) {
    const parts = raw.split(/[/-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato ISO
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function isFechaVentaEnPeriodo(
  fecha: Date | null,
  periodo: PeriodoVentasTipo,
  mesEspecificoNum: number,
  anioEspecificoNum: number
): boolean {
  if (periodo === 'todo') return true;
  if (!fecha) return false;

  const ahora = new Date();

  if (periodo === 'hoy') {
    return (
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  }

  if (periodo === '7dias') {
    const hace7 = new Date();
    hace7.setDate(ahora.getDate() - 7);
    hace7.setHours(0, 0, 0, 0);
    return fecha >= hace7 && fecha <= ahora;
  }

  if (periodo === 'mes') {
    return (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  }

  if (periodo === 'mes_especifico') {
    return (
      fecha.getMonth() === mesEspecificoNum &&
      fecha.getFullYear() === anioEspecificoNum
    );
  }

  return true;
}
