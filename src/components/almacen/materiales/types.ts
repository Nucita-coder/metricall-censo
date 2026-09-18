export interface CustodiaItem {
  codigo: string;
  nombre: string;
  modelo: string;
  serial?: string;
  cantidad: number;
}

export interface MovimientoItem {
  cardId: string;
  nroOrden: string;
  fecha: string;
  motivo: string;
  tipoCarga: 'ASIGNACION' | 'DEVOLUCION';
  entregadoPor: string;
  recibidoPor: string;
  items: Array<{
    codigoMaterial: string;
    nombreMaterial: string;
    modeloMaterial: string;
    serialMaterial?: string;
    cantidad: number;
  }>;
  totalUnidades: number;
}

export type ActiveMaterialTab = 'custodia' | 'devoluciones' | 'historial';
