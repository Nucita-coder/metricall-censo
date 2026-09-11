import { TarjetaDatosValores } from '../../../types/kanban';

export interface MaterialRowItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  serialMaterial: string;
  cantidadRecibida: string;
}

export interface InsumoPrecargado {
  nombre: string;
  codigo: string;
  modelo: string;
}

export const INSUMOS_PRECARGADOS: InsumoPrecargado[] = [
  { nombre: 'TENSOR PLÁSTICO', codigo: 'MAT-TENSOR-PLASTICO', modelo: 'GENERAL' },
  { nombre: 'TENSOR HIERRO', codigo: 'MAT-TENSOR-HIERRO', modelo: 'GENERAL' },
  { nombre: 'GRAPAS', codigo: 'MAT-GRAPAS', modelo: 'GENERAL' },
  { nombre: 'TIRRAP', codigo: 'MAT-TIRRAP', modelo: 'GENERAL' },
  { nombre: 'PACH CORD APC', codigo: 'MAT-PACH-APC', modelo: 'APC' },
  { nombre: 'PACH CORD UPC', codigo: 'MAT-PACH-UPC', modelo: 'UPC' },
  { nombre: 'PACH CORD APC/UPC', codigo: 'MAT-PACH-APC-UPC', modelo: 'APC/UPC' },
  { nombre: 'CAJA TERM. CON ACCESORIOS', codigo: 'MAT-CAJA-TERM-CON', modelo: 'CON ACCESORIOS' },
  { nombre: 'CAJA TERM. SIN ACCESORIOS', codigo: 'MAT-CAJA-TERM-SIN', modelo: 'SIN ACCESORIOS' },
  { nombre: 'CONECTOR/ACOPLE H-H', codigo: 'MAT-CONECTOR-ACOPLE-HH', modelo: 'H-H' },
  { nombre: 'CONECTOR MECÁNICO APC', codigo: 'MAT-CONECTOR-MEC-APC', modelo: 'APC' },
  { nombre: 'CONECTOR MECÁNICO UPC', codigo: 'MAT-CONECTOR-MEC-UPC', modelo: 'UPC' },
  { nombre: 'PRECINTO', codigo: 'MAT-PRECINTO', modelo: 'GENERAL' },
  { nombre: 'CABLE PRECONECTORIZADO', codigo: 'MAT-CABLE-PRECONECTORIZADO', modelo: 'PRECONECTORIZADO' },
  { nombre: 'CABLE DROP', codigo: 'MAT-CABLE-DROP', modelo: 'DROP' },
  { nombre: 'CABLE DROP 50 MTS', codigo: 'MAT-CABLE-DROP-50', modelo: 'DROP 50M' },
  { nombre: 'CABLE DROP 70 MTS', codigo: 'MAT-CABLE-DROP-70', modelo: 'DROP 70M' },
  { nombre: 'CABLE DROP 100 MTS', codigo: 'MAT-CABLE-DROP-100', modelo: 'DROP 100M' },
];

export interface StockInfo {
  stockExistente: number | null;
  esNuevoCodigo: boolean | null;
  isSearching: boolean;
}

export interface StockItemDisponible {
  codigo: string;
  nombre: string;
  modelo: string;
  stock: number;
}

export interface FormularioReciboMaterialProps {
  formData: TarjetaDatosValores;
  handleChange?: (campo: string, valor: unknown) => void;
  readOnly?: boolean;
}
