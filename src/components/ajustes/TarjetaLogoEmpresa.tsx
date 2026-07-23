import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Building2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../services/uploadImage';

interface TarjetaLogoEmpresaProps {
  empresaId: string | null;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}

export function TarjetaLogoEmpresa({
  empresaId,
  logoUrl,
  setLogoUrl,
  uploading,
  setUploading,
}: TarjetaLogoEmpresaProps) {
  const handlePickLogo = async () => {
    if (!empresaId) return;

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para cambiar el logo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setUploading(true);

        const publicUrl = await uploadImageToSupabase(selectedUri, 'adjuntos', `logos/${empresaId}`);
        if (!publicUrl) {
          throw new Error('No se pudo subir la imagen a Supabase Storage.');
        }

        const { error: updateError } = await supabase
          .from('empresas')
          .update({ logo_url: publicUrl })
          .eq('id', empresaId);

        if (updateError) throw updateError;

        setLogoUrl(publicUrl);
        Alert.alert('¡Éxito!', 'El logo de la empresa ha sido actualizado.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el logo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Logo de la Empresa</Text>
      <Text style={styles.cardSubtitle}>
        Este logo se mostrará en el encabezado principal del dashboard y reportes.
      </Text>

      <View style={styles.logoSection}>
        <View style={styles.logoPreviewContainer}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Building2 size={40} color="#8C9BAB" />
              <Text style={styles.logoPlaceholderText}>Sin Logo</Text>
            </View>
          )}
        </View>

        <View style={styles.logoActions}>
          <TouchableOpacity
            style={[styles.btnUpload, uploading && { opacity: 0.7 }]}
            onPress={handlePickLogo}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Upload size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnUploadText}>{logoUrl ? 'Cambiar Logo' : 'Subir Logo'}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.uploadHint}>Recomendado: Imagen PNG o JPG transparente de alta resolución.</Text>
        </View>
      </View>
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
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  logoPreviewContainer: {
    width: 140,
    height: 90,
    backgroundColor: '#1D2125',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#8C9BAB',
    fontSize: 12,
    marginTop: 4,
  },
  logoActions: {
    flex: 1,
    minWidth: 200,
  },
  btnUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  btnUploadText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadHint: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});
