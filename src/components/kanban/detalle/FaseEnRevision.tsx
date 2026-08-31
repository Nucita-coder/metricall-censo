import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { FaseProps, findListaTarget, getAtencionFallasListaId } from './types';
import { renderSection } from './SeccionRegistro';
import { FaseEnProceso } from './FaseEnProceso';

export const FaseEnRevision = (props: FaseProps) => {
  const {
    tarjeta,
    onUpdateTarjeta,
    autoMoverTarjeta,
    isSaving,
    setIsSaving,
    listasGlobales = [],
    onRemoveTarjetaLocal,
    setTarjetaSeleccionada,
  } = props;
  const data = tarjeta.datos_valores || {};

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

  const handleAprobarFallaSolventada = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoSoporte: 'Falla Solventada',
        accionFalla: 'Falla Solventada',
        estadoGestion: 'falla_solventada',
        fechaSolventada: new Date().toISOString(),
        aprobadoPorAtc: true,
      });

      let destId = await getAtencionFallasListaId('Falla Solventada', tarjeta.empresa_id);

      if (!destId) {
        const matchGlobal = listasGlobales.find(l => {
          const nombreL = (l.nombre || '').toLowerCase();
          const isSameTablero = l.tablero_id === tarjeta.tablero_id;
          return isSameTablero && (nombreL.includes('solventada') || nombreL.includes('falla solventada'));
        });
        if (matchGlobal) destId = matchGlobal.id;
      }

      if (!destId) {
        const fallback = findListaTarget(listasGlobales, 'falla_solventada');
        if (fallback) destId = fallback.id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'Falla Solventada' en este tablero.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Falla Solventada!', "La tarjeta fue aprobada exitosamente y pasó a 'Falla Solventada'.");
    } catch (e: any) {
      console.error('[FaseEnRevision] Error al solventar falla:', e);
      Alert.alert('Error', e.message || 'No se pudo mover a Falla Solventada.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRechazarDevolverEnProceso = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        motivoRechazoRevision: 'Devuelto por ATC a En Proceso',
        fechaRechazoRevision: new Date().toISOString(),
        aprobadoPorAtc: false,
      });

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
      Alert.alert('¡Devuelto a En Proceso!', "La tarjeta fue rechazada y devuelta a 'En Proceso' para recarga.");
    } catch (e: any) {
      console.error('[FaseEnRevision] Error al devolver a En Proceso:', e);
      Alert.alert('Error', e.message || 'No se pudo devolver a En Proceso.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View>
      <FaseEnProceso {...props} readOnly={true} />

      {renderSection(isFalla ? "Auditoría y Validación ATC" : "Revisión de Servicio", (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: '#10B981',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={handleAprobarFallaSolventada}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFF" />
                  <Text style={{ fontWeight: 'bold', color: '#FFF', fontSize: 13, textAlign: 'center' }}>
                    Falla Solventada
                  </Text>
                </>
              )}
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
              onPress={handleRechazarDevolverEnProceso}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <XCircle size={18} color="#EF4444" />
                  <Text style={{ fontWeight: 'bold', color: '#EF4444', fontSize: 13, textAlign: 'center' }}>
                    Rechazar (En Proceso)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};
