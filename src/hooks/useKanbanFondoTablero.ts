import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { TableroInfo } from '../types/kanban';
import { uploadImageToSupabase } from '../services/uploadImage';

interface UseKanbanFondoTableroParams {
  tableroInfo: TableroInfo | null;
  setTableroInfo: (info: TableroInfo | null) => void;
  id: string;
}

export const useKanbanFondoTablero = ({ tableroInfo, setTableroInfo, id }: UseKanbanFondoTableroParams) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /** Sube una imagen URI a Supabase Storage y actualiza el fondo del tablero en DB */
  const _subirFondo = async (uri: string): Promise<void> => {
    if (!tableroInfo) return;
    setIsUploadingImage(true);
    try {
      const publicUrl = await uploadImageToSupabase(uri, 'adjuntos', `tableros/${id}`);
      if (!publicUrl) throw new Error('No se pudo subir la imagen.');
      const { error } = await supabase.from('tableros').update({ fondo_url: publicUrl }).eq('id', id);
      if (error) throw error;
      setTableroInfo({ ...tableroInfo, fondo_url: publicUrl });
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * Muestra el selector de fondo: galería o cámara (nativo) / solo galería (web).
   * Incluye opción de eliminar el fondo actual si existe.
   */
  const handleCambiarFondo = async (): Promise<void> => {
    if (!tableroInfo) return;

    // Web: selector directo de galería sin Alert nativo
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
        if (!result.canceled && result.assets?.length > 0) {
          await _subirFondo(result.assets[0].uri);
          alert('¡Éxito! El fondo del tablero ha sido actualizado.');
        }
      } catch (e: unknown) {
        alert('Error: ' + (e as Error).message || 'Error al cambiar fondo');
      }
      return;
    }

    Alert.alert(
      'Fondo del Tablero',
      'Elige una opción para cambiar la imagen de fondo de este tablero',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...(tableroInfo.fondo_url ? [{
          text: 'Quitar Fondo',
          style: 'destructive' as const,
          onPress: async () => {
            try {
              setIsUploadingImage(true);
              const { error } = await supabase.from('tableros').update({ fondo_url: null }).eq('id', id);
              if (error) throw error;
              setTableroInfo({ ...tableroInfo, fondo_url: undefined });
              Alert.alert('Éxito', 'Fondo eliminado correctamente');
            } catch (e: unknown) {
              Alert.alert('Error', (e as Error).message || 'No se pudo quitar el fondo');
            } finally {
              setIsUploadingImage(false);
            }
          },
        }] : []),
        {
          text: 'Seleccionar de Galería',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la galería de fotos.'); return; }
              const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
              if (!result.canceled && result.assets?.length > 0) {
                await _subirFondo(result.assets[0].uri);
                Alert.alert('¡Éxito!', 'El fondo del tablero ha sido actualizado.');
              }
            } catch (e: unknown) {
              Alert.alert('Error', (e as Error).message || 'Error al cambiar fondo');
            }
          },
        },
        {
          text: 'Tomar Foto (Cámara)',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') { Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.'); return; }
              const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
              if (!result.canceled && result.assets?.length > 0) {
                await _subirFondo(result.assets[0].uri);
                Alert.alert('¡Éxito!', 'El fondo del tablero ha sido actualizado.');
              }
            } catch (e: unknown) {
              Alert.alert('Error', (e as Error).message || 'Error al cambiar fondo');
            }
          },
        },
      ]
    );
  };

  return { handleCambiarFondo, isUploadingImage };
};
