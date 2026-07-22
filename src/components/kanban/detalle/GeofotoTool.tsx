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

    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setObteniendoGeo(true);
        const lat = currentLocation.coords.latitude;
        const lng = currentLocation.coords.longitude;
        const altitude = currentLocation.coords.altitude || 0;
        const accuracy = currentLocation.coords.accuracy || 0;

        const asset = result.assets[0];

        // Advertencia si la precisión GPS es baja (> 50 metros)
        if (accuracy > 50) {
          console.warn(`[GeoFoto] Advertencia de baja precisión GPS: ±${accuracy}m`);
        }

        setFotoTemporalParaMarcar({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
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
                    // Fallback para Web (PC)
                    await procesarSubidaGeoFoto(fotoTemporalParaMarcar.uri);
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
