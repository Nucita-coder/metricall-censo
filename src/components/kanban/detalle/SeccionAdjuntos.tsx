import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { uploadImageToSupabase } from '../../../services/uploadImage';

export const SeccionAdjuntos = ({ tarjeta, onUpdateTarjeta, setImagenExpandida }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [subiendoImagen, setSubiendoImagen] = useState(false);

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
      Alert.alert('Error al subir imagen', error.message);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleAdjuntarImagen = () => {
    Alert.alert('Adjuntar Imagen', '¿Desde dónde deseas adjuntar la imagen?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadImage(result.assets[0].uri, result.assets[0].base64);
          }
        }
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadImage(result.assets[0].uri, result.assets[0].base64);
          }
        }
      }
    ]);
  };

  return renderSection("Archivos Adjuntos", (
    <View>
      <TouchableOpacity
        style={{ flexDirection: 'row', backgroundColor: '#2C333A', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
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
            <TouchableOpacity key={index} style={{ marginRight: 12 }} onPress={() => setImagenExpandida && setImagenExpandida(url)}>
              <ImageBackground
                source={{ uri: url }}
                style={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 8, backgroundColor: '#384148' }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  ));
};
