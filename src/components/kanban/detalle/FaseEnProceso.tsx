import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, ImageBackground, Alert, Image } from 'react-native';
import { ChevronDown, MapPin, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { GeofotoTool } from './GeofotoTool';

export const FaseEnProceso = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const { nombreCompleto, empresaId } = useAuth();
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

  const [stockCustodia, setStockCustodia] = useState<Record<string, number>>({});

  useEffect(() => {
    const targetTecnico = (data.tecnicoAsignado || data.asignadoA || nombreCompleto || '').toString().trim().toUpperCase();
    const targetEmpresa = tarjeta.empresa_id || empresaId;
    if (!targetEmpresa || !targetTecnico) return;

    supabase.from('tarjetas').select('id, datos_valores').eq('empresa_id', targetEmpresa).then(({ data: rows }) => {
      if (!rows) return;
      const mapaStock: Record<string, number> = {};

      rows.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const miembro = (v.asignadoA || v.recibidoPor || '').toString().trim().toUpperCase();
        const isMatch = miembro === targetTecnico || (miembro && targetTecnico && (miembro.includes(targetTecnico) || targetTecnico.includes(miembro)));

        const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
        const isAsignado = !isDevolucion && (tipo.includes('ASIGNA') || Boolean(v.asignadoA && v.asignadoA.toString().trim()));

        if (isMatch && (isAsignado || isDevolucion)) {
          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          itemsList.forEach((item: any) => {
            const cod = (item.codigoMaterial || '').trim().toUpperCase();
            const nom = (item.nombreMaterial || '').trim().toUpperCase();
            const cant = parseFloat(item.cantidadRecibida || '0') || 0;
            const key = cod || nom;
            if (key) {
              if (!mapaStock[key]) mapaStock[key] = 0;
              if (isAsignado) mapaStock[key] += cant;
              else if (isDevolucion) mapaStock[key] -= cant;
            }
          });
        }

        const tecCard = (v.tecnicoAsignado || v.asignadoA || v.creadorNombre || '').toString().trim().toUpperCase();
        const matchTec = tecCard === targetTecnico || (tecCard && targetTecnico && (tecCard.includes(targetTecnico) || targetTecnico.includes(miembro)));
        if (matchTec && row.id !== tarjeta.id && v.materiales && typeof v.materiales === 'object') {
          const fieldMap: Record<string, string> = {
            tensorPlastico: 'MAT-TENSOR-PLASTICO',
            tensorHierro: 'MAT-TENSOR-HIERRO',
            grapas: 'MAT-GRAPAS',
            tirrap: 'MAT-TIRRAP',
            pachCordApc: 'MAT-PACH-APC',
            pachCordUpc: 'MAT-PACH-UPC',
            pachCordApcUpc: 'MAT-PACH-APC-UPC',
            cajaTerminalCon: 'MAT-CAJA-TERM-CON',
            cajaTerminalSin: 'MAT-CAJA-TERM-SIN',
            conectorAcople: 'MAT-CONECTOR-ACOPLE-HH',
            conectorMecanicoApc: 'MAT-CONECTOR-MEC-APC',
            conectorMecanicoUpc: 'MAT-CONECTOR-MEC-UPC',
            precinto: 'MAT-PRECINTO',
            cablePreconectorizado: 'MAT-CABLE-PRECONECTORIZADO',
            cableDrop: 'MAT-CABLE-DROP'
          };

          Object.keys(v.materiales).forEach((fk) => {
            const cantUsed = parseFloat(v.materiales[fk] || '0') || 0;
            if (cantUsed > 0 && fieldMap[fk]) {
              const k = fieldMap[fk];
              if (mapaStock[k] !== undefined) mapaStock[k] -= cantUsed;
            }
          });
        }
      });

      setStockCustodia(mapaStock);
    });
  }, [tarjeta.id, tarjeta.empresa_id, empresaId, nombreCompleto, data.tecnicoAsignado, data.asignadoA]);

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
              { key: 'tensorPlastico', label: 'Tensor Plástico', cod: 'MAT-TENSOR-PLASTICO' },
              { key: 'tensorHierro', label: 'Tensor Hierro', cod: 'MAT-TENSOR-HIERRO' },
              { key: 'grapas', label: 'Grapas', cod: 'MAT-GRAPAS' },
              { key: 'tirrap', label: 'Tirrap', cod: 'MAT-TIRRAP' },
              { key: 'pachCordApc', label: 'Pach Cord APC', cod: 'MAT-PACH-APC' },
              { key: 'pachCordUpc', label: 'Pach Cord UPC', cod: 'MAT-PACH-UPC' },
              { key: 'pachCordApcUpc', label: 'Pach Cord APC/UPC', cod: 'MAT-PACH-APC-UPC' },
              { key: 'cajaTerminalCon', label: 'Caja Term. Con Accesorios', cod: 'MAT-CAJA-TERM-CON' },
              { key: 'cajaTerminalSin', label: 'Caja Term. Sin Accesorios', cod: 'MAT-CAJA-TERM-SIN' },
              { key: 'conectorAcople', label: 'Conector/Acople H-H', cod: 'MAT-CONECTOR-ACOPLE-HH' },
              { key: 'conectorMecanicoApc', label: 'Conector Mecánico APC', cod: 'MAT-CONECTOR-MEC-APC' },
              { key: 'conectorMecanicoUpc', label: 'Conector Mecánico UPC', cod: 'MAT-CONECTOR-MEC-UPC' },
              { key: 'precinto', label: 'Precinto', cod: 'MAT-PRECINTO' },
            ].map(item => {
              const disp = stockCustodia[item.cod] !== undefined ? stockCustodia[item.cod] : (stockCustodia[item.label.toUpperCase()] || 0);
              const numVal = parseFloat(materiales[item.key as keyof typeof materiales] || '0') || 0;
              return (
                <View key={item.key} style={{ width: '48%', marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{item.label}</Text>
                  <TextInput
                    style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: numVal > disp && disp > 0 ? '#F87171' : '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }}
                    keyboardType="numeric"
                    value={String(materiales[item.key as keyof typeof materiales] || '')}
                    onChangeText={val => {
                      const cleaned = val.replace(/[^0-9]/g, '');
                      if (!cleaned) {
                        setMateriales((p: any) => ({ ...p, [item.key]: '' }));
                        return;
                      }
                      const inputNum = parseInt(cleaned, 10);
                      if (inputNum > 0 && inputNum > disp) {
                        Alert.alert(
                          "Acción no permitida",
                          `No posees suficiente stock de ${item.label} en tu custodia (Disponible: ${disp} und.). Solicita una carga a Almacén.`
                        );
                        setMateriales((p: any) => ({ ...p, [item.key]: '' }));
                        return;
                      }
                      setMateriales((p: any) => ({ ...p, [item.key]: cleaned }));
                    }}
                    editable={!isSaving}
                  />
                  {disp > 0 ? (
                    <Text style={{ fontSize: 9, color: numVal > disp ? '#F87171' : '#4ADE80', marginTop: 2, fontWeight: numVal > disp ? 'bold' : 'normal' }}>
                      {numVal > disp ? `⚠️ Excede tu stock (${disp} und.)` : `✓ En custodia: ${disp} und.`}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 9, color: '#8C9BAB', marginTop: 2, fontStyle: 'italic' }}>Sin stock asignado</Text>
                  )}
                </View>
              );
            })}
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
                      const dispCable = stockCustodia['MAT-CABLE-PRECONECTORIZADO'] !== undefined ? stockCustodia['MAT-CABLE-PRECONECTORIZADO'] : (stockCustodia['CABLE PRECONECTORIZADO'] || 0);
                      const cantCable = parseFloat(opcion) || 0;
                      if (cantCable > dispCable) {
                        Alert.alert(
                          "Acción no permitida",
                          `No posees suficiente stock de Cable Preconectorizado de ${opcion}m en tu custodia (Disponible: ${dispCable} und.).`
                        );
                        setMostrarDropdownCable(false);
                        return;
                      }
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
