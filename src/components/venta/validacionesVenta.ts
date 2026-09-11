import { TarjetaDatosValores } from '../../types/kanban';

export interface ResultadoValidacionVenta {
  esValido: boolean;
  faltantes: string[];
}

/**
 * Valida que los datos obligatorios de una tarjeta de venta estén completos.
 * Retorna si es válido y la lista de nombres legibles de las casillas faltantes.
 */
export function validarDatosVenta(formData: TarjetaDatosValores): ResultadoValidacionVenta {
  const faltantes: string[] = [];

  // 1. Datos Comerciales
  const tipoServicio = String(formData.tipoServicio || '').trim();
  if (!tipoServicio) {
    faltantes.push('Tipo de Servicio');
  } else {
    const tipo = tipoServicio.toLowerCase();
    if (tipo === 'hogar') {
      const tienePlanHogar = Boolean(
        formData.phConectados ||
        formData.phGamer ||
        formData.phCinefilos ||
        formData.phFamiliar ||
        formData.phInstalacion
      );
      if (!tienePlanHogar) {
        faltantes.push('Plan Hogar o Tipo de Instalación');
      }
    } else if (tipo === 'pymes') {
      const tienePlanPymes = Boolean(
        formData.ppEmprendedores ||
        formData.ppComercios ||
        formData.ppOficinas ||
        formData.ppNegocios ||
        formData.ppInstalacion
      );
      if (!tienePlanPymes) {
        faltantes.push('Plan PYMES o Tipo de Instalación');
      }
    }
  }

  // 2. Datos del Cliente
  const nombreApellido = String(formData.nombreApellido || '').trim();
  if (!nombreApellido) {
    faltantes.push('Nombre y Apellido');
  }

  const tipoDocumento = String(formData.tipoDocumento || '').trim();
  if (!tipoDocumento) {
    faltantes.push('Tipo de Documento');
  }

  const cedula = String(formData.documentoIdentidad || formData.nroIdentidad || '').trim();
  if (!cedula) {
    faltantes.push('Nro. de Identidad');
  }

  const telefono = String(formData.telefonoMovil || formData.nroTelefonoMovil || '').trim();
  if (!telefono) {
    faltantes.push('Teléfono Móvil');
  }

  const correo = String(formData.correo || '').trim();
  if (!correo) {
    faltantes.push('Correo Electrónico');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    faltantes.push('Correo Electrónico (Formato inválido)');
  }

  // 3. Dirección de Instalación
  const estado = String(formData.estado || '').trim();
  if (!estado) {
    faltantes.push('Estado');
  }

  const zona = String(formData.zona || formData.zonaCuadrante || '').trim();
  if (!zona) {
    faltantes.push('Zona / Cuadrante');
  }

  const sector = String(formData.sector || '').trim();
  if (!sector) {
    faltantes.push('Sector');
  }

  return {
    esValido: faltantes.length === 0,
    faltantes,
  };
}
