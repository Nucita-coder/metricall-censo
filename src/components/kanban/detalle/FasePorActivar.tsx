import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { CheckCircle2, RotateCcw, Send, ShieldAlert } from 'lucide-react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { generarReporteActivacion } from '../../../services/reportes';
import { useAuth } from '../../../context/AuthContext';
import { FasePorActivarAuditoria } from './FasePorActivarAuditoria';
import { FasePorActivarRetornoForm } from './FasePorActivarRetornoForm';

export const FasePorActivar = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
}: FaseProps) => {
  const { userRol, isDeveloper, etiquetas, nombreCompleto } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const isLiderEtiqueta = (etiquetas || []).some(
    (e) => e.toLowerCase() === 'líder' || e.toLowerCase() === 'lider'
  );
  const canAprobarORechazar =
    isDeveloper ||
    isLiderEtiqueta ||
    ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(rolLower);

  const data = tarjeta.datos_valores || {};
  const [activadoPor, setActivadoPor] = useState(
    String(data.activadoPor || (canAprobarORechazar ? nombreCompleto : ''))
  );
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<Record<string, boolean>>({});

  // Devolución a "En Proceso"
  const [mostrarFormRetorno, setMostrarFormRetorno] = useState(false);
  const [motivoRetornoInput, setMotivoRetornoInput] = useState('');

  const geofotos = (data.geofotos as string[]) || [];
  const adjuntos = (data.adjuntos as string[]) || [];
  const lch = data.lch_imagen as string | undefined;

  const toggleFoto = (url: string) => {
    setFotosSeleccionadas((p) => ({ ...p, [url]: !p[url] }));
  };

  // Aprobación final
  const handleAprobarYFinalizar = async () => {
    if (!activadoPor.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa el nombre de quien activó el servicio en el sistema.');
      return;
    }

    try {
      setIsSaving(true);
      const destId = findListaTarget(listasGlobales, 'cliente_activo')?.id;
      if (!destId) throw new Error("Lista destino 'Cliente Activo' no encontrada.");

      await onUpdateTarjeta({
        instalacionConfirmada: true,
        activadoPor: activadoPor.trim(),
        fechaActivacion: new Date().toISOString(),
        motivoRetorno: null,
      });

      await autoMoverTarjeta(tarjeta, destId);

      Alert.alert('¡Activación Exitosa!', 'El servicio ha sido confirmado y el abonado pasa a Cliente Activo.');
    } catch (e: unknown) {
      Alert.alert('Error al activar', (e as Error).message || 'No se pudo activar el servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  // Devolución a "En Proceso"
  const handleDevolverAEnProceso = async () => {
    if (!motivoRetornoInput.trim()) {
      Alert.alert(
        'Motivo Requerido',
        'Por favor describe el motivo por el cual no se puede activar y debe regresar a En Proceso.'
      );
      return;
    }

    try {
      setIsSaving(true);
      let destId = findListaTarget(listasGlobales, 'en_proceso')?.id;
      if (!destId) {
        destId = findListaTarget(listasGlobales, 'proceso')?.id;
      }
      if (!destId) {
        const match = listasGlobales.find(
          (l) => l.tablero_id === tarjeta.tablero_id && (l.nombre || '').toLowerCase().includes('proceso')
        );
        if (match) destId = match.id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'En Proceso' en este tablero.");
      }

      // Preservar todos los datos e insertar el motivo de retorno
      await onUpdateTarjeta({
        motivoRetorno: motivoRetornoInput.trim(),
        ultimoMotivoRetorno: motivoRetornoInput.trim(),
        retornadoPor: nombreCompleto || 'Líder / Admin',
        fechaRetorno: new Date().toISOString(),
      });

      await autoMoverTarjeta(tarjeta, destId);

      Alert.alert(
        'Instalación Devuelta',
        'La tarjeta fue regresada a "En Proceso". El técnico podrá ver el motivo de rechazo y editar los datos.'
      );
    } catch (e: unknown) {
      Alert.alert('Error al devolver', (e as Error).message || 'No se pudo mover la tarjeta.');
    } finally {
      setIsSaving(false);
    }
  };

  return renderSection(
    'Activación de Servicio',
    <View>
      {/* Alerta de permisos si no es Líder ni Admin */}
      {!canAprobarORechazar && (
        <View style={styles.bannerAlertaPermiso}>
          <ShieldAlert size={18} color="#FBBF24" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerAlertaTitulo}>Aprobación Restringida</Text>
            <Text style={styles.bannerAlertaTexto}>
              Solo un usuario con rol de Líder o Administrador puede aprobar la activación o devolver la tarjeta a En Proceso.
            </Text>
          </View>
        </View>
      )}

      {/* Auditoría Técnica y Selector de Evidencias */}
      <FasePorActivarAuditoria
        data={data as Record<string, unknown>}
        lch={lch}
        geofotos={geofotos}
        adjuntos={adjuntos}
        fotosSeleccionadas={fotosSeleccionadas}
        onToggleFoto={toggleFoto}
        isSaving={isSaving}
      />

      {/* Campo Activado Por */}
      <Text style={styles.labelInput}>Activado Por (NOC / Soporte)</Text>
      <TextInput
        style={styles.textInput}
        value={activadoPor}
        onChangeText={setActivadoPor}
        placeholder="Nombre de quien activó el servicio"
        placeholderTextColor="#8C9BAB"
        editable={!isSaving && canAprobarORechazar}
      />

      {/* Botón Reporte WhatsApp */}
      <TouchableOpacity
        style={styles.btnWhatsapp}
        onPress={() => {
          const reporte = generarReporteActivacion({ ...tarjeta, ...data }, fotosSeleccionadas);
          Linking.openURL('https://wa.me/?text=' + encodeURIComponent(reporte));
        }}
        disabled={isSaving}
      >
        <Send size={16} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.btnTextWhite}>Enviar Reporte (WhatsApp)</Text>
      </TouchableOpacity>

      {/* Acciones Exclusivas de Líder / Admin */}
      {canAprobarORechazar ? (
        <View style={{ marginTop: 8, gap: 10 }}>
          {/* Botón Aprobar y Finalizar */}
          <TouchableOpacity
            style={styles.btnAprobar}
            onPress={handleAprobarYFinalizar}
            disabled={isSaving || !activadoPor.trim()}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <CheckCircle2 size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnTextWhite}>Aprobar y Finalizar (Cliente Activo)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Formulario o Botón de Devolución a En Proceso */}
          {mostrarFormRetorno ? (
            <FasePorActivarRetornoForm
              motivo={motivoRetornoInput}
              onChangeMotivo={setMotivoRetornoInput}
              onConfirmar={handleDevolverAEnProceso}
              onCancelar={() => setMostrarFormRetorno(false)}
              isSaving={isSaving}
            />
          ) : (
            <TouchableOpacity
              style={styles.btnDevolver}
              onPress={() => setMostrarFormRetorno(true)}
              disabled={isSaving}
            >
              <RotateCcw size={16} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={styles.btnTextDevolver}>Devolver a En Proceso (Rechazar)</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerAlertaPermiso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: '#CA8A04',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bannerAlertaTitulo: {
    color: '#FACC15',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
  bannerAlertaTexto: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  labelInput: {
    fontSize: 11,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 10,
    color: '#B6C2CF',
    marginBottom: 16,
    fontSize: 13,
  },
  btnWhatsapp: {
    backgroundColor: '#25D366',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  btnAprobar: {
    backgroundColor: '#0C66E4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnDevolver: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnTextDevolver: {
    color: '#F87171',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
