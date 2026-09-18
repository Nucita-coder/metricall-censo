import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormularioCenso from '../../components/FormularioCenso';
import FormularioReciboMaterial from '../../components/FormularioReciboMaterial';
import FormularioVenta from '../../components/FormularioVenta';
import { checkIsCensoFormat } from '../../components/kanban/detalle/types';
import CardLayoutWrapper from '../../components/layout/CardLayoutWrapper';
import { ModalMapaUbicacion } from '../../components/tarjetas/ModalMapaUbicacion';
import { validarDatosVenta } from '../../components/venta/validacionesVenta';
import { validarDatosAlmacen } from '../../components/almacen/formulario/validacionesAlmacen';
import { ModalAvisoFaltantes } from '../../components/common/ModalAvisoFaltantes';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ejecutarPostCreacionTarjeta } from '../../services/tarjetaCreacionService';
import { clasificarMovimientoAlmacen } from '../../services/almacenService';
import { TarjetaDatosValores, TarjetaMaterialItem } from '../../types/kanban';

const LISTAS_ALMACEN = ['Carga de Materiales', 'Material Recibido', 'Material Asignado', 'Recuperados', 'Devolución de Asignación', 'Devolución a Almacén Central', 'Devolución al Almacén Central'];

const checkIsMaterialesMode = (nombre?: string, tipo?: string): boolean => {
  if (!nombre && !tipo) return false;
  const n = (nombre || '').toLowerCase().trim();
  if (n.includes('asignado a') || n.includes('por asignar') || n.includes('en proceso') || n.includes('por instalar')) {
    return false;
  }
  return (
    LISTAS_ALMACEN.includes(nombre || '') ||
    clasificarMovimientoAlmacen(tipo, nombre) !== 'OTRO'
  );
};

export default function NuevaTarjetaScreen() {
  const {
    lista_id,
    lista_nombre,
    tipoCarga: paramTipoCarga,
    codigoMaterial: paramCodigo,
    nombreMaterial: paramNombre,
    modeloMaterial: paramModelo,
    serialMaterial: paramSerial,
    cantidad: paramCantidad
  } = useLocalSearchParams<{
    lista_id: string;
    lista_nombre?: string;
    tipoCarga?: string;
    codigoMaterial?: string;
    nombreMaterial?: string;
    modeloMaterial?: string;
    serialMaterial?: string;
    cantidad?: string;
  }>();
  const { session, empresaId } = useAuth();

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [ubicacionTemporal, setUbicacionTemporal] = useState<{ latitude: number, longitude: number } | null>(null);
  const [listaNombre, setListaNombre] = useState<string>(lista_nombre || '');
  const [faltantesAviso, setFaltantesAviso] = useState<string[]>([]);

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...(paramTipoCarga
        ? {
            tipoCarga:
              paramTipoCarga.trim().toLowerCase() === 'carga de materiales'
                ? 'Material Recibido'
                : paramTipoCarga,
          }
        : {}),
      ...(paramCodigo ? { codigoMaterial: paramCodigo } : {}),
      ...(paramNombre ? { nombreMaterial: paramNombre } : {}),
      ...(paramModelo ? { modeloMaterial: paramModelo } : {}),
      ...(paramSerial ? { serialMaterial: paramSerial } : {}),
      ...(paramCantidad ? { cantidadRecibida: paramCantidad } : {}),
      ...(paramCodigo || paramNombre ? {
        items: [{
          codigoMaterial: paramCodigo || '',
          nombreMaterial: paramNombre || '',
          modeloMaterial: paramModelo || '',
          serialMaterial: paramSerial || '',
          cantidadRecibida: paramCantidad || '1',
        }]
      } : {})
    }));
  }, [paramTipoCarga, paramCodigo, paramNombre, paramModelo, paramSerial, paramCantidad]);

  React.useEffect(() => {
    if (lista_id) {
      supabase.from('listas').select('nombre').eq('id', lista_id).single()
        .then(({ data }) => {
          if (data) {
            setListaNombre(data.nombre);
            if (clasificarMovimientoAlmacen(data.nombre) !== 'OTRO') {
              const tipoPorDefecto =
                data.nombre.trim().toLowerCase() === 'carga de materiales'
                  ? 'Material Recibido'
                  : data.nombre;
              setFormData(prev => (!prev.tipoCarga ? { ...prev, tipoCarga: tipoPorDefecto } : prev));
            }
          }
        });
    } else if (lista_nombre && clasificarMovimientoAlmacen(lista_nombre) !== 'OTRO') {
      const tipoPorDefecto =
        lista_nombre.trim().toLowerCase() === 'carga de materiales'
          ? 'Material Recibido'
          : lista_nombre;
      setFormData(prev => (!prev.tipoCarga ? { ...prev, tipoCarga: tipoPorDefecto } : prev));
    }
  }, [lista_id, lista_nombre]);

  React.useEffect(() => {
    const loadCachedCiudad = async () => {
      try {
        const cachedCiudad = await AsyncStorage.getItem('@ultima_ciudad_registrada');
        if (cachedCiudad) {
          setFormData(prev => ({
            ...prev,
            ciudad: cachedCiudad,
            ciudadMunicipio: cachedCiudad
          }));
        }
      } catch (e) {
        console.log('Error cargando ciudad del caché', e);
      }
    };
    loadCachedCiudad();
  }, []);

  const [formData, setFormData] = useState<TarjetaDatosValores>({
    fechaVenta: '', vendedor: '', tipoServicio: '', nombreApellido: '', tipoDocumento: '', documentoIdentidad: '',
    fechaNacimiento: '', telefonoMovil: '', telefonoAdicional: '', telefonoResidencial: '', correo: '',
    estado: '', ciudad: '', zona: '', sector: '', calle: '', urbanizacion: '', piso: '', edificio: '', referencia: '',
    latitud: null as number | null, longitud: null as number | null, direccionFiscal: '',
    phInstalacion: '', phConectados: '', phGamer: '', phCinefilos: '', phFamiliar: '',
    ppInstalacion: '', ppEmprendedores: '', ppComercios: '', ppOficinas: '', ppNegocios: '',
    equipoAdicional: '', nroAbonado: '', cuentaConInternet: '', dispuestoCambiar: '', tipoCarga: ''
  });

  const updateForm = (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value }));

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
    } catch (e: unknown) {
      Alert.alert('Error', 'No se pudo obtener la ubicación: ' + (e as Error).message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleGuardar = async () => {
    if (!lista_id) {
      Alert.alert('Error', 'No se pudo identificar la lista de destino.');
      return;
    }

    const isMaterialesMode = checkIsMaterialesMode(
      listaNombre || (lista_nombre as string) || '',
      formData.tipoCarga || paramTipoCarga
    );

    if (isMaterialesMode) {
      const tipoCargaStr = String(formData.tipoCarga || '').toUpperCase();
      const isDevolucionCentral = tipoCargaStr.includes('ALMACÉN CENTRAL') || tipoCargaStr.includes('ALMACEN CENTRAL');
      const isDevolucion = tipoCargaStr.includes('DEVOLUCION') || tipoCargaStr.includes('DEVOLUCIÓN');

      if (isDevolucion && !formData.nroOrdenEntrega) {
        formData.nroOrdenEntrega = 'S/N';
      }

      if (isDevolucion && !isDevolucionCentral) {
        formData.tipoCarga = 'DEVOLUCIÓN DE ASIGNACIÓN';
      } else if (isDevolucionCentral) {
        formData.tipoCarga = 'DEVOLUCIÓN A ALMACÉN CENTRAL';
      }

      const { esValido, faltantes } = validarDatosAlmacen(formData);
      if (!esValido) {
        setFaltantesAviso(faltantes);
        return;
      }
    } else if (listaNombre !== 'Censo') {
      const { esValido, faltantes } = validarDatosVenta(formData);
      if (!esValido) {
        setFaltantesAviso(faltantes);
        return;
      }
    } else {
      if (formData.cuentaConInternet === 'Sí' && !formData.dispuestoCambiar) {
        setFaltantesAviso(['Disposición a cambiar de operador (Requerido al contar con internet)']);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: currentLista } = await supabase.from('listas').select('id, tablero_id, nombre').eq('id', lista_id).single();

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

      await ejecutarPostCreacionTarjeta({
        currentLista,
        nuevaTarjetaId: nuevaTarjeta.id,
        formData,
        empresaId,
        listaNombre,
        isMaterialesMode,
        payload,
      });

      const navigateBack = () => {
        if (router.canGoBack()) {
          router.back();
        } else if (session) {
          router.replace('/(drawer)' as Href);
        } else {
          router.replace('/');
        }
      };

      const mensajeExito = isMaterialesMode
        ? 'Carga de material registrada correctamente.'
        : isCensoMode
          ? 'Censo registrado correctamente.'
          : 'Venta registrada correctamente.';

      if (Platform.OS === 'web') {
        navigateBack();
      } else {
        Alert.alert('Éxito', mensajeExito, [{ text: 'OK', onPress: navigateBack }]);
      }
    } catch (e: unknown) {
      Alert.alert('Error', 'No se pudo guardar: ' + (e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCensoMode = checkIsCensoFormat(listaNombre || lista_nombre);
  const isMaterialesMode = checkIsMaterialesMode(
    listaNombre || (lista_nombre as string) || '',
    formData.tipoCarga || paramTipoCarga
  );

  return (
    <>
      <CardLayoutWrapper
        title={isMaterialesMode ? 'Carga / Recibo de Material' : isCensoMode ? 'Nuevo Censo' : 'Nueva Venta'}
        onClose={() => router.canGoBack() ? router.back() : (session ? router.replace('/(drawer)' as Href) : router.replace('/'))}
        footer={
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color="#1D2125" /> : <Save size={20} color="#1D2125" />}
              <Text style={styles.saveBtnText}>{isSubmitting ? "Guardando..." : isMaterialesMode ? "Cargar Material" : isCensoMode ? "Guardar Censo" : "Guardar Venta"}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {isMaterialesMode ? (
          <FormularioReciboMaterial formData={formData} handleChange={updateForm} />
        ) : isCensoMode ? (
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
        latitud={typeof formData.latitud === 'number' ? formData.latitud : null}
        longitud={typeof formData.longitud === 'number' ? formData.longitud : null}
        ubicacionTemporal={ubicacionTemporal}
        setUbicacionTemporal={setUbicacionTemporal}
        onConfirmar={(loc) => {
          updateForm('latitud', loc.latitude);
          updateForm('longitud', loc.longitude);
          setMapaVisible(false);
        }}
        onCancelar={() => setMapaVisible(false)}
      />

      <ModalAvisoFaltantes
        visible={faltantesAviso.length > 0}
        faltantes={faltantesAviso}
        onClose={() => setFaltantesAviso([])}
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
