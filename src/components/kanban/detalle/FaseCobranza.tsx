import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { getResultadoColor } from '../../../constants/theme';
import { FaseProps, findListaTarget } from './types';
import { PhoneCall, CheckCircle2, History } from 'lucide-react-native';
import { TarjetaDatosValores } from '../../../types/kanban';
import { notificarPagoProcesado, notificarPagoRechazado } from '../../../services/whatsappNotificacionesService';
import { ModalRechazarPago } from './ModalRechazarPago';
import { SeccionEstadoPagoCobranza } from './SeccionEstadoPagoCobranza';
import {
  OPCIONES_TIPO_CONTACTO_COBRANZA,
  OPCIONES_RESULTADO_COBRANZA,
  RESULTADOS_EFECTIVOS,
} from './faseCobranzaConstants';
import { styles } from './FaseCobranza.styles';

export {
  OPCIONES_TIPO_CONTACTO_COBRANZA,
  OPCIONES_RESULTADO_COBRANZA,
  RESULTADOS_EFECTIVOS,
};

export function FaseCobranza({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  listasGlobales,
  isSaving,
  setIsSaving,
}: FaseProps) {
  const datos = tarjeta.datos_valores || {};

  const [tipoContacto, setTipoContacto] = useState<string>(
    datos.tipoContacto || datos['TIPO DE CONTACTO'] || ''
  );
  const [resultado, setResultado] = useState<string>(
    datos.resultadoContacto || datos.resultado || datos['RESULTADO'] || ''
  );
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);

  const gestionesPrevias: Array<Record<string, unknown>> = (datos.gestionesCobranza as Array<Record<string, unknown>>) || [];

  const handleRegistrarGestionCobranza = async () => {
    if (!tipoContacto || !resultado) {
      Alert.alert(
        'Campos Incompletos',
        'Por favor selecciona el Tipo de Contacto y el Resultado antes de registrar.'
      );
      return;
    }

    const adjuntos = datos.adjuntos || [];
    if (!Array.isArray(adjuntos) || adjuntos.length === 0) {
      Alert.alert(
        'Evidencia Obligatoria',
        'Es obligatorio adjuntar al menos una imagen como evidencia en la sección "Archivos Adjuntos" antes de registrar el resultado de contacto.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const nuevaGestion = {
        fecha: new Date().toISOString(),
        tipoContacto,
        resultado,
        autor: datos.asesorComercial || 'Analista de Cobranza',
      };

      const updatedGestiones = [...gestionesPrevias, nuevaGestion];

      const updates: Partial<TarjetaDatosValores> = {
        tipoContacto,
        resultadoContacto: resultado,
        'TIPO DE CONTACTO': tipoContacto,
        RESULTADO: resultado,
        gestionesCobranza: updatedGestiones,
        adjuntosRegistrados: true,
      };

      await onUpdateTarjeta(updates);

      // Determinar si la tarjeta pertenece al flujo de Recupero o de Cobranza
      const listaActual = listasGlobales?.find(l => l.id === tarjeta.lista_id);
      const nombreListaActual = (listaActual?.nombre || '').toLowerCase();
      const esFlujoRecupero = nombreListaActual.includes('recupero');

      const nombreTargetEfectiva = esFlujoRecupero ? 'Acción efectiva (Recupero)' : 'Acción efectiva';
      const nombreTargetNegativa = esFlujoRecupero ? 'Acción negativa (Recupero)' : 'Acción negativa';

      // Auto-mover tarjeta según el resultado a la lista correspondiente de su flujo
      if (RESULTADOS_EFECTIVOS.includes(resultado)) {
        const listaDestino = findListaTarget(listasGlobales, nombreTargetEfectiva);
        if (listaDestino && listaDestino.id !== tarjeta.lista_id) {
          await autoMoverTarjeta(tarjeta, listaDestino.id);
        }
      } else {
        const listaDestino = findListaTarget(listasGlobales, nombreTargetNegativa);
        if (listaDestino && listaDestino.id !== tarjeta.lista_id) {
          await autoMoverTarjeta(tarjeta, listaDestino.id);
        }
      }

      Alert.alert('¡Gestión Registrada!', `Se guardó correctamente: ${resultado}`);
    } catch (err: unknown) {
      Alert.alert('Error', 'No se pudo guardar la gestión de cobranza: ' + ((err as Error)?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const esReportePago = Boolean(
    datos.comprobantePagoUrl ||
    datos.bancoOrigen ||
    datos.montoPago ||
    (datos.estadoCobranza && ['Pago Procesado', 'Pago Rechazado', 'Pago Pendiente Revisión', 'Pendiente Verificación'].includes(datos.estadoCobranza))
  );

  const estadoPagoActual = datos.estadoCobranza || 'Pago Pendiente Revisión';

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
      Alert.alert('Error', 'No se pudo cambiar el estado de pago: ' + ((e as Error)?.message || String(e)));
    } finally {
      setIsSaving(false);
      setMostrarModalRechazo(false);
    }
  };

  return (
    <View style={styles.cardSection}>
      {/* SECCIÓN DE ESTADO DE PAGO (Solo si la tarjeta es un reporte de pago real) */}
      {esReportePago && (
        <SeccionEstadoPagoCobranza
          estadoPagoActual={estadoPagoActual}
          isSaving={isSaving}
          onCambiarEstadoPago={handleCambiarEstadoPago}
          onAbrirModalRechazo={() => setMostrarModalRechazo(true)}
        />
      )}

      <View style={styles.sectionHeader}>
        <PhoneCall size={18} color="#8C9BAB" />
        <Text style={styles.sectionTitle}>Gestión de Cobranza / Contacto</Text>
      </View>

      <View style={styles.formContainer}>
        {/* SELECTOR 1: TIPO DE CONTACTO */}
        <SelectDropdown
          label="TIPO DE CONTACTO"
          value={tipoContacto}
          onSelect={(v) => setTipoContacto(v)}
          options={OPCIONES_TIPO_CONTACTO_COBRANZA}
          placeholder="Seleccione tipo de contacto..."
          isRequired
          disabled={isSaving}
        />

        {/* SELECTOR 2: RESULTADO */}
        <SelectDropdown
          label="RESULTADO"
          value={resultado}
          onSelect={(v) => setResultado(v)}
          options={OPCIONES_RESULTADO_COBRANZA}
          placeholder="Seleccione resultado de gestión..."
          isRequired
          disabled={isSaving}
        />

        {!(Array.isArray(datos.adjuntos) && datos.adjuntos.length > 0) && (
          <Text style={{ fontSize: 11, color: '#E2A3A3', marginTop: 4, fontStyle: 'italic' }}>
            * Es obligatorio adjuntar al menos 1 imagen como evidencia en "Archivos Adjuntos"
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.btnGuardar,
            (!tipoContacto || !resultado || isSaving) && styles.btnDisabled,
          ]}
          onPress={handleRegistrarGestionCobranza}
          disabled={!tipoContacto || !resultado || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#1D2125" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#1D2125" />
              <Text style={styles.btnGuardarText}>Registrar Resultado de Contacto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* HISTORIAL DE GESTIONES */}
      {gestionesPrevias.length > 0 && (
        <View style={styles.historialContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <History size={14} color="#8C9BAB" />
            <Text style={styles.historialTitle}>Historial de Contactos ({gestionesPrevias.length})</Text>
          </View>
          {gestionesPrevias.map((g, idx) => (
            <View key={idx} style={styles.historialItem}>
              <Text style={styles.historialFecha}>
                {g.fecha ? new Date(String(g.fecha)).toLocaleString() : '—'}
              </Text>
              <Text style={styles.historialTxt}>
                • Contacto: <Text style={{ color: '#B6C2CF' }}>{String(g.tipoContacto || '')}</Text>
              </Text>
              <Text style={styles.historialTxt}>
                • Resultado:{' '}
                <Text style={{ color: getResultadoColor(String(g.resultado || '')).text, fontWeight: 'bold' }}>
                  {String(g.resultado || '')}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Modal obligatorio para especificar la causa de rechazo de pago y notificar al cliente */}
      <ModalRechazarPago
        visible={mostrarModalRechazo}
        onClose={() => setMostrarModalRechazo(false)}
        onConfirmar={async (motivo) => {
          await handleCambiarEstadoPago('Pago Rechazado', motivo);
        }}
        isSaving={isSaving}
        clienteNombre={String(datos.nombreApellido || datos.nombre || '')}
        referencia={String(datos.referencia || datos.nroReferencia || '')}
      />
    </View>
  );
}
