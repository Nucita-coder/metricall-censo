import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen() {
  const [sucursalName, setSucursalName] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tableroName, setTableroName] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);

  const handleUploadLogo = () => {
    // Mock de subida de Storage
    setLogoUploaded(true);
    Alert.alert('Logo subido', 'El logo se ha simulado con éxito (mock_logo.png)');
  };

  const handleCompleteSetup = async () => {
    if (!sucursalName || !ubicacion || !tableroName) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los datos para continuar.');
      return;
    }

    setLoading(true);

    try {
      // Usamos el RPC transaccional
      const { data, error } = await supabase.rpc('completar_onboarding', {
        p_logo_url: logoUploaded ? 'mock_logo.png' : null,
        p_nombre_sucursal: sucursalName,
        p_ubicacion_sucursal: ubicacion,
        p_nombre_tablero: tableroName
      });

      if (error) throw error;

      Alert.alert('¡Todo listo!', 'Tu entorno de trabajo ha sido inicializado.');
      // Redirigir al dashboard principal de la app
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error de configuración', error.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={globalStyles.container}>
        <View style={styles.headerContainer}>
          <Text style={globalStyles.headerTitle}>Configura tu Empresa</Text>
          <Text style={globalStyles.headerSubtitle}>Solo faltan un par de detalles</Text>
        </View>

        {/* 1. Logo */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>1. Identidad Visual</Text>
          <Text style={styles.desc}>Sube el logo de tu organización.</Text>
          <TouchableOpacity 
            style={[globalStyles.btnOutline, logoUploaded && { backgroundColor: '#2C333A', borderColor: '#0C66E4' }]} 
            onPress={handleUploadLogo}
          >
            <Text style={globalStyles.btnTextOutline}>
              {logoUploaded ? '✅ Logo Adjunto' : '📤 Subir Logo (Mock)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Sucursal Inicial */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>2. Sede o Sucursal Principal</Text>
          <Text style={styles.desc}>¿Dónde opera tu equipo principal?</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Nombre (ej. Sede Anaco)"
            value={sucursalName}
            onChangeText={setSucursalName}
            placeholderTextColor="#8C9BAB"
          />
          <TextInput
            style={globalStyles.input}
            placeholder="Ubicación o Dirección"
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholderTextColor="#8C9BAB"
          />
        </View>

        {/* 3. Primer Tablero */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>3. Primer Proyecto / Departamento</Text>
          <Text style={styles.desc}>El tablero base donde crearás tus procesos.</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Ej. Operaciones Técnicas"
            value={tableroName}
            onChangeText={setTableroName}
            placeholderTextColor="#8C9BAB"
          />
        </View>

        <TouchableOpacity 
          style={[globalStyles.btnPrimary, loading && { opacity: 0.7 }]} 
          onPress={handleCompleteSetup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={globalStyles.btnTextPrimary}>Completar y Entrar</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const globalStyles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#1D2125',
    padding: 24,
    justifyContent: 'center'
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#FFF',
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: '#8C9BAB', 
    marginTop: 8,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#1D2125',
    borderWidth: 1, 
    borderColor: '#384148', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    marginBottom: 16,
    color: '#FFF'
  },
  btnPrimary: {
    flexDirection: 'row', 
    backgroundColor: '#0C66E4', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16,
  },
  btnTextPrimary: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  btnOutline: {
    flexDirection: 'row', 
    backgroundColor: '#1D2125', 
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16
  },
  btnTextOutline: { 
    color: '#B6C2CF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#22272B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#384148',
    ...Platform.select({ web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 } }),
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 16,
  }
});
