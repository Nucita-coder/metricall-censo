import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, ImageBackground, Alert, Image } from 'react-native';
import { ChevronDown, MapPin, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { GeofotoTool } from './GeofotoTool';

export const FaseEnProceso = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};

  const [tipoInstalacion, setTipoInstalacion] = useState(data.tipoInstalacion || '');
  const [serialEquipo, setSerialEquipo] = useState(data.serialEquipo || '');
  const [macEquipo, setMacEquipo] = useState(data.macEquipo || '');
  const [puertoAsignado, setPuertoAsignado] = useState(data.puertoAsignado || '');
  const [puertosDisponibles, setPuertosDisponibles] = useState(data.puertosDisponibles || '');
  const [nroNap, setNroNap] = useState(data.nroNap || '');
  const [potenciaNap, setPotenciaNap] = useState(data.potenciaNap || '');
  const [potenciaCasa, setPotenciaCasa] = useState(data.potencia_casa || '');
  const [cableDrop, setCableDrop] = useState(data.cable_drop || '');
  const [mostrarDropdownCable, setMostrarDropdownCable] = useState(false);
  const [geoNap, setGeoNap] = useState<{ lat: number, lng: number } | null>(data.geo_nap || null);
  const [geoCasa, setGeoCasa] = useState<{ lat: number, lng: number } | null>(data.geo_casa || null);
  const [geoFotos, setGeoFotos] = useState<string[]>(data.geofotos || []);
  const [obteniendoGeoNap, setObteniendoGeoNap] = useState(false);
  const [obteniendoGeoCasa, setObteniendoGeoCasa] = useState(false);

  const [materiales, setMateriales] = useState<any>(data.materiales || {
    tensorPlastico: '',
    tensorHierro: '',
    grapas: '',
    tirrap: '',
    pachCordApc: '',
    pachCordUpc: '',
    pachCordApcUpc: '',
    cajaTerminalCon: '',
    cajaTerminalSin: '',
    conectorAcople: '',
    conectorMecanicoApc: '',
    conectorMecanicoUpc: '',
    precinto: '',
    cablePreconectorizado: ''
  });

  return (
    <View>
      {renderSection("Reporte de Instalación", (
        <View>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Tipo de Instalación</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {['tradicional', 'preconectorizado'].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: tipoInstalacion === tipo ? '#0C66E4' : '#384148', backgroundColor: tipoInstalacion === tipo ? '#0C66E4' : '#1D2125', alignItems: 'center' }}
                onPress={() => !isSaving && setTipoInstalacion(tipo)}
                disabled={isSaving}
              >
                <Text style={{ fontWeight: 'bold', color: tipoInstalacion === tipo ? '#FFF' : '#B6C2CF', textTransform: 'capitalize' }}>{tipo}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8 }}>SERIAL EQUIPO</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }} value={serialEquipo} onChangeText={setSerialEquipo} editable={!isSaving} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8 }}>MAC EQUIPO</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }} value={macEquipo} onChangeText={setMacEquipo} editable={!isSaving} />
            </View>
          </View>

          <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            {[
              { key: 'tensorPlastico', label: 'Tensor Plástico' },
              { key: 'tensorHierro', label: 'Tensor Hierro' },
              { key: 'grapas', label: 'Grapas' },
              { key: 'tirrap', label: 'Tirrap' },
              { key: 'pachCordApc', label: 'Pach Cord APC' },
              { key: 'pachCordUpc', label: 'Pach Cord UPC' },
              { key: 'pachCordApcUpc', label: 'Pach Cord APC/UPC' },
              { key: 'cajaTerminalCon', label: 'Caja Term. Con Accesorios' },
              { key: 'cajaTerminalSin', label: 'Caja Term. Sin Accesorios' },
              { key: 'conectorAcople', label: 'Conector/Acople H-H' },
              { key: 'conectorMecanicoApc', label: 'Conector Mecánico APC' },
              { key: 'conectorMecanicoUpc', label: 'Conector Mecánico UPC' },
              { key: 'precinto', label: 'Precinto' },
            ].map(item => (
              <View key={item.key} style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{item.label}</Text>
                <TextInput
                  style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }}
                  keyboardType="numeric"
                  value={String(materiales[item.key as keyof typeof materiales] || '')}
                  onChangeText={val => setMateriales((p: any) => ({ ...p, [item.key]: val }))}
                  editable={!isSaving}
                />
              </View>
            ))}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Cable Preconectorizado</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={() => !isSaving && setMostrarDropdownCable(!mostrarDropdownCable)}
              disabled={isSaving}
            >
              <Text style={{ color: materiales.cablePreconectorizado ? '#B6C2CF' : '#8C9BAB' }}>
                {materiales.cablePreconectorizado || 'Seleccionar...'}
              </Text>
              <ChevronDown size={16} color="#8C9BAB" />
            </TouchableOpacity>
            
            {mostrarDropdownCable && !isSaving && (
              <View style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                {['50', '70', '100'].map(opcion => (
                  <TouchableOpacity
                    key={opcion}
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#384148' }}
                    onPress={() => {
                      setMateriales((p: any) => ({ ...p, cablePreconectorizado: opcion }));
                      setMostrarDropdownCable(false);
                    }}
                  >
                    <Text style={{ color: '#B6C2CF' }}>{opcion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>


          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>NRO DE NAP</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={nroNap} onChangeText={setNroNap} editable={!isSaving} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>POTENCIA NAP</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={potenciaNap} onChangeText={setPotenciaNap} editable={!isSaving} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>POTENCIA CASA</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={potenciaCasa} onChangeText={setPotenciaCasa} editable={!isSaving} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>CABLE DROP</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={cableDrop} onChangeText={setCableDrop} editable={!isSaving} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>PUERTO ASIGNADO</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={puertoAsignado} onChangeText={setPuertoAsignado} editable={!isSaving} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>PUERTOS DISPONIBLES</Text>
                <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} keyboardType="numeric" value={puertosDisponibles} onChangeText={setPuertosDisponibles} editable={!isSaving} />
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>GEO NAP Y CASA</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: '100%', backgroundColor: geoNap ? '#48BB78' : '#3182CE', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={async () => {
                    setObteniendoGeoNap(true);
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                         Alert.alert('Permiso denegado', 'Se necesita acceso al GPS.');
                        return;
                      }
                      const loc = await Location.getCurrentPositionAsync({});
                      setGeoNap({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                      Alert.alert('Éxito', 'Coordenadas NAP capturadas.');
                    } catch (e) {
                      Alert.alert('Error', 'No se pudo obtener ubicación');
                    } finally {
                      setObteniendoGeoNap(false);
                    }
                  }}
                  disabled={obteniendoGeoNap || isSaving}
                >
                  {obteniendoGeoNap ? <ActivityIndicator color="#FFF" size="small" /> : <MapPin size={16} color="#FFF" style={{ marginRight: 8 }} />}
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{geoNap ? 'NAP Listo' : 'Capturar NAP'}</Text>
                </TouchableOpacity>
                {geoNap && (
                  <Text style={{ color: '#8C9BAB', fontSize: 10, marginTop: 4 }}>
                    {geoNap.lat.toFixed(5)}, {geoNap.lng.toFixed(5)}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: '100%', backgroundColor: geoCasa ? '#48BB78' : '#805AD5', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={async () => {
                    setObteniendoGeoCasa(true);
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permiso denegado', 'Se necesita acceso al GPS.');
                        return;
                      }
                      const loc = await Location.getCurrentPositionAsync({});
                      setGeoCasa({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                      Alert.alert('Éxito', 'Coordenadas Casa capturadas.');
                    } catch (e) {
                      Alert.alert('Error', 'No se pudo obtener ubicación');
                    } finally {
                      setObteniendoGeoCasa(false);
                    }
                  }}
                  disabled={obteniendoGeoCasa || isSaving}
                >
                  {obteniendoGeoCasa ? <ActivityIndicator color="#FFF" size="small" /> : <MapPin size={16} color="#FFF" style={{ marginRight: 8 }} />}
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{geoCasa ? 'Casa Lista' : 'Capturar Casa'}</Text>
                </TouchableOpacity>
                {geoCasa && (
                  <Text style={{ color: '#8C9BAB', fontSize: 10, marginTop: 4 }}>
                    {geoCasa.lat.toFixed(5)}, {geoCasa.lng.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>

            <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, marginTop: 8, textTransform: 'uppercase' }}>EVIDENCIA FOTOGRÁFICA MÚLTIPLE</Text>
            <GeofotoTool 
              onPhotoCaptured={(url) => setGeoFotos(prev => [...prev, url])} 
              isSaving={isSaving} 
            />

            {geoFotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
                {geoFotos.map((url: string, index: number) => (
                  <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                    <ImageBackground source={{ uri: url }} style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden' }} />
                    <TouchableOpacity
                      style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#E53E3E', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 }}
                      onPress={() => setGeoFotos(prev => prev.filter((_, i) => i !== index))}
                      disabled={isSaving}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
            onPress={async () => {
              setIsSaving(true);
              await onUpdateTarjeta({
                tipoInstalacion,
                serialEquipo,
                macEquipo,
                materiales,
                puertoAsignado,
                puertosDisponibles,
                nroNap,
                potenciaNap,
                potencia_casa: potenciaCasa,
                cable_drop: cableDrop,
                geo_nap: geoNap,
                geo_casa: geoCasa,
                geofotos: geoFotos,
                estadoLiberacion: 'exitosa',
                puerto: puertoAsignado,
                puertos_disponibles: puertosDisponibles,
                nap: nroNap,
                serial_onu: serialEquipo,
                tecnico: data.tecnicoAsignado || tarjeta.asignado_a || ''
              });
              const destId = findListaTarget(listasGlobales, 'por_activar')?.id;
              if (!destId) throw new Error("Lista destino 'Por Activar' no encontrada");
              await autoMoverTarjeta(tarjeta, destId);
              setIsSaving(false);
            }}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Instalación Exitosa (Activar)</Text>}
          </TouchableOpacity>
        </View>
      ))}

    </View>
  );
};
