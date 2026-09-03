import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';

interface ModalRechazarPagoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
  isSaving: boolean;
  clienteNombre?: string;
  referencia?: string;
}

const SUGERENCIAS_MOTIVOS = [
  'Referencia no encontrada en la cuenta bancaria',
  'Monto transferido no coincide con la factura',
  'Comprobante adjunto ilegible o borroso',
  'Fecha de transferencia no corresponde al período',
  'Banco de origen o titular no coincide',
];

export function ModalRechazarPago({
  visible,
  onClose,
  onConfirmar,
  isSaving,
  clienteNombre,
  referencia,
}: ModalRechazarPagoProps) {
  const [motivo, setMotivo] = useState('');

  const handleConfirmar = async () => {
    if (!motivo.trim()) return;
    await onConfirmar(motivo.trim());
    setMotivo('');
  };

  const handleClose = () => {
    if (isSaving) return;
    setMotivo('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <AlertCircle size={18} color="#EF4444" />
              </View>
              <Text style={styles.headerTitle}>Rechazar Reporte de Pago</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSaving} style={styles.btnClose}>
              <X size={18} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Context */}
          <Text style={styles.subtitleText}>
            Indica la causa obligatoria del rechazo. Este mensaje será notificado al cliente ({clienteNombre || 'Cliente'}) para que pueda corregirlo y subir su pago nuevamente.
          </Text>

          {referencia && referencia !== 'S/N' && (
            <View style={styles.referenciaBadge}>
              <Text style={styles.referenciaLabel}>REFERENCIA:</Text>
              <Text style={styles.referenciaVal}>{referencia}</Text>
            </View>
          )}

          {/* Sugerencias Rápidas */}
          <Text style={styles.labelSugerencias}>Causas frecuentes (toca para elegir):</Text>
          <View style={styles.chipsContainer}>
            {SUGERENCIAS_MOTIVOS.map((sug) => (
              <TouchableOpacity
                key={sug}
                style={[styles.chip, motivo === sug && styles.chipSelected]}
                onPress={() => setMotivo(sug)}
                disabled={isSaving}
              >
                <Text style={[styles.chipText, motivo === sug && styles.chipTextSelected]}>
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input de Motivo Obligatorio */}
          <Text style={styles.labelInput}>Mensaje / Causa del rechazo *</Text>
          <TextInput
            style={styles.textArea}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Escribe detalladamente por qué se rechaza el pago..."
            placeholderTextColor="#6B778C"
            multiline
            numberOfLines={3}
            editable={!isSaving}
          />

          {/* Botones de Acción */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnRechazar,
                (!motivo.trim() || isSaving) && styles.btnRechazarDisabled,
              ]}
              onPress={handleConfirmar}
              disabled={!motivo.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.btnRechazarText}>Rechazar y Notificar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#384148',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnClose: {
    padding: 4,
  },
  subtitleText: {
    color: '#8C9BAB',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  referenciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D2125',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  referenciaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  referenciaVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#579DFF',
  },
  labelSugerencias: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#1D2125',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#384148',
  },
  chipSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  chipTextSelected: {
    color: '#F87171',
    fontWeight: 'bold',
  },
  labelInput: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textArea: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 10,
    color: '#FFF',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelarText: {
    color: '#8C9BAB',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnRechazar: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRechazarDisabled: {
    opacity: 0.5,
  },
  btnRechazarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
