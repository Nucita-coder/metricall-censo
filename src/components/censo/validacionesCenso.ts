import { TarjetaDatosValores } from '../../types/kanban';

export interface ResultadoValidacionCenso {
  esValido: boolean;
  faltantes: string[];
}

/**
 * Valida los datos obligatorios para el registro de un censo.
 * La cédula / documento de identidad es opcional.
 * Nombre y teléfono son indispensables.
 * La pregunta de servicio de internet es obligatoria, y si cuenta con servicio,
 * se vuelve obligatorio indicar el proveedor actual y la disposición al cambio.
 */
export function validarDatosCenso(formData: TarjetaDatosValores): ResultadoValidacionCenso {
  const faltantes: string[] = [];

  // 1. Datos Principales del Prospecto
  const nombre = String(formData.nombreApellido || '').trim();
  if (!nombre) {
    faltantes.push('Nombre y Apellido');
  }

  const telefono = String(formData.telefonoMovil || formData.telefono || '').trim();
  if (!telefono) {
    faltantes.push('Teléfono Móvil');
  }

  // Nota: Documento de Identidad / Cédula es opcional según requerimiento del censo.

  // 2. Encuesta de Servicio
  const cuentaConInternet = String(formData.cuentaConInternet || '').trim();
  if (!cuentaConInternet) {
    faltantes.push('¿Cuenta actualmente con servicio de Internet?');
  } else if (cuentaConInternet === 'Sí') {
    const proveedor = String(formData.proveedorActual || '').trim();
    if (!proveedor) {
      faltantes.push('Proveedor Actual');
    }
  }

  const dispuesto = String(formData.dispuestoCambiar || '').trim();
  if (!dispuesto) {
    faltantes.push(
      cuentaConInternet === 'No'
        ? '¿Desea contratar servicio de Internet?'
        : '¿Estaría dispuesto a cambiar de proveedor?'
    );
  }

  // 3. Dirección del Censo (Obligatorios: Estado y Ciudad)
  const estado = String(formData.estado || '').trim();
  if (!estado) {
    faltantes.push('Estado');
  }

  const ciudad = String(formData.ciudad || formData.ciudadMunicipio || '').trim();
  if (!ciudad) {
    faltantes.push('Ciudad / Municipio');
  }

  return {
    esValido: faltantes.length === 0,
    faltantes,
  };
}
