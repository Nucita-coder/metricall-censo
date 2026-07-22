import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface BotonesAccionEdicionProps {
  isSaving: boolean;
  onCancelar: () => void;
  onGuardar: () => void;
}

export function BotonesAccionEdicion({ isSaving, onCancelar, onGuardar }: BotonesAccionEdicionProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#1D2125', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#384148' }}
        onPress={onCancelar}
        disabled={isSaving}
      >
        <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center' }}
        onPress={onGuardar}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar Cambios</Text>}
      </TouchableOpacity>
    </View>
  );
}
