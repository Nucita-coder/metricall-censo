import React from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

let MapView: any = null, UrlTile: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  UrlTile = maps.UrlTile;
}

interface ModalMapaUbicacionProps {
  visible: boolean;
  latitud: number | null;
  longitud: number | null;
  ubicacionTemporal: { latitude: number; longitude: number } | null;
  setUbicacionTemporal: (loc: { latitude: number; longitude: number }) => void;
  onConfirmar: (loc: { latitude: number; longitude: number }) => void;
  onCancelar: () => void;
}

export function ModalMapaUbicacion({
  visible,
  latitud,
  longitud,
  ubicacionTemporal,
  setUbicacionTemporal,
  onConfirmar,
  onCancelar,
}: ModalMapaUbicacionProps) {
  if (Platform.OS === 'web' || !MapView) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#22272B' }, WEB_MODAL_CONTAINER]}>
        <MapView
          style={{ width: '100%', height: '100%' }}
          showsUserLocation={true}
          mapType="none"
          initialRegion={{
            latitude: latitud || 10.4806,
            longitude: longitud || -66.9036,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onRegionChangeComplete={(region: any) => {
            setUbicacionTemporal({ latitude: region.latitude, longitude: region.longitude });
          }}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            zIndex={1}
          />
        </MapView>
        <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -40, marginLeft: -20, pointerEvents: 'none' }}>
          <MapPin size={40} color="#E53E3E" />
        </View>

        <View style={{ position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#B6C2CF', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 }}
            onPress={() => {
              if (ubicacionTemporal) {
                onConfirmar(ubicacionTemporal);
              }
            }}
          >
            <Text style={{ color: '#1D2125', fontWeight: 'bold' }}>Confirmar Ubicación</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#22272B', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#384148' }}
            onPress={onCancelar}
          >
            <Text style={{ color: '#4A5568', fontWeight: 'bold' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
