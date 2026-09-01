import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions, Platform } from 'react-native';
import { Briefcase, Users, Settings, MessageSquare, BarChart3, Package, Bot } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';

export default function TabLayout() {
  const { userRol, isDeveloper } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: '#8C9BAB',
        tabBarStyle: [
          {
            borderTopWidth: 1,
            borderTopColor: '#384148',
            backgroundColor: '#22272B',
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          isDesktop && { display: 'none' }
        ],
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Operaciones',
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="materiales"
        options={{
          title: 'Mis Materiales',
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: 'Métricas',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          href: (isDeveloper || ['admin', 'lider', 'administrador', 'supervisor'].includes((userRol || '').toLowerCase())) ? '/(drawer)/(tabs)/metricas' : null,
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Messenger',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          href: (isDeveloper || userRol !== 'empleado') ? '/(drawer)/(tabs)/equipo' : null,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'Bot WA',
          tabBarIcon: ({ color }) => <Bot size={24} color={color} />,
          href: (isDeveloper || ['lider', 'admin', 'administrador'].includes((userRol || '').toLowerCase())) ? '/(drawer)/(tabs)/whatsapp' : null,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}



