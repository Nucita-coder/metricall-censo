import { TarjetaDatosValores, TarjetaMaterialItem } from '../../../types/kanban';
import { clasificarMovimientoAlmacen } from '../../../services/almacenService';

export interface ResultadoValidacionAlmacen {
  esValido: boolean;
  faltantes: string[];
}

/**
 * Valida que los datos obligatorios de un movimiento de almacén estén completos.
 * Retorna si es válido y la lista de nombres legibles de las casillas faltantes.
 */
export function validarDatosAlmacen(formData: TarjetaDatosValores): ResultadoValidacionAlmacen {
  const faltantes: string[] = [];
  const movTipo = clasificarMovimientoAlmacen(formData.tipoCarga);
  const isDevolucionCentral = movTipo === 'DEVOLUCION_CENTRAL';
  const isDevolucionAsignacion = movTipo === 'DEVOLUCION_ASIGNACION';
  const isDevolucion = isDevolucionCentral || isDevolucionAsignacion;
  const isAsignado = movTipo === 'MATERIAL_ASIGNADO';

  // 1. Tipo de Carga
  if (!formData.tipoCarga || !String(formData.tipoCarga).trim()) {
    faltantes.push('Tipo de Carga');
  }

  // 2. Fecha de Recibido / Devolución
  if (!formData.fechaRecibido || !String(formData.fechaRecibido).trim()) {
    faltantes.push(isDevolucion ? 'Fecha de Devolución' : 'Fecha de Recibido');
  }

  // 3. Número Orden de Entrega (en devoluciones se autogenera 'S/N' si está vacío)
  if (!isDevolucion) {
    if (!formData.nroOrdenEntrega || !String(formData.nroOrdenEntrega).trim()) {
      faltantes.push('Número Orden de Entrega');
    }
  }

  // 4. Origen
  if (!formData.origen || !String(formData.origen).trim()) {
    faltantes.push('Origen');
  }

  // 5. Destino / Asignación
  if (isAsignado) {
    if (!formData.asignadoA || !String(formData.asignadoA).trim()) {
      faltantes.push('Personal / Miembro Asignado');
    }
  } else if (isDevolucionCentral) {
    if (!formData.asignadoA || !String(formData.asignadoA).trim()) {
      faltantes.push('Sede / Almacén Central de Destino');
    }
  }

  // 6. Insumos y Materiales
  const rawItems =
    Array.isArray(formData.items) && formData.items.length > 0
      ? (formData.items as TarjetaMaterialItem[])
      : [formData as unknown as TarjetaMaterialItem];

  const itemsValidos = rawItems.filter((i) => {
    const cod = String(i.codigoMaterial || '').trim();
    const cant = parseFloat(String(i.cantidadRecibida || '0'));
    return cod !== '' && !isNaN(cant) && cant > 0;
  });

  if (itemsValidos.length === 0) {
    if (isAsignado) {
      faltantes.push('Material de Almacén a Asignar (seleccionar del inventario)');
    } else if (isDevolucion) {
      faltantes.push('Material en tu poder a Devolver');
    } else {
      faltantes.push('Al menos un Material con Código y Cantidad mayor a 0');
    }
  } else {
    // Verificar si algún ítem de la lista quedó a medias
    rawItems.forEach((it, idx) => {
      const num = rawItems.length > 1 ? ` #${idx + 1}` : '';
      const cod = String(it.codigoMaterial || '').trim();
      const cant = parseFloat(String(it.cantidadRecibida || '0'));

      if (!cod && (it.nombreMaterial || it.cantidadRecibida)) {
        faltantes.push(`Código del Material${num}`);
      }
      if (cod && (isNaN(cant) || cant <= 0)) {
        faltantes.push(`Cantidad del Material${num} (debe ser mayor a 0)`);
      }
    });
  }

  // 7. Responsables
  if (isDevolucion) {
    if (!formData.entregadoPor || !String(formData.entregadoPor).trim()) {
      faltantes.push('Devuelto por (Responsable)');
    }
    if (!formData.recibidoPor || !String(formData.recibidoPor).trim()) {
      faltantes.push('Entregado a (Almacén Receptor)');
    }
    if (!formData.motivoAsignacion || !String(formData.motivoAsignacion).trim()) {
      faltantes.push('Motivo de Devolución');
    }
  } else {
    if (!formData.recibidoPor || !String(formData.recibidoPor).trim()) {
      faltantes.push('Recibido por (Almacén)');
    }
    if (!formData.entregadoPor || !String(formData.entregadoPor).trim()) {
      faltantes.push('Entregado por (Proveedor / Personal)');
    }
    if (isAsignado && (!formData.motivoAsignacion || !String(formData.motivoAsignacion).trim())) {
      faltantes.push('Motivo de Asignación');
    }
  }

  return {
    esValido: faltantes.length === 0,
    faltantes,
  };
}
