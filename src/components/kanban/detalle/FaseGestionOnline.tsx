import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import { notificarPagoProcesado, notificarPagoRechazado } from '../../../services/whatsappNotificacionesService';
import { ModalRechazarPago } from './ModalRechazarPago';
import { SeccionEstadoPagoOnline } from './SeccionEstadoPagoOnline';
import { SeccionAccionFallaOnline } from './SeccionAccionFallaOnline';
import { SeccionAccionesVentaOnline } from './SeccionAccionesVentaOnline';

/**
 * FaseGestionOnline
 * Botones de acción para tarjetas creadas desde el bot de WhatsApp (Gestión Online).
 * Se muestra cuando la tarjeta tiene origen='WhatsApp Bot'.
 */
export const FaseGestionOnline = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const { showDiagnosticError } = useErrorDiagnostics();
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);

  const datosValores = tarjeta.datos_valores || {};

  const isReporteFalla = Boolean(
    datosValores.tipoFalla ||
    datosValores.estadoSoporte ||
    (datosValores.origen && String(datosValores.origen).toLowerCase().includes('soporte')) ||
    (datosValores.origen && String(datosValores.origen).toLowerCase().includes('falla')) ||
    String(datosValores.nombreApellido || '').toLowerCase().includes('falla')
  );

  const esReportePago = !isReporteFalla && Boolean(
    datosValores.comprobantePagoUrl ||
    datosValores.bancoOrigen ||
    datosValores.montoPago ||
    (datosValores.estadoCobranza && ['Pago Procesado', 'Pago Rechazado', 'Pago Pendiente Revisión', 'Pendiente Verificación'].includes(datosValores.estadoCobranza))
  );

  const estadoPagoActual = datosValores.estadoCobranza || 'Pago Pendiente Revisión';

  const handleCambiarEstadoPago = async (nuevoEstado: string, motivoRechazo?: string) => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoCobranza: nuevoEstado,
        estadoGestion: nuevoEstado.toLowerCase().replace(/\s+/g, '_'),
        motivoRechazoPago: motivoRechazo || null,
        motivo_rechazo: motivoRechazo || null,
        fechaUltimaGestionPago: new Date().toISOString(),
      });

      let mensajeResultado = `El pago ahora está marcado como: ${nuevoEstado}`;
      if (nuevoEstado === 'Pago Procesado') {
        const notif = await notificarPagoProcesado(tarjeta);
        if (notif.success) {
          mensajeResultado += '\n\n📲 Se envió la notificación de confirmación al cliente por WhatsApp.';
        } else if (notif.noPhone) {
          mensajeResultado += '\n\nℹ️ (La tarjeta no tiene número telefónico registrado para enviar WhatsApp).';
        } else {
          mensajeResultado += `\n\n⚠️ (No se pudo entregar el mensaje por WhatsApp: ${notif.error || 'Error de conexión'}).`;
        }
      } else if (nuevoEstado === 'Pago Rechazado') {
        const notif = await notificarPagoRechazado(tarjeta, motivoRechazo);
        if (notif.success) {
          mensajeResultado += `\n\n📲 Se notificó la causa del rechazo al cliente por WhatsApp:\n"${motivoRechazo}"`;
        } else if (notif.noPhone) {
          mensajeResultado += '\n\nℹ️ (La tarjeta no tiene número telefónico registrado para enviar WhatsApp).';
        } else {
          mensajeResultado += `\n\n⚠️ (No se pudo entregar el mensaje por WhatsApp: ${notif.error || 'Error de conexión'}).`;
        }
      }

      Alert.alert('Estatus Actualizado', mensajeResultado);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-PAGO-ESTADO',
        'Error al actualizar el estado de pago.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
      setMostrarModalRechazo(false);
    }
  };

  const sectionTitle = esReportePago
    ? 'Gestión de Reporte de Pago'
    : isReporteFalla
    ? 'Gestión de Reporte de Falla'
    : 'Acciones de Gestión Online';

  return renderSection(sectionTitle, (
    <View>
      {esReportePago ? (
        <SeccionEstadoPagoOnline
          estadoPagoActual={estadoPagoActual}
          isSaving={isSaving}
          onCambiarEstadoPago={handleCambiarEstadoPago}
          onAbrirModalRechazo={() => setMostrarModalRechazo(true)}
        />
      ) : isReporteFalla ? (
        <SeccionAccionFallaOnline
          tarjeta={tarjeta}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          onUpdateTarjeta={onUpdateTarjeta}
          autoMoverTarjeta={autoMoverTarjeta}
          onRemoveTarjetaLocal={onRemoveTarjetaLocal}
          setTarjetaSeleccionada={setTarjetaSeleccionada}
        />
      ) : (
        <SeccionAccionesVentaOnline
          tarjeta={tarjeta}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          onUpdateTarjeta={onUpdateTarjeta}
          autoMoverTarjeta={autoMoverTarjeta}
          listasGlobales={listasGlobales}
          onRemoveTarjetaLocal={onRemoveTarjetaLocal}
          setTarjetaSeleccionada={setTarjetaSeleccionada}
        />
      )}

      {/* Modal obligatorio para especificar la causa de rechazo de pago y notificar al cliente */}
      <ModalRechazarPago
        visible={mostrarModalRechazo}
        onClose={() => setMostrarModalRechazo(false)}
        onConfirmar={async (motivo) => {
          await handleCambiarEstadoPago('Pago Rechazado', motivo);
        }}
        isSaving={isSaving}
        clienteNombre={String(datosValores.nombreApellido || datosValores.nombre || '')}
        referencia={String(datosValores.referencia || datosValores.nroReferencia || '')}
      />
    </View>
  ));
};
