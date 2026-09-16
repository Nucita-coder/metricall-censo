import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Clock, User } from 'lucide-react-native';
import { FaseProps, resolverListaKanban } from './types';
import { renderSection } from './SeccionRegistro';
import { useAuth } from '../../../context/AuthContext';

interface EventoHistorialLiberacion {
  fecha: string;
  motivoLiberacion: string;
  motivoRetorno: string;
  tecnicoAnterior: string;
  tecnicoAnteriorId?: string | null;
  usuarioRetorno?: string;
}

export const FaseLiberada = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const { session, nombreCompleto } = useAuth();
  const data = tarjeta.datos_valores || {};
  const [motivoRetorno, setMotivoRetorno] = useState(data.ultimoMotivoRetorno || '');

  const motivoTexto = data.motivoLiberacion || data.motivoLiberada || 'Razón desconocida';
  const tecnicoAsignadoPrevio = String(
    data.tecnicoAsignado || data.asignadoA || data.tecnicoAnterior || 'Sin técnico asignado'
  ).trim();

  const matchLista = listasGlobales.find(l => l.id === tarjeta.lista_id);
  const tableroId = matchLista?.tablero_id || (typeof tarjeta.tablero_id === 'string' ? tarjeta.tablero_id : undefined);
  const empresaId = tarjeta.empresa_id || matchLista?.empresa_id;
  const nombreTablero = (matchLista?.tableros?.nombre || '').toLowerCase();
  const isFalla = Boolean(
    data.tipoFalla ||
    data.estadoSoporte ||
    data.accionFalla ||
    (tarjeta.origen && String(tarjeta.origen).toLowerCase().includes('soporte')) ||
    nombreTablero.includes('atenci') ||
    nombreTablero.includes('falla')
  );

  const historialLiberaciones: EventoHistorialLiberacion[] = Array.isArray(data.historial_liberaciones)
    ? (data.historial_liberaciones as unknown as EventoHistorialLiberacion[])
    : [];

  const handleRetomarProceso = async () => {
    if (motivoRetorno.trim().length === 0) {
      Alert.alert('Atención', 'Debes explicar por qué se retoma la instalación antes de continuar.');
      return;
    }

    setIsSaving(true);
    try {
      const tecnicoAnteriorNombre = String(data.tecnicoAsignado || data.asignadoA || 'Sin técnico registrado').trim();
      const tecnicoAnteriorId = data.asignado_a || data.tecnico_id || null;

      const nuevoEvento: EventoHistorialLiberacion = {
        fecha: new Date().toISOString(),
        motivoLiberacion: String(motivoTexto),
        motivoRetorno: motivoRetorno.trim(),
        tecnicoAnterior: tecnicoAnteriorNombre,
        tecnicoAnteriorId: typeof tecnicoAnteriorId === 'string' ? tecnicoAnteriorId : null,
        usuarioRetorno: nombreCompleto || session?.user?.email || 'Usuario',
      };

      const comentariosPrevios = Array.isArray(data.comentarios) ? data.comentarios : [];
      const nuevoComentario = {
        autor: nombreCompleto || 'Sistema',
        fecha: new Date().toISOString(),
        texto: `Instalación reactivada a 'Por Instalar'. Técnico anterior: ${tecnicoAnteriorNombre}. Motivo de reactivación: "${motivoRetorno.trim()}". Causa de caída previa: "${motivoTexto}".`,
      };

      // Limpiar técnico previo para permitir reasignación limpia en "Por Instalar"
      await onUpdateTarjeta({
        motivoLiberacion: null,
        motivoLiberada: null,
        estadoLiberacion: null,
        estadoGestion: null,
        tecnicoAsignado: null,
        asignadoA: null,
        asignado_a: null,
        tecnico_id: null,
        tecnicoAnterior: tecnicoAnteriorNombre,
        ultimoMotivoRetorno: motivoRetorno.trim(),
        fechaUltimoRetorno: new Date().toISOString(),
        historial_liberaciones: [...historialLiberaciones, nuevoEvento],
        comentarios: [...comentariosPrevios, nuevoComentario],
      });

      // Mover hacia "Por Instalar" (o "Por asignar" si es falla)
      const targetSlug = isFalla ? 'por asignar' : 'por instalar';
      let destId = await resolverListaKanban(targetSlug, listasGlobales, tableroId, empresaId);

      if (!destId) {
        destId = await resolverListaKanban(isFalla ? 'asignar' : 'instalar', listasGlobales, tableroId, empresaId);
      }

      if (!destId) {
        throw new Error(
          isFalla
            ? "No se encontró la lista 'Por asignar' en este tablero."
            : "No se encontró la lista 'Por Instalar' en este tablero."
        );
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);

      Alert.alert(
        'Proceso Retomado',
        isFalla
          ? "La tarjeta fue enviada a 'Por asignar' para la reasignación de técnico."
          : "La tarjeta volvió a 'Por Instalar' para su correspondiente reasignación de técnico."
      );
    } catch (err: unknown) {
      console.error('[FaseLiberada] Error al retomar proceso:', err);
      Alert.alert('Error', (err as Error).message || 'No se pudo retomar el proceso');
    } finally {
      setIsSaving(false);
    }
  };

  return renderSection('Estado de Liberación', (
    <View>
      <View style={styles.cardLiberada}>
        <Text style={styles.tituloLiberada}>
          Esta tarjeta ha sido liberada (caída) por: {String(motivoTexto)}
        </Text>

        <View style={styles.infoTecnicoRow}>
          <User size={15} color="#8C9BAB" />
          <Text style={styles.infoTecnicoText}>
            Técnico que la atendía:{' '}
            <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>{tecnicoAsignadoPrevio}</Text>
          </Text>
        </View>

        <Text style={styles.labelInput}>Explicación para Retomar Proceso:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="¿Por qué se retoma esta instalación?"
          placeholderTextColor="#8C9BAB"
          multiline
          value={motivoRetorno}
          onChangeText={setMotivoRetorno}
          editable={!isSaving}
        />

        <TouchableOpacity
          style={[styles.botonRetomar, (isSaving || motivoRetorno.trim().length === 0) && styles.botonDisabled]}
          onPress={handleRetomarProceso}
          disabled={isSaving || motivoRetorno.trim().length === 0}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator color="#1D2125" />
          ) : (
            <Text style={styles.textoBotonRetomar}>Retomar Proceso (Enviar a Por Instalar)</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Historial de retornos anteriores */}
      {historialLiberaciones.length > 0 && (
        <View style={styles.historialContainer}>
          <Text style={styles.historialHeader}>Historial de Caídas y Reactivaciones</Text>
          {historialLiberaciones.map((h, idx) => (
            <View key={idx} style={styles.historialItem}>
              <View style={styles.historialTopRow}>
                <Clock size={13} color="#8C9BAB" />
                <Text style={styles.historialFecha}>
                  {new Date(h.fecha).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.historialTexto}>
                <Text style={{ fontWeight: 'bold', color: '#B6C2CF' }}>Técnico previo: </Text>
                {h.tecnicoAnterior}
              </Text>
              <Text style={styles.historialTexto}>
                <Text style={{ fontWeight: 'bold', color: '#B6C2CF' }}>Causa caída: </Text>
                {h.motivoLiberacion}
              </Text>
              <Text style={styles.historialTexto}>
                <Text style={{ fontWeight: 'bold', color: '#B6C2CF' }}>Motivo reactivación: </Text>
                {h.motivoRetorno}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ));
};

const styles = StyleSheet.create({
  cardLiberada: {
    backgroundColor: '#2C333A',
    borderColor: '#384148',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
  },
  tituloLiberada: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'capitalize',
    fontSize: 13,
  },
  infoTecnicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  infoTecnicoText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  labelInput: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8C9BAB',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 12,
    color: '#B6C2CF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 13,
  },
  botonRetomar: {
    backgroundColor: '#A0B2C6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonDisabled: {
    opacity: 0.5,
  },
  textoBotonRetomar: {
    color: '#1D2125',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  historialContainer: {
    marginTop: 16,
    backgroundColor: '#1D2125',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 12,
  },
  historialHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  historialItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    gap: 3,
  },
  historialTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  historialFecha: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  historialTexto: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});


