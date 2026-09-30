import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationContextData {
  currentLocation: Location.LocationObject | null;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  setCurrentLocation: (loc: Location.LocationObject | null) => void;
  obtenerUbicacionActual: () => Promise<Location.LocationObject | null>;
}

const LocationContext = createContext<LocationContextData>({
  currentLocation: null,
  isTracking: false,
  startTracking: async () => {},
  stopTracking: () => {},
  setCurrentLocation: () => {},
  obtenerUbicacionActual: async () => null,
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const obtenerUbicacionActual = async (): Promise<Location.LocationObject | null> => {
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return null;
      }

      // 1. Obtener última posición conocida de inmediato para respuesta ultrarrápida
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastKnown) {
        setCurrentLocation(lastKnown);
      }

      // 2. Adquirir lectura satelital en tiempo real con precisión balanceada
      // Timeout de 15s para evitar cuelgue si el GPS no tiene señal (ej. interiores)
      const freshLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000,
        timeInterval: 15000,
      }).catch(() => null);
      if (freshLoc) {
        setCurrentLocation(freshLoc);
        return freshLoc;
      }
      return lastKnown;
    } catch (e) {
      console.warn('[LocationContext] Error al obtener ubicación actual:', e);
      const fallback = await Location.getLastKnownPositionAsync().catch(() => null);
      if (fallback) {
        setCurrentLocation(fallback);
        return fallback;
      }
      return null;
    }
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado.');
        return;
      }

      // Obtener lectura inicial inmediata sin esperar movimiento
      obtenerUbicacionActual().catch(() => {});

      if (subscriptionRef.current) {
        return; // Ya está trackeando
      }

      setIsTracking(true);
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2500,
          distanceInterval: 1,
        },
        (location) => {
          setCurrentLocation(location);
        }
      );
    } catch (e) {
      console.error('Error al iniciar el tracking de ubicación:', e);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  };

  // Precargar última posición conocida al inicializar el provider
  useEffect(() => {
    Location.getLastKnownPositionAsync()
      .then((last) => {
        if (last) setCurrentLocation(last);
      })
      .catch(() => {});

    return () => {
      stopTracking();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isTracking,
        startTracking,
        stopTracking,
        setCurrentLocation,
        obtenerUbicacionActual,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
