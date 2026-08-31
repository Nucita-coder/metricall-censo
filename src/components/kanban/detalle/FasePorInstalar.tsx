import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { UserCheck, User } from 'lucide-react-native';
import { FaseProps, findListaTarget, getAtencionFallasListaId } from './types';
import { renderSection } from './SeccionRegistro';
import { supabase } from '../../../lib/supabase';

export const FasePorInstalar = ({
  tarjeta,
  miembros = [],
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [tecnicoAsignado, setTecnicoAsignado] = useState(data.tecnicoAsignado || '');

  // Filtrar técnicos (o mostrar todos los miembros si no hay etiquetas registradas)
  const tecnicosFiltrados = miembros.filter((m: any) => {
    const hasRolTecnico = m.rol === 'tecnico' || m.rol === 'técnico' || m.rol === 'instalador';
    const hasEtiquetaTecnico = Array.isArray(m.etiquetas) && m.etiquetas.some((e: string) => {
      const clean = String(e).toLowerCase().trim();
      return clean === 'tecnico' || clean === 'técnico' || clean === 'instalador' || clean === 'instalaciones' || clean.includes('tecnico') || clean.includes('técnico');
    });
    return hasRolTecnico || hasEtiquetaTecnico;
  });

  const listaTecnicos = tecnicosFiltrados.length > 0 ? tecnicosFiltrados : miembros;

  const matchLista = listasGlobales.find(l => l.id === tarjeta.lista_id);
  const nombreTablero = (matchLista?.tableros?.nombre || '').toLowerCase();
  const isFallaCard = Boolean(
    data.tipoFalla ||
    data.estadoSoporte ||
    data.accionFalla ||
    (tarjeta.origen && String(tarjeta.origen).toLowerCase().includes('soporte')) ||
    nombreTablero.includes('atenci') ||
    nombreTablero.includes('falla')
  );

  const handleSeleccionarTecnico = async (m: any) => {
    setIsSaving(true);
    const tecnicoNombre = m.nombre_completo || m.nombre || 'Técnico';
    setTecnicoAsignado(tecnicoNombre);

    try {
      const tecnicoId = m.id || null;
      await onUpdateTarjeta({
        tecnicoAsignado: tecnicoNombre,
        asignado_a: tecnicoId,
        tecnico_id: tecnicoId,
        fechaAsignacionTecnica: new Date().toISOString(),
      });

      let destId: string | undefined = undefined;

      if (isFallaCard) {
        destId = (await getAtencionFallasListaId('Asignado a', tarjeta.empresa_id)) || undefined;
      }

      if (!destId) {
        const matchGlobal = listasGlobales.find(l => {
          const nombreL = (l.nombre || '').toLowerCase();
          const isSameTablero = l.tablero_id === tarjeta.tablero_id;
          return isSameTablero && nombreL.includes('asignado');
        });
        if (matchGlobal) destId = matchGlobal.id;
      }

      if (!destId) {
        const fallback = findListaTarget(listasGlobales, 'asignado_a');
        if (fallback) destId = fallback.id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'Asignado a' en este tablero.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Técnico Asignado!', `La tarjeta fue asignada a ${tecnicoNombre} y transferida a 'Asignado a'.`);
    } catch (e: any) {
      console.error('[FasePorInstalar] Error al asignar técnico:', e);
      Alert.alert('Error', e.message || 'No se pudo asignar el técnico.');
    } finally {
      setIsSaving(false);
    }
  };

  return renderSection("Asignación Técnica", (
    <View>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
          Técnicos disponibles para asignar:
        </Text>

        {listaTecnicos.length === 0 ? (
          <View style={{ backgroundColor: '#2C333A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#384148', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#ECC94B', fontWeight: 'bold' }}>
              ⚠️ No hay miembros registrados en el equipo.
            </Text>
            <Text style={{ fontSize: 11, color: '#8C9BAB', marginTop: 4 }}>
              Agrega miembros al equipo desde Ajustes para poder asignarlos.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {listaTecnicos.map((m: any, idx: number) => {
              const isSelected = tecnicoAsignado === m.nombre_completo || tecnicoAsignado === m.nombre;
              return (
                <TouchableOpacity
                  key={m.id || idx}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? '#3B82F6' : '#384148',
                    backgroundColor: isSelected ? '#1E3A8A' : '#1D2125',
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                  onPress={() => !isSaving && handleSeleccionarTecnico(m)}
                  disabled={isSaving}
                >
                  {isSelected ? <UserCheck size={14} color="#60A5FA" /> : <User size={14} color="#8C9BAB" />}
                  <Text style={{ fontWeight: 'bold', color: isSelected ? '#FFF' : '#B6C2CF', fontSize: 13 }}>
                    {m.nombre_completo || m.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  ));
};
