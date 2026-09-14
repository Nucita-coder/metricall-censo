import { Tarjeta } from '../../../types/kanban';

export interface ModuloCobranzaProps {
  empresaId: string | null;
  filtroPeriodo: 'todo' | 'hoy' | '7dias' | 'mes';
  busquedaTexto: string;
}

export interface MesCobranzaData {
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

export interface CobranzaStats {
  totalCortados: number;
  totalEfectivos: number;
  totalNegativos: number;
  totalSinAtender: number;
  tasaRecuperacion: number;
  tasaSinAtender: number;
  serie12Meses: MesCobranzaData[];
}

export interface SliceDataItem {
  label: string;
  count: number;
  color?: string;
}

export type PeriodoTipo =
  | 'todo'
  | 'hoy'
  | '7dias'
  | 'mes'
  | 'mes_especifico'
  | 'comparativa'
  | 'personalizado';
