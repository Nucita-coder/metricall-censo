import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions, Platform } from 'react-native';
import { Briefcase, Users, Settings, MessageSquare, BarChart3, Package, Bot } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { soundService } from '../../../services/soundService';

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
            paddingBottom: Platform.OS === 'ios' ? 14 : 0,
            paddingTop: 0,
            height: Platform.OS === 'ios' ? 62 : 48,
          },
          isDesktop && { display: 'none' }
        ],
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Operaciones',
          tabBarIcon: ({ color }) => <Briefcase size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="materiales"
        options={{
          title: 'Materiales',
          tabBarIcon: ({ color }) => <Package size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: 'Métricas',
          tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
          href: canSeeAdmin ? '/(drawer)/(tabs)/metricas' : null,
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
          href: (isDeveloper || rolLower !== 'empleado') ? '/(drawer)/(tabs)/equipo' : null,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'Bot WA',
          tabBarIcon: ({ color }) => <Bot size={22} color={color} />,
          href: isDevUser ? '/(drawer)/(tabs)/whatsapp' : null,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}



