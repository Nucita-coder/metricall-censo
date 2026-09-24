import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { FaseProps, findListaTarget } from './types';
import { CheckCircle2, MessageCircle, PhoneCall } from 'lucide-react-native';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { notificarPagoProcesado, notificarPagoRechazado } from '../../../services/whatsappNotificacionesService';
import { contactarClientePorWhatsApp, formatMonto } from '../../../services/whatsappCobranzaService';
import { ModalRechazarPago } from './ModalRechazarPago';
import { SeccionEstadoPagoCobranza } from './SeccionEstadoPagoCobranza';
import { SeccionHistorialCobranza } from './SeccionHistorialCobranza';
import {
  OPCIONES_TIPO_CONTACTO_COBRANZA,
  OPCIONES_RESULTADO_COBRANZA,
  RESULTADOS_EFECTIVOS,
  RESULTADOS_NEGATIVOS,
  findListaCobranzaTarget,
} from './faseCobranzaConstants';
import { styles } from './FaseCobranza.styles';

export {
  OPCIONES_TIPO_CONTACTO_COBRANZA,
  OPCIONES_RESULTADO_COBRANZA,
  RESULTADOS_EFECTIVOS,
  RESULTADOS_NEGATIVOS,
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

  const rawSaldoCobranza = datos.saldo ?? datos['SALDO'] ?? datos.monto ?? datos.Monto ?? datos['MONTO'] ?? datos.montoDeuda;

  const handleContactarWhatsApp = async () => {
    const res = await contactarClientePorWhatsApp(datos);
    if (!res.success) {
      Alert.alert('Teléfono no disponible', res.error || 'Verifica el número telefónico del cliente.');
    } else {
      if (!tipoContacto) {
        setTipoContacto('WhatsApp');
      }
    }
  };

  const gestionesPrevias: Array<Record<string, unknown>> = (datos.gestionesCobranza as Array<Record<string, unknown>>) || [];

  const handleRegistrarGestionCobranza = async () => {
    if (!tipoContacto || !resultado) {
      Alert.alert(
        'Campos Incompletos',
        'Por favor selecciona el Tipo de Contacto y el Resultado antes de registrar.'
      );
      return;
    }

    const resultadoLimpio = resultado.trim().toUpperCase();
    const esEfectiva = RESULTADOS_EFECTIVOS.some(
      (r) => r.trim().toUpperCase() === resultadoLimpio
    );
    const accionFinal = esEfectiva ? 'ACCIÓN EFECTIVA' : 'ACCIÓN NEGATIVA';

    setIsSaving(true);
    try {
      const nuevaGestion = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tipoAccion: accionFinal,
        categoriaAccion: accionFinal,
        tipoContacto,
        resultado,
        autor: datos.asesorComercial || 'Analista de Cobranza',
      };

      const updatedGestiones = [nuevaGestion, ...gestionesPrevias];

      const updates: Partial<TarjetaDatosValores> = {
        tipoAccion: accionFinal,
        categoriaAccion: accionFinal,
        tipoContacto,
        resultadoContacto: resultado,
        'TIPO DE CONTACTO': tipoContacto,
        RESULTADO: resultado,
        fechaUltimoContacto: new Date().toISOString(),
        gestionesCobranza: updatedGestiones,
      };

      await onUpdateTarjeta(updates);

      // Determinar si la tarjeta pertenece al flujo de Recupero o de Cobranza
      const listaActual = listasGlobales?.find((l) => l.id === tarjeta.lista_id);
      const nombreListaActual = (listaActual?.nombre || '').toLowerCase();
      const esFlujoRecupero = nombreListaActual.includes('recupero');

      // Buscar determinísticamente la lista destino en base a la pauta
      const listaDestino = findListaCobranzaTarget(
        listasGlobales || [],
        esEfectiva,
        esFlujoRecupero
      );

      const updatedTarjeta: Tarjeta = {
        ...tarjeta,
        datos_valores: {
          ...(tarjeta.datos_valores || {}),
          ...updates,
        },
      };

      if (listaDestino && listaDestino.id !== tarjeta.lista_id) {
        await autoMoverTarjeta(updatedTarjeta, listaDestino.id);
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

      {/* ACCIÓN RÁPIDA: CONTACTAR POR WHATSAPP */}
      <View style={styles.whatsappCard}>
        <View style={styles.whatsappInfoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappLabel}>CLIENTE A CONTACTAR</Text>
            <Text style={styles.whatsappNombre} numberOfLines={1}>
              {datos.nombreApellido || datos.nombre || 'Cliente'}
            </Text>
            <Text style={styles.whatsappMeta}>
              {datos.nroAbonado ? `${String(datos.nroAbonado).startsWith('#') ? datos.nroAbonado : `#${datos.nroAbonado}`} • ` : ''}
              {datos.telefonoMovil || datos.nroTelefonoMovil || 'Sin teléfono registrado'}
              {rawSaldoCobranza ? ` • Deuda: ${formatMonto(rawSaldoCobranza)}` : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnWhatsApp}
          onPress={handleContactarWhatsApp}
          activeOpacity={0.7}
        >
          <MessageCircle size={16} color="#B6C2CF" />
          <Text style={styles.btnWhatsAppText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
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
      <SeccionHistorialCobranza gestiones={gestionesPrevias} />

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
