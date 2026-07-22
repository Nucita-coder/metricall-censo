import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ImageBackground, Alert, Platform } from 'react-native';
import { Image as ImageIcon, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';

export const FaseFactibilidad = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const { showDiagnosticError } = useErrorDiagnostics();

  const [lchNumero, setLchNumero] = useState(data.lch_numero || '');
  const [lchImagen, setLchImagen] = useState<string | null>(data.lch_imagen || null);
  const [subiendoLch, setSubiendoLch] = useState(false);
  const [errorFactibilidad, setErrorFactibilidad] = useState<string | null>(null);

  const lchIncompleto = !lchNumero || lchNumero.trim() === '' || !lchImagen;

  return (
    <View>
      {/* LCH FORM IN FACTIBILIDAD */}
      {renderSection("Evidencia LCH", (
        <View style={{ marginBottom: 20, backgroundColor: '#2C333A', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: lchIncompleto && errorFactibilidad ? '#E53E3E' : '#384148' }}>
          <Text style={{ fontSize: 14, color: '#B6C2CF', fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' }}>Ingresar LCH</Text>

          <TextInput
            style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: (!lchNumero || lchNumero.trim() === '') && errorFactibilidad ? '#E53E3E' : '#384148', borderRadius: 8, padding: 12, color: '#B6C2CF', marginBottom: 12 }}
            placeholder="Ingresar Nro LCH *"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
            value={lchNumero}
            onChangeText={(val) => { setLchNumero(val); setErrorFactibilidad(null); }}
            editable={!isSaving && !subiendoLch}
          />

          <TouchableOpacity
            style={{ backgroundColor: '#1D2125', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: lchImagen ? 12 : 0, borderWidth: 1, borderColor: !lchImagen && errorFactibilidad ? '#E53E3E' : '#384148' }}
            onPress={async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                if (Platform.OS === 'web') window.alert('Se requiere acceso a la galería.');
                else Alert.alert('Permiso', 'Se requiere acceso a la galería.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                setSubiendoLch(true);
                try {
                  const asset = result.assets[0];
                  const url = await uploadImageToSupabase(asset.uri, 'evidencias', 'lch');
                  if (url) {
                    setLchImagen(url);
                    setErrorFactibilidad(null);
                  }
                } catch (e: any) {
                  if (Platform.OS === 'web') window.alert('Error: ' + e.message);
                  else Alert.alert('Error', e.message);
                } finally {
                  setSubiendoLch(false);
                }
              }
            }}
            disabled={isSaving || subiendoLch}
          >
            <ImageIcon size={18} color="#B6C2CF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>{lchImagen ? 'Cambiar Foto de LCH' : 'Adjuntar Foto de LCH *'}</Text>
          </TouchableOpacity>

          {lchImagen && (
            <View style={{ height: 150, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
              <ImageBackground source={{ uri: lchImagen }} style={{ flex: 1 }} resizeMode="cover" />
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 }}
            onPress={async () => {
              setIsSaving(true);
              await onUpdateTarjeta({ lch_numero: lchNumero, lch_imagen: lchImagen });
              if (Platform.OS === 'web') window.alert("LCH guardado correctamente.");
              else Alert.alert("Éxito", "LCH guardado correctamente.");
              setIsSaving(false);
            }}
            disabled={isSaving || subiendoLch}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar LCH</Text>}
          </TouchableOpacity>
        </View>
      ))}

      {/* CONTROL DE CALIDAD IN FACTIBILIDAD */}
      {renderSection("Control de Calidad", (
        <View>
          {lchIncompleto && (
            <View style={{ backgroundColor: '#3A301A', borderWidth: 1, borderColor: '#D69E2E', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <AlertCircle size={20} color="#ECC94B" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ECC94B', fontSize: 12, flex: 1, fontWeight: '600' }}>
                Requisito obligatorio: Debes ingresar el Nro de LCH y adjuntar su imagen antes de poder aprobar y pasar la tarjeta a "Por Instalar".
              </Text>
            </View>
          )}

          {errorFactibilidad && (
            <View style={{ backgroundColor: '#4A1515', borderWidth: 1, borderColor: '#F56565', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <AlertCircle size={20} color="#F56565" style={{ marginRight: 10 }} />
              <Text style={{ color: '#F56565', fontSize: 12, flex: 1, fontWeight: 'bold' }}>
                {errorFactibilidad}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            <TouchableOpacity
              style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: lchIncompleto ? '#2F5C3E' : '#48BB78', backgroundColor: '#1C3A27', alignItems: 'center', opacity: lchIncompleto ? 0.7 : 1 }}
              onPress={async () => {
                if (lchIncompleto) {
                  const msg = 'Es obligatorio ingresar el Nro de LCH y adjuntar su imagen antes de aprobar y pasar a instalar.';
                  setErrorFactibilidad(msg);
                  showDiagnosticError(
                    'ERR-FACTIBILIDAD-INCOMPLETO',
                    'Datos de LCH incompletos.',
                    'Falta Nro LCH o foto de LCH en la tarjeta. Ambos son requeridos para la transicion a Por Instalar.',
                    'Factibilidad'
                  );
                  return;
                }
                setIsSaving(true);
                try {
                  await onUpdateTarjeta({ controlCalidad: 'Aprobado', lch_numero: lchNumero, lch_imagen: lchImagen });
                  const destId = findListaTarget(listasGlobales, 'por_instalar')?.id;
                  if (!destId) throw new Error("Lista destino 'Por Instalar' no encontrada");
                  await autoMoverTarjeta(tarjeta, destId);
                } catch (e: any) {
                  setErrorFactibilidad(e.message);
                  showDiagnosticError('ERR-FACTIBILIDAD-APROBAR', 'No se pudo aprobar ni mover la tarjeta a Por Instalar.', e, 'Factibilidad');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#48BB78" /> : <Text style={{ fontWeight: 'bold', color: '#48BB78' }}>Aprobado (Pasar a Instalar)</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#F56565', backgroundColor: '#4A1515', alignItems: 'center' }}
              onPress={async () => {
                setIsSaving(true);
                try {
                  await onUpdateTarjeta({ controlCalidad: 'Rechazado' });
                  const destId = findListaTarget(listasGlobales, 'venta')?.id;
                  if (!destId) throw new Error("Lista destino 'Venta' no encontrada");
                  await autoMoverTarjeta(tarjeta, destId);
                } catch (e: any) {
                  setErrorFactibilidad(e.message);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#F56565" /> : <Text style={{ fontWeight: 'bold', color: '#F56565' }}>Rechazado (Devolver a Venta)</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};
