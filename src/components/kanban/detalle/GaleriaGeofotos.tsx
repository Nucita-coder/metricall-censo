import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Camera, X } from 'lucide-react-native';

interface GaleriaGeofotosProps {
  geofotos: string[];
}

export function GaleriaGeofotos({ geofotos }: GaleriaGeofotosProps) {
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);

  if (geofotos.length === 0) return null;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Camera size={16} color="#8C9BAB" />
          <Text style={styles.cardTitle}>
            GeoFotos de Instalación ({geofotos.length})
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 4 }}
          contentContainerStyle={{ gap: 10 }}
        >
          {geofotos.map((url, idx) => (
            <TouchableOpacity
              key={`geofoto-${idx}`}
              onPress={() => setImagenExpandida(url)}
              activeOpacity={0.8}
              style={styles.thumbWrapper}
            >
              <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.thumbBar}>
                <Text style={styles.thumbLabel}>FOTO {idx + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal de imagen ampliada */}
      <Modal
        visible={!!imagenExpandida}
        transparent
        animationType="fade"
        onRequestClose={() => setImagenExpandida(null)}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setImagenExpandida(null)}
          >
            <X size={22} color="#B6C2CF" />
          </TouchableOpacity>
          {imagenExpandida && (
            <Image
              source={{ uri: imagenExpandida }}
              style={styles.imagenCompleta}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 6,
  },
  cardTitle: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  thumbWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
  },
  thumb: {
    width: 110,
    height: 80,
  },
  thumbBar: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  thumbLabel: {
    color: '#B6C2CF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: '#2C333A',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  imagenCompleta: {
    width: '92%',
    height: '75%',
    borderRadius: 10,
  },
});
