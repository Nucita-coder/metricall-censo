import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
      if (onOk) {
        setTimeout(onOk, 150);
      }
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      showAlert('Error', 'Todos los campos obligatorios deben ser completados.');
      return;
    }

    setLoading(true);

    try {
      // Si proporcionó un código, validamos antes de registrar en auth
      let empresaId: string | null = null;
      let empresaNombre: string = '';

      if (inviteCode.trim()) {
        const { data: rpcData } = await supabase
          .rpc('buscar_empresa_por_codigo', { p_codigo: inviteCode.trim() });

        const empresa = rpcData && rpcData.length > 0 ? rpcData[0] : null;

        if (empresa) {
          empresaId = empresa.id;
          empresaNombre = empresa.nombre;
        } else {
          // Fallback a consulta directa por si el RPC no ha sido instalado aún
          const { data: directEmpresa } = await supabase
            .from('empresas')
            .select('id, nombre')
            .ilike('codigo_invitacion', inviteCode.trim())
            .single();

          if (directEmpresa) {
            empresaId = directEmpresa.id;
            empresaNombre = directEmpresa.nombre;
          } else {
            throw new Error('Código de invitación inválido o empresa no encontrada.');
          }
        }
      }

      // 1. Registro en Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario.');
      }

      const userId = authData.user.id;

      // Si signUp no devolvió sesión automática, forzamos signInWithPassword
      if (!authData.session) {
        try {
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        } catch (e) {
          console.log('SignIn automático tras signUp:', e);
        }
      }

      // 2. Registro de Perfil Empleado
      const { error: insertError } = await supabase.rpc('crear_perfil_empleado', {
        p_nombre_completo: fullName.trim(),
        p_user_id: userId
      });

      if (insertError) throw insertError;

      // Si se especificó código de invitación, enviar solicitud al admin automáticamente
      if (empresaId) {
        const { error: reqError } = await supabase.from('solicitudes_acceso').insert({
          usuario_id: userId,
          empresa_id: empresaId,
          estado: 'pendiente'
        });
        if (reqError && reqError.code !== '23505') {
          console.warn('Error al crear solicitud de acceso:', reqError);
        }
      }

      showAlert(
        'Cuenta Creada',
        empresaId
          ? `Se envió tu solicitud para unirte a ${empresaNombre}. Espera la aprobación del administrador.`
          : 'Cuenta creada con éxito. A continuación ingresa el código de invitación de tu empresa.',
        () => {
          router.replace('/espera');
        }
      );

    } catch (error: any) {
      showAlert('Error en Registro', error.message || 'Error desconocido');
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
        <View style={styles.card}>
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
            placeholder="Código de Invitación de Empresa (Opcional)"
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholderTextColor="#8C9BAB"
            autoCapitalize="none"
            maxLength={8}
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
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#FFF',
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 15, 
    color: '#8C9BAB', 
    marginTop: 6,
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
  },
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
    marginBottom: 24,
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
  }
});
