import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator, Alert, Platform } from 'react-native';
import { Image as ImageIcon, X, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { uploadImageToSupabase } from '../../../services/uploadImage';

export const SeccionAdjuntos = ({ tarjeta, onUpdateTarjeta, setImagenExpandida }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // La evidencia es inmutable si ya se registró la gestión de contacto o la tarjeta fue enviada
  const esEvidenciaInmutable = Boolean(
    data.adjuntosRegistrados ||
    (Array.isArray(data.gestionesCobranza) && data.gestionesCobranza.length > 0) ||
    data.resultadoContacto ||
    (Array.isArray(data.gestiones) && data.gestiones.length > 0)
  );

  const uploadImage = async (uri: string, base64String?: string | null) => {
    try {
      setSubiendoImagen(true);
      const publicUrl = await uploadImageToSupabase(uri, 'adjuntos');

      if (!publicUrl) throw new Error('No se pudo obtener la URL de la imagen subida.');

      const adjuntosActuales = data.adjuntos || [];
      const nuevosAdjuntos = [...adjuntosActuales, publicUrl];

      await onUpdateTarjeta({ adjuntos: nuevosAdjuntos });
      Alert.alert('Éxito', 'Imagen adjuntada correctamente.');
    } catch (error: any) {
      console.error('[SeccionAdjuntos] Error al subir imagen:', error);
      Alert.alert('Error al subir imagen', error.message || 'Ocurrió un error inesperado');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (e: any) {
      console.error('[SeccionAdjuntos] Error galería:', e);
      Alert.alert('Error', e.message || 'No se pudo seleccionar la imagen.');
    }
  };

  const pickFromCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (e: any) {
      console.error('[SeccionAdjuntos] Error cámara:', e);
      Alert.alert('Error', e.message || 'No se pudo tomar la foto.');
    }
  };

  const handleAdjuntarImagen = () => {
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }

    Alert.alert('Adjuntar Imagen', '¿Desde dónde deseas adjuntar la imagen?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: pickFromCamera },
      { text: 'Galería', onPress: pickFromGallery },
    ]);
  };

  return renderSection("Archivos Adjuntos", (
    <View>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          backgroundColor: '#2C333A',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#384148',
        }}
        onPress={handleAdjuntarImagen}
        disabled={subiendoImagen}
      >
        {subiendoImagen ? (
          <ActivityIndicator color="#B6C2CF" style={{ marginRight: 8 }} />
        ) : (
          <ImageIcon size={20} color="#B6C2CF" style={{ marginRight: 8 }} />
        )}
        <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>
          {subiendoImagen ? "Subiendo imagen..." : "Adjuntar Imagen"}
        </Text>
      </TouchableOpacity>

      {data.adjuntos?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {data.adjuntos?.map((url: string, index: number) => (
            <View key={index} style={{ marginRight: 12, position: 'relative', marginVertical: 4 }}>
              <TouchableOpacity onPress={() => setImagenExpandida && setImagenExpandida(url)}>
                <ImageBackground
                  source={{ uri: url }}
                  style={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 8, backgroundColor: '#384148' }}
                />
              </TouchableOpacity>

              {/* Si la evidencia ya fue registrada, no se puede eliminar (Inmutable) */}
              {esEvidenciaInmutable ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: '#2C333A',
                    borderRadius: 10,
                    padding: 3,
                    borderWidth: 1,
                    borderColor: '#5C6873',
                    zIndex: 10,
                    elevation: 3,
                  }}
                >
                  <Lock size={11} color="#9CA3AF" />
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: '#E53E3E',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    elevation: 3,
                  }}
                  onPress={async () => {
                    const nuevosAdjuntos = (data.adjuntos || []).filter((_: any, i: number) => i !== index);
                    await onUpdateTarjeta({ adjuntos: nuevosAdjuntos });
                  }}
                >
                  <X size={12} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  ));
};
