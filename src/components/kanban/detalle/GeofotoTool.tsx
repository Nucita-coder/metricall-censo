import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ImageBackground, Alert, Image, Platform } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocation } from '../../../context/LocationContext';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import NetInfo from '@react-native-community/netinfo';
import { uploadImageToSupabase } from '../../../services/uploadImage';

const safeCaptureRef = async (ref: any, options: any) => {
  if (Platform.OS === 'web') return null;
  const { captureRef } = await import('react-native-view-shot');
  return captureRef(ref, options);
};

const generarWatermarkWeb = async (fotoInfo: { uri: string, width: number, height: number, lat: number, lng: number, altitude?: number, accuracy?: number }): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (typeof document === 'undefined') return resolve(fotoInfo.uri);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(fotoInfo.uri);

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const targetWidth = 1024;
        const targetHeight = Math.round(1024 * (img.naturalHeight / img.naturalWidth || fotoInfo.height / fotoInfo.width || 1));
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const boxWidth = 400;
        const boxHeight = 220;
        const margin = 20;
        const boxX = targetWidth - boxWidth - margin;
        const boxY = targetHeight - boxHeight - margin;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
          ctx.fill();
        } else {
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillText(`Lat: ${fotoInfo.lat.toFixed(6)}`, boxX + 20, boxY + 40);
        ctx.fillText(`Lng: ${fotoInfo.lng.toFixed(6)}`, boxX + 20, boxY + 75);
        ctx.fillText(`Elev: ${(fotoInfo.altitude || 0).toFixed(2)} m`, boxX + 20, boxY + 110);
        ctx.fillText(`Prec: ±${(fotoInfo.accuracy || 0).toFixed(2)} m`, boxX + 20, boxY + 145);

        ctx.font = '18px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(new Date().toLocaleString(), boxX + 20, boxY + 185);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(fotoInfo.uri);
      img.src = fotoInfo.uri;
    } catch (e) {
      console.error('[generarWatermarkWeb] Error:', e);
      resolve(fotoInfo.uri);
    }
  });
};

interface GeofotoToolProps {
  onPhotoCaptured: (url: string) => void;
  isSaving: boolean;
  buttonText?: string;
  buttonStyle?: object;
}

export const GeofotoTool: React.FC<GeofotoToolProps> = ({ onPhotoCaptured, isSaving, buttonText = "Añadir GeoFoto", buttonStyle }) => {
  const [obteniendoGeo, setObteniendoGeo] = useState(false);
  const [fotoTemporalParaMarcar, setFotoTemporalParaMarcar] = useState<{ uri: string, width: number, height: number, lat: number, lng: number, altitude?: number, accuracy?: number } | null>(null);
  const watermarkViewRef = useRef<View>(null);

  const { currentLocation } = useLocation();
  const { showDiagnosticError } = useErrorDiagnostics();

  const tomarGeoFoto = async () => {
    if (!currentLocation) {
      showDiagnosticError(
        'ERR-GEO-GPS-PENDIENTE',
        'Se requiere señal GPS activa antes de tomar la GeoFoto.',
        'LocationContext.currentLocation es null. Asegúrese de otorgar permisos de ubicación y tener GPS activo.',
        'GeoFoto'
      );
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;
      if (Platform.OS === 'web') {
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 }).catch(async () => {
          return await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showDiagnosticError(
            'ERR-GEO-CAMARA-PERMISO',
            'Se requiere permiso de acceso a la cámara.',
            'ImagePicker.requestCameraPermissionsAsync devolvió status: ' + status,
            'GeoFoto'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setObteniendoGeo(true);
        const lat = currentLocation.coords.latitude;
        const lng = currentLocation.coords.longitude;
        const altitude = currentLocation.coords.altitude || 0;
        const accuracy = currentLocation.coords.accuracy || 0;

        const asset = result.assets[0];

        if (accuracy > 50) {
          console.warn(`[GeoFoto] Advertencia de baja precisión GPS: ±${accuracy}m`);
        }

        setFotoTemporalParaMarcar({
          uri: asset.uri,
          width: asset.width || 1024,
          height: asset.height || 768,
          lat,
          lng,
          altitude,
          accuracy
        });
      }
    } catch (e: any) {
      showDiagnosticError('ERR-GEO-CAPTURAR', 'No se pudo abrir la cámara o capturar la fotografía.', e, 'GeoFoto');
      setObteniendoGeo(false);
    }
  };

  const procesarSubidaGeoFoto = async (capturedUri: string) => {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const publicUrl = await uploadImageToSupabase(capturedUri, 'adjuntos', 'geonap');
        if (!publicUrl) throw new Error('Supabase no retornó una URL pública válida.');
        
        onPhotoCaptured(publicUrl);
        if (Platform.OS === 'web') window.alert('Éxito: Foto guardada con coordenadas impresas.');
        else Alert.alert('Éxito', 'Foto guardada con coordenadas impresas.');
      } else {
        const filename = capturedUri.split('/').pop() || `geofoto_${Date.now()}.jpg`;
        const localPath = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({ from: capturedUri, to: localPath });
        
        onPhotoCaptured(localPath);
      }
    } catch (e: any) {
      showDiagnosticError('ERR-GEO-SUBIDA', 'Error al procesar o subir la GeoFoto a la nube.', e, 'GeoFoto');
    } finally {
      setFotoTemporalParaMarcar(null);
      setObteniendoGeo(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[{ backgroundColor: '#DD6B20', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }, buttonStyle]}
        onPress={tomarGeoFoto}
        disabled={obteniendoGeo || isSaving}
      >
        {obteniendoGeo ? <ActivityIndicator color="#FFF" size="small" /> : <ImageIcon size={16} color="#FFF" style={{ marginRight: 8 }} />}
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{buttonText}</Text>
      </TouchableOpacity>

      {/* HIDDEN WATERMARK VIEW */}
      {fotoTemporalParaMarcar && (
        <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
          <View ref={watermarkViewRef} style={{ width: 1024, height: 1024 * (fotoTemporalParaMarcar.height / fotoTemporalParaMarcar.width), backgroundColor: '#000' }} collapsable={false}>
            <ImageBackground
              source={{ uri: fotoTemporalParaMarcar.uri }}
              style={{ width: '100%', height: '100%' }}
              onLoad={() => {
                setTimeout(async () => {
                  if (Platform.OS === 'web') {
                    const stampedUri = await generarWatermarkWeb(fotoTemporalParaMarcar);
                    await procesarSubidaGeoFoto(stampedUri);
                    return;
                  }
                  try {
                    const capturedUri = await safeCaptureRef(watermarkViewRef, {
                      format: 'jpg',
                      quality: 0.5,
                      result: 'tmpfile'
                    });
                    
                    if (!capturedUri) {
                      await procesarSubidaGeoFoto(fotoTemporalParaMarcar.uri);
                      return;
                    }
                    await procesarSubidaGeoFoto(capturedUri);
                  } catch (e: any) {
                    showDiagnosticError('ERR-GEO-WATERMARK', 'Error al generar la marca de agua en la imagen.', e, 'GeoFoto');
                    setFotoTemporalParaMarcar(null);
                    setObteniendoGeo(false);
                  }
                }, 200);
              }}
            >
              <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: 'transparent', flexDirection: 'column', alignItems: 'flex-start' }}>
                <View style={{ marginBottom: -12, zIndex: 10, backgroundColor: 'transparent' }}>
                  <Image
                    source={require('@/assets/images/logo-seguridad.png')}
                    style={{ width: 220, height: 60 }}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>Lat: {fotoTemporalParaMarcar.lat.toFixed(6)}</Text>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>Lng: {fotoTemporalParaMarcar.lng.toFixed(6)}</Text>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>Elev: {fotoTemporalParaMarcar.altitude?.toFixed(2) || '0.00'} m</Text>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>Prec: ±{fotoTemporalParaMarcar.accuracy?.toFixed(2) || '0.00'} m</Text>
                  <Text style={{ color: '#FFF', fontSize: 20, marginTop: 8, opacity: 0.9 }}>{new Date().toLocaleString()}</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>
      )}
    </>
  );
};
