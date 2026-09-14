export type TipoTableroCreacion = 'instalaciones' | 'censo' | 'almacen' | 'cobranza' | 'gestion_online' | 'atencion_fallas';

export function getListasPorDefecto(tipoTablero: TipoTableroCreacion): string[] {
  switch (tipoTablero) {
    case 'instalaciones':
      return ['Venta', 'Factibilidad', 'Por Instalar', 'Asignado A', 'Liberada', 'En Proceso', 'Por Activar', 'Cliente Activo'];
    case 'censo':
      return ['Censo', 'si desea', 'no desea', 'es posible'];
    case 'cobranza':
      return ['Carga de cobranza clientes cortados', 'Acción efectiva', 'Acción negativa', 'Recupero', 'Acción efectiva (Recupero)', 'Acción negativa (Recupero)'];
    case 'gestion_online':
      return ['ventas online', 'reporte falla', 'reporte pago'];
    case 'atencion_fallas':
      return ['Por asignar', 'Asignado a', 'En Proceso', 'En Revisión', 'Falla Solventada'];
    case 'almacen':
    default:
      return ['Carga de Materiales', 'Material Recibido', 'Material Asignado', 'Recuperados', 'Devolución de Asignación', 'Devolución a Almacén Central'];
  }
}
