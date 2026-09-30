import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocation } from '../context/LocationContext';

interface Coordenadas {
  latitud: number;
  longitud: number;
}

export function useCapturaUbicacion() {
  const { setCurrentLocation } = useLocation();
  const [isLocating, setIsLocating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [modalPermisoVisible, setModalPermisoVisible] = useState(false);

  const obtenerCoordenadas = async (): Promise<Coordenadas | null> => {
    try {
      setIsLocating(true);

      // Comprobar permiso existente primero
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }

      if (perm.status !== 'granted') {
        setIsLocating(false);
        setModalPermisoVisible(true);
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({});
      if (setCurrentLocation) {
        setCurrentLocation(loc);
      }
      return {
        latitud: loc.coords.latitude,
        longitud: loc.coords.longitude,
      };
    } catch (e: unknown) {
      const errStr = (e as Error)?.message || String(e);
      if (errStr.toLowerCase().includes('denied') || errStr.toLowerCase().includes('permission')) {
        setModalPermisoVisible(true);
      } else {
        Alert.alert('Error GPS', 'No se pudo obtener la ubicación: ' + errStr);
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  const reintentarCaptura = async (onSuccess: (coords: Coordenadas) => void): Promise<void> => {
    try {
      setIsRetrying(true);
      let perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.getForegroundPermissionsAsync();
      }

      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        if (setCurrentLocation) {
          setCurrentLocation(loc);
        }
        const coords = {
          latitud: loc.coords.latitude,
          longitud: loc.coords.longitude,
        };
        setModalPermisoVisible(false);
        onSuccess(coords);
        const msg = 'Coordenadas GPS obtenidas exitosamente.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Éxito', msg);
        }
      } else {
        const msg = 'El permiso sigue bloqueado. Por favor, asegúrate de haberlo permitido en los ajustes antes de reintentar.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Aviso', msg);
        }
      }
    } catch (e: unknown) {
      Alert.alert('Error', 'No se pudo verificar el permiso: ' + ((e as Error)?.message || ''));
    } finally {
      setIsRetrying(false);
    }
  };

  const cerrarModalPermiso = () => {
    setModalPermisoVisible(false);
  };

  return {
    isLocating,
    isRetrying,
    modalPermisoVisible,
    obtenerCoordenadas,
    reintentarCaptura,
    cerrarModalPermiso,
  };
}
