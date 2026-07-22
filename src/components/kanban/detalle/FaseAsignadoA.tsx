import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';

export const FaseAsignadoA = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [showMotivosLiberacion, setShowMotivosLiberacion] = useState(false);
  const [motivoLiberacion, setMotivoLiberacion] = useState(data.motivoLiberacion || '');

  return renderSection("Gestión de Instalación", (
    <View>
      {!showMotivosLiberacion ? (
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#3182CE', alignItems: 'center' }}
            onPress={async () => {
              setIsSaving(true);
              const destId = findListaTarget(listasGlobales, 'en_proceso')?.id;
              if (!destId) throw new Error("Lista destino 'En Proceso' no encontrada");
              await autoMoverTarjeta(tarjeta, destId);
              setIsSaving(false);
            }}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontWeight: 'bold', color: '#FFF' }}>En Proceso</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#E53E3E', alignItems: 'center' }}
            onPress={() => setShowMotivosLiberacion(true)}
            disabled={isSaving}
          >
            <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Liberada (Caída)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Selecciona Motivo de Caída</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['cliente no quiere la instalacion', 'cliente no quiere pagar exceso de metraje', 'exceso de metraje', 'no hay nap cerca', 'nap sin potencia', 'nap potencia elevada'].map((motivo, idx) => (
              <TouchableOpacity
                key={idx}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: motivoLiberacion === motivo ? '#F56565' : '#384148', backgroundColor: motivoLiberacion === motivo ? '#F56565' : '#1D2125', marginRight: 8 }}
                onPress={() => !isSaving && setMotivoLiberacion(motivo === motivoLiberacion ? '' : motivo)}
                disabled={isSaving}
              >
                <Text style={{ fontWeight: 'bold', color: motivoLiberacion === motivo ? '#FFF' : '#B6C2CF', textTransform: 'capitalize' }}>{motivo}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity
              style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#384148', backgroundColor: '#1D2125', alignItems: 'center' }}
              onPress={() => {
                setShowMotivosLiberacion(false);
                setMotivoLiberacion('');
              }}
              disabled={isSaving}
            >
              <Text style={{ fontWeight: 'bold', color: '#B6C2CF' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#E53E3E', alignItems: 'center' }}
              onPress={async () => {
                setIsSaving(true);
                await onUpdateTarjeta({ motivoLiberacion, estadoLiberacion: 'bloqueada' });
                const destId = listasGlobales.find(l => l.slug === 'liberada')?.id;
                if (!destId) throw new Error("Lista destino 'Liberada' no encontrada");
                await autoMoverTarjeta(tarjeta, destId);
                setIsSaving(false);
              }}
              disabled={isSaving || !motivoLiberacion}
            >
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Confirmar Liberación</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  ));
};
