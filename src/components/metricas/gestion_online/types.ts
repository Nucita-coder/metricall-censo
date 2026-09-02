import { Tarjeta } from '../../../types/kanban';

export interface SliceDataItem {
  label: string;
  count: number;
  color?: string;
}

export interface MesOnlineData {
  claveMes: string;
  nombreMes: string;
  nombreCorto: string;
  totalEfectivos: number;
  totalNegativos: number;
  totalSinAtender: number;
  totalGeneral: number;
  tasaEfectividad: number;
  tasaSinAtender: number;
}

export interface GestionOnlineStats {
  totalCasos: number;
  totalEfectivos: number;
  totalNegativos: number;
  totalSeguimiento: number;
  totalSinAtender: number;
  tasaEfectividad: number;
  tasaSinAtender: number;
  serie12Meses: MesOnlineData[];
}

export interface ResultadoItemConfig {
  clave: string;
  label: string;
  tipo: 'efectivo' | 'negativo' | 'seguimiento' | 'pendiente';
}

export interface MatrizOnlineData {
  grid: number[][];
  columnTotals: number[];
  totalActividadesPeriodo: number;
}

export interface MatrixResultadosOnlineData {
  countsMap: Map<string, number>;
  totalResultadosPeriodo: number;
}

export type PeriodoKey =
  | 'todo'
  | 'mes'
  | 'mes_especifico'
  | 'comparativa'
  | '7dias'
  | 'hoy'
  | 'personalizado';

export const OPCIONES_PERIODO: string[] = [
  'Todo el Historial',
  'Este Mes',
  'Mes Específico (Selector)',
  'Comparación entre Meses (Comparativa)',
  'Últimos 7 días',
  'Hoy',
  'Rango Personalizado (Calendario)',
];

export const PERIODO_MAP_TO_KEY: Record<string, PeriodoKey> = {
  'Todo el Historial': 'todo',
  'Este Mes': 'mes',
  'Mes Específico (Selector)': 'mes_especifico',
  'Comparación entre Meses (Comparativa)': 'comparativa',
  'Últimos 7 días': '7dias',
  'Hoy': 'hoy',
  'Rango Personalizado (Calendario)': 'personalizado',
};

export const PERIODO_MAP_TO_LABEL: Record<PeriodoKey, string> = {
  todo: 'Todo el Historial',
  mes: 'Este Mes',
  mes_especifico: 'Mes Específico (Selector)',
  comparativa: 'Comparación entre Meses (Comparativa)',
  '7dias': 'Últimos 7 días',
  hoy: 'Hoy',
  personalizado: 'Rango Personalizado (Calendario)',
};

export const NOMBRES_MESES_DROPDOWN: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const OPCIONES_ANIO_DROPDOWN: string[] = ['2026', '2025', '2024', '2023'];

export const CANALES_GESTION_HEADERS: string[] = [
  'VENTAS ONLINE',
  'REPORTE PAGO',
  'FALLAS TÉCNICAS',
  'CONSULTA CHAT',
  'COMPRA DIRECTA',
];

export const HORAS_JORNADA: string[] = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export const OPCIONES_PERIODO_MATRIZ: string[] = [
  'Hoy',
  'Semanal (7 días)',
  'Quincenal (15 días)',
  'Mensual (Este Mes)',
  'Mes Específico (Selector)',
];

export const TODOS_LOS_RESULTADOS_ONLINE: ResultadoItemConfig[] = [
  { clave: 'compra_efectiva', label: 'Compra Efectiva (Venta)', tipo: 'efectivo' },
  { clave: 'pago_procesado', label: 'Pago Procesado (Cobro)', tipo: 'efectivo' },
  { clave: 'procesado_en_sae', label: 'Procesado en SAE (Falla)', tipo: 'efectivo' },
  { clave: 'comprara_luego', label: 'Comprará Luego (Prospecto)', tipo: 'seguimiento' },
  { clave: 'pago_en_revision', label: 'Pago en Revisión (Pendiente)', tipo: 'pendiente' },
  { clave: 'pago_rechazado', label: 'Pago Rechazado', tipo: 'negativo' },
  { clave: 'no_quiso_servicio', label: 'No Quiso Servicio', tipo: 'negativo' },
  { clave: 'liberada_sin_caja', label: 'Sector Sin Caja (Liberada)', tipo: 'negativo' },
  { clave: 'sin_atender', label: 'Sin Atender (En Cola)', tipo: 'pendiente' },
];

export const PALETA_COLORES_CANALES: string[] = [
  '#10B981', // Verde esmeralda (Ventas)
  '#0C66E4', // Azul (Pagos)
  '#F59E0B', // Ámbar (Fallas)
  '#8B5CF6', // Púrpura (Chat)
  '#06B6D4', // Cyan (Compra directa)
];

export const PALETA_COLORES_RESULTADOS: string[] = [
  '#10B981', // Compra Efectiva
  '#059669', // Pago Procesado
  '#3B82F6', // Procesado en SAE
  '#6366F1', // Comprará luego
  '#F59E0B', // Pago en revisión
  '#EF4444', // Pago rechazado
  '#DC2626', // No quiso servicio
  '#B91C1C', // Sector sin caja
  '#6B7280', // Sin atender
];
