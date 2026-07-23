import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LogOut, Building, Clock, ShieldAlert } from 'lucide-react-native';


export default function EsperaScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    checkSolicitudStatus();
  }, []);

  const checkSolicitudStatus = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        await supabase.auth.signOut().catch(() => {});
        router.replace('/');
        return;
      }

      // 1. Primero validar si en el ínterin el administrador ya lo aceptó y le asignó empresa_id
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (perfil?.empresa_id) {
        // ¡Ya fue aceptado y tiene empresa! Lo enviamos al dashboard
        router.replace('/(drawer)/(tabs)');
        return;
      }

      // 2. Si sigue sin empresa, revisar el estado de su solicitud
      const { data } = await supabase
        .from('solicitudes_acceso')
        .select('*, empresas(nombre)')
        .eq('usuario_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setSolicitud(data);
      } else {
        setSolicitud(null);
      }
    } catch (error) {
      console.warn("Error validando solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarCodigo = async () => {
    if (!codigo || codigo.trim() === '') {
      Alert.alert('Error', 'Ingresa el código de invitación de la empresa.');
      return;
    }

    try {
      setSubmitting(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // 1. Buscar si la empresa existe
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nombre')
        .ilike('codigo_invitacion', codigo.trim())
        .single();

      if (empresaError || !empresa) {
        throw new Error('Código inválido o empresa no encontrada.');
      }

      // 2. Insertar solicitud
      const { error: insertError } = await supabase
        .from('solicitudes_acceso')
        .insert({
          usuario_id: userData.user.id,
          empresa_id: empresa.id,
          estado: 'pendiente'
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          throw new Error('Ya has enviado una solicitud a esta empresa.');
        }
        throw insertError;
      }

      Alert.alert('¡Solicitud Enviada!', `Se ha enviado tu petición para unirte a ${empresa.nombre}.`);
      checkSolicitudStatus(); // Refrescar pantalla

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };



  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  // ESTADO 1: BLOQUEADO
  if (solicitud?.estado === 'bloqueado') {
    return (
      <View style={styles.centerContainer}>
        <ShieldAlert size={64} color="#FF3B30" style={{ marginBottom: 24 }} />
        <Text style={styles.title}>Acceso Denegado</Text>
        <Text style={styles.subtitle}>
          Tu solicitud a la empresa <Text style={{fontWeight: 'bold', color: '#FFF'}}>{solicitud.empresas?.nombre}</Text> ha sido bloqueada permanentemente.
        </Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={handleCerrarSesion}>
          <LogOut size={20} color="#B6C2CF" />
          <Text style={styles.outlineBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ESTADO 2: PENDIENTE
  if (solicitud?.estado === 'pendiente') {
    return (
      <View style={styles.centerContainer}>
        <Clock size={64} color="#F59E0B" style={{ marginBottom: 24 }} />
        <Text style={styles.title}>En Sala de Espera</Text>
        <Text style={styles.subtitle}>
          Has solicitado unirte a <Text style={{fontWeight: 'bold', color: '#FFF'}}>{solicitud.empresas?.nombre}</Text>.
        </Text>
        <Text style={styles.desc}>
          Tu cuenta está a la espera de que el administrador apruebe tu ingreso y te asigne a una sucursal.
        </Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24, width: '100%' }]} onPress={checkSolicitudStatus}>
          <Text style={styles.primaryBtnText}>Actualizar Estado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.outlineBtn, { marginTop: 12 }]} onPress={handleCerrarSesion}>
          <LogOut size={20} color="#B6C2CF" />
          <Text style={styles.outlineBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ESTADO 3: SIN SOLICITUD (Ingreso de Código)
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Building size={48} color="#0C66E4" />
          <Text style={styles.titleMain}>Unirse a una Empresa</Text>
          <Text style={styles.subtitleMain}>Ingresa el código de invitación proporcionado por tu administrador.</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Ej: A8X9F2"
          placeholderTextColor="#8C9BAB"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="characters"
          maxLength={8}
          editable={!submitting}
        />

        <TouchableOpacity 
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleEnviarCodigo}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Enviar Solicitud</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleCerrarSesion}>
          <LogOut size={20} color="#8C9BAB" />
          <Text style={styles.logoutBtnText}>Cerrar Sesión e ir Atrás</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#B6C2CF',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#8C9BAB',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleMain: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleMain: {
    fontSize: 16,
    color: '#8C9BAB',
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#FFF',
    marginBottom: 24,
    ...Platform.select({ web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 } }),
  },
  primaryBtn: {
    backgroundColor: '#0C66E4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
    width: '100%'
  },
  outlineBtnText: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  logoutBtnText: {
    color: '#8C9BAB',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  }
});
