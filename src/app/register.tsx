import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      // 1. Registro en Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario.');
      }

      // 2. Registro de Perfil (usando el RPC seguro)
      const { error: insertError } = await supabase.rpc('crear_perfil_empleado', {
        p_nombre_completo: fullName.trim()
      });
      
      if (insertError) throw insertError;

      Alert.alert('Éxito', 'Cuenta creada con éxito.');
      router.replace('/espera');
      
    } catch (error: any) {
      Alert.alert('Error en Registro', error.message || 'Error desconocido');
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
          <Text style={globalStyles.headerTitle}>Crear Cuenta</Text>
          <Text style={globalStyles.headerSubtitle}>Únete a tu organización en Metricall</Text>
        </View>

        <TextInput
          style={globalStyles.input}
          placeholder="Nombre Completo"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#8C9BAB"
          editable={!loading}
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Correo Electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#8C9BAB"
          editable={!loading}
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#8C9BAB"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[globalStyles.btnPrimary, loading && { opacity: 0.7 }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={globalStyles.btnTextPrimary}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} disabled={loading}>
            <Text style={styles.linkText}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos
const globalStyles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#1D2125',
    padding: 24,
    justifyContent: 'center'
  },
  headerTitle: { 
    fontSize: 32, 
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
    backgroundColor: '#2C333A',
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
    marginTop: 8,
  },
  btnTextPrimary: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  btnOutline: {
    flexDirection: 'row', 
    backgroundColor: '#2C333A', 
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 12,
    marginTop: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: '#8C9BAB',
  },
  linkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#58A6FF',
    textDecorationLine: 'underline',
  }
});
