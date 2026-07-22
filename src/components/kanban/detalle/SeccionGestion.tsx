import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';

import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { useSyncQueue } from '../../../hooks/useSyncQueue';
import { HistorialGestionList } from './HistorialGestionList';
import { DropdownSelector, EvidenciaUpload } from './FormularioGestionForm';

export const SeccionGestion = ({ tarjeta, onUpdateTarjeta, isSaving, setIsSaving, onSolicitarConversionVenta, soloHistorial }: FaseProps) => {
  const { addJob } = useSyncQueue();
  const gestiones = tarjeta.datos_valores?.gestiones || [];
  const hasGestion1 = gestiones.some((g: any) => g.etapa === 'gestion_1');
  const hasGestion2 = gestiones.some((g: any) => g.etapa === 'gestion_2');
  const fechaAgendada = tarjeta.datos_valores?.fecha_gestion_2;

  // Estados GESTION 1
  const [tipoContacto1, setTipoContacto1] = useState('');
  const [resultado1, setResultado1] = useState('');
  const [evidenciaUrl1, setEvidenciaUrl1] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [fechaContacto2, setFechaContacto2] = useState(new Date());
  const [showDatePicker1, setShowDatePicker1] = useState(false);
  const [mostrarDropdownTipo1, setMostrarDropdownTipo1] = useState(false);
  const [mostrarDropdownResultado1, setMostrarDropdownResultado1] = useState(false);
  const [subiendoEvidencia1, setSubiendoEvidencia1] = useState(false);

  // Estados GESTION 2
  const [tipoContacto2, setTipoContacto2] = useState('');
  const [resultado2, setResultado2] = useState('');
  const [evidenciaUrl2, setEvidenciaUrl2] = useState('');
  const [mostrarDropdownTipo2, setMostrarDropdownTipo2] = useState(false);
  const [mostrarDropdownResultado2, setMostrarDropdownResultado2] = useState(false);
  const [subiendoEvidencia2, setSubiendoEvidencia2] = useState(false);

  const fechaActualStr = new Date().toLocaleString();
  const opcionesTipo = ['Mensajería', 'Llamada', 'Visita Residencia'];
  
  const opcionesAgendar = [
    'Falta de dinero actual', 
    'De viaje', 
    'Contrato vigente con otro proveedor', 
    'Requiere consultarlo con familiares', 
    'Desea agendar para el próximo mes',
    'Cliente interesado - Agendar contacto'
  ];
  
  const opcionesResultado1 = [
    ...opcionesAgendar,
    'No quiere el servicio (Rechazo definitivo)',
    'Venta concretada'
  ];
  
  const opcionesResultado2 = ['Cliente no interesado', 'Venta concretada'];

  const guardarGestion1 = async () => {
    if (!tipoContacto1 || !resultado1 || !evidenciaUrl1) {
      Alert.alert('Incompleto', 'Debes seleccionar el tipo de contacto, resultado y adjuntar evidencia obligatoria.');
      return;
    }
    
    if (resultado1 === 'No quiere el servicio (Rechazo definitivo)' && !motivoRechazo.trim()) {
      Alert.alert('Incompleto', 'Debes explicar el motivo del rechazo definitivo.');
      return;
    }

    setIsSaving(true);
    try {
      const nuevaGestion: any = {
        etapa: 'gestion_1',
        fecha: fechaActualStr,
        tipoContacto: tipoContacto1,
        resultado: resultado1,
        evidenciaUrl: evidenciaUrl1,
      };

      if (resultado1 === 'No quiere el servicio (Rechazo definitivo)') {
        nuevaGestion.motivoRechazo = motivoRechazo;
      }

      const payload: any = { gestiones: [...gestiones, nuevaGestion] };
      if (opcionesAgendar.includes(resultado1)) {
        payload.fecha_gestion_2 = fechaContacto2.toLocaleString();
      }

      const netInfo = await NetInfo.fetch();

      if (resultado1 === 'Venta concretada' && onSolicitarConversionVenta) {
        if (!netInfo.isConnected) {
          Alert.alert('Sin Conexión', 'Se requiere conexión a internet para procesar una Venta Concretada.');
          setIsSaving(false);
          return;
        }
        onSolicitarConversionVenta(nuevaGestion);
        setIsSaving(false);
        return;
      }

      if (!netInfo.isConnected || evidenciaUrl1.startsWith('file://')) {
        const syncPayload = { ...nuevaGestion };
        if (payload.fecha_gestion_2) syncPayload.fecha_gestion_2 = payload.fecha_gestion_2;
        
        await addJob({
          tarjetaId: tarjeta.id,
          localUri: evidenciaUrl1,
          payloadGestion: syncPayload
        });
        
        Alert.alert('Modo Offline', 'Guardado localmente. Se sincronizará al recuperar la conexión.');
        setTipoContacto1('');
        setResultado1('');
        setEvidenciaUrl1('');
        setMotivoRechazo('');
      } else {
        await onUpdateTarjeta(payload);
        Alert.alert('Éxito', 'Gestión 1 registrada exitosamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo guardar la gestión.');
    } finally {
      setIsSaving(false);
    }
  };

  const guardarGestion2 = async () => {
    if (!tipoContacto2 || !resultado2 || !evidenciaUrl2) {
      Alert.alert('Incompleto', 'Debes seleccionar el tipo de contacto, resultado y adjuntar evidencia obligatoria.');
      return;
    }

    setIsSaving(true);
    try {
      const nuevaGestion = {
        etapa: 'gestion_2',
        fecha: fechaActualStr,
        tipoContacto: tipoContacto2,
        resultado: resultado2,
        evidenciaUrl: evidenciaUrl2,
      };

      const netInfo = await NetInfo.fetch();

      if (resultado2 === 'Venta concretada' && onSolicitarConversionVenta) {
        if (!netInfo.isConnected) {
          Alert.alert('Sin Conexión', 'Se requiere conexión a internet para procesar una Venta Concretada.');
          setIsSaving(false);
          return;
        }
        onSolicitarConversionVenta(nuevaGestion);
        setIsSaving(false);
        return;
      }

      if (!netInfo.isConnected || evidenciaUrl2.startsWith('file://')) {
        await addJob({
          tarjetaId: tarjeta.id,
          localUri: evidenciaUrl2,
          payloadGestion: nuevaGestion
        });
        Alert.alert('Modo Offline', 'Guardado localmente. Se sincronizará al recuperar la conexión.');
        setTipoContacto2('');
        setResultado2('');
        setEvidenciaUrl2('');
      } else {
        const payload: any = { gestiones: [...gestiones, nuevaGestion] };
        await onUpdateTarjeta(payload);
        Alert.alert('Éxito', 'Gestión 2 registrada exitosamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo guardar la gestión.');
    } finally {
      setIsSaving(false);
    }
  };

  if (soloHistorial) {
    return <HistorialGestionList gestiones={gestiones} />;
  }

  return (
    <View>
      {/* FORMULARIO GESTIÓN 1 */}
      {!hasGestion1 && renderSection("Gestión 1", (
        <View>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Fecha y Hora</Text>
            <TextInput
              style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }}
              value={fechaActualStr}
              editable={false}
            />
          </View>

          <DropdownSelector label="Tipo de Contacto" value={tipoContacto1} setValue={setTipoContacto1} options={opcionesTipo} show={mostrarDropdownTipo1} setShow={setMostrarDropdownTipo1} isSaving={isSaving} setEvidUrl={setEvidenciaUrl1} />
          <DropdownSelector label="Resultado de Gestión" value={resultado1} setValue={setResultado1} options={opcionesResultado1} show={mostrarDropdownResultado1} setShow={setMostrarDropdownResultado1} isSaving={isSaving} />

          {resultado1 === 'No quiere el servicio (Rechazo definitivo)' && (
            <View style={{ marginBottom: 16 }}>
               <Text style={{ fontSize: 10, color: '#F56565', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Motivo del Rechazo (Obligatorio)</Text>
              <TextInput
                style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#F56565', borderRadius: 8, padding: 12, color: '#B6C2CF', minHeight: 60 }}
                placeholder="¿Por qué no quiere el servicio?"
                placeholderTextColor="#8C9BAB"
                multiline
                value={motivoRechazo}
                onChangeText={setMotivoRechazo}
                editable={!isSaving}
              />
            </View>
          )}

          {opcionesAgendar.includes(resultado1) && (
            <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#1D2125', borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: '#90CDF4', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Fecha de Próximo Contacto</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#3182CE', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setShowDatePicker1(true)}
              >
                <Calendar size={18} color="#90CDF4" style={{ marginRight: 8 }} />
                <Text style={{ color: '#90CDF4', fontWeight: 'bold' }}>{fechaContacto2.toLocaleString()}</Text>
              </TouchableOpacity>
              {showDatePicker1 && (
                <DateTimePicker
                  value={fechaContacto2}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker1(Platform.OS === 'ios');
                    if (selectedDate) setFechaContacto2(selectedDate);
                  }}
                />
              )}
            </View>
          )}

          <EvidenciaUpload tipo={tipoContacto1} url={evidenciaUrl1} setUrl={setEvidenciaUrl1} subiendo={subiendoEvidencia1} setSubiendo={setSubiendoEvidencia1} isSaving={isSaving} />

          <TouchableOpacity
            style={{ backgroundColor: (!tipoContacto1 || !resultado1 || !evidenciaUrl1 || (resultado1 === 'No quiere el servicio (Rechazo definitivo)' && !motivoRechazo.trim())) ? '#384148' : '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
            onPress={guardarGestion1}
            disabled={isSaving || subiendoEvidencia1 || !tipoContacto1 || !resultado1 || !evidenciaUrl1 || (resultado1 === 'No quiere el servicio (Rechazo definitivo)' && !motivoRechazo.trim())}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Registrar Gestión 1</Text>}
          </TouchableOpacity>
        </View>
      ))}

      {/* FORMULARIO GESTIÓN 2 */}
      {hasGestion1 && fechaAgendada && !hasGestion2 && renderSection("Gestión 2 (Cierre)", (
        <View>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Fecha Agendada para hoy</Text>
            <TextInput style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }} value={fechaAgendada} editable={false} />
          </View>

          <DropdownSelector label="Tipo de Contacto" value={tipoContacto2} setValue={setTipoContacto2} options={opcionesTipo} show={mostrarDropdownTipo2} setShow={setMostrarDropdownTipo2} isSaving={isSaving} setEvidUrl={setEvidenciaUrl2} />
          <DropdownSelector label="Resultado de Gestión" value={resultado2} setValue={setResultado2} options={opcionesResultado2} show={mostrarDropdownResultado2} setShow={setMostrarDropdownResultado2} isSaving={isSaving} />
          <EvidenciaUpload tipo={tipoContacto2} url={evidenciaUrl2} setUrl={setEvidenciaUrl2} subiendo={subiendoEvidencia2} setSubiendo={setSubiendoEvidencia2} isSaving={isSaving} />

          <TouchableOpacity
            style={{ backgroundColor: (!tipoContacto2 || !resultado2 || !evidenciaUrl2) ? '#384148' : '#E53E3E', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
            onPress={guardarGestion2}
            disabled={isSaving || subiendoEvidencia2 || !tipoContacto2 || !resultado2 || !evidenciaUrl2}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Cerrar Gestión 2</Text>}
          </TouchableOpacity>
        </View>
      ))}

      <HistorialGestionList gestiones={gestiones} />
    </View>
  );
};
