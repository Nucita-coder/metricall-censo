import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationContextData {
  currentLocation: Location.LocationObject | null;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

const LocationContext = createContext<LocationContextData>({
  currentLocation: null,
  isTracking: false,
  startTracking: async () => {},
  stopTracking: () => {},
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado.');
        return;
      }

      if (subscriptionRef.current) {
        return; // Ya está trackeando
      }

      setIsTracking(true);
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
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
    // Opcional: limpiar la ubicación al salir, o mantener la última conocida. 
    // Mantenemos la última para evitar nulos si tarda en iniciar la próxima vez.
  };

  // Limpieza por seguridad si el provider se desmonta
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <LocationContext.Provider value={{ currentLocation, isTracking, startTracking, stopTracking }}>
      {children}
    </LocationContext.Provider>
  );
};
