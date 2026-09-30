import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { EquipoMemberItem } from './EquipoMemberCard';

interface ModalResetPasswordProps {
  visible: boolean;
  member: EquipoMemberItem | null;
  onClose: () => void;
}

export function ModalResetPassword({ visible, member, onClose }: ModalResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!member) return null;

  const memberName = member.nombre_completo || member.perfil?.nombre_completo || 'Usuario';

  const handleReset = async () => {
    const trimmed = newPassword.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Ingresa una nueva contraseña.');
      return;
    }
    if (trimmed.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_reset_user_password', {
        p_target_user_id: member.id,
        p_new_password: trimmed,
      });

      if (error) throw error;

      const successMsg = `La contraseña de "${memberName}" ha sido restablecida exitosamente.`;
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Éxito', successMsg);
      }

      setNewPassword('');
      setShowPassword(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setNewPassword('');
    setShowPassword(false);
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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <KeyRound size={16} color="#B6C2CF" />
              </View>
              <Text style={styles.headerTitle}>Restablecer Contraseña</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeBtn}>
              <X size={18} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.subtitle}>Establece una nueva clave para:</Text>
            <Text style={styles.memberName} numberOfLines={1}>{memberName}</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nueva clave (mín. 6 car.)"
                placeholderTextColor="#8C9BAB"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(prev => !prev)}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#8C9BAB" />
                ) : (
                  <Eye size={18} color="#8C9BAB" />
                )}
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#1D2125" />
                ) : (
                  <Text style={styles.confirmBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  subtitle: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
    marginBottom: 14,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 42,
    fontSize: 14,
    color: '#FFFFFF',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  actions: {
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
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#A0B2C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    color: '#1D2125',
    fontWeight: 'bold',
  },
});
