import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { AlertOctagon, Copy, Check, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export interface DiagnosticErrorData {
  code: string;
  message: string;
  technicalDetails?: string;
  module?: string;
  timestamp?: string;
}

interface DiagnosticErrorCardProps {
  error: DiagnosticErrorData | null;
  onClose: () => void;
}

export const DiagnosticErrorCard: React.FC<DiagnosticErrorCardProps> = ({ error, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const timestampStr = error.timestamp || new Date().toISOString();
  const fullDiagnosticText = `[DIAGNOSTICO DE ERROR - METRICALL]\nCodigo: ${error.code}\nModulo: ${error.module || 'General'}\nFecha: ${timestampStr}\nMensaje: ${error.message}\nDetalle Tecnico: ${error.technicalDetails || 'N/A'}`;

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullDiagnosticText);
      } else {
        await Clipboard.setStringAsync(fullDiagnosticText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback silencioso si falla portapapeles
    }
  };

  return (
    <Modal transparent visible={!!error} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Card Header */}
          <View style={styles.headerRow}>
            <View style={styles.badgeContainer}>
              <AlertOctagon size={20} color="#FF4D4D" style={{ marginRight: 6 }} />
              <Text style={styles.codeBadgeText}>{error.code}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Module & Timestamp Info */}
          <Text style={styles.moduleText}>
            Módulo: <Text style={styles.moduleHighlight}>{error.module || 'Sistema'}</Text> • {new Date(timestampStr).toLocaleTimeString()}
          </Text>

          {/* User Friendly Message */}
          <Text style={styles.userMessageTitle}>Notificación de Error:</Text>
          <Text style={styles.userMessage}>{error.message}</Text>

          {/* Technical Diagnostics Box for Screenshot / Dev */}
          {error.technicalDetails && (
            <View style={styles.technicalBox}>
              <Text style={styles.technicalTitle}>DETALLE TÉCNICO PARA DESARROLLADOR (CAPTURA):</Text>
              <Text style={styles.technicalText} numberOfLines={8} selectable>
                {error.technicalDetails}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              {copied ? <Check size={16} color="#48BB78" style={{ marginRight: 6 }} /> : <Copy size={16} color="#B6C2CF" style={{ marginRight: 6 }} />}
              <Text style={{ color: copied ? '#48BB78' : '#B6C2CF', fontWeight: 'bold', fontSize: 13 }}>
                {copied ? '¡Copiado!' : 'Copiar Diagnóstico'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#1E232A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF4D4D',
    padding: 20,
    width: '100%',
    maxWidth: 520,
    ...Platform.select({
      web: { boxShadow: '0px 0px 20px rgba(255, 77, 77, 0.4)' } as any,
      default: { elevation: 12, shadowColor: '#FF4D4D', shadowRadius: 10, shadowOpacity: 0.5 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBadgeText: {
    color: '#FF4D4D',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  moduleText: {
    color: '#8C9BAB',
    fontSize: 11,
    marginBottom: 12,
  },
  moduleHighlight: {
    color: '#B6C2CF',
    fontWeight: 'bold',
  },
  userMessageTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userMessage: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  technicalBox: {
    backgroundColor: '#111418',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  technicalTitle: {
    color: '#FF8080',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  technicalText: {
    color: '#A0AEC0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dismissButton: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
