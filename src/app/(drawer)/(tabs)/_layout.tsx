import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions, Platform, View, StyleSheet } from 'react-native';
import { Briefcase, Users, Settings, MessageSquare, BarChart3, Package, Bot, LucideIcon } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { soundService } from '../../../services/soundService';

interface TabIconProps {
  icon: LucideIcon;
  focused: boolean;
}

function TabIcon({ icon: Icon, focused }: TabIconProps) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon
        size={19}
        color={focused ? '#FFFFFF' : '#8C9BAB'}
        strokeWidth={focused ? 2.3 : 2}
      />
    </View>
  );
}

export default function TabLayout() {
  const { userRol, isDeveloper } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const rolLower = (userRol || '').toLowerCase();
  const isDevUser = isDeveloper || rolLower === 'developer' || rolLower === 'desarrollador';
  const canSeeAdmin = isDevUser || ['admin', 'lider', 'administrador', 'supervisor'].includes(rolLower);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          soundService.playGesture('tab_switch');
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: '#8C9BAB',
        tabBarStyle: [
          {
            borderTopWidth: 1,
            borderTopColor: '#384148',
            backgroundColor: '#22272B',
            paddingHorizontal: 8,
            paddingBottom: Platform.OS === 'ios' ? 14 : 0,
            paddingTop: 0,
            height: Platform.OS === 'ios' ? 68 : 58,
          },
          isDesktop && { display: 'none' }
        ],
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: 0,
          margin: 0,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Operaciones',
          tabBarIcon: ({ focused }) => <TabIcon icon={Briefcase} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="materiales"
        options={{
          title: 'Materiales',
          tabBarIcon: ({ focused }) => <TabIcon icon={Package} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: 'Métricas',
          tabBarIcon: ({ focused }) => <TabIcon icon={BarChart3} focused={focused} />,
          href: canSeeAdmin ? '/(drawer)/(tabs)/metricas' : null,
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ focused }) => <TabIcon icon={MessageSquare} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ focused }) => <TabIcon icon={Users} focused={focused} />,
          href: (isDeveloper || rolLower !== 'empleado') ? '/(drawer)/(tabs)/equipo' : null,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'Bot WA',
          tabBarIcon: ({ focused }) => <TabIcon icon={Bot} focused={focused} />,
          href: isDevUser ? '/(drawer)/(tabs)/whatsapp' : null,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon icon={Settings} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 36,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  iconPillActive: {
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
  },
});



