import { useEffect } from 'react';
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { ErrorDiagnosticsProvider } from '../context/ErrorDiagnosticsContext';

export default function RootLayout() {
  return (
    <ErrorDiagnosticsProvider>
      <AuthProvider>
        <LocationProvider>
          <RootLayoutNav />
        </LocationProvider>
      </AuthProvider>
    </ErrorDiagnosticsProvider>
  );
}
