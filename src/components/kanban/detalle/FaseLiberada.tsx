import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';

export const FaseLiberada = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [motivoRetorno, setMotivoRetorno] = useState(data.ultimoMotivoRetorno || '');

  return renderSection("Estado de Liberación", (
    <View>
      <View style={{ backgroundColor: '#4A1515', borderColor: '#F56565', borderWidth: 1, padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#F56565', fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' }}>
          Esta tarjeta ha sido liberada (caída) por: {data.motivoLiberacion || 'Razón desconocida'}
        </Text>

        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#8C9BAB', marginBottom: 8 }}>Explicación para Retomar Proceso:</Text>
        <TextInput
          style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 12, color: '#B6C2CF', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }}
          placeholder="¿Por qué se retoma esta instalación?"
          placeholderTextColor="#8C9BAB"
          multiline
          value={motivoRetorno}
          onChangeText={setMotivoRetorno}
          editable={!isSaving}
        />

        <TouchableOpacity
          style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center', opacity: motivoRetorno.trim().length > 0 ? 1 : 0.5 }}
          onPress={async () => {
            if (motivoRetorno.trim().length === 0) {
              Alert.alert("Atención", "Debes explicar por qué se retoma la instalación.");
              return;
            }
            setIsSaving(true);
            await onUpdateTarjeta({ motivoLiberacion: undefined, estadoLiberacion: undefined, ultimoMotivoRetorno: motivoRetorno.trim() });
            const destId = findListaTarget(listasGlobales, 'asignado_a')?.id;
            if (!destId) throw new Error("Lista destino 'Asignado A' no encontrada");
            await autoMoverTarjeta(tarjeta, destId);
            setIsSaving(false);
          }}
          disabled={isSaving || motivoRetorno.trim().length === 0}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retomar Proceso</Text>}
        </TouchableOpacity>
      </View>
    </View>
  ));
};
