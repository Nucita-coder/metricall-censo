export interface DetalleCargaRegistro {
  id: string;
  nroOrden: string;
  fecha: string;
  tipoCarga: string;
  origen: string;
  entregadoPor: string;
  recibidoPor: string;
  motivo: string;
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  serialMaterial?: string;
  cantidad: number;
  adjuntos: string[];
}

export interface FilaDesgloseMaterial {
  codigo: string;
  modelo: string;
  cantidad: number;
}

export interface MaterialStockItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  stockTotal: number;
  numRegistros: number;
  ultimoIngreso: string;
  cargas?: DetalleCargaRegistro[];
}

export type ActiveInventarioTab = 'disponible' | 'asignado' | 'historial' | 'general';
export type FiltroStock = 'all' | 'ok' | 'low' | 'zero';
export type OrdenInventario = 'nombre' | 'stockDesc' | 'stockAsc';
