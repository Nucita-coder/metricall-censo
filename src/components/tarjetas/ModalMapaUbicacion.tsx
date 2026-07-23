import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin, Navigation, Plus, Minus, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

interface ModalMapaUbicacionProps {
  visible: boolean;
  latitud: number | null;
  longitud: number | null;
  ubicacionTemporal: { latitude: number; longitude: number } | null;
  setUbicacionTemporal: (loc: { latitude: number; longitude: number }) => void;
  onConfirmar: (loc: { latitude: number; longitude: number }) => void;
  onCancelar: () => void;
}

const getInteractiveMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: #1D2125; cursor: pointer; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};
    var map = L.map('map', { zoomControl: true }).setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

    function notifyCoords(latVal, lngVal) {
      var data = JSON.stringify({ latitude: latVal, longitude: lngVal });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(data);
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    }

    // Al hacer clic o toque en cualquier parte del mapa, fija el pin ahí
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyCoords(e.latlng.lat, e.latlng.lng);
    });

    // Al arrastrar el pin
    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyCoords(pos.lat, pos.lng);
    });
  </script>
</body>
</html>
`;

export function ModalMapaUbicacion({
  visible,
  latitud,
  longitud,
  ubicacionTemporal,
  setUbicacionTemporal,
  onConfirmar,
  onCancelar,
}: ModalMapaUbicacionProps) {
  const defaultLat = 10.4806;
  const defaultLng = -66.9036;

  const currentLat = ubicacionTemporal?.latitude || latitud || defaultLat;
  const currentLng = ubicacionTemporal?.longitude || longitud || defaultLng;

  const [inputLat, setInputLat] = useState<string>(currentLat.toString());
  const [inputLng, setInputLng] = useState<string>(currentLng.toString());
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      const lat = ubicacionTemporal?.latitude || latitud || defaultLat;
      const lng = ubicacionTemporal?.longitude || longitud || defaultLng;
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));
    }
  }, [visible, latitud, longitud]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleWebMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setInputLat(data.latitude.toFixed(6));
          setInputLng(data.longitude.toFixed(6));
          setUbicacionTemporal({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, [visible]);

  const updateCoords = (newLat: number, newLng: number) => {
    setInputLat(newLat.toFixed(6));
    setInputLng(newLng.toFixed(6));
    setUbicacionTemporal({ latitude: newLat, longitude: newLng });
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación no concedido.');
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      updateCoords(loc.coords.latitude, loc.coords.longitude);
    } catch (err: any) {
      alert('Error obteniendo ubicación: ' + err.message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleNudge = (deltaLat: number, deltaLng: number) => {
    const lat = parseFloat(inputLat) || defaultLat;
    const lng = parseFloat(inputLng) || defaultLng;
    updateCoords(lat + deltaLat, lng + deltaLng);
  };

  if (!visible) return null;

  const latNum = parseFloat(inputLat) || defaultLat;
  const lngNum = parseFloat(inputLng) || defaultLng;

  const interactiveHtml = getInteractiveMapHtml(latNum, lngNum);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, WEB_MODAL_CONTAINER]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={20} color="#0C66E4" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Fijar Ubicación en el Mapa</Text>
            </View>
            <TouchableOpacity onPress={onCancelar}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* HINT & BOTÓN GPS */}
          <View style={styles.topActions}>
            <Text style={styles.hintText}>
              👉 Toca o haz clic en cualquier lugar del mapa para fijar el punto exacto.
            </Text>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGetCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Navigation size={16} color="#FFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.gpsBtnText}>{isLocating ? 'Capturando...' : 'Usar Mi GPS Actual'}</Text>
            </TouchableOpacity>
          </View>

          {/* INPUTS DE COORDENADAS Y BOTONES FINOS DE AJUSTE */}
          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Latitud</Text>
              <View style={styles.inputWithButtons}>
                <TextInput
                  style={styles.input}
                  value={inputLat}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    setInputLat(val);
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) updateCoords(parsed, lngNum);
                  }}
                />
                <View style={styles.nudgeBtnGroup}>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(0.0005, 0)}>
                    <Plus size={12} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(-0.0005, 0)}>
                    <Minus size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Longitud</Text>
              <View style={styles.inputWithButtons}>
                <TextInput
                  style={styles.input}
                  value={inputLng}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    setInputLng(val);
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) updateCoords(latNum, parsed);
                  }}
                />
                <View style={styles.nudgeBtnGroup}>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(0, 0.0005)}>
                    <Plus size={12} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(0, -0.0005)}>
                    <Minus size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* MAPA INTERACTIVO */}
          <View style={styles.mapFrame}>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={interactiveHtml}
                style={{ width: '100%', height: '100%', border: 'none' } as any}
              />
            ) : (
              <WebView
                originWhitelist={['*']}
                source={{ html: interactiveHtml }}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (
                      data &&
                      typeof data.latitude === 'number' &&
                      typeof data.longitude === 'number'
                    ) {
                      setInputLat(data.latitude.toFixed(6));
                      setInputLng(data.longitude.toFixed(6));
                      setUbicacionTemporal({
                        latitude: data.latitude,
                        longitude: data.longitude,
                      });
                    }
                  } catch (e) {}
                }}
                style={{ flex: 1 }}
              />
            )}
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                onConfirmar({ latitude: latNum, longitude: lngNum });
              }}
            >
              <Text style={styles.confirmBtnText}>Confirmar Ubicación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancelar}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 650,
    height: '85%',
    backgroundColor: '#22272B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C333A',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  topActions: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#90CDF4',
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  gpsBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C9BAB',
    marginBottom: 4,
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nudgeBtnGroup: {
    flexDirection: 'column',
    marginLeft: 4,
    gap: 2,
  },
  nudgeBtn: {
    backgroundColor: '#384148',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFrame: {
    flex: 1,
    backgroundColor: '#1D2125',
    marginHorizontal: 14,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#384148',
  },
  footer: {
    padding: 14,
    backgroundColor: '#2C333A',
    borderTopWidth: 1,
    borderTopColor: '#384148',
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: '#0C66E4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#8C9BAB',
    fontWeight: '600',
    fontSize: 14,
  },
});
