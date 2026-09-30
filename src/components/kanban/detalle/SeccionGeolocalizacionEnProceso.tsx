import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { GeofotoTool } from './GeofotoTool';
import { ModalPermisoUbicacion } from '../../common/ModalPermisoUbicacion';
import { useCapturaUbicacion } from '../../../hooks/useCapturaUbicacion';

interface SeccionGeolocalizacionEnProcesoProps {
  geoNap: { lat: number; lng: number } | null;
  setGeoNap: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
  geoCasa: { lat: number; lng: number } | null;
  setGeoCasa: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
  geoFotos: string[];
  setGeoFotos: React.Dispatch<React.SetStateAction<string[]>>;
  isSaving: boolean;
}

export function SeccionGeolocalizacionEnProceso({
  geoNap,
  setGeoNap,
  geoCasa,
  setGeoCasa,
  geoFotos,
  setGeoFotos,
  isSaving,
}: SeccionGeolocalizacionEnProcesoProps) {
  const {
    isLocating,
    isRetrying,
    modalPermisoVisible,
    obtenerCoordenadas,
    reintentarCaptura,
    cerrarModalPermiso,
  } = useCapturaUbicacion();

  const [objetivoCaptura, setObjetivoCaptura] = useState<'nap' | 'casa' | null>(null);
  const obteniendoGeoNap = isLocating && objetivoCaptura === 'nap';
  const obteniendoGeoCasa = isLocating && objetivoCaptura === 'casa';

  const capturarGeoNap = async () => {
    setObjetivoCaptura('nap');
    const coords = await obtenerCoordenadas();
    if (coords) {
      setGeoNap({ lat: coords.latitud, lng: coords.longitud });
      Alert.alert('Éxito', 'Coordenadas NAP capturadas.');
    }
  };

  const capturarGeoCasa = async () => {
    setObjetivoCaptura('casa');
    const coords = await obtenerCoordenadas();
    if (coords) {
      setGeoCasa({ lat: coords.latitud, lng: coords.longitud });
      Alert.alert('Éxito', 'Coordenadas Casa capturadas.');
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.seccionTitulo}>GEO NAP Y CASA</Text>
      <View style={styles.btnRow}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.geoBtn, { backgroundColor: geoNap ? '#48BB78' : '#3182CE' }]}
            onPress={capturarGeoNap}
            disabled={obteniendoGeoNap || isSaving}
          >
            {obteniendoGeoNap ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <MapPin size={16} color="#FFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.geoBtnText}>{geoNap ? 'NAP Listo' : 'Capturar NAP'}</Text>
          </TouchableOpacity>
          {geoNap && (
            <Text style={styles.geoCoordText}>
              {geoNap.lat.toFixed(5)}, {geoNap.lng.toFixed(5)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.geoBtn, { backgroundColor: geoCasa ? '#48BB78' : '#805AD5' }]}
            onPress={capturarGeoCasa}
            disabled={obteniendoGeoCasa || isSaving}
          >
            {obteniendoGeoCasa ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <MapPin size={16} color="#FFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.geoBtnText}>{geoCasa ? 'Casa Lista' : 'Capturar Casa'}</Text>
          </TouchableOpacity>
          {geoCasa && (
            <Text style={styles.geoCoordText}>
              {geoCasa.lat.toFixed(5)}, {geoCasa.lng.toFixed(5)}
            </Text>
          )}
        </View>
      </View>

      <Text style={[styles.seccionTitulo, { marginTop: 8 }]}>EVIDENCIA FOTOGRÁFICA MÚLTIPLE</Text>
      <GeofotoTool
        onPhotoCaptured={(url) => setGeoFotos((prev) => [...prev, url])}
        isSaving={isSaving}
        fallbackCoords={geoCasa || geoNap}
      />

      {geoFotos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
          {geoFotos.map((url, index) => (
            <View key={index} style={styles.fotoThumbWrapper}>
              <ImageBackground source={{ uri: url }} style={styles.fotoThumbImg} />
              <TouchableOpacity
                style={styles.btnEliminarFoto}
                onPress={() => setGeoFotos((prev) => prev.filter((_, i) => i !== index))}
                disabled={isSaving}
              >
                <Text style={styles.btnEliminarFotoText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <ModalPermisoUbicacion
        visible={modalPermisoVisible}
        onClose={cerrarModalPermiso}
        onRetry={() => reintentarCaptura((coords) => {
          if (objetivoCaptura === 'nap') {
            setGeoNap({ lat: coords.latitud, lng: coords.longitud });
          } else if (objetivoCaptura === 'casa') {
            setGeoCasa({ lat: coords.latitud, lng: coords.longitud });
          }
        })}
        loading={isRetrying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  seccionTitulo: {
    fontSize: 12,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  geoBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  geoBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  geoCoordText: {
    color: '#8C9BAB',
    fontSize: 10,
    marginTop: 4,
  },
  fotosScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  fotoThumbWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  fotoThumbImg: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  btnEliminarFoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  btnEliminarFotoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
