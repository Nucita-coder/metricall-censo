export const OPCIONES_PERIODO = [
  'Todo el Historial',
  'Este Mes',
  'Mes Específico (Selector)',
  'Comparación entre Meses (Comparativa)',
  'Últimos 7 días',
  'Hoy',
  'Rango Personalizado (Calendario)',
];

export const PERIODO_MAP_TO_KEY: Record<string, 'todo' | 'mes' | 'mes_especifico' | 'comparativa' | '7dias' | 'hoy' | 'personalizado'> = {
  'Todo el Historial': 'todo',
  'Este Mes': 'mes',
  'Mes Específico (Selector)': 'mes_especifico',
  'Comparación entre Meses (Comparativa)': 'comparativa',
  'Últimos 7 días': '7dias',
  'Hoy': 'hoy',
  'Rango Personalizado (Calendario)': 'personalizado',
};

export const PERIODO_MAP_TO_LABEL: Record<string, string> = {
  todo: 'Todo el Historial',
  mes: 'Este Mes',
  mes_especifico: 'Mes Específico (Selector)',
  comparativa: 'Comparación entre Meses (Comparativa)',
  '7dias': 'Últimos 7 días',
  hoy: 'Hoy',
  personalizado: 'Rango Personalizado (Calendario)',
};

export const NOMBRES_MESES_DROPDOWN = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const OPCIONES_ANIO_DROPDOWN = ['2026', '2025', '2024', '2023'];

export const OPCIONES_FILTRO_CONTACTO = [
  'Todos los Contactos',
  'Solo Cobro Efectivo',
  'Acción Negativa',
];

export const TIPOS_CONTACTO_HEADERS = [
  'LLAMADA TELEFON',
  'MENSAJE WHASSAPP',
  'MENSAJE TEXTO',
  'CORREO',
  'VISITA RESIDENCIAL',
];

export const OPCIONES_PERIODO_MATRIZ = [
  'Hoy',
  'Semanal (7 días)',
  'Quincenal (15 días)',
  'Mensual (Este Mes)',
  'Mes Específico (Selector)',
];

export const HORAS_JORNADA = [
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
  '06:00 PM',
];

export const RESULTADOS_EFECTIVOS_COBRANZA = [
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'LUEGO PASA POR OFIC',
  'PIDE AJUSTE DE PLAN',
];

export const TODOS_LOS_RESULTADOS = [
  { clave: 'COBRO EFECTIVO', label: 'COBRO EFECTIVO', tipo: 'efectivo' },
  { clave: 'CONVENIO DE PAGO', label: 'CONVENIO DE PAGO', tipo: 'efectivo' },
  { clave: 'ABONO PARCIALMENTE', label: 'ABONO PARCIALMENTE', tipo: 'efectivo' },
  { clave: 'RECUPERADO', label: 'RECUPERADO', tipo: 'efectivo' },
  { clave: 'LUEGO PASA POR OFIC', label: 'LUEGO PASA POR OFIC', tipo: 'efectivo' },
  { clave: 'PIDE AJUSTE DE PLAN', label: 'PIDE AJUSTE DE PLAN', tipo: 'efectivo' },
  { clave: 'NO CONTESTO', label: 'NO CONTESTO', tipo: 'negativo' },
  { clave: 'PIDE RETIRO', label: 'PIDE RETIRO', tipo: 'negativo' },
  { clave: 'FUERA DE ZONA', label: 'FUERA DE ZONA', tipo: 'negativo' },
  { clave: 'RECHAZO A PAGAR POR DIAS SIN SERVICIO', label: 'RECHAZO A PAGAR POR DIAS SIN SERVICIO', tipo: 'negativo' },
  { clave: 'TIENE FALLA', label: 'TIENE FALLA', tipo: 'negativo' },
  { clave: 'INCONFORMIDAD CON MONTO', label: 'INCONFORMIDAD CON MONTO', tipo: 'negativo' },
  { clave: 'NO RECONOCE DEUDA', label: 'NO RECONOCE DEUDA', tipo: 'negativo' },
  { clave: 'REHUSA ENTREGAR EQUIPO', label: 'REHUSA ENTREGAR EQUIPO', tipo: 'negativo' },
  { clave: 'PUERTO LIBERADO', label: 'PUERTO LIBERADO', tipo: 'negativo' },
  { clave: 'TIENE OTRO SERVICIO', label: 'TIENE OTRO SERVICIO', tipo: 'negativo' },
  { clave: 'NO DESEA PAGAR', label: 'NO DESEA PAGAR', tipo: 'negativo' },
];

export const PALETA_COLORES_GRAFICO = [
  '#7C3AED', '#60A5FA', '#34D399', '#F59E0B', '#F87171',
  '#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F97316',
  '#E11D48', '#A855F7', '#3B82F6', '#22C55E', '#EAB308',
  '#EF4444', '#6366F1'
];

export function getTodayString(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

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
