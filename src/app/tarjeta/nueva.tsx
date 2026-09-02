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
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { TarjetaDatosValores, TarjetaMaterialItem } from '../../types/kanban';

const LISTAS_ALMACEN = ['Carga de Materiales', 'Material Recibido', 'Material Asignado', 'Devolución de Asignación', 'Devolución a Almacén Central', 'Recuperados'];

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

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...(paramTipoCarga ? { tipoCarga: paramTipoCarga } : {}),
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

    const isMaterialesMode = LISTAS_ALMACEN.includes(listaNombre || (lista_nombre as string) || '');

    if (isMaterialesMode) {
      const items = Array.isArray(formData.items) && formData.items.length > 0 ? (formData.items as TarjetaMaterialItem[]) : [formData as unknown as TarjetaMaterialItem];
      const hasValidItem = items.some((i) => i.codigoMaterial && i.nombreMaterial && i.cantidadRecibida);
      if (!formData.nroOrdenEntrega || !formData.recibidoPor || !formData.entregadoPor || !formData.tipoCarga || !hasValidItem) {
        Alert.alert('Campos incompletos', 'Por favor, completa los campos obligatorios de la orden, el tipo de carga y al menos un material válido.');
        return;
      }
      if (typeof formData.tipoCarga === 'string' && formData.tipoCarga.toUpperCase() === 'MATERIAL ASIGNADO') {
        if (!formData.asignadoA) {
          Alert.alert('Campo incompleto', 'Por favor, selecciona el miembro o personal al cual se le va a asignar el material.');
          return;
        }
        const hasUnselectedItem = items.some((i) => !i.codigoMaterial || !i.codigoMaterial.trim());
        if (hasUnselectedItem) {
          Alert.alert('Material no seleccionado', 'Por favor, selecciona el material de Almacén a asignar utilizando el menú desplegable.');
          return;
        }
      }
    } else if (listaNombre !== 'Censo') {
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

      if (currentLista && currentLista.nombre === 'Venta' && nuevaTarjeta) {
        const { data: listaFactibilidad } = await supabase
          .from('listas')
          .select('id')
          .eq('tablero_id', currentLista.tablero_id)
          .eq('nombre', 'Factibilidad')
          .maybeSingle();

        if (listaFactibilidad) {
          const { error: rpcError } = await supabase.rpc('mover_tarjeta_seguro', {
            p_tarjeta_id: nuevaTarjeta.id,
            p_lista_destino_id: listaFactibilidad.id
          });
          if (rpcError) {
            console.warn('RPC mover_tarjeta_seguro falló, actualizando directamente:', rpcError.message);
            await supabase.from('tarjetas').update({ lista_id: listaFactibilidad.id }).eq('id', nuevaTarjeta.id);
          }
        }
      }

      try {
        const ciudadToCache = (formData.ciudad as string) || (formData.ciudadMunicipio as string);
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

      if (isMaterialesMode && formData.tipoCarga && currentLista?.tablero_id && nuevaTarjeta) {
        try {
          const { data: tableroListas } = await supabase
            .from('listas')
            .select('id, nombre')
            .eq('tablero_id', currentLista.tablero_id);

          if (tableroListas && tableroListas.length > 0) {
            const targetClean = (formData.tipoCarga as string).toLowerCase().trim();
            const targetList = tableroListas.find(l => l.nombre && l.nombre.toLowerCase().trim() === targetClean);

            if (targetList && targetList.id !== currentLista.id) {
              const { error: rpcError } = await supabase.rpc('mover_tarjeta_seguro', {
                p_tarjeta_id: nuevaTarjeta.id,
                p_lista_destino_id: targetList.id
              });
              if (rpcError) {
                console.warn('mover_tarjeta_seguro falló en almacén, actualizando directamente:', rpcError.message);
                await supabase.from('tarjetas').update({ lista_id: targetList.id }).eq('id', nuevaTarjeta.id);
              }
            }
          }
        } catch (err) {
          console.error('Error al mover tarjeta de almacén:', err);
        }

        const tipoUpper = ((formData.tipoCarga as string) || '').toUpperCase();
        const isDevolucion = tipoUpper.includes('DEVOLUCION') || tipoUpper.includes('DEVOLUCIÓN');
        const isAsignado = !isDevolucion && (tipoUpper.includes('ASIGNA') || Boolean(formData.asignadoA && (formData.asignadoA as string).trim()));

        if ((isAsignado || isDevolucion) && formData.asignadoA && (formData.asignadoA as string).trim()) {
          try {
            const targetName = (formData.asignadoA as string).trim().toLowerCase();
            const { data: perfiles, error: perfilError } = await supabase
              .from('perfiles')
              .select('id, nombre_completo')
              .eq('empresa_id', empresaId);

            if (perfilError) {
              console.error('Error al buscar perfiles para notificación:', perfilError);
            }

            const matchedProfile = perfiles?.find(p => {
              const pName = (p.nombre_completo || '').trim().toLowerCase();
              return pName === targetName || (pName && targetName && (pName.includes(targetName) || targetName.includes(pName)));
            });

            if (matchedProfile?.id) {
              // Guardar también asignado_a UUID en datos_valores para compatibilidad RLS y triggers
              await supabase.from('tarjetas').update({
                datos_valores: { ...formData, asignado_a: matchedProfile.id }
              }).eq('id', nuevaTarjeta.id);

              const itemsList = Array.isArray(formData.items) && formData.items.length > 0 ? (formData.items as TarjetaMaterialItem[]) : [formData as unknown as TarjetaMaterialItem];
              const resumenItems = itemsList.map((it) => `${it.cantidadRecibida || '0'} und. de ${(it.nombreMaterial || it.codigoMaterial || 'Material').toUpperCase()}`).join(', ');
              const mensaje = isDevolucion
                ? `Se registró la devolución de ${resumenItems} al almacén correctamente.`
                : `Se te asignó ${resumenItems}. Este material está ahora en tu custodia.`;
              const { error: notifError } = await supabase.from('notificaciones').insert({ usuario_id: matchedProfile.id, tarjeta_id: nuevaTarjeta.id, mensaje, leida: false });
              if (notifError) {
                console.error('Error al insertar notificación:', notifError);
              }
            } else {
              console.warn('Perfil no encontrado para notificación. Nombre buscado:', formData.asignadoA, 'Perfiles disponibles:', perfiles?.map(p => p.nombre_completo));
            }
          } catch (errNotif) { console.error('Error notificacion:', errNotif); }
        }
      }

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
  const isMaterialesMode = LISTAS_ALMACEN.includes(listaNombre || (lista_nombre as string) || '');

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
