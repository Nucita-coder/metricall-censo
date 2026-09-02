import React from 'react';
import { usePathname, useRouter, Href } from 'expo-router';
import { Archive, BarChart3, Bot, FolderKanban, LifeBuoy, MessageSquare, Package, Settings, Users, Code2, LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalUi } from '../../context/GlobalUiContext';
import { useAuth } from '../../context/AuthContext';

interface CustomDrawerContentProps {
  isDesktop?: boolean;
  userRol?: string;
  [key: string]: unknown;
}

interface MenuItemProps {
  label: string;
  icon: LucideIcon;
  route?: Href;
  onPress?: () => void;
}

export function CustomDrawerContent(props: CustomDrawerContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDesktop, userRol } = props;
  const { userRol: authRol, isDeveloper } = useAuth();
  const currentRol = (userRol || authRol || '').toLowerCase();
  const isDevUser = isDeveloper || currentRol === 'developer' || currentRol === 'desarrollador';
  const isAdmin = isDevUser || ['admin', 'lider', 'administrador', 'supervisor'].includes(currentRol);
  const canSeeTeam = isDevUser || (currentRol !== 'empleado');

  const insets = useSafeAreaInsets();
  const { triggerSoporteModal, triggerArchivadosModal } = useGlobalUi();

  const MenuItem = ({ label, icon: Icon, route, onPress }: MenuItemProps) => {
    const routeStr = typeof route === 'string' ? route : '';
    const targetPath = routeStr ? routeStr.split('/').pop() : '';
    const isActive = Boolean(routeStr && (
      (routeStr === '/(drawer)/(tabs)' && (pathname === '/' || pathname.startsWith('/tablero') || pathname === '/(drawer)/(tabs)')) ||
      (routeStr !== '/(drawer)/(tabs)' && targetPath && pathname.includes(targetPath))
    ));
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress || (() => { if (route) router.push(route); })}
      >
        <Icon size={22} color={isActive ? '#0C66E4' : '#8C9BAB'} />
        <Text style={[styles.menuItemText, { color: isActive ? '#0C66E4' : '#B6C2CF' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#22272B' }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 16 }}>
      {isDeveloper && (
        <View style={styles.devBadgeContainer}>
          <Code2 size={14} color='#F59E0B' />
          <Text style={styles.devBadgeText}>MODO DEVELOPER</Text>
        </View>
      )}
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#8C9BAB', marginBottom: 12, marginLeft: 8 }}>MENU PRINCIPAL</Text>

      {!isDesktop && (
        <>
          <MenuItem label="Operaciones" icon={FolderKanban} route="/(drawer)/(tabs)" />
          {isAdmin && <MenuItem label="Mis Materiales" icon={Package} route="/(drawer)/(tabs)/materiales" />}
          {isAdmin && <MenuItem label="Métricas" icon={BarChart3} route="/(drawer)/(tabs)/metricas" />}
          <MenuItem label="Messenger" icon={MessageSquare} route="/(drawer)/(tabs)/mensajes" />
          {isDevUser && <MenuItem label="WhatsApp Bot" icon={Bot} route="/(drawer)/(tabs)/whatsapp" />}
          <MenuItem label="Soporte Técnico" icon={LifeBuoy} onPress={() => triggerSoporteModal()} />
          {canSeeTeam && <MenuItem label="Organización" icon={Users} route="/(drawer)/gestion" />}
          <MenuItem label="Archivados" icon={Archive} onPress={() => triggerArchivadosModal()} />
        </>
      )}

      {isDesktop && (
        <>
          <MenuItem label="Operaciones" icon={FolderKanban} route="/(drawer)/(tabs)" />
          {isAdmin && <MenuItem label="Mis Materiales" icon={Package} route="/(drawer)/(tabs)/materiales" />}
          {isAdmin && <MenuItem label="Métricas" icon={BarChart3} route="/(drawer)/(tabs)/metricas" />}
          <MenuItem label="Messenger" icon={MessageSquare} route="/(drawer)/(tabs)/mensajes" />
          {isDevUser && <MenuItem label="WhatsApp Bot" icon={Bot} route="/(drawer)/(tabs)/whatsapp" />}
          {canSeeTeam && <MenuItem label="Equipo" icon={Users} route="/(drawer)/(tabs)/equipo" />}
          <MenuItem label="Ajustes" icon={Settings} route="/(drawer)/(tabs)/ajustes" />
          <MenuItem label="Soporte Técnico" icon={LifeBuoy} onPress={() => triggerSoporteModal()} />
          {canSeeTeam && <MenuItem label="Organización" icon={Users} route="/(drawer)/gestion" />}
          <MenuItem label="Archivados" icon={Archive} onPress={() => triggerArchivadosModal()} />
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
  devBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
    gap: 6,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
});
