export const KANBAN_THEME = {
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  column: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
  }
};

export const KANBAN_COLORS = {
  card: {
    defaultBg: '#FFFFFF',
    censoInteresadosBg: '#E8F5E9',
    censoNoInteresadosBg: '#FFEBEE',
    censoPosiblesBg: '#E3F2FD',
    bloqueadaBg: '#D1D5DB',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
  },
  badge: {
    hogar: { bg: '#EBF4FF', text: '#2B6CB0' },
    pymes: { bg: '#FEEBC8', text: '#C05621' },
    dedicado: { bg: '#E6FFFA', text: '#2C7A7B' },
    isp: { bg: '#E9D8FD', text: '#6B46C1' },
    pagoProcesado: { bg: '#E6F4EA', text: '#137333' },
    pagoPendiente: { bg: '#FEF7E0', text: '#B06000' },
    pagoRechazado: { bg: '#FCE8E6', text: '#C5221F' },
    procesadoSAE: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
    default: { bg: '#E2E8F0', text: '#4A5568' }
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    muted: '#718096',
    empty: '#A0AEC0',
    danger: '#FFF',
    light: '#A0AEC0',
  },
  tags: {
    bloqueadaBg: '#EF4444'
  }
};

export interface ResultadoColorConfig {
  bg: string;
  text: string;
  border: string;
  barColor: string;
}

// 8 POSITIVOS → Acción efectiva | 9 NEGATIVOS → Acción negativa
export const COBRANZA_RESULTADO_COLORS: Record<string, ResultadoColorConfig> = {
  // ───── ACCIÓN EFECTIVA (8) ─────
  // 1. Verde Esmeralda – más positivo de todos
  'COBRO EFECTIVO':          { bg: 'rgba(16,185,129,0.18)',  text: '#34D399', border: '#059669', barColor: '#10B981' },
  // 2. Cian Turquesa
  'CONVENIO DE PAGO':        { bg: 'rgba(6,182,212,0.18)',   text: '#22D3EE', border: '#0891B2', barColor: '#06B6D4' },
  // 3. Azul Royal
  'ABONO PARCIALMENTE':      { bg: 'rgba(59,130,246,0.18)',  text: '#60A5FA', border: '#2563EB', barColor: '#3B82F6' },
  // 4. Verde Menta / Teal
  'RECUPERADO':              { bg: 'rgba(20,184,166,0.18)',  text: '#2DD4BF', border: '#0D9488', barColor: '#14B8A6' },
  // 5. Azul Cobalto – no contestó
  'NO CONTESTO':             { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.35)', barColor: '#3B82F6' },
  // 6. Índigo Suave
  'LUEGO PASA POR OFIC':     { bg: 'rgba(99,102,241,0.18)', text: '#818CF8', border: '#4F46E5', barColor: '#6366F1' },
  // 7. Ámbar Dorado – zona límite
  'FUERA DE ZONA':           { bg: 'rgba(245,158,11,0.18)', text: '#FBBF24', border: '#D97706', barColor: '#F59E0B' },
  // 8. Púrpura Vívido
  'PIDE AJUSTE DE PLAN':     { bg: 'rgba(139,92,246,0.18)', text: '#A78BFA', border: '#7C3AED', barColor: '#8B5CF6' },

  // ───── ACCIÓN NEGATIVA (9) ─────
  // 1. Rojo Carmesí
  'PIDE RETIRO':                            { bg: 'rgba(239,68,68,0.22)',   text: '#F87171', border: '#DC2626', barColor: '#EF4444' },
  // 2. Rosa Fuerte – rechazo explícito
  'RECHAZO A PAGAR POR DIAS SIN SERVICIO':  { bg: 'rgba(244,63,94,0.22)',  text: '#FB7185', border: '#E11D48', barColor: '#F43F5E' },
  // 3. Naranja Quemado – falla técnica
  'TIENE FALLA':                            { bg: 'rgba(249,115,22,0.22)', text: '#FB923C', border: '#EA580C', barColor: '#F97316' },
  // 4. Fucsia – inconformidad
  'INCONFORMIDAD CON MONTO':                { bg: 'rgba(217,70,239,0.22)', text: '#E879F9', border: '#C026D3', barColor: '#D946EF' },
  // 5. Rojo Rosa – desconoce
  'NO RECONOCE DEUDA':                      { bg: 'rgba(225,29,72,0.2)',   text: '#FDA4AF', border: '#BE123C', barColor: '#E11D48' },
  // 6. Granate Oscuro – rehúsa devolver equipo
  'REHUSA ENTREGAR EQUIPO':                 { bg: 'rgba(159,18,57,0.25)',  text: '#FCA5A5', border: '#9F1239', barColor: '#BE123C' },
  // 7. Violeta Eléctrico – puerto liberado
  'PUERTO LIBERADO':                        { bg: 'rgba(168,85,247,0.22)', text: '#C084FC', border: '#9333EA', barColor: '#A855F7' },
  // 8. Gris Cálido – tiene otro servicio
  'TIENE OTRO SERVICIO':                    { bg: 'rgba(120,113,108,0.2)', text: '#E7E5E4', border: '#78716C', barColor: '#78716C' },
  // 9. Rojo Fuego – no paga
  'NO DESEA PAGAR':                         { bg: 'rgba(220,38,38,0.28)',  text: '#EF4444', border: '#991B1B', barColor: '#DC2626' },
};

export const getResultadoColor = (resultado?: string): ResultadoColorConfig => {
  if (!resultado) {
    return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.4)', barColor: '#0EA5E9' };
  }
  const key = resultado.trim().toUpperCase();
  return COBRANZA_RESULTADO_COLORS[key] || {
    bg: 'rgba(156, 163, 175, 0.18)',
    text: '#E5E7EB',
    border: '#4B5563',
    barColor: '#9CA3AF',
  };
};

import { Platform } from 'react-native';

export const WEB_MODAL_CONTAINER = Platform.OS === 'web' ? {
  width: '100%',
  maxWidth: 1100,
  alignSelf: 'center',
  flex: 1,
} as const : {};
