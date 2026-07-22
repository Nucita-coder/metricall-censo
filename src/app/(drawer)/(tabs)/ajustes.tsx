import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AjustesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Próximamente más opciones de configuración.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8C9BAB',
    textAlign: 'center',
  },
});
