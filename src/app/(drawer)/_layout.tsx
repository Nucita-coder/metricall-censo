import React from 'react';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlobalUiProvider } from '../../context/GlobalUiContext';
import { CustomDrawerContent } from '../../components/navigation/CustomDrawerContent';
import { GlobalTopBar } from '../../components/navigation/GlobalTopBar';

export default function DrawerLayout() {
  const { isLoading, userRol, empresaId } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!empresaId) {
    return <Redirect href="/espera" />;
  }

  return (
    <GlobalUiProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        {isDesktop && <GlobalTopBar />}
        <GestureHandlerRootView style={[styles.rootView, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} isDesktop={isDesktop} userRol={userRol} />}
            screenOptions={{
              headerShown: !isDesktop,
              header: () => (!isDesktop ? <GlobalTopBar /> : null),
              drawerPosition: 'left',
              drawerType: isDesktop ? 'permanent' : 'front',
              drawerStyle: isDesktop
                ? { width: 260, borderRightWidth: 1, borderRightColor: '#2C333A', backgroundColor: '#22272B' }
                : { backgroundColor: '#22272B' },
            }}
          />
        </GestureHandlerRootView>
      </SafeAreaView>
    </GlobalUiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  rootView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D2125',
  },
});
