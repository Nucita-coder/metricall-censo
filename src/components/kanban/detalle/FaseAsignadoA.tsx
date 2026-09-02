import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { FaseProps, findListaTarget, getAtencionFallasListaId } from './types';
import { renderSection } from './SeccionRegistro';
import { supabase } from '../../../lib/supabase';

export const FaseAsignadoA = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const [showMotivosLiberacion, setShowMotivosLiberacion] = useState(false);
  const [motivoLiberacion, setMotivoLiberacion] = useState(data.motivoLiberacion || '');

  const matchLista = listasGlobales.find(l => l.id === tarjeta.lista_id);
  const nombreTablero = (matchLista?.tableros?.nombre || '').toLowerCase();
  const isFalla = Boolean(
    data.tipoFalla ||
    data.estadoSoporte ||
    data.accionFalla ||
    (tarjeta.origen && String(tarjeta.origen).toLowerCase().includes('soporte')) ||
    nombreTablero.includes('atenci') ||
    nombreTablero.includes('falla')
  );

  const handleEnProcesoFalla = async () => {
    setIsSaving(true);
    try {
      let destId = await getAtencionFallasListaId('En Proceso', tarjeta.empresa_id);

      if (!destId) {
        const matchGlobal = listasGlobales.find(l => {
          const nombreL = (l.nombre || '').toLowerCase();
          const isSameTablero = l.tablero_id === tarjeta.tablero_id;
          return isSameTablero && (nombreL.includes('en proceso') || nombreL.includes('proceso'));
        });
        if (matchGlobal) destId = matchGlobal.id;
      }

      if (!destId) {
        const fallback = findListaTarget(listasGlobales, 'en_proceso');
        if (fallback) destId = fallback.id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'En Proceso' en este tablero.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Trabajo Aceptado!', "La tarjeta fue aceptada y pasó a 'En Proceso'.");
    } catch (e: unknown) {
      console.error('[FaseAsignadoA] Error al mover a En Proceso:', e);
      Alert.alert('Error', (e as Error).message || 'No se pudo mover a En Proceso.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRechazarFalla = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        tecnicoAsignado: null,
        asignado_a: null,
        tecnico_id: null,
        motivoRechazoTecnico: 'Rechazado por el técnico',
        fechaRechazoTecnico: new Date().toISOString(),
      });

      let destId = await getAtencionFallasListaId('Por asignar', tarjeta.empresa_id);

      if (!destId) {
        const matchGlobal = listasGlobales.find(l => {
          const nombreL = (l.nombre || '').toLowerCase();
          const isSameTablero = l.tablero_id === tarjeta.tablero_id;
          return isSameTablero && nombreL.includes('por asignar');
        });
        if (matchGlobal) destId = matchGlobal.id;
      }

      if (!destId) {
        const fallback = findListaTarget(listasGlobales, 'por_asignar');
        if (fallback) destId = fallback.id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'Por asignar' en este tablero.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Tarjeta Rechazada!', "La tarjeta fue rechazada y devuelta a la lista 'Por asignar'.");
    } catch (e: unknown) {
      console.error('[FaseAsignadoA] Error al rechazar tarjeta:', e);
      Alert.alert('Error', (e as Error).message || 'No se pudo rechazar la tarjeta.');
    } finally {
      setIsSaving(false);
    }
  };

  const sectionTitle = isFalla ? 'Gestión de Atención de Fallas' : 'Gestión de Instalación';

  return renderSection(sectionTitle, (
    <View>
      {isFalla ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: '#1F2937',
              borderWidth: 1,
              borderColor: '#3B82F6',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: isSaving ? 0.6 : 1,
            }}
            onPress={handleEnProcesoFalla}
            disabled={isSaving}
          >
            <CheckCircle2 size={16} color="#3B82F6" />
            <Text style={{ fontWeight: 'bold', color: '#60A5FA', fontSize: 13, textAlign: 'center' }}>
              En Proceso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: '#1F2937',
              borderWidth: 1,
              borderColor: '#EF4444',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: isSaving ? 0.6 : 1,
            }}
            onPress={handleRechazarFalla}
            disabled={isSaving}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={{ fontWeight: 'bold', color: '#EF4444', fontSize: 13, textAlign: 'center' }}>
              Rechazar
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}
    </View>
  ));
};
