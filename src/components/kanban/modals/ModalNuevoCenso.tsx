import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { UserCheck, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { TarjetaDatosValores } from '../../../types/kanban';
import FormularioCenso from '../../FormularioCenso';
import { validarDatosCenso } from '../../censo/validacionesCenso';
import { ejecutarPostCreacionTarjeta } from '../../../services/tarjetaCreacionService';
import { styles } from './ModalNuevoCenso.styles';

interface ModalNuevoCensoProps {
  visible: boolean;
  onClose: () => void;
  listaId: string;
  tableroId?: string;
  onSuccess?: () => void;
}

const ESTADO_INICIAL: TarjetaDatosValores = {
  nombreApellido: '',
  tipoDocumento: 'V',
  documentoIdentidad: '',
  telefonoMovil: '',
  telefonoAdicional: '',
  correo: '',
  cuentaConInternet: '',
  proveedorActual: '',
  tecnologiaActual: '',
  costoMensualActual: '',
  dispuestoCambiar: '',
  motivoNoCambiar: '',
  observacionesCenso: '',
  estado: '',
  ciudad: '',
  zona: '',
  sector: '',
  calle: '',
  urbanizacion: '',
  piso: '',
  edificio: '',
  referencia: '',
  origen: 'censo',
};

export function ModalNuevoCenso({
  visible,
  onClose,
  listaId,
  tableroId,
  onSuccess,
}: ModalNuevoCensoProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const { session, empresaId, nombreCompleto } = useAuth();

  const [formData, setFormData] = useState<TarjetaDatosValores>(ESTADO_INICIAL);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    AsyncStorage.getItem('@ultima_ciudad_registrada')
      .then((cached) => {
        setFormData((prev) => ({
          ...prev,
          vendedor: nombreCompleto || '',
          asesorComercial: nombreCompleto || '',
          ...(cached ? { ciudad: cached, ciudadMunicipio: cached } : {}),
        }));
      })
      .catch(() => {});
  }, [visible, nombreCompleto]);

  const updateForm = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGuardar = async () => {
    const validacion = validarDatosCenso(formData);
    if (!validacion.esValido) {
      const msg = `Faltan campos obligatorios:\n\n• ${validacion.faltantes.join('\n• ')}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Campos Faltantes', msg);
      return;
    }

    try {
      setIsSaving(true);
      const creadorNombre = nombreCompleto || session?.user?.email || 'Asesor';
      const asesorFinal = (formData.asesorComercial || formData.vendedor || creadorNombre).trim();

      const payloadDatos: TarjetaDatosValores = {
        ...formData,
        asesorComercial: asesorFinal,
        vendedor: asesorFinal,
        asignadoA: asesorFinal,
        creadorNombre,
        fechaCenso: new Date().toISOString(),
        origen: 'censo',
      };

      const { data: tarjetaCreada, error } = await supabase
        .from('tarjetas')
        .insert({
          lista_id: listaId,
          empresa_id: empresaId,
          creador_id: session?.user?.id,
          datos_valores: payloadDatos,
        })
        .select('id')
        .single();

      if (error || !tarjetaCreada) {
        throw new Error(error?.message || 'No se pudo guardar la tarjeta en la base de datos.');
      }

      const ciudadCache = String(formData.ciudad || formData.ciudadMunicipio || '').trim();
      if (ciudadCache) {
        AsyncStorage.setItem('@ultima_ciudad_registrada', ciudadCache).catch(() => {});
      }

      await ejecutarPostCreacionTarjeta({
        listaNombre: 'Censo',
        formData: payloadDatos,
        currentLista: { id: listaId, tablero_id: tableroId || '', nombre: 'Censo' },
        nuevaTarjetaId: tarjetaCreada.id,
        isMaterialesMode: false,
        payload: {
          lista_id: listaId,
          empresa_id: empresaId,
          creador_id: session?.user?.id,
          datos_valores: payloadDatos,
        },
      });

      const exitoMsg = 'Censo registrado exitosamente.';
      if (Platform.OS === 'web') window.alert(exitoMsg);
      else Alert.alert('Éxito', exitoMsg);

      setFormData(ESTADO_INICIAL);
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: unknown) {
      const errStr = (e as Error)?.message || 'Error inesperado al guardar el censo.';
      if (Platform.OS === 'web') window.alert('Error: ' + errStr);
      else Alert.alert('Error al Guardar', errStr);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCerrar = () => {
    if (isSaving) return;
    setFormData(ESTADO_INICIAL);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCerrar}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isDesktop && { maxWidth: 580 }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} color="#579DFF" />
              <Text style={styles.headerTitle}>Registrar Nuevo Censo</Text>
            </View>
            <TouchableOpacity onPress={handleCerrar} disabled={isSaving} style={styles.btnClose}>
              <X size={20} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* CUERPO DEL FORMULARIO DE CENSO */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <FormularioCenso formData={formData} handleChange={updateForm} />
          </ScrollView>

          {/* FOOTER DE ACCIONES */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancelar} onPress={handleCerrar} disabled={isSaving}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnGuardar, isSaving && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#1D2125" />
              ) : (
                <Text style={styles.btnGuardarTxt}>Guardar Censo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
