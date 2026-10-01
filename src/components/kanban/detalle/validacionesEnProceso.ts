export interface ParametrosValidacionEnProceso {
  tipoInstalacion: string;
  serialEquipo: string;
  macEquipo: string;
  materiales: Record<string, string>;
  cableDrop: string;
  nroNap: string;
  potenciaNap: string;
  potenciaCasa: string;
  puertoAsignado: string;
  puertosDisponibles: string;
}

export interface ResultadoValidacionEnProceso {
  esValido: boolean;
  faltantes: string[];
}

export function validarFaseEnProceso(
  params: ParametrosValidacionEnProceso
): ResultadoValidacionEnProceso {
  const faltantes: string[] = [];

  const tipo = (params.tipoInstalacion || '').trim().toLowerCase();
  if (!tipo || (tipo !== 'tradicional' && tipo !== 'preconectorizado')) {
    faltantes.push('Tipo de Instalación (Tradicional o Preconectorizada)');
  }

  if (!params.serialEquipo || !params.serialEquipo.trim()) {
    faltantes.push('Serial del Equipo');
  }

  if (!params.macEquipo || !params.macEquipo.trim()) {
    faltantes.push('MAC del Equipo');
  }

  const cantOntCon = parseFloat(params.materiales?.ontConWifi || '0') || 0;
  const cantOntSin = parseFloat(params.materiales?.ontSinWifi || '0') || 0;
  if (cantOntCon <= 0 && cantOntSin <= 0) {
    faltantes.push('Modelo de ONT (Registrar ONT Con Wifi o ONT Sin Wifi)');
  }

  if (tipo === 'tradicional') {
    const cantCable = parseFloat(params.cableDrop || '0') || 0;
    if (cantCable <= 0) {
      faltantes.push('Metros de Cable Drop utilizados');
    }
  } else if (tipo === 'preconectorizado') {
    const cablePre = String(params.materiales?.cablePreconectorizado || '').trim();
    if (!cablePre || cablePre === '0') {
      faltantes.push('Cable Preconectorizado (Seleccionar metraje: 50, 70 o 100 mts)');
    }
  }

  if (!params.nroNap || !params.nroNap.trim()) {
    faltantes.push('Número de NAP');
  }

  if (!params.potenciaNap || !params.potenciaNap.trim()) {
    faltantes.push('Potencia NAP');
  }

  if (!params.potenciaCasa || !params.potenciaCasa.trim()) {
    faltantes.push('Potencia Casa');
  }

  if (!params.puertoAsignado || !params.puertoAsignado.trim()) {
    faltantes.push('Puerto Asignado');
  }

  if (
    params.puertosDisponibles === undefined ||
    params.puertosDisponibles === null ||
    !String(params.puertosDisponibles).trim()
  ) {
    faltantes.push('Puertos Disponibles');
  }

  return {
    esValido: faltantes.length === 0,
    faltantes,
  };
}
