export interface SubItemLote {
  codigoMaterial: string;
  modeloMaterial: string;
  serialMaterial?: string;
  cantidad: number;
}

export interface SKUDetailItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  unidadesAlmacen: number;
  unidadesAsignadas: number;
  unidadesTotales: number;
  fechaEntrada: string;
  numMovimientos: number;
  subItems?: SubItemLote[];
}

export interface AsignacionDetallada {
  id: string;
  tecnicoNombre: string;
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  serialMaterial?: string;
  cantidad: number;
  fechaAsignacion: string;
  nroOrden: string;
  entregadoPor: string;
  motivo: string;
  tipoMovimiento: 'ASIGNACION' | 'INSTALACION_CONSUMO' | 'DEVOLUCION';
  tarjetaDestino?: string;
}

export interface TecnicoResumen {
  nombre: string;
  totalUnidadesAsignadas: number;
  totalOrdenes: number;
  totalConsumidas: number;
}

export type FiltroAlmacenTab = 'todos' | 'almacen' | 'asignado';

export interface ModuloAlmacenProps {
  empresaId: string | null;
}

// Mapa de correspondencia de campos de formulario de instalación a SKUs
export const MAPA_CAMPOS_INSTALACION: Record<string, { cod: string; nombre: string }> = {
  ontConWifi: { cod: 'MAT-ONT-CON-WIFI', nombre: 'ONT CON WIFI' },
  ontSinWifi: { cod: 'MAT-ONT-SIN-WIFI', nombre: 'ONT SIN WIFI' },
  tensorPlastico: { cod: 'MAT-TENSOR-PLASTICO', nombre: 'TENSOR PLÁSTICO' },
  tensorHierro: { cod: 'MAT-TENSOR-HIERRO', nombre: 'TENSOR HIERRO' },
  grapas: { cod: 'MAT-GRAPAS', nombre: 'GRAPAS' },
  tirrap: { cod: 'MAT-TIRRAP', nombre: 'TIRRAP' },
  pachCordApc: { cod: 'MAT-PACH-APC', nombre: 'PACH CORD APC' },
  pachCordUpc: { cod: 'MAT-PACH-UPC', nombre: 'PACH CORD UPC' },
  pachCordApcUpc: { cod: 'MAT-PACH-APC-UPC', nombre: 'PACH CORD APC/UPC' },
  cajaTerminalCon: { cod: 'MAT-CAJA-TERM-CON', nombre: 'CAJA TERMINAL CON ACCESORIOS' },
  cajaTerminalSin: { cod: 'MAT-CAJA-TERM-SIN', nombre: 'CAJA TERMINAL SIN ACCESORIOS' },
  conectorAcople: { cod: 'MAT-CONECTOR-ACOPLE-HH', nombre: 'CONECTOR/ACOPLE H-H' },
  conectorMecanicoApc: { cod: 'MAT-CONECTOR-MEC-APC', nombre: 'CONECTOR MECÁNICO APC' },
  conectorMecanicoUpc: { cod: 'MAT-CONECTOR-MEC-UPC', nombre: 'CONECTOR MECÁNICO UPC' },
  precinto: { cod: 'MAT-PRECINTO', nombre: 'PRECINTO' },
  cablePreconectorizado: { cod: 'MAT-CABLE-PRECONECTORIZADO', nombre: 'CABLE PRECONECTORIZADO' },
  cableDrop: { cod: 'MAT-CABLE-DROP', nombre: 'CABLE DROP' },
  cable_drop: { cod: 'MAT-CABLE-DROP', nombre: 'CABLE DROP' },
};
