import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';

export const FasePorInstalar = ({ tarjeta, miembros = [], onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [tecnicoAsignado, setTecnicoAsignado] = useState(data.tecnicoAsignado || '');

  // Filtrar exclusivamente miembros que posean la etiqueta o rol de "técnico" / "tecnico" / "instalador" / "instalaciones"
  const tecnicos = miembros.filter((m: any) => {
    const hasRolTecnico = m.rol === 'tecnico' || m.rol === 'técnico' || m.rol === 'instalador';
    const hasEtiquetaTecnico = Array.isArray(m.etiquetas) && m.etiquetas.some((e: string) => {
      const clean = String(e).toLowerCase().trim();
      return clean === 'tecnico' || clean === 'técnico' || clean === 'instalador' || clean === 'instalaciones' || clean.includes('tecnico') || clean.includes('técnico');
    });
    return hasRolTecnico || hasEtiquetaTecnico;
  });

  return renderSection("Asignación Técnica", (
    <View>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
          Seleccionar Técnico
        </Text>

        {tecnicos.length === 0 ? (
          <View style={{ backgroundColor: '#2C333A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#384148', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#ECC94B', fontWeight: 'bold' }}>
              ⚠️ No hay miembros con la etiqueta "técnico" registrados.
            </Text>
            <Text style={{ fontSize: 11, color: '#8C9BAB', marginTop: 4 }}>
              Asigna la etiqueta "técnico" a los miembros desde la sección de Equipo / Permisos para poder asignarlos aquí.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {tecnicos.map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: tecnicoAsignado === m.nombre_completo ? '#0C66E4' : '#384148', backgroundColor: tecnicoAsignado === m.nombre_completo ? '#0C66E4' : '#1D2125', marginRight: 8 }}
                onPress={() => !isSaving && setTecnicoAsignado(m.nombre_completo)}
                disabled={isSaving}
              >
                <Text style={{ fontWeight: 'bold', color: tecnicoAsignado === m.nombre_completo ? '#FFF' : '#B6C2CF' }}>{m.nombre_completo}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center' }}
        onPress={async () => {
          setIsSaving(true);
          const tecnicoId = miembros.find((m) => m.nombre_completo === tecnicoAsignado)?.id || null;
          await onUpdateTarjeta({ tecnicoAsignado, asignado_a: tecnicoId });
          const destId = findListaTarget(listasGlobales, 'asignado_a')?.id;
          if (!destId) throw new Error("Lista destino 'Asignado A' no encontrada");
          await autoMoverTarjeta(tarjeta, destId);
          setIsSaving(false);
        }}
        disabled={isSaving || !tecnicoAsignado}
      >
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar Técnico y Asignar</Text>}
      </TouchableOpacity>
    </View>
  ));
};
