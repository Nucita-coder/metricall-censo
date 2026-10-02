import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState, type Href } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import { useSyncQueue } from '../hooks/useSyncQueue';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  
  // Inicializamos el demonio de sincronización offline-first a nivel global
  useSyncQueue();

  // Registro de PWA (Service Worker, Manifiesto y meta-etiquetas web)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        const registerSW = () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => console.log('[PWA] Service Worker activo:', reg.scope))
            .catch((err) => console.log('[PWA] Error en Service Worker:', err));
        };

        if (document.readyState === 'complete') {
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      }

      if (typeof document !== 'undefined') {
        if (!document.querySelector('link[rel="manifest"]')) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#22272B';
          document.head.appendChild(meta);
        }
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
          const meta = document.createElement('meta');
          meta.name = 'apple-mobile-web-app-capable';
          meta.content = 'yes';
          document.head.appendChild(meta);
        }
        if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
          const meta = document.createElement('meta');
          meta.name = 'apple-mobile-web-app-status-bar-style';
          meta.content = 'black-translucent';
          document.head.appendChild(meta);
        }
      }
    }
  }, []);

  const isAuth = !!session;

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isLoading || session === undefined) return; // Aún cargando

    // Identificamos las pantallas de "login" o públicas iniciales
    // (index corresponde a '/', register a '/register')
    const inLoginScreen = !segments[0] || ['index', '(index)', 'register'].includes(segments[0]); 

    // Identificamos si aterrizó directamente en una pantalla modal en frío (ej. Expo Go restore) sin historial previo
    const isColdBootModal = segments[0] === 'tarjeta' && segments[1] === 'nueva';

    if (!isAuth && !inLoginScreen) {
      // Si NO hay sesión y NO está en el login (ej. está en el área de trabajo/espera) -> expulsar al login
      console.log('[ROOT] Sin sesión fuera del login → router.replace("/")');
      router.replace('/' as Href);
    } else if (isAuth && (inLoginScreen || (isColdBootModal && !router.canGoBack()))) {
      // Si SÍ hay sesión pero está en la pantalla de login o restauró un modal en frío sin historial -> entrar a Inicio
      console.log('[ROOT] Con sesión en login o modal en frío → router.replace("/(drawer)")');
      router.replace('/(drawer)' as Href); 
    }
    // Si SÍ hay sesión y está en (drawer), espera, u otra ruta, NO HACEMOS NADA.
    
  }, [isAuth, isLoading, segments, rootNavigationState?.key]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="tarjeta/nueva" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack>
        <InAppNotificationToast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { ErrorDiagnosticsProvider } from '../context/ErrorDiagnosticsContext';
import { SoundPreferencesProvider } from '../context/SoundPreferencesContext';
import { NotificationProvider } from '../context/NotificationContext';
import { InAppNotificationToast } from '../components/notificaciones/InAppNotificationToast';

export default function RootLayout() {
  return (
    <ErrorDiagnosticsProvider>
      <SoundPreferencesProvider>
        <AuthProvider>
          <NotificationProvider>
            <LocationProvider>
              <RootLayoutNav />
            </LocationProvider>
          </NotificationProvider>
        </AuthProvider>
      </SoundPreferencesProvider>
    </ErrorDiagnosticsProvider>
  );
}

