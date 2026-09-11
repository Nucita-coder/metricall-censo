import React from 'react';
import { FaseProps } from './types';
import { FaseAsignadoA } from './FaseAsignadoA';
import { FaseClienteActivo } from './FaseClienteActivo';
import { FaseCobranza } from './FaseCobranza';
import { FaseEnProceso } from './FaseEnProceso';
import { FaseEnRevision } from './FaseEnRevision';
import { FaseFactibilidad } from './FaseFactibilidad';
import { FaseGestionOnline } from './FaseGestionOnline';
import { FaseLiberada } from './FaseLiberada';
import { FasePorActivar } from './FasePorActivar';
import { FasePorInstalar } from './FasePorInstalar';
import { FaseSolventada } from './FaseSolventada';
import { FaseVenta } from './FaseVenta';

interface Props {
  listaActualNombre: string;
  faseProps: FaseProps;
  isCensoFormat: boolean;
  isMaterialesFormat: boolean;
}

export const FaseDinamicaSelector: React.FC<Props> = ({
  listaActualNombre,
  faseProps,
  isCensoFormat,
  isMaterialesFormat,
}) => {
  if (isCensoFormat || isMaterialesFormat) return null;

  const clean = listaActualNombre.toLowerCase().trim().replace(/_/g, ' ');
  const datosVal = faseProps.tarjeta?.datos_valores || {};
  const esWhatsAppBot = Boolean(datosVal.origen && String(datosVal.origen).toLowerCase().includes('whatsapp'));
  const esPagoWhatsApp = Boolean(datosVal.referencia || datosVal.comprobantePagoUrl || datosVal.montoPago);
  const isReporteFalla = Boolean(
    datosVal.tipoFalla ||
    datosVal.estadoSoporte ||
    (datosVal.origen && String(datosVal.origen).toLowerCase().includes('soporte')) ||
    (datosVal.origen && String(datosVal.origen).toLowerCase().includes('falla')) ||
    String(datosVal.nombreApellido || '').toLowerCase().includes('falla') ||
    clean.includes('falla') ||
    clean.includes('soporte') ||
    clean.includes('reclamo')
  );

  if (
    clean.includes('solventad') ||
    datosVal.estadoSoporte === 'Falla Solventada' ||
    datosVal.accionFalla === 'Falla Solventada'
  ) {
    return <FaseSolventada {...faseProps} />;
  }
  if (clean.includes('factibilidad')) return <FaseFactibilidad {...faseProps} />;
  if (clean.includes('liberad')) return <FaseLiberada {...faseProps} />;
  if (
    clean.includes('por instalar') ||
    clean.includes('instalar') ||
    clean.includes('por asignar') ||
    clean.includes('asignar')
  ) {
    return <FasePorInstalar {...faseProps} />;
  }
  if (clean.includes('asignado')) return <FaseAsignadoA {...faseProps} />;
  if (clean.includes('proceso')) return <FaseEnProceso {...faseProps} />;
  if (clean.includes('revis') || clean.includes('revision') || clean.includes('revisión')) {
    return <FaseEnRevision {...faseProps} />;
  }
  if (clean.includes('activar')) return <FasePorActivar {...faseProps} />;
  if (clean.includes('activo')) return <FaseClienteActivo {...faseProps} />;
  if (
    clean.includes('cobranza') ||
    clean.includes('efectiva') ||
    clean.includes('negativa') ||
    datosVal.origenImportacion === 'COBRANZA-RECUPERO-CHURN'
  ) {
    return <FaseCobranza {...faseProps} />;
  }
  if (
    clean.includes('ventas online') ||
    clean.includes('gestion online') ||
    clean.includes('gestión online') ||
    clean.includes('falla') ||
    clean.includes('soporte')
  ) {
    return <FaseGestionOnline {...faseProps} />;
  }
  if (clean.includes('venta')) return <FaseVenta {...faseProps} />;

  // Fallback asegurado para tarjetas de WhatsApp Bot / Pagos / Fallas recibidas
  if (esWhatsAppBot || esPagoWhatsApp || isReporteFalla) {
    return <FaseGestionOnline {...faseProps} />;
  }

  return null;
};
