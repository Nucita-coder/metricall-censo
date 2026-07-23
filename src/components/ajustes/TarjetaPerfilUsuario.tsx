import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera, Save, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../services/uploadImage';

export function TarjetaPerfilUsuario() {
  const { session, nombreCompleto, userRol, avatarUrl, mensaje: mensajeContext, refreshProfile } = useAuth();
  
  const [profileMsg, setProfileMsg] = useState(mensajeContext || '');
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProfileMsg(mensajeContext || '');
    setCurrentAvatar(avatarUrl || null);
  }, [mensajeContext, avatarUrl]);

  const countWords = (str: string) => {
    if (!str.trim()) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = countWords(profileMsg);
  const isWordLimitExceeded = wordCount > 20;

  const handlePickAvatar = async () => {
    if (!session?.user?.id) return;

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para cambiar la foto de perfil.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setUploadingAvatar(true);

        const publicUrl = await uploadImageToSupabase(selectedUri, 'adjuntos', `avatars/${session.user.id}`);
        if (!publicUrl) {
          throw new Error('No se pudo subir la imagen de perfil.');
        }

        const { error } = await supabase
          .from('perfiles')
          .update({ avatar_url: publicUrl })
          .eq('id', session.user.id);

        if (error) throw error;

        setCurrentAvatar(publicUrl);
        await refreshProfile();
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    if (isWordLimitExceeded) {
      Alert.alert('Límite de palabras', 'El mensaje no debe superar las 20 palabras.');
      return;
    }

    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from('perfiles')
        .update({ mensaje: profileMsg.trim() })
        .eq('id', session.user.id);

      if (error) throw error;

      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el mensaje de perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tu Perfil</Text>
      <Text style={styles.cardSubtitle}>Administra tu información personal, foto de perfil y mensaje de estado.</Text>

      <View style={styles.profileHeaderRow}>
        <View style={styles.avatarWrapper}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={32} color="#FFF" />
            </View>
          )}

          <TouchableOpacity
            style={styles.avatarChangeBtn}
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Camera size={14} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.userInfoCol}>
          <Text style={styles.userName}>{nombreCompleto || 'Usuario Metricall'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.userRole}>ROL: {userRol ? userRol.toUpperCase() : 'MIEMBRO'}</Text>
          </View>
          <Text style={styles.userEmail}>{session?.user?.email}</Text>
        </View>
      </View>

      {/* CAMPO MENSAJE / ESTADO DE PERFIL */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Mensaje de Estado</Text>
          <Text style={[styles.wordCounter, isWordLimitExceeded && styles.wordCounterDanger]}>
            {wordCount} / 20 palabras
          </Text>
        </View>

        <TextInput
          style={[styles.inputMsg, isWordLimitExceeded && styles.inputMsgError]}
          value={profileMsg}
          onChangeText={setProfileMsg}
          placeholder="Escribe un mensaje de estado personal (máximo 20 palabras)..."
          placeholderTextColor="#8C9BAB"
          multiline
          numberOfLines={2}
        />

        {isWordLimitExceeded && (
          <Text style={styles.errorText}>El mensaje no puede exceder 20 palabras.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnSave, (savingProfile || isWordLimitExceeded) && { opacity: 0.6 }]}
        onPress={handleSaveProfile}
        disabled={savingProfile || isWordLimitExceeded}
      >
        {savingProfile ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : savedSuccess ? (
          <>
            <Check size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnSaveText}>Perfil Guardado</Text>
          </>
        ) : (
          <>
            <Save size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnSaveText}>Guardar Perfil</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#384148',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0C66E4',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChangeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0052CC',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22272B',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#8C9BAB',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  wordCounter: {
    fontSize: 12,
    color: '#8C9BAB',
    fontWeight: '600',
  },
  wordCounterDanger: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  inputMsg: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputMsgError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  btnSaveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
