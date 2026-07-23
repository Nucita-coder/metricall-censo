import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { GeofotoTool } from './GeofotoTool';
import { SelectDropdown } from '../../venta/CamposVenta';

interface DropdownSelectorProps {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
  show?: boolean;
  setShow?: (s: boolean) => void;
  isSaving: boolean;
  setEvidUrl?: (v: string) => void;
}

export function DropdownSelector({
  label,
  value,
  setValue,
  options,
  isSaving,
  setEvidUrl,
}: DropdownSelectorProps) {
  return (
    <SelectDropdown
      label={label}
      value={value}
      options={options}
      disabled={isSaving}
      onSelect={(opcion: string) => {
        setValue(opcion);
        if (opcion !== 'Visita Residencia' && label === 'Tipo de Contacto' && setEvidUrl) {
          setEvidUrl('');
        }
      }}
    />
  );
}

interface EvidenciaUploadProps {
  tipo: string;
  url: string;
  setUrl: (v: string) => void;
  subiendo: boolean;
  setSubiendo: (v: boolean) => void;
  isSaving: boolean;
}

export function EvidenciaUpload({ tipo, url, setUrl, subiendo, setSubiendo, isSaving }: EvidenciaUploadProps) {
  if (!tipo) return null;

  const handleSubirEvidenciaNormal = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSubiendo(true);
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const uploadedUrl = await uploadImageToSupabase(result.assets[0].uri, 'adjuntos', 'gestion');
          if (uploadedUrl) {
            setUrl(uploadedUrl);
          }
        } else {
          const uri = result.assets[0].uri;
          const filename = uri.split('/').pop() || `evidencia_${Date.now()}.jpg`;
          const localPath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.copyAsync({ from: uri, to: localPath });
          setUrl(localPath);
        }
      } catch (e: any) {
        // error hander
      } finally {
        setSubiendo(false);
      }
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 10, color: '#A0AEC0', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
        Subir Evidencia Obligatoria
      </Text>

      {tipo === 'Visita Residencia' ? (
        <GeofotoTool onPhotoCaptured={(u) => setUrl(u)} isSaving={isSaving || subiendo} buttonText="Tomar GeoFoto de Visita" />
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: '#3182CE',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          onPress={handleSubirEvidenciaNormal}
          disabled={isSaving || subiendo}
        >
          {subiendo ? <ActivityIndicator color="#FFF" size="small" /> : <ImageIcon size={16} color="#FFF" style={{ marginRight: 8 }} />}
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Seleccionar Imagen del Chat/Llamada</Text>
        </TouchableOpacity>
      )}

      {url ? (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <Image source={{ uri: url }} style={{ width: 100, height: 100, borderRadius: 8 }} />
          <Text style={{ fontSize: 10, color: '#38A169', marginTop: 4, fontWeight: 'bold' }}>Evidencia Cargada</Text>
        </View>
      ) : (
        <Text style={{ color: '#E53E3E', fontSize: 10, textAlign: 'center' }}>* La evidencia es requerida para continuar</Text>
      )}
    </View>
  );
}
