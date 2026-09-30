import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ExternalLink, MapPinOff, RefreshCw, X } from 'lucide-react-native';

interface ModalPermisoUbicacionProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  loading?: boolean;
}

export function ModalPermisoUbicacion({
  visible,
  onClose,
  onRetry,
  loading = false,
}: ModalPermisoUbicacionProps) {
  const isWeb = Platform.OS === 'web';

  const handleOpenSettings = async () => {
    try {
      if (!isWeb) {
        await Linking.openSettings();
      }
    } catch (e: unknown) {
      console.warn('Error abriendo ajustes:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MapPinOff size={16} color="#B6C2CF" />
              </View>
              <Text style={styles.headerTitle}>Permiso de Ubicación</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
              <X size={18} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PERMISO BLOQUEADO</Text>
              </View>
            </View>

            <Text style={styles.description}>
              El acceso al GPS está denegado en este dispositivo. Para registrar coordenadas en ventas o instalaciones, es necesario desbloquearlo.
            </Text>

            {/* Instruction Box */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>
                {isWeb ? 'Pasos para desbloquear en PWA / Navegador:' : 'Pasos para desbloquear en tu dispositivo:'}
              </Text>
              {isWeb ? (
                <>
                  <Text style={styles.stepText}>1. Toca el candado o ajustes del sitio junto a la URL del navegador.</Text>
                  <Text style={styles.stepText}>2. En el apartado de permisos, cambia Ubicación a "Permitir".</Text>
                  <Text style={styles.stepText}>3. Pulsa "Reintentar Captura" abajo.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.stepText}>1. Pulsa "Abrir Ajustes" para ir a la configuración de la app.</Text>
                  <Text style={styles.stepText}>2. En la sección de Permisos, activa "Ubicación".</Text>
                  <Text style={styles.stepText}>3. Regresa a Metricall y presiona "Reintentar Captura".</Text>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {!isWeb && (
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={handleOpenSettings}
                  disabled={loading}
                >
                  <ExternalLink size={14} color="#B6C2CF" style={{ marginRight: 6 }} />
                  <Text style={styles.settingsBtnText}>Abrir Ajustes</Text>
                </TouchableOpacity>
              )}

              <View style={styles.mainActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cerrar</Text>
                </TouchableOpacity>

                {onRetry && (
                  <TouchableOpacity
                    style={[styles.retryBtn, loading && { opacity: 0.6 }]}
                    onPress={onRetry}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#1D2125" />
                    ) : (
                      <>
                        <RefreshCw size={14} color="#1D2125" style={{ marginRight: 6 }} />
                        <Text style={styles.retryBtnText}>Reintentar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C333A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  badgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C9BAB',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: '#B6C2CF',
    lineHeight: 18,
    marginBottom: 12,
  },
  instructionBox: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#8C9BAB',
    lineHeight: 17,
    marginBottom: 4,
  },
  actions: {
    gap: 8,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 4,
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  mainActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#8C9BAB',
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#A0B2C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 13,
    color: '#1D2125',
    fontWeight: 'bold',
  },
});
