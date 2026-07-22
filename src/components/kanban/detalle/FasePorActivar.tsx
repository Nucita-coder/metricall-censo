import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import * as Linking from 'expo-linking';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { generarReporteActivacion } from '../../../services/reportes';

export const FasePorActivar = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [activadoPor, setActivadoPor] = useState(data.activadoPor || '');
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<Record<string, boolean>>({});

  const geofotos = data.geofotos || [];
  const adjuntos = data.adjuntos || [];
  const lch = data.lch_imagen;

  return renderSection("Activación de Servicio", (
    <View>
      <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Activado Por</Text>
      <TextInput
        style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF', marginBottom: 16 }}
        value={activadoPor}
        onChangeText={setActivadoPor}
        placeholder="Nombre de quien activó"
        placeholderTextColor="#8C9BAB"
        editable={!isSaving}
      />

      {(geofotos.length > 0 || adjuntos.length > 0 || lch) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '500', marginBottom: 8, textTransform: 'uppercase' }}>Seleccionar enlaces para enviar:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {lch && (
              <TouchableOpacity
                style={{ marginRight: 12, opacity: fotosSeleccionadas[lch] ? 1 : 0.4, alignItems: 'center' }}
                onPress={() => !isSaving && setFotosSeleccionadas(p => ({ ...p, [lch]: !p[lch] }))}
                disabled={isSaving}
              >
                <Image source={{ uri: lch }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: fotosSeleccionadas[lch] ? 2 : 0, borderColor: '#48BB78' }} />
                <Text style={{ fontSize: 10, marginTop: 4, fontWeight: 'bold', color: '#B6C2CF' }}>LCH</Text>
                {fotosSeleccionadas[lch] && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#48BB78', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text></View>}
              </TouchableOpacity>
            )}
            {geofotos.map((url: string, idx: number) => (
              <TouchableOpacity
                key={`geo-${idx}`}
                style={{ marginRight: 12, opacity: fotosSeleccionadas[url] ? 1 : 0.4, alignItems: 'center' }}
                onPress={() => !isSaving && setFotosSeleccionadas(p => ({ ...p, [url]: !p[url] }))}
                disabled={isSaving}
              >
                <Image source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: fotosSeleccionadas[url] ? 2 : 0, borderColor: '#48BB78' }} />
                <Text style={{ fontSize: 10, marginTop: 4, fontWeight: 'bold', color: '#B6C2CF' }}>Geo {idx + 1}</Text>
                {fotosSeleccionadas[url] && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#48BB78', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text></View>}
              </TouchableOpacity>
            ))}
            {adjuntos.map((url: string, idx: number) => (
              <TouchableOpacity
                key={`adj-${idx}`}
                style={{ marginRight: 12, opacity: fotosSeleccionadas[url] ? 1 : 0.4, alignItems: 'center' }}
                onPress={() => !isSaving && setFotosSeleccionadas(p => ({ ...p, [url]: !p[url] }))}
                disabled={isSaving}
              >
                <Image source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: fotosSeleccionadas[url] ? 2 : 0, borderColor: '#48BB78' }} />
                <Text style={{ fontSize: 10, marginTop: 4, fontWeight: 'bold', color: '#B6C2CF' }}>Adj. {idx + 1}</Text>
                {fotosSeleccionadas[url] && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#48BB78', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={{ backgroundColor: '#25D366', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center' }}
        onPress={() => {
          const reporte = generarReporteActivacion({ ...tarjeta, ...data }, fotosSeleccionadas);
          const textoCodificado = encodeURIComponent(reporte);
          Linking.openURL('https://wa.me/?text=' + textoCodificado);
        }}
        disabled={isSaving}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Enviar Reporte (WhatsApp)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ backgroundColor: '#3182CE', padding: 14, borderRadius: 8, alignItems: 'center' }}
        onPress={async () => {
          setIsSaving(true);
          await onUpdateTarjeta({ instalacionConfirmada: true, activadoPor });
          const destId = findListaTarget(listasGlobales, 'cliente_activo')?.id;
          if (!destId) throw new Error("Lista destino 'Cliente Activo' no encontrada");
          await autoMoverTarjeta(tarjeta, destId);
          setIsSaving(false);
        }}
        disabled={isSaving || !activadoPor}
      >
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar y Finalizar</Text>}
      </TouchableOpacity>
    </View>
  ));
};
