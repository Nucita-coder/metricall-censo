import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Hourglass, XCircle } from 'lucide-react-native';
import { KANBAN_COLORS } from '../../../constants/theme';

interface SeccionEstadoPagoOnlineProps {
  estadoPagoActual: string;
  isSaving: boolean;
  onCambiarEstadoPago: (nuevoEstado: string) => void;
  onAbrirModalRechazo: () => void;
}

export function SeccionEstadoPagoOnline({
  estadoPagoActual,
  isSaving,
  onCambiarEstadoPago,
  onAbrirModalRechazo,
}: SeccionEstadoPagoOnlineProps) {
  const badgeConfig =
    estadoPagoActual === 'Pago Procesado'
      ? KANBAN_COLORS.badge.pagoProcesado
      : estadoPagoActual === 'Pago Rechazado'
      ? KANBAN_COLORS.badge.pagoRechazado
      : KANBAN_COLORS.badge.pagoPendiente;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estatus del Pago:</Text>

      {/* Badge de Estatus Actual */}
      <View style={[styles.badgeContainer, { backgroundColor: badgeConfig.bg }]}>
        {estadoPagoActual === 'Pago Procesado' && <CheckCircle2 size={16} color={badgeConfig.text} />}
        {estadoPagoActual === 'Pago Rechazado' && <XCircle size={16} color={badgeConfig.text} />}
        {estadoPagoActual !== 'Pago Procesado' && estadoPagoActual !== 'Pago Rechazado' && (
          <Hourglass size={16} color={badgeConfig.text} />
        )}
        <Text style={[styles.badgeText, { color: badgeConfig.text }]}>
          {estadoPagoActual}
        </Text>
      </View>

      <Text style={styles.subtitle}>Selecciona una acción para este pago:</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            estadoPagoActual === 'Pago Procesado' ? styles.btnProcesadoActive : styles.btnInactive,
            isSaving && styles.btnDisabled,
          ]}
          onPress={() => onCambiarEstadoPago('Pago Procesado')}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={16} color="#A0B2C6" />
          <Text style={styles.btnProcesadoText}>Pago Procesado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            estadoPagoActual === 'Pago Rechazado' ? styles.btnRechazadoActive : styles.btnInactive,
            isSaving && styles.btnDisabled,
          ]}
          onPress={onAbrirModalRechazo}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <XCircle size={16} color="#E2A3A3" />
          <Text style={styles.btnRechazadoText}>Pago Rechazado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.btnPendiente,
            isSaving && styles.btnDisabled,
          ]}
          onPress={() => onCambiarEstadoPago('Pago Pendiente Revisión')}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Hourglass size={14} color="#D69E2E" />
          <Text style={styles.btnPendienteText}>Pago Pendiente Revisión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161A1D',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#384148',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  badgeText: {
    fontWeight: '900',
    fontSize: 13,
  },
  subtitle: {
    fontSize: 12,
    color: '#8C9BAB',
    marginBottom: 10,
  },
  buttonsContainer: {
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnInactive: {
    backgroundColor: '#2C333A',
    borderColor: '#384148',
  },
  btnProcesadoActive: {
    backgroundColor: 'rgba(56, 161, 105, 0.2)',
    borderColor: 'rgba(56, 161, 105, 0.5)',
  },
  btnProcesadoText: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnRechazadoActive: {
    backgroundColor: 'rgba(229, 62, 62, 0.2)',
    borderColor: 'rgba(229, 62, 62, 0.5)',
  },
  btnRechazadoText: {
    color: '#E2A3A3',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnPendiente: {
    backgroundColor: '#2C333A',
    borderColor: '#384148',
    padding: 10,
  },
  btnPendienteText: {
    color: '#D69E2E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
