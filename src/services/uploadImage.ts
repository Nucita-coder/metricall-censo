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
    if (!uri) throw new Error('URI de archivo no proporcionada.');

    // 1. Extraer extensión limpia y tipo MIME de forma segura
    let ext = 'jpg';
    let mimeType = 'image/jpeg';

    if (uri.startsWith('data:')) {
      const mimeMatch = uri.match(/^data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1].toLowerCase();
        const subtype = mimeType.split('/')[1] || 'jpeg';
        ext = subtype === 'jpeg' ? 'jpg' : subtype.replace(/[^a-z0-9]/gi, '');
      }
    } else {
      const cleanUri = uri.split('?')[0].split('#')[0];
      const lastSlash = cleanUri.lastIndexOf('/');
      const lastDot = cleanUri.lastIndexOf('.');
      if (lastDot > lastSlash && lastDot !== -1) {
        const rawExt = cleanUri.substring(lastDot + 1).toLowerCase();
        if (rawExt && rawExt.length <= 5) {
          ext = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-z0-9]/gi, '');
        }
      }
      mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    }

    // 2. Generar nombre de archivo único y seguro para Storage
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sanitizedFolder = folderName.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_\-\/]/g, '');
    const fileName = sanitizedFolder ? `${sanitizedFolder}/${uniqueId}.${ext}` : `${uniqueId}.${ext}`;

    let targetBucket = bucket;
    let targetPath = fileName;
    let error: { message?: string } | null = null;

    if (Platform.OS === 'web') {
      // 3. (Web) Obtener Blob para subida
      let blob: Blob;
      if (uri.startsWith('data:')) {
        try {
          const res = await fetch(uri);
          blob = await res.blob();
        } catch {
          const base64Data = uri.split(',')[1] || '';
          const byteChars = atob(base64Data);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
        }
      } else {
        const res = await fetch(uri);
        blob = await res.blob();
      }

      const response = await supabase.storage
        .from(targetBucket)
        .upload(targetPath, blob, {
          contentType: blob.type || mimeType,
          upsert: true,
        });
      error = response.error;

      // Fallback a 'adjuntos' si el bucket solicitado no existe
      if (error && targetBucket !== 'adjuntos') {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('bucket not found') || msg.includes('not found')) {
          console.warn(`[uploadImageToSupabase] Bucket '${targetBucket}' no encontrado. Reintentando en 'adjuntos'...`);
          targetBucket = 'adjuntos';
          targetPath = `${bucket}/${fileName}`;
          const retryRes = await supabase.storage
            .from(targetBucket)
            .upload(targetPath, blob, {
              contentType: blob.type || mimeType,
              upsert: true,
            });
          error = retryRes.error;
        }
      }
    } else {
      // 3. (Móvil)
      let fileData: ArrayBuffer;
      if (uri.startsWith('data:')) {
        const base64Data = uri.split(',')[1] || '';
        fileData = decode(base64Data);
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = decode(base64);
      }

      // 4. Subir a Supabase usando decode de base64-arraybuffer
      const response = await supabase.storage
        .from(targetBucket)
        .upload(targetPath, fileData, {
          contentType: mimeType,
          upsert: true,
        });
      error = response.error;

      // Fallback a 'adjuntos' si el bucket solicitado no existe
      if (error && targetBucket !== 'adjuntos') {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('bucket not found') || msg.includes('not found')) {
          console.warn(`[uploadImageToSupabase] Bucket '${targetBucket}' no encontrado. Reintentando en 'adjuntos'...`);
          targetBucket = 'adjuntos';
          targetPath = `${bucket}/${fileName}`;
          const retryRes = await supabase.storage
            .from(targetBucket)
            .upload(targetPath, fileData, {
              contentType: mimeType,
              upsert: true,
            });
          error = retryRes.error;
        }
      }
    }

    if (error) {
      console.error('[uploadImageToSupabase] Error subiendo imagen:', error);
      throw new Error(error.message || 'Error de almacenamiento en Supabase');
    }

    // 5. Obtener URL Pública
    const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(targetPath);

    if (!urlData?.publicUrl) {
      throw new Error('Supabase no retornó una URL pública válida.');
    }

    return urlData.publicUrl;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[uploadImageToSupabase] Excepción capturada:', errorMsg);
    throw new Error(errorMsg);
  }
};
