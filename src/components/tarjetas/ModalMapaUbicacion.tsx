import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin, Navigation, Plus, Minus, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';
import { getInteractiveMapHtml } from './mapaUbicacionHtml';
import { styles } from './ModalMapaUbicacion.styles';

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
    } catch (err: unknown) {
      alert('Error obteniendo ubicación: ' + ((err as Error).message || String(err)));
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
            <View style={styles.headerLeft}>
              <MapPin size={20} color="#8C9BAB" />
              <Text style={styles.title}>Fijar Ubicación en el Mapa</Text>
            </View>
            <TouchableOpacity onPress={onCancelar}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* HINT & BOTÓN GPS */}
          <View style={styles.topActions}>
            <Text style={styles.hintText}>
              Toca o haz clic en cualquier lugar del mapa para fijar el punto exacto.
            </Text>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGetCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#B6C2CF" />
              ) : (
                <Navigation size={16} color="#B6C2CF" style={{ marginRight: 6 }} />
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
                    <Plus size={12} color="#B6C2CF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(-0.0005, 0)}>
                    <Minus size={12} color="#B6C2CF" />
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
                    <Plus size={12} color="#B6C2CF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => handleNudge(0, -0.0005)}>
                    <Minus size={12} color="#B6C2CF" />
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
                style={{ width: '100%', height: '100%', border: 'none' } as React.CSSProperties}
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
