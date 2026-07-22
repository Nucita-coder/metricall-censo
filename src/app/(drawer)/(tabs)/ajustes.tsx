import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  TextInput,
  Platform,
  useWindowDimensions 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Building2, User, Copy, Check, Save } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { uploadImageToSupabase } from '../../../services/uploadImage';

export default function AjustesScreen() {
  const { session, empresaId, nombreCompleto, userRol } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, [empresaId]);

  const fetchCompanyData = async () => {
    if (!empresaId) return;
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

  const handlePickLogo = async () => {
    if (!empresaId) return;

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para cambiar el logo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setUploading(true);

        // 1. Subir a Supabase Storage (bucket: 'adjuntos', carpeta: 'logos')
        const publicUrl = await uploadImageToSupabase(selectedUri, 'adjuntos', `logos/${empresaId}`);

        if (!publicUrl) {
          throw new Error('No se pudo subir la imagen a Supabase Storage.');
        }

        // 2. Guardar en la tabla empresas
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ logo_url: publicUrl })
          .eq('id', empresaId);

        if (updateError) throw updateError;

        setLogoUrl(publicUrl);
        Alert.alert('¡Éxito!', 'El logo de la empresa ha sido actualizado.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCompanyName = async () => {
    if (!companyName.trim() || !empresaId) return;
    try {
      setSavingName(true);
      const { error } = await supabase
        .from('empresas')
        .update({ nombre: companyName.trim() })
        .eq('id', empresaId);

      if (error) throw error;
      Alert.alert('Éxito', 'Nombre de la empresa actualizado.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el nombre.');
    } finally {
      setSavingName(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteCode);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.contentWrapper, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.pageTitle}>Ajustes de la Empresa</Text>
        <Text style={styles.pageSubtitle}>Configura la información pública y el logo oficial de tu organización.</Text>

        {/* TARJETA DEL LOGO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logo de la Empresa</Text>
          <Text style={styles.cardSubtitle}>
            Este logo se mostrará en el encabezado principal del dashboard y reportes.
          </Text>

          <View style={styles.logoSection}>
            <View style={styles.logoPreviewContainer}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Building2 size={40} color="#8C9BAB" />
                  <Text style={styles.logoPlaceholderText}>Sin Logo</Text>
                </View>
              )}
            </View>

            <View style={styles.logoActions}>
              <TouchableOpacity 
                style={[styles.btnUpload, uploading && { opacity: 0.7 }]}
                onPress={handlePickLogo}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Upload size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnUploadText}>{logoUrl ? 'Cambiar Logo' : 'Subir Logo'}</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.uploadHint}>Recomendado: Imagen PNG o JPG transparente de alta resolución.</Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE INFORMACIÓN DE EMPRESA */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la Organización</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre de la Empresa</Text>
            <View style={styles.inputWithBtn}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Nombre de la empresa"
                placeholderTextColor="#8C9BAB"
                editable={userRol === 'lider' || userRol === 'admin'}
              />
              {(userRol === 'lider' || userRol === 'admin') && (
                <TouchableOpacity 
                  style={[styles.btnSave, savingName && { opacity: 0.7 }]}
                  onPress={handleSaveCompanyName}
                  disabled={savingName}
                >
                  {savingName ? <ActivityIndicator color="#FFF" size="small" /> : <Save size={18} color="#FFF" />}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {inviteCode ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Código de Invitación (para Empleados)</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <TouchableOpacity style={styles.btnCopy} onPress={copyInviteCode}>
                  {copiedCode ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#8C9BAB" />}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {/* TARJETA DE USUARIO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu Perfil</Text>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <User size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{nombreCompleto || 'Usuario Metricall'}</Text>
              <Text style={styles.userRole}>Rol: {userRol ? userRol.toUpperCase() : 'MIEMBRO'}</Text>
              <Text style={styles.userEmail}>{session?.user?.email}</Text>
            </View>
          </View>
        </View>
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
  card: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#384148',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  logoPreviewContainer: {
    width: 140,
    height: 90,
    backgroundColor: '#1D2125',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#8C9BAB',
    fontSize: 12,
    marginTop: 4,
  },
  logoActions: {
    flex: 1,
    minWidth: 200,
  },
  btnUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  btnUploadText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadHint: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  fieldGroup: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 8,
  },
  inputWithBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 15,
  },
  btnSave: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  btnCopy: {
    padding: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userRole: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#8C9BAB',
    marginTop: 2,
  },
});
