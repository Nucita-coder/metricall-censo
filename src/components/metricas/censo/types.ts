import { Tarjeta } from '../../../types/kanban';

export type PeriodoCensoTipo = 'todo' | 'mes' | 'mes_especifico' | '7dias' | 'hoy';

export interface CensoKpis {
  totalCensados: number;
  totalInteresados: number;
  totalIndecisos: number;
  totalNoInteresados: number;
  totalGestiones: number;
  tasaInteres: number;
  tasaIndecision: number;
  tasaNoInteres: number;
}

export interface AsesorCensoStat {
  asesorNombre: string;
  totalCensados: number;
  interesados: number;
  indecisos: number;
  noInteresados: number;
  gestiones: number;
}

export interface SectorCensoStat {
  sectorNombre: string;
  totalCensados: number;
  porcentaje: number;
}

export interface CensoStats {
  kpis: CensoKpis;
  porAsesor: AsesorCensoStat[];
  porSector: SectorCensoStat[];
  rawTarjetas: Tarjeta[];
}

export interface SliceDataItem {
  label: string;
  count: number;
  color: string;
}
