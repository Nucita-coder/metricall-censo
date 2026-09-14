import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, CheckCircle2, ChevronDown, Paperclip, Wrench } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { getAtencionFallasListaId } from './types';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { styles } from './SeccionAccionFallaOnline.styles';

interface SeccionAccionFallaOnlineProps {
  tarjeta: Tarjeta;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  onUpdateTarjeta: (updates: Partial<TarjetaDatosValores>) => Promise<void>;
  autoMoverTarjeta: (tarjeta: Tarjeta, nuevaListaId: string) => Promise<void>;
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  setTarjetaSeleccionada?: (tarjeta: Tarjeta | null) => void;
}

export function SeccionAccionFallaOnline({
  tarjeta,
  isSaving,
  setIsSaving,
  onUpdateTarjeta,
  autoMoverTarjeta,
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: SeccionAccionFallaOnlineProps) {
  const { showDiagnosticError } = useErrorDiagnostics();
  const [mostrarFormFalla, setMostrarFormFalla] = useState(false);
  const [nroOrden, setNroOrden] = useState('');
  const [fechaOrden] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [adjuntoOrdenUrl, setAdjuntoOrdenUrl] = useState<string | null>(null);
  const [nombreAdjunto, setNombreAdjunto] = useState<string | null>(null);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const handleProcesadoSAE = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoSoporte: 'Procesado en SAE',
        accionFalla: 'Procesado en SAE',
        estadoGestion: 'procesado_en_sae',
        fechaUltimaGestionFalla: new Date().toISOString(),
      });

      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Procesado en SAE!', 'La tarjeta fue marcada correctamente como resuelta.');
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-FALLA-SAE', 'Error al marcar Procesado en SAE.', e, 'GestionOnline');
    } finally {
      setIsSaving(false);
    }
  };

  const pickDocumentOrImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,application/pdf';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target?.files?.[0];
          if (file) {
            setSubiendoAdjunto(true);
            try {
              const fileUri = URL.createObjectURL(file);
              const publicUrl = await uploadImageToSupabase(fileUri, 'adjuntos', 'ordenes');
              setAdjuntoOrdenUrl(publicUrl || fileUri);
              setNombreAdjunto(file.name);
            } catch (err: unknown) {
              Alert.alert('Error al subir archivo', (err as Error).message || 'Ocurrió un error inesperado');
            } finally {
              setSubiendoAdjunto(false);
            }
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso a los archivos para adjuntar la orden.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSubiendoAdjunto(true);
        try {
          const asset = result.assets[0];
          const publicUrl = await uploadImageToSupabase(asset.uri, 'adjuntos', 'ordenes');
          setAdjuntoOrdenUrl(publicUrl || asset.uri);
          setNombreAdjunto(asset.fileName || 'orden_adjunta.jpg');
        } catch (err: unknown) {
          Alert.alert('Error al subir imagen', (err as Error).message || 'Ocurrió un error inesperado');
        } finally {
          setSubiendoAdjunto(false);
        }
      }
    } catch (e: unknown) {
      console.error('[ASISTENCIA TECNICA] Error selector de archivo:', e);
      Alert.alert('Error', (e as Error).message || 'No se pudo seleccionar el archivo');
    }
  };

  const handleProcesarAsistenciaTecnica = async () => {
    if (!nroOrden.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa el Número de Orden.');
      return;
    }

    const adjuntosActuales = Array.isArray(tarjeta.datos_valores?.adjuntos)
      ? tarjeta.datos_valores.adjuntos
      : [];
    const nuevosAdjuntos = adjuntoOrdenUrl
      ? Array.from(new Set([...adjuntosActuales, adjuntoOrdenUrl]))
      : adjuntosActuales;

    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        nroOrden: nroOrden.trim(),
        fechaOrdenGenerada: fechaOrden,
        archivoOrdenUrl: adjuntoOrdenUrl || '',
        adjuntos: nuevosAdjuntos,
        estadoSoporte: 'Asistencia Técnica',
        accionFalla: 'Asistencia Técnica',
        estadoGestion: 'asistencia_tecnica',
        fechaUltimaGestionFalla: new Date().toISOString(),
      });

      const destId = await getAtencionFallasListaId('Por asignar', tarjeta.empresa_id);
      if (!destId) {
        throw new Error("No se encontró la lista 'Por asignar' en el tablero 'Atención de Fallas'.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Orden Procesada!', `La orden ${nroOrden.trim()} fue procesada y enviada a Atención de Fallas (Por Asignar).`);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-FALLA-ASISTENCIA-TECNICA',
        'Error al procesar la asistencia técnica.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Selecciona la acción correspondiente para esta falla técnica:
      </Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isSaving && styles.btnDisabled]}
          onPress={handleProcesadoSAE}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={16} color="#A0B2C6" />
          <Text style={styles.actionBtnText}>Procesado en SAE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            mostrarFormFalla && styles.actionBtnActive,
            isSaving && styles.btnDisabled,
          ]}
          onPress={() => setMostrarFormFalla(!mostrarFormFalla)}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Wrench size={16} color="#B6C2CF" />
          <Text style={styles.actionBtnText}>Asistencia Técnica</Text>
          <ChevronDown
            size={14}
            color="#B6C2CF"
            style={{ transform: [{ rotate: mostrarFormFalla ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {mostrarFormFalla && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            Registro de Orden de Asistencia Técnica
          </Text>

          <Text style={styles.fieldLabel}>NÚMERO DE ORDEN *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej. ORD-10294"
            placeholderTextColor="#8C9BAB"
            value={nroOrden}
            onChangeText={setNroOrden}
          />

          <Text style={styles.fieldLabel}>FECHA DE ORDEN GENERADA</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{fechaOrden}</Text>
          </View>

          <Text style={styles.fieldLabel}>ADJUNTAR ORDEN</Text>
          <TouchableOpacity
            style={[styles.uploadBtn, adjuntoOrdenUrl ? styles.uploadBtnAttached : null]}
            onPress={pickDocumentOrImage}
            disabled={subiendoAdjunto}
            activeOpacity={0.7}
          >
            {subiendoAdjunto ? (
              <ActivityIndicator size="small" color="#B6C2CF" />
            ) : (
              <>
                <Paperclip size={15} color="#8C9BAB" />
                <Text style={styles.uploadBtnText}>
                  {nombreAdjunto || (adjuntoOrdenUrl ? 'Orden Adjuntada' : 'Adjuntar')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (isSaving || subiendoAdjunto) && styles.btnDisabled,
            ]}
            onPress={handleProcesarAsistenciaTecnica}
            disabled={isSaving || subiendoAdjunto}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator color="#1D2125" />
            ) : (
              <>
                <Check size={16} color="#1D2125" />
                <Text style={styles.submitBtnText}>Procesar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


