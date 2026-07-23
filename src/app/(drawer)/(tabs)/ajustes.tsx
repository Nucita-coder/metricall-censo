import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { TarjetaLogoEmpresa } from '../../../components/ajustes/TarjetaLogoEmpresa';
import { TarjetaInfoOrganizacion } from '../../../components/ajustes/TarjetaInfoOrganizacion';
import { TarjetaPerfilUsuario } from '../../../components/ajustes/TarjetaPerfilUsuario';
import { TarjetaSoporteTecnico } from '../../../components/ajustes/TarjetaSoporteTecnico';

export default function AjustesScreen() {
  const { empresaId, userRol } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, [empresaId]);

  const fetchCompanyData = async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('nombre, codigo_invitacion, logo_url')
        .eq('id', empresaId)
        .single();

      if (error) throw error;
      if (data) {
        setCompanyName(data.nombre || '');
        setInviteCode(data.codigo_invitacion || '');
        setLogoUrl(data.logo_url || null);
      }
    } catch (e: any) {
      console.error('Error al cargar datos de empresa:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  const isLiderOrAdmin = userRol === 'lider' || userRol === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.contentWrapper, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.pageTitle}>{isLiderOrAdmin ? 'Ajustes de la Empresa' : 'Ajustes del Perfil'}</Text>
        <Text style={styles.pageSubtitle}>
          {isLiderOrAdmin
            ? 'Configura la información pública, el logo oficial y tu perfil de usuario.'
            : 'Administra tu información personal, foto de perfil y mensaje de estado.'}
        </Text>

        {/* TARJETA DEL PERFIL DE USUARIO (Visible para todos los usuarios) */}
        <TarjetaPerfilUsuario />

        {/* TARJETAS DE ADMINISTRACIÓN DE EMPRESA (Solo visibles para Líder / Admin) */}
        {isLiderOrAdmin && (
          <>
            <TarjetaLogoEmpresa
              empresaId={empresaId}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              uploading={uploading}
              setUploading={setUploading}
            />

            <TarjetaInfoOrganizacion
              empresaId={empresaId}
              companyName={companyName}
              setCompanyName={setCompanyName}
              inviteCode={inviteCode}
              userRol={userRol}
            />

            <TarjetaSoporteTecnico
              empresaId={empresaId}
              userRol={userRol}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  contentWrapper: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#8C9BAB',
    marginBottom: 24,
  },
});
