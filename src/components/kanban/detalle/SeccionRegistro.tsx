import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Alert } from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { FaseProps } from './types';

export const renderSection = (title: string, children: React.ReactNode) => {
  return (
    <View style={{ marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#384148' }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#B6C2CF', marginBottom: 16 }}>{title}</Text>
      {children}
    </View>
  );
};

export const formatKeyName = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const SeccionRegistro = ({ tarjeta, setImagenExpandida }: FaseProps) => {
  const data = tarjeta.datos_valores || {};

  const GROUPS = [
    {
      title: '1. Información del Cliente (Identidad)',
      keys: ['nombreApellido', 'tipoDocumento', 'documentoIdentidad', 'fechaNacimiento']
    },
    {
      title: '2. Datos de Contacto',
      keys: ['telefonoMovil', 'telefonoAdicional', 'telefonoResidencial', 'correo']
    },
    {
      title: '3. Dirección y Geolocalización',
      keys: ['estado', 'ciudad', 'zona', 'sector', 'calle', 'edificio', 'piso', 'referencia', 'direccionFiscal']
    },
    {
      title: '4. Datos Comerciales (Servicio y Origen)',
      keys: ['tipoServicio', 'origen', 'vendedor', 'fechaVenta']
    },
    {
      title: '5. Paquetes y Equipos (Detalle Técnico)',
      keys: ['phInstalacion', 'phConectados', 'phGamer', 'phCinefilos', 'phFamiliar', 'ppInstalacion', 'ppEmprendedores', 'ppComercios', 'ppOficinas', 'ppNegocios']
    },
    {
      title: '6. Adicionales',
      keys: ['nroAbonado', 'equipoAdicional']
    }
  ];

  const IGNORE_KEYS = [
    'latitud', 'longitud', 'adjuntos', 'estadoLiberacion', 'motivoLiberacion', 
    'geo_nap', 'geo_casa', 'geofotos', 'lch_imagen', 'historial_auditoria', 
    'comentarios', 'gestiones'
  ];

  const renderGroups = () => {
    const processedKeys = new Set<string>();

    const getValue = (k: string) => {
      const v = data[k];
      return (v !== null && v !== undefined && v !== '') ? String(v) : '-';
    };

    const groupsUI = GROUPS.map((group, idx) => {
      let fieldsToRender = group.keys.filter(k => data.hasOwnProperty(k)).map(k => {
        processedKeys.add(k);
        return { key: formatKeyName(k), value: getValue(k), origKey: k };
      });

      // Lógica especial para Paquetes y Equipos: Solo mostrar los que tienen valor
      if (group.title.includes('Paquetes y Equipos')) {
        fieldsToRender = fieldsToRender.filter(field => field.value !== '-');
      }

      if (fieldsToRender.length === 0) return null;

      return (
        <View key={`group-${idx}`} style={{ marginBottom: 24, backgroundColor: '#1D2125', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#384148' }}>
          <Text style={{ fontSize: 13, color: '#8C9BAB', fontWeight: '900', marginBottom: 12, textTransform: 'uppercase' }}>
            {group.title}
          </Text>
          {fieldsToRender.map((field, fIdx) => (
             <View key={fIdx} style={{ flexDirection: 'column', borderBottomWidth: fIdx === fieldsToRender.length - 1 && !group.title.includes('Dirección') ? 0 : 1, borderBottomColor: '#384148', paddingBottom: 8, marginBottom: 8 }}>
               <Text style={{ fontSize: 11, color: '#8C9BAB', fontWeight: '500', marginBottom: 2 }}>{field.key.toUpperCase()}</Text>
               <Text style={{ fontSize: 15, color: '#FFF', fontWeight: 'bold' }}>{field.value}</Text>
             </View>
          ))}
          {/* Ubicación Integrada en el Grupo 3 */}
          {group.title.includes('Dirección') && data.latitud && data.longitud && (
             <View style={{ flexDirection: 'column', paddingTop: 4 }}>
               <Text style={{ fontSize: 11, color: '#8C9BAB', fontWeight: '500', marginBottom: 4 }}>UBICACIÓN GPS</Text>
               <TouchableOpacity onPress={handleOpenMap} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0C66E420', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#0C66E450' }}>
                 <MapPin size={14} color="#0C66E4" style={{ marginRight: 6 }} />
                 <Text style={{ fontSize: 13, color: '#0C66E4', fontWeight: 'bold' }}>Ver {Number(data.latitud).toFixed(6)}, {Number(data.longitud).toFixed(6)} en Mapa</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>
      );
    });

    return groupsUI;
  };

  const handleOpenMap = async () => {
    if (data.latitud && data.longitud) {
      const url = `https://www.google.com/maps/search/?api=1&query=${data.latitud},${data.longitud}`;
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede abrir la aplicación de mapas en este dispositivo.');
        }
      } catch (error) {
        Alert.alert('Error', 'Hubo un problema al intentar abrir el mapa.');
      }
    }
  };

  return renderSection("Registro de la Tarjeta", (
    <View style={{ gap: 8 }}>
      {renderGroups()}

      {data.geo_nap && data.geo_nap.lat && (
        <View style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: '#384148', paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '500', marginBottom: 2, textTransform: 'uppercase' }}>Ubicación GEO NAP</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${data.geo_nap.lat},${data.geo_nap.lng}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={14} color="#0C66E4" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: '#0C66E4', fontWeight: 'bold', textDecorationLine: 'underline' }}>Abrir Mapa NAP</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#8C9BAB' }}>{Number(data.geo_nap.lat).toFixed(6)}, {Number(data.geo_nap.lng).toFixed(6)}</Text>
          </View>
        </View>
      )}

      {data.geo_casa && data.geo_casa.lat && (
        <View style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: '#384148', paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '500', marginBottom: 2, textTransform: 'uppercase' }}>Ubicación GEO CASA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${data.geo_casa.lat},${data.geo_casa.lng}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={14} color="#0C66E4" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: '#0C66E4', fontWeight: 'bold', textDecorationLine: 'underline' }}>Abrir Mapa Casa</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#8C9BAB' }}>{Number(data.geo_casa.lat).toFixed(6)}, {Number(data.geo_casa.lng).toFixed(6)}</Text>
          </View>
        </View>
      )}

      {data.geofotos && data.geofotos.length > 0 && (
        <View style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: '#384148', paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Evidencia Fotográfica Múltiple</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {data.geofotos.map((url: string, index: number) => (
              <TouchableOpacity key={index} style={{ marginRight: 12 }} onPress={() => setImagenExpandida && setImagenExpandida(url)}>
                <ImageBackground source={{ uri: url }} style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', backgroundColor: '#384148' }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, position: 'absolute', bottom: 0, width: '100%' }}>
                    <Text style={{ color: '#FFF', fontSize: 9, textAlign: 'center', fontWeight: 'bold' }}>VER FOTO</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {data.lch_imagen && (
        <View style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: '#384148', paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase' }}>Evidencia LCH</Text>
          <TouchableOpacity onPress={() => setImagenExpandida && setImagenExpandida(data.lch_imagen)}>
            <ImageBackground source={{ uri: data.lch_imagen }} style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: '#384148' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, position: 'absolute', bottom: 0, width: '100%' }}>
                <Text style={{ color: '#FFF', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>VER LCH</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ));
};
