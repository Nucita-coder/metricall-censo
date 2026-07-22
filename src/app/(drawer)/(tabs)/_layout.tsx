import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions, Platform } from 'react-native';
import { Briefcase, Users, Settings } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';

export default function TabLayout() {
  const { userRol } = useAuth();
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
        name="equipo"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          href: userRol === 'empleado' ? null : '/(drawer)/(tabs)/equipo',
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


