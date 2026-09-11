import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { soundService } from '../services/soundService';
import { localNotificationService } from '../services/localNotificationService';

interface SoundPreferencesContextType {
  sonidosGestos: boolean;
  sonidosNotificaciones: boolean;
  vibracionHaptica: boolean;
  setSonidosGestos: (val: boolean) => void;
  setSonidosNotificaciones: (val: boolean) => void;
  setVibracionHaptica: (val: boolean) => void;
  toggleSonidosGestos: () => void;
  toggleSonidosNotificaciones: () => void;
  toggleVibracionHaptica: () => void;
}

const STORAGE_KEYS = {
  GESTURES: '@metricall_sound_gestures',
  NOTIFICATIONS: '@metricall_sound_notifications',
  HAPTICS: '@metricall_sound_haptics',
};

const SoundPreferencesContext = createContext<SoundPreferencesContextType | undefined>(undefined);

export const SoundPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sonidosGestos, setSonidosGestosState] = useState<boolean>(true);
  const [sonidosNotificaciones, setSonidosNotificacionesState] = useState<boolean>(true);
  const [vibracionHaptica, setVibracionHapticaState] = useState<boolean>(true);

  // Inicializar soundService, notificaciones locales y cargar preferencias persistidas
  useEffect(() => {
    soundService.init();
    localNotificationService.init().catch(() => {});

    const loadPreferences = async () => {
      try {
        const [storedGestures, storedNotifications, storedHaptics] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.GESTURES),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
          AsyncStorage.getItem(STORAGE_KEYS.HAPTICS),
        ]);

        const gesturesVal = storedGestures !== null ? storedGestures === 'true' : true;
        const notifVal = storedNotifications !== null ? storedNotifications === 'true' : true;
        const hapticsVal = storedHaptics !== null ? storedHaptics === 'true' : true;

        setSonidosGestosState(gesturesVal);
        setSonidosNotificacionesState(notifVal);
        setVibracionHapticaState(hapticsVal);

        soundService.setPreferences({
          gestures: gesturesVal,
          notifications: notifVal,
          haptics: hapticsVal,
        });
      } catch (err) {
        console.warn('Error al cargar preferencias de sonido:', err);
      }
    };

    loadPreferences();
  }, []);

  const setSonidosGestos = (val: boolean) => {
    setSonidosGestosState(val);
    soundService.setPreferences({ gestures: val });
    AsyncStorage.setItem(STORAGE_KEYS.GESTURES, String(val)).catch(() => {});
  };

  const setSonidosNotificaciones = (val: boolean) => {
    setSonidosNotificacionesState(val);
    soundService.setPreferences({ notifications: val });
    AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(val)).catch(() => {});
  };

  const setVibracionHaptica = (val: boolean) => {
    setVibracionHapticaState(val);
    soundService.setPreferences({ haptics: val });
    AsyncStorage.setItem(STORAGE_KEYS.HAPTICS, String(val)).catch(() => {});
  };

  const toggleSonidosGestos = () => setSonidosGestos(!sonidosGestos);
  const toggleSonidosNotificaciones = () => setSonidosNotificaciones(!sonidosNotificaciones);
  const toggleVibracionHaptica = () => setVibracionHaptica(!vibracionHaptica);

  const contextValue = useMemo(
    () => ({
      sonidosGestos,
      sonidosNotificaciones,
      vibracionHaptica,
      setSonidosGestos,
      setSonidosNotificaciones,
      setVibracionHaptica,
      toggleSonidosGestos,
      toggleSonidosNotificaciones,
      toggleVibracionHaptica,
    }),
    [sonidosGestos, sonidosNotificaciones, vibracionHaptica]
  );

  return (
    <SoundPreferencesContext.Provider value={contextValue}>
      {children}
    </SoundPreferencesContext.Provider>
  );
};

export const useSoundPreferences = (): SoundPreferencesContextType => {
  const context = useContext(SoundPreferencesContext);
  if (!context) {
    throw new Error('useSoundPreferences debe ser usado dentro de un SoundPreferencesProvider');
  }
  return context;
};
