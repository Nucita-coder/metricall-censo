import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { X, User } from 'lucide-react-native';

interface ModalVerFotoPerfilProps {
  visible: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  nombre?: string | null;
  rol?: string | null;
  mensaje?: string | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);

export function ModalVerFotoPerfil({
  visible,
  onClose,
  avatarUrl,
  nombre,
  rol,
  mensaje,
}: ModalVerFotoPerfilProps) {
  const isDev = (rol || '').toLowerCase().includes('developer');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.contentContainer}>
              {/* Botón Cerrar */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>

              {/* Anillo de foto estilo Instagram (gradiente/borde estilizado) */}
              <View style={[styles.avatarRingOuter, isDev && styles.avatarRingOuterDev]}>
                <View style={styles.avatarRingInner}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, isDev && { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.avatarInitial}>{initialLetter}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Nombre y datos del usuario */}
              <View style={styles.infoContainer}>
                <Text style={styles.userName}>{nombre || 'Usuario'}</Text>
                
                {rol && (
                  <View style={[styles.roleBadge, isDev && styles.roleBadgeDev]}>
                    <Text style={[styles.roleText, isDev && styles.roleTextDev]}>
                      {isDev ? 'DEVELOPER' : rol.toUpperCase()}
                    </Text>
                  </View>
                )}

                {mensaje && (
                  <Text style={styles.userMessage}>"{mensaje}"</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2C333A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarRingOuter: {
    width: AVATAR_SIZE + 12,
    height: AVATAR_SIZE + 12,
    borderRadius: (AVATAR_SIZE + 12) / 2,
    padding: 4,
    // Borde brillante de estilo historia de instagram (magenta/violeta a azul metricall)
    borderWidth: 3,
    borderColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarRingOuterDev: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarRingInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#161A1D',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: AVATAR_SIZE * 0.4,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F4F5F7',
    textAlign: 'center',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(12, 102, 228, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  roleBadgeDev: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  roleText: {
    color: '#579DFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  roleTextDev: {
    color: '#F59E0B',
    letterSpacing: 1,
  },
  userMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#90CDF4',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 10,
  },
});
