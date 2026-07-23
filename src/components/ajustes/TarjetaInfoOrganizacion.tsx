import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Copy, Check, Save } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface TarjetaInfoOrganizacionProps {
  empresaId: string | null;
  companyName: string;
  setCompanyName: (v: string) => void;
  inviteCode: string;
  userRol: string;
}

export function TarjetaInfoOrganizacion({
  empresaId,
  companyName,
  setCompanyName,
  inviteCode,
  userRol,
}: TarjetaInfoOrganizacionProps) {
  const [savingName, setSavingName] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  return (
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
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
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
});
