import { Tarjeta } from '../../../types/kanban';

export type PeriodoVentasTipo = 'todo' | 'mes' | 'mes_especifico' | '7dias' | 'hoy';

export interface VentasKpis {
  totalVentas: number;
  ventasFactibles: number;
  ventasPorInstalar: number;
  ventasInstaladas: number;
  ventasRechazadas: number;
  ventasEnVerificacion: number;
  tasaFactibilidad: number;
}

export interface AsesorVentasStat {
  asesorNombre: string;
  totalVentas: number;
  factibles: number;
  porInstalar: number;
  instaladas: number;
  rechazadas: number;
  enVerificacion: number;
  tasaFactibilidad: number;
  desgloseTipos: Record<string, number>;
  desglosePlanes: Record<string, number>;
}

export interface FactibilidadVentasStat {
  estado: string;
  clave: 'factible' | 'verificacion' | 'rechazada';
  cantidad: number;
  porcentaje: number;
  color: string;
}

export interface ZonaVentasStat {
  zonaNombre: string;
  totalVentas: number;
  porcentaje: number;
}

export interface TipoServicioVentasStat {
  tipoServicio: string;
  totalVentas: number;
  porcentaje: number;
  color: string;
}

export interface PlanVentasStat {
  planNombre: string;
  tipoServicio: string;
  totalVentas: number;
  porcentaje: number;
}

export interface VentasStats {
  kpis: VentasKpis;
  porAsesor: AsesorVentasStat[];
  porFactibilidad: FactibilidadVentasStat[];
  porZona: ZonaVentasStat[];
  porTipo: TipoServicioVentasStat[];
  porPlan: PlanVentasStat[];
  rawTarjetas: Tarjeta[];
}
