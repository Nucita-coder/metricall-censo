import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface HistorialGestionListProps {
  gestiones: any[];
}

export function HistorialGestionList({ gestiones }: HistorialGestionListProps) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  if (!gestiones || gestiones.length === 0) return null;

  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity
        style={{ backgroundColor: '#2C333A', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        onPress={() => setMostrarHistorial(!mostrarHistorial)}
      >
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#B6C2CF' }}>Ver Historial de Gestión ({gestiones.length})</Text>
        <ChevronDown size={20} color="#8C9BAB" style={{ transform: [{ rotate: mostrarHistorial ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      {mostrarHistorial && (
        <View style={{ marginTop: 12 }}>
          {gestiones
            .map((gestion: any, idx: number) => (
              <View key={idx} style={{ backgroundColor: '#2C333A', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#384148' }}>
                <Text style={{ fontSize: 12, color: '#3182CE', fontWeight: '900', marginBottom: 4, textTransform: 'uppercase' }}>
                  {gestion.etapa === 'gestion_1' ? 'Gestión 1' : 'Gestión 2 (Cierre)'}
                </Text>
                <Text style={{ fontSize: 12, color: '#8C9BAB', marginBottom: 4 }}>{gestion.fecha}</Text>
                <Text style={{ fontWeight: 'bold', color: '#B6C2CF', marginBottom: 2 }}>
                  {gestion.tipoContacto} - <Text style={{ fontWeight: 'normal' }}>{gestion.resultado}</Text>
                </Text>
                {gestion.motivoRechazo && (
                  <Text style={{ color: '#F56565', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                    Motivo: {gestion.motivoRechazo}
                  </Text>
                )}
                {gestion.evidenciaUrl && (
                  <Image source={{ uri: gestion.evidenciaUrl }} style={{ width: 60, height: 60, borderRadius: 4, marginTop: 8 }} />
                )}
              </View>
            ))
            .reverse()}
        </View>
      )}
    </View>
  );
}
