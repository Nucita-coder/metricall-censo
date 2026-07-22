import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('@saved_user_email');
        const rememberStatus = await AsyncStorage.getItem('@remember_me');
        if (savedEmail && rememberStatus === 'true') {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.log('Error cargando email guardado:', e);
      }
    };
    loadSavedEmail();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa tu correo y contraseña.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (rememberMe) {
        await AsyncStorage.setItem('@saved_user_email', email.trim());
        await AsyncStorage.setItem('@remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('@saved_user_email');
        await AsyncStorage.removeItem('@remember_me');
      }

      // Redirigimos al layout principal (Tabs) que se encarga de proteger la sesión
      router.replace('/(drawer)/(tabs)');
      
    } catch (error: any) {
      Alert.alert('Error en Inicio de Sesión', error.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={globalStyles.container}>
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Image source={require('../../assets/images/logo-metricall.png')} style={{ width: 220, height: 120, alignSelf: 'center', marginBottom: 16 }} resizeMode="contain" />
            <Text style={globalStyles.headerTitle}>Metricall</Text>
            <Text style={globalStyles.headerSubtitle}>Inicia sesión para continuar</Text>
          </View>

          <TextInput
            style={globalStyles.input}
            placeholder="Correo Electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#9FADBC"
            editable={!loading}
          />

          <TextInput
            style={globalStyles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#9FADBC"
            editable={!loading}
          />

          <TouchableOpacity 
            style={styles.rememberContainer} 
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Check size={12} color="#FFF" strokeWidth={3} />}
            </View>
            <Text style={styles.rememberText}>Recordar mi usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[globalStyles.btnPrimary, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={globalStyles.btnTextPrimary}>Acceder</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
              <Text style={styles.linkText}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const globalStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1D2125',
    padding: 24,
    justifyContent: 'center'
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#FFF',
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#8C9BAB', 
    marginTop: 4,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#1D2125',
    borderWidth: 1, 
    borderColor: '#384148', 
    borderRadius: 8, 
    padding: 16, 
    fontSize: 16, 
    marginBottom: 16,
    color: '#FFF'
  },
  btnPrimary: {
    flexDirection: 'row', 
    backgroundColor: '#0C66E4', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8,
  },
  btnTextPrimary: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2C333A',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 48,
    ...Platform.select({ web: { boxShadow: '0px 8px 12px rgba(0,0,0,0.4)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 } }),
    borderWidth: 1,
    borderColor: '#384148',
  },
  headerContainer: {
    marginBottom: 32,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#8C9BAB',
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C66E4',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  rememberText: {
    color: '#8C9BAB',
    fontSize: 14,
  }
});
