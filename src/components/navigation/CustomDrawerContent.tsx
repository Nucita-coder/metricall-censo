import React from 'react';
import { usePathname, useRouter } from 'expo-router';
import { BarChart3, FolderKanban, LifeBuoy, MessageSquare, Settings, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalUi } from '../../context/GlobalUiContext';

import { useAuth } from '../../context/AuthContext';

export function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDesktop, userRol } = props;
  const { userRol: authRol } = useAuth();
  const currentRol = (userRol || authRol || '').toLowerCase();
  const isAdmin = ['admin', 'lider', 'administrador', 'supervisor'].includes(currentRol);

  const insets = useSafeAreaInsets();
  const { triggerSoporteModal } = useGlobalUi();

  const MenuItem = ({ label, icon: Icon, route, onPress }: any) => {
    const targetPath = route ? route.split('/').pop() : '';
    const isActive = route && (
      (route === '/(drawer)/(tabs)' && (pathname === '/' || pathname.startsWith('/tablero') || pathname === '/(drawer)/(tabs)')) ||
      (route !== '/(drawer)/(tabs)' && targetPath && pathname.includes(targetPath))
    );
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress || (() => router.push(route))}
      >
        <Icon size={22} color={isActive ? '#0C66E4' : '#8C9BAB'} />
        <Text style={[styles.menuItemText, { color: isActive ? '#0C66E4' : '#B6C2CF' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#22272B' }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#8C9BAB', marginBottom: 12, marginLeft: 8 }}>MENU PRINCIPAL</Text>

      {!isDesktop && (
        <>
          <MenuItem label="Operaciones" icon={FolderKanban} route="/(drawer)/(tabs)" />
          {isAdmin && <MenuItem label="Métricas" icon={BarChart3} route="/(drawer)/(tabs)/metricas" />}
          <MenuItem label="Messenger" icon={MessageSquare} route="/(drawer)/(tabs)/mensajes" />
          <MenuItem label="Soporte Técnico" icon={LifeBuoy} onPress={() => triggerSoporteModal()} />
          {currentRol !== 'empleado' && <MenuItem label="Organización" icon={Users} route="/(drawer)/gestion" />}
        </>
      )}

      {isDesktop && (
        <>
          <MenuItem label="Operaciones" icon={FolderKanban} route="/(drawer)/(tabs)" />
          {isAdmin && <MenuItem label="Métricas" icon={BarChart3} route="/(drawer)/(tabs)/metricas" />}
          <MenuItem label="Messenger" icon={MessageSquare} route="/(drawer)/(tabs)/mensajes" />
          {currentRol !== 'empleado' && <MenuItem label="Equipo" icon={Users} route="/(drawer)/(tabs)/equipo" />}
          <MenuItem label="Ajustes" icon={Settings} route="/(drawer)/(tabs)/ajustes" />
          <MenuItem label="Soporte Técnico" icon={LifeBuoy} onPress={() => triggerSoporteModal()} />
          {currentRol !== 'empleado' && <MenuItem label="Organización" icon={Users} route="/(drawer)/gestion" />}
        </>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
