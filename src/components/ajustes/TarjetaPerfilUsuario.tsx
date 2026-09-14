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
import { User, Camera, Save, Check, Code2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../services/uploadImage';
import { ModalVerFotoPerfil } from '../common/ModalVerFotoPerfil';
import { styles } from './TarjetaPerfilUsuario.styles';

export function TarjetaPerfilUsuario() {
  const { session, nombreCompleto, userRol, isDeveloper, avatarUrl, mensaje: mensajeContext, refreshProfile } = useAuth();
  
  const [profileMsg, setProfileMsg] = useState(mensajeContext || '');
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [verFotoModal, setVerFotoModal] = useState(false);

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
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo actualizar la foto de perfil.');
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
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo actualizar el mensaje de perfil.');
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
          <TouchableOpacity onPress={() => setVerFotoModal(true)} activeOpacity={0.85}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={32} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

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
          {isDeveloper ? (
            <View style={[styles.roleBadge, styles.roleBadgeDev]}>
              <Code2 size={11} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={[styles.userRole, styles.userRoleDev]}>DEVELOPER</Text>
            </View>
          ) : (
            <View style={styles.roleBadge}>
              <Text style={styles.userRole}>ROL: {userRol ? userRol.toUpperCase() : 'MIEMBRO'}</Text>
            </View>
          )}
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

      <ModalVerFotoPerfil
        visible={verFotoModal}
        onClose={() => setVerFotoModal(false)}
        avatarUrl={currentAvatar}
        nombre={nombreCompleto}
        rol={userRol}
        mensaje={profileMsg}
      />
    </View>
  );
}

