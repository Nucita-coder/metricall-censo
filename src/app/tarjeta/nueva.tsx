import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormularioCenso from '../../components/FormularioCenso';
import FormularioVenta from '../../components/FormularioVenta';
import CardLayoutWrapper from '../../components/layout/CardLayoutWrapper';
import { ModalMapaUbicacion } from '../../components/tarjetas/ModalMapaUbicacion';
import { checkIsCensoFormat } from '../../components/kanban/detalle/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function NuevaTarjetaScreen() {
  const { lista_id, lista_nombre } = useLocalSearchParams<{ lista_id: string, lista_nombre?: string }>();
  const { session, empresaId } = useAuth();

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [ubicacionTemporal, setUbicacionTemporal] = useState<{ latitude: number, longitude: number } | null>(null);
  const [listaNombre, setListaNombre] = useState<string>(lista_nombre || '');

  React.useEffect(() => {
    if (lista_id) {
      supabase.from('listas').select('nombre').eq('id', lista_id).single()
        .then(({ data }) => {
          if (data) setListaNombre(data.nombre);
        });
    }
  }, [lista_id]);

  React.useEffect(() => {
    const loadCachedCiudad = async () => {
      try {
        const cachedCiudad = await AsyncStorage.getItem('@ultima_ciudad_registrada');
        if (cachedCiudad) {
          setFormData(prev => ({
            ...prev,
            ciudad: cachedCiudad,
            ciudadMunicipio: cachedCiudad
          } as any));
        }
      } catch (e) {
        console.log('Error cargando ciudad del caché', e);
      }
    };
    loadCachedCiudad();
  }, []);

  const [formData, setFormData] = useState({
    fechaVenta: '',
    vendedor: '',
    tipoServicio: '',

    nombreApellido: '',
    tipoDocumento: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    telefonoMovil: '',
    telefonoAdicional: '',
    telefonoResidencial: '',
    correo: '',

    estado: '', ciudad: '', zona: '', sector: '', calle: '',
    urbanizacion: '', piso: '', edificio: '', referencia: '',
    latitud: null as number | null, longitud: null as number | null,
    direccionFiscal: '',

    phInstalacion: '', phConectados: '', phGamer: '', phCinefilos: '', phFamiliar: '',
    ppInstalacion: '', ppEmprendedores: '', ppComercios: '', ppOficinas: '', ppNegocios: '',

    equipoAdicional: '',
    nroAbonado: '',

    cuentaConInternet: '',
    dispuestoCambiar: ''
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const obtenerUbicacion = async () => {
    try {
      setIsLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación.');
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({ ...prev, latitud: location.coords.latitude, longitud: location.coords.longitude }));
      Alert.alert('Ubicación obtenida', 'Coordenadas capturadas con éxito.');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo obtener la ubicación: ' + e.message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleGuardar = async () => {
    if (!lista_id) {
      Alert.alert('Error', 'No se pudo identificar la lista de destino.');
      return;
    }

    if (listaNombre !== 'Censo') {
      if (!formData.tipoServicio || !formData.nombreApellido || !formData.tipoDocumento || !formData.documentoIdentidad) {
        Alert.alert('Campos incompletos', 'Por favor, completa los campos obligatorios marcados con (*).');
        return;
      }
    } else {
      if (formData.cuentaConInternet === 'Sí' && !formData.dispuestoCambiar) {
        Alert.alert('Error', 'Debe indicar si está dispuesto a cambiar de operador.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: currentLista } = await supabase.from('listas').select('tablero_id, nombre').eq('id', lista_id).single();

      const payload = {
        lista_id: lista_id,
        creador_id: session?.user?.id,
        empresa_id: empresaId,
        datos_valores: formData
      };

      const { data: nuevaTarjeta, error } = await supabase.from('tarjetas')
        .insert(payload)
        .select('id').single();

      if (error) throw error;

      if (currentLista && currentLista.nombre === 'Venta' && nuevaTarjeta) {
        const { error: rpcError } = await supabase.rpc('mover_tarjeta_seguro', {
          p_tarjeta_id: nuevaTarjeta.id,
          p_nombre_lista_destino: 'Factibilidad'
        });
        if (rpcError) console.warn('No se pudo mover a Factibilidad:', rpcError.message);
      }

      try {
        const ciudadToCache = formData.ciudad || (formData as any).ciudadMunicipio;
        if (ciudadToCache) {
          await AsyncStorage.setItem('@ultima_ciudad_registrada', ciudadToCache);
        }
      } catch (e) {
        console.log('Error guardando ciudad en caché', e);
      }

      if (listaNombre === 'Censo' && formData.dispuestoCambiar && currentLista?.tablero_id) {
        const runClone = async () => {
          try {
            let targetListName = '';
            if (formData.dispuestoCambiar === 'Sí') targetListName = 'si desea';
            else if (formData.dispuestoCambiar === 'No') targetListName = 'no desea';
            else if (formData.dispuestoCambiar === 'Es posible') targetListName = 'es posible';

            if (targetListName) {
              const { data: targetList } = await supabase.from('listas').select('id').eq('tablero_id', currentLista.tablero_id).eq('nombre', targetListName).single();
              if (targetList) {
                const clonePayload = { ...payload, lista_id: targetList.id };
                await supabase.from('tarjetas').insert(clonePayload);
              }
            }
          } catch (err) {
            console.log('Error silenciado al clonar tarjeta de censo:', err);
          }
        };
        runClone();
      }

      Alert.alert('Éxito', listaNombre === 'Censo' ? 'Censo registrado correctamente.' : 'Venta registrada correctamente.', [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : (session ? router.replace('/(drawer)' as Href) : router.replace('/')) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo guardar: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCensoMode = checkIsCensoFormat(listaNombre || lista_nombre);

  return (
    <>
      <CardLayoutWrapper
        title={isCensoMode ? 'Nuevo Censo' : 'Nueva Venta'}
        onClose={() => router.canGoBack() ? router.back() : (session ? router.replace('/(drawer)' as Href) : router.replace('/'))}
        footer={
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color="#1D2125" /> : <Save size={20} color="#1D2125" />}
              <Text style={styles.saveBtnText}>{isSubmitting ? "Guardando..." : isCensoMode ? "Guardar Censo" : "Guardar Venta"}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {isCensoMode ? (
          <FormularioCenso formData={formData} handleChange={updateForm} />
        ) : (
          <FormularioVenta
            formData={formData}
            handleChange={updateForm}
            isLocating={isLocating}
            onCaptarGPS={obtenerUbicacion}
            onMapaManual={() => {
              setUbicacionTemporal({ latitude: formData.latitud || 10.4806, longitude: formData.longitud || -66.9036 });
              setMapaVisible(true);
            }}
          />
        )}
      </CardLayoutWrapper>

      <ModalMapaUbicacion
        visible={mapaVisible}
        latitud={formData.latitud}
        longitud={formData.longitud}
        ubicacionTemporal={ubicacionTemporal}
        setUbicacionTemporal={setUbicacionTemporal}
        onConfirmar={(loc) => {
          updateForm('latitud', loc.latitude);
          updateForm('longitud', loc.longitude);
          setMapaVisible(false);
        }}
        onCancelar={() => setMapaVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1D2125',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#384148',
    paddingBottom: 30
  },
  saveBtn: {
    backgroundColor: '#B6C2CF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveBtnText: { color: '#1D2125', fontWeight: '900', fontSize: 18, marginLeft: 8 }
});
