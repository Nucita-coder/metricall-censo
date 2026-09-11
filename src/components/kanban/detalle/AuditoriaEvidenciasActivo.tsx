import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Linking from 'expo-linking';

interface AuditoriaEvidenciasActivoProps {
  data: Record<string, unknown>;
  setImagenExpandida?: (uri: string) => void;
}

export function AuditoriaEvidenciasActivo({ data, setImagenExpandida }: AuditoriaEvidenciasActivoProps) {
  const geoNap = data.geo_nap as { lat?: number; lng?: number } | undefined;
  const geoCasa = data.geo_casa as { lat?: number; lng?: number } | undefined;
  const geofotos = (data.geofotos as string[]) || [];
  const lchImagen = data.lch_imagen as string | undefined;

  const handleOpenMap = (lat?: number, lng?: number) => {
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MapPin size={16} color="#579DFF" />
        <Text style={styles.cardTitle}>Evidencias y Geolocalización Satelital</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>GEO NAP</Text>
          {geoNap && typeof geoNap.lat === 'number' && typeof geoNap.lng === 'number' ? (
            <TouchableOpacity onPress={() => handleOpenMap(geoNap.lat, geoNap.lng)} style={styles.mapBtn}>
              <MapPin size={13} color="#579DFF" />
              <Text style={styles.mapBtnText}>{geoNap.lat.toFixed(5)}, {geoNap.lng.toFixed(5)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.valEmpty}>Sin registrar</Text>
          )}
        </View>

        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>GEO CASA</Text>
          {geoCasa && typeof geoCasa.lat === 'number' && typeof geoCasa.lng === 'number' ? (
            <TouchableOpacity onPress={() => handleOpenMap(geoCasa.lat, geoCasa.lng)} style={[styles.mapBtn, styles.mapBtnPurple]}>
              <MapPin size={13} color="#A855F7" />
              <Text style={[styles.mapBtnText, { color: '#C084FC' }]}>{geoCasa.lat.toFixed(5)}, {geoCasa.lng.toFixed(5)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.valEmpty}>Sin registrar</Text>
          )}
        </View>
      </View>

      {lchImagen && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.gridLabel}>FOTO EVIDENCIA LCH</Text>
          <TouchableOpacity onPress={() => setImagenExpandida && setImagenExpandida(lchImagen)} style={{ marginTop: 4 }}>
            <ImageBackground source={{ uri: lchImagen }} style={styles.lchThumb}>
              <View style={styles.lchThumbBar}>
                <Text style={styles.lchThumbText}>VER LCH</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}

      {geofotos.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.gridLabel}>GEOFOTOS DE INSTALACIÓN ({geofotos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
            {geofotos.map((url, idx) => (
              <TouchableOpacity key={idx} onPress={() => setImagenExpandida && setImagenExpandida(url)} style={{ marginRight: 8 }}>
                <ImageBackground source={{ uri: url }} style={styles.geoFotoThumb}>
                  <View style={styles.lchThumbBar}>
                    <Text style={styles.lchThumbText}>FOTO {idx + 1}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
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
    color: '#579DFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  valEmpty: {
    color: '#626F86',
    fontStyle: 'italic',
    fontSize: 11,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(87, 157, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  mapBtnPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  mapBtnText: {
    color: '#579DFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lchThumb: {
    width: 140,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#1D2125',
  },
  geoFotoThumb: {
    width: 100,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#1D2125',
  },
  lchThumbBar: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  lchThumbText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
