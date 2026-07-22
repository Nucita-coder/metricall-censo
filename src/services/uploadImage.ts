import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública.
 * Soporta URIs locales convirtiéndolas a base64 para evitar problemas con Blobs en React Native.
 * 
 * @param uri La URI local del archivo (ej. obtenida de expo-image-picker o expo-camera)
 * @param bucket Nombre del bucket en Supabase (ej. 'adjuntos')
 * @param folderName (Opcional) Nombre de la carpeta dentro del bucket, o prefijo para el archivo
 * @returns La URL pública de la imagen subida, o null si ocurre un error.
 */
export const uploadImageToSupabase = async (
  uri: string,
  bucket: string = 'adjuntos',
  folderName: string = ''
): Promise<string | null> => {
  try {
    // 1. Obtener extensión del archivo
    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpeg';
    
    // 2. Generar nombre único
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileName = folderName ? `${folderName}/${uniqueId}.${ext}` : `${uniqueId}.${ext}`;

    let error: any;

    if (Platform.OS === 'web') {
      // 3. (Web) Usar Fetch y Blob directo
      const res = await fetch(uri);
      const blob = await res.blob();
      const response = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
        });
      error = response.error;
    } else {
      // 3. (Móvil) Leer el archivo como Base64 (más seguro en React Native que usar fetch Blob)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 4. Subir a Supabase usando decode de base64-arraybuffer
      const response = await supabase.storage
        .from(bucket)
        .upload(fileName, decode(base64), {
          contentType: `image/${ext}`,
        });
      error = response.error;
    }

    if (error) {
      console.error('[uploadImageToSupabase] Error subiendo imagen:', error);
      throw error;
    }

    // 5. Obtener URL Pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('[uploadImageToSupabase] Excepción capturada:', error);
    return null;
  }
};
