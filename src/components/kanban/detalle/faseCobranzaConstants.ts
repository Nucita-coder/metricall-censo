import { Lista } from '../../../types/kanban';

export const OPCIONES_TIPO_ACCION_COBRANZA = [
  'ACCIÓN EFECTIVA',
  'ACCIÓN NEGATIVA',
];

export const OPCIONES_TIPO_CONTACTO_COBRANZA = [
  'LLAMADA TELEFONICA',
  'MENSAJE WHATSAPP',
  'MENSAJE TEXTO',
  'CORREO',
  'VISITA RESIDENCIAL',
];

// --- ACCIÓN EFECTIVA / POSITIVA (6 opciones) ---
export const RESULTADOS_EFECTIVOS = [
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'LUEGO PASA POR OFIC',
  'PIDE AJUSTE DE PLAN',
];

// --- ACCIÓN NEGATIVA (11 opciones) ---
export const RESULTADOS_NEGATIVOS = [
  'NO CONTESTO',
  'FUERA DE ZONA',
  'PIDE RETIRO',
  'RECHAZO A PAGAR POR DIAS SIN SERVICIO',
  'TIENE FALLA',
  'INCONFORMIDAD CON MONTO',
  'NO RECONOCE DEUDA',
  'REHUSA ENTREGAR EQUIPO',
  'PUERTO LIBERADO',
  'TIENE OTRO SERVICIO',
  'NO DESEA PAGAR',
];

// Opciones de resultado de cobranza combinadas
export const OPCIONES_RESULTADO_COBRANZA = [
  ...RESULTADOS_EFECTIVOS,
  ...RESULTADOS_NEGATIVOS,
];

/**
 * Encuentra de forma determinista la lista destino para tarjetas de Cobranza / Recupero
 */
export function findListaCobranzaTarget(
  listas: Lista[] = [],
  esEfectiva: boolean,
  esFlujoRecupero: boolean
): Lista | undefined {
  if (!listas || listas.length === 0) return undefined;

  const norm = (s?: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  if (esFlujoRecupero) {
    if (esEfectiva) {
      const match = listas.find(
        (l) =>
          norm(l.nombre).includes('efectiva') && norm(l.nombre).includes('recupero')
      );
      if (match) return match;
    } else {
      const match = listas.find(
        (l) =>
          norm(l.nombre).includes('negativa') && norm(l.nombre).includes('recupero')
      );
      if (match) return match;
    }
  }

  // Flujo normal de cobranza (o fallback si no existe lista separada de recupero)
  if (esEfectiva) {
    return (
      listas.find(
        (l) =>
          (norm(l.nombre).includes('efectiva') || norm(l.nombre).includes('positiva')) &&
          !norm(l.nombre).includes('recupero')
      ) ||
      listas.find((l) => norm(l.nombre).includes('efectiva') || norm(l.nombre).includes('positiva'))
    );
  } else {
    return (
      listas.find(
        (l) =>
          norm(l.nombre).includes('negativa') &&
          !norm(l.nombre).includes('recupero')
      ) ||
      listas.find((l) => norm(l.nombre).includes('negativa'))
    );
  }
}


