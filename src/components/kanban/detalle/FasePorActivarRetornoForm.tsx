import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface FasePorActivarRetornoFormProps {
  motivo: string;
  onChangeMotivo: (val: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
  isSaving: boolean;
}

export function FasePorActivarRetornoForm({
  motivo,
  onChangeMotivo,
  onConfirmar,
  onCancelar,
  isSaving,
}: FasePorActivarRetornoFormProps) {
  return (
    <View style={styles.formRetornoBox}>
      <View style={styles.headerRow}>
        <AlertTriangle size={16} color="#EF4444" />
        <Text style={styles.formRetornoTitulo}>Motivo de Devolución a Campo:</Text>
      </View>
      <TextInput
        style={styles.textInputRetorno}
        value={motivo}
        onChangeText={onChangeMotivo}
        placeholder="Ej: Potencia en casa muy alta (-32 dBm), rehacer conector y re-medir..."
        placeholderTextColor="#6B778C"
        multiline
        numberOfLines={3}
        editable={!isSaving}
      />
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btnAccionRetorno, styles.btnConfirmarRetorno]}
          onPress={onConfirmar}
          disabled={isSaving || !motivo.trim()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.btnTextWhite}>Confirmar Devolución</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAccionRetorno, styles.btnCancelarRetorno]}
          onPress={onCancelar}
          disabled={isSaving}
        >
          <Text style={styles.btnTextCancel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formRetornoBox: {
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  formRetornoTitulo: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textInputRetorno: {
    backgroundColor: '#161A1D',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 6,
    padding: 10,
    color: '#FFF',
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnAccionRetorno: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmarRetorno: {
    backgroundColor: '#DC2626',
  },
  btnCancelarRetorno: {
    backgroundColor: '#2C333A',
  },
  btnTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnTextCancel: {
    color: '#8C9BAB',
    fontWeight: 'bold',
  },
});
