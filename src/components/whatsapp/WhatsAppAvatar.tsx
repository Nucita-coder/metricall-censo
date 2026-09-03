import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WhatsAppAvatarProps {
  nombre: string;
  telefono: string;
  size?: number;
}

const PALETA_COLORES = [
  '#0C66E4', // Azul Metricall
  '#805AD5', // Morado
  '#059669', // Esmeralda
  '#D97706', // Ámbar
  '#E11D48', // Carmesí
  '#0891B2', // Cian
  '#4F46E5', // Índigo
  '#2563EB', // Azul Real
  '#0D9488', // Turquesa
  '#EA580C', // Naranja
  '#7C3AED', // Violeta
];

function obtenerAvatarInfo(nombre: string, telefono: string) {
  const cleanName = (nombre || '').trim();
  let initials = '';

  if (cleanName && !cleanName.toLowerCase().startsWith('usuario')) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0]) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  } else {
    initials = (telefono.replace(/\D/g, '').slice(-2) || 'WA').toUpperCase();
  }

  // Hash determinista para color consistente
  let hash = 0;
  const str = (telefono || '') + cleanName;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = PALETA_COLORES[Math.abs(hash) % PALETA_COLORES.length];

  return { initials, color };
}

export function WhatsAppAvatar({ nombre, telefono, size = 44 }: WhatsAppAvatarProps) {
  const { initials, color } = obtenerAvatarInfo(nombre, telefono);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
