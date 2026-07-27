import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, Platform } from 'react-native';
import { Plus, Trash2, Paperclip, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { InputTexto, DatePickerInput, SelectDropdown } from './venta/CamposVenta';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadImageToSupabase } from '../services/uploadImage';

export interface MaterialRowItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  serialMaterial: string;
  cantidadRecibida: string;
}

interface StockInfo {
  stockExistente: number | null;
  esNuevoCodigo: boolean | null;
  isSearching: boolean;
}

interface FormularioReciboMaterialProps {
  formData: any;
  handleChange?: (campo: string, valor: any) => void;
  readOnly?: boolean;
}

export default function FormularioReciboMaterial({
  formData,
  handleChange,
  readOnly = false,
}: FormularioReciboMaterialProps) {
  const { empresaId } = useAuth();
  const [stockInfoMap, setStockInfoMap] = useState<Record<number, StockInfo>>({});
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const adjuntos: string[] = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];

  const getItems = (): MaterialRowItem[] => {
    if (Array.isArray(formData.items) && formData.items.length > 0) return formData.items;
    return [{
      codigoMaterial: formData.codigoMaterial || '',
      nombreMaterial: formData.nombreMaterial || '',
      modeloMaterial: formData.modeloMaterial || '',
      serialMaterial: formData.serialMaterial || '',
      cantidadRecibida: formData.cantidadRecibida ? String(formData.cantidadRecibida) : '',
    }];
  };

  const items = getItems();

  const updateRootAndItems = (newItems: MaterialRowItem[]) => {
    if (readOnly || !handleChange) return;
    handleChange('items', newItems);
    if (newItems.length > 0) {
      const first = newItems[0];
      handleChange('codigoMaterial', first.codigoMaterial);
      handleChange('nombreMaterial', first.nombreMaterial);
      handleChange('modeloMaterial', first.modeloMaterial);
      handleChange('serialMaterial', first.serialMaterial);
      handleChange('cantidadRecibida', first.cantidadRecibida);
    }
  };

  const updateHeaderField = (key: string, val: any) => {
    if (readOnly || !handleChange) return;
    const upperVal = typeof val === 'string' ? val.toUpperCase() : val;
    handleChange(key, upperVal);
  };

  const updateItemField = (index: number, field: keyof MaterialRowItem, val: any) => {
    if (readOnly || !handleChange) return;
    const upperVal = typeof val === 'string' ? val.toUpperCase() : val;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: upperVal };
    updateRootAndItems(newItems);
  };

  const handleAddItem = () => {
    if (readOnly) return;
    updateRootAndItems([...items, { codigoMaterial: '', nombreMaterial: '', modeloMaterial: '', serialMaterial: '', cantidadRecibida: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (readOnly || items.length <= 1) return;
    updateRootAndItems(items.filter((_, i) => i !== index));
  };

  const handleCodigoChangeForItem = async (index: number, codigo: string) => {
    const upperCodigo = codigo ? codigo.toUpperCase() : '';
    updateItemField(index, 'codigoMaterial', upperCodigo);
    const cleanCodigo = upperCodigo.trim();

    if (!cleanCodigo || cleanCodigo.length < 2 || !empresaId || readOnly) {
      setStockInfoMap((prev) => ({ ...prev, [index]: { stockExistente: null, esNuevoCodigo: null, isSearching: false } }));
      return;
    }

    setStockInfoMap((prev) => ({ ...prev, [index]: { ...(prev[index] || { stockExistente: null, esNuevoCodigo: null }), isSearching: true } }));

    try {
      const { data, error } = await supabase.from('tarjetas').select('datos_valores').eq('empresa_id', empresaId);
      if (error) throw error;

      let totalStock = 0;
      let primerNombre = '';
      let primerModelo = '';
      let encontrado = false;

      if (data) {
        data.forEach((row: any) => {
          const val = row.datos_valores || {};
          const rowItems = Array.isArray(val.items) ? val.items : [val];
          rowItems.forEach((subItem: any) => {
            const subCod = (subItem.codigoMaterial || '').trim().toUpperCase();
            if (subCod === cleanCodigo) {
              encontrado = true;
              const cant = parseFloat(subItem.cantidadRecibida || '0');
              if (!isNaN(cant)) totalStock += cant;
              if (!primerNombre && subItem.nombreMaterial) primerNombre = subItem.nombreMaterial;
              if (!primerModelo && subItem.modeloMaterial) primerModelo = subItem.modeloMaterial;
            }
          });
        });
      }

      setStockInfoMap((prev) => ({ ...prev, [index]: { stockExistente: encontrado ? totalStock : 0, esNuevoCodigo: !encontrado, isSearching: false } }));

      if (encontrado && handleChange) {
        const cur = getItems()[index];
        if (cur) {
          if (primerNombre && !cur.nombreMaterial) updateItemField(index, 'nombreMaterial', primerNombre);
          if (primerModelo && !cur.modeloMaterial) updateItemField(index, 'modeloMaterial', primerModelo);
        }
      }
    } catch (e) {
      setStockInfoMap((prev) => ({ ...prev, [index]: { ...(prev[index] || { stockExistente: null, esNuevoCodigo: null }), isSearching: false } }));
    }
  };

  const handleAdjuntarFotoFactura = async () => {
    if (readOnly || !handleChange) return;

    if (Platform.OS === 'web') {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (!res.canceled && res.assets && res.assets[0]) {
          processUpload(res.assets[0].uri);
        }
      } catch (e: any) {
        Alert.alert('Error', 'No se pudo seleccionar el archivo: ' + e.message);
      }
      return;
    }

    Alert.alert('Adjuntar Evidencia / Factura', '¿Desde dónde deseas adjuntar la evidencia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara.');
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!res.canceled && res.assets && res.assets[0]) processUpload(res.assets[0].uri);
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se requiere acceso a la galería.');
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!res.canceled && res.assets && res.assets[0]) processUpload(res.assets[0].uri);
        },
      },
    ]);
  };

  const processUpload = async (uri: string) => {
    try {
      setSubiendoImagen(true);
      const url = await uploadImageToSupabase(uri, 'adjuntos', 'facturas_materiales');
      if (url && handleChange) {
        handleChange('adjuntos', [...adjuntos, url]);
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo subir el archivo: ' + e.message);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleRemoveAdjunto = (index: number) => {
    if (readOnly || !handleChange) return;
    handleChange('adjuntos', adjuntos.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. GUÍA Y ORDEN DE ENTREGA */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>1. GUÍA Y ORDEN DE ENTREGA</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <InputTexto label="Número Orden de Entrega" value={formData.nroOrdenEntrega} onChangeText={(v) => updateHeaderField('nroOrdenEntrega', v)} placeholder="Ej. ORD-2026-001" isRequired readOnly={readOnly} />
          </View>
          <View style={styles.flex1}>
            <DatePickerInput label="Fecha de Recibido" value={formData.fechaRecibido} onDateChange={(v) => updateHeaderField('fechaRecibido', v)} placeholder="Seleccionar fecha" isRequired disabled={readOnly} />
          </View>
        </View>
      </View>

      {/* 2. INSUMOS RECIBIDOS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>2. MATERIALES RECIBIDOS ({items.length})</Text>
        {items.map((item, idx) => {
          const info = stockInfoMap[idx];
          return (
            <View key={idx} style={styles.itemBox}>
              <View style={styles.itemBoxHeader}>
                <Text style={styles.itemBoxTitle}>ÍTEM #{idx + 1}</Text>
                {!readOnly && items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(idx)} style={styles.removeBtn}>
                    <Trash2 size={16} color="#F87171" /><Text style={styles.removeBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <InputTexto label="Código Material" value={item.codigoMaterial} onChangeText={(v) => handleCodigoChangeForItem(idx, v)} placeholder="Ej. MAT-0982" isRequired readOnly={readOnly} />
              {info?.isSearching && <Text style={styles.helperText}>Buscando stock e información...</Text>}
              {!info?.isSearching && info?.esNuevoCodigo === false && info?.stockExistente !== null && (
                <View style={styles.stockBadgeExistente}>
                  <Text style={styles.stockBadgeText}>✓ Material en inventario. Stock acumulado previo: <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{info.stockExistente} und.</Text></Text>
                </View>
              )}
              {!info?.isSearching && info?.esNuevoCodigo === true && (
                <View style={styles.stockBadgeNuevo}>
                  <Text style={styles.stockBadgeTextNuevo}>+ Código nuevo. Se registrará este nuevo material.</Text>
                </View>
              )}
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <InputTexto label="Cantidad Recibida" value={item.cantidadRecibida} onChangeText={(v) => updateItemField(idx, 'cantidadRecibida', v)} placeholder="Ej. 50" keyboardType="numeric" isRequired readOnly={readOnly} />
                </View>
                <View style={styles.flex1}>
                  <InputTexto label="Modelo Material" value={item.modeloMaterial} onChangeText={(v) => updateItemField(idx, 'modeloMaterial', v)} placeholder="Ej. G657A2" readOnly={readOnly} />
                </View>
              </View>
              <InputTexto label="Nombre de Material" value={item.nombreMaterial} onChangeText={(v) => updateItemField(idx, 'nombreMaterial', v)} placeholder="Ej. Cable Fibra Óptica Drop 2 Hilos" isRequired readOnly={readOnly} />
              <InputTexto label="Serial Material (Opcional)" value={item.serialMaterial} onChangeText={(v) => updateItemField(idx, 'serialMaterial', v)} placeholder="Ej. SN-8839201" readOnly={readOnly} />
            </View>
          );
        })}
        {!readOnly && (
          <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
            <Plus size={18} color="#579DFF" /><Text style={styles.addItemBtnText}>Añadir otro material a esta orden</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. ADJUNTOS Y EVIDENCIAS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. FACTURAS Y EVIDENCIAS ({adjuntos.length})</Text>
        {!readOnly && (
          <TouchableOpacity style={styles.attachBtn} onPress={handleAdjuntarFotoFactura} disabled={subiendoImagen}>
            {subiendoImagen ? <ActivityIndicator color="#579DFF" size="small" /> : <Paperclip size={18} color="#579DFF" />}
            <Text style={styles.attachBtnText}>{subiendoImagen ? 'Comprimiendo y subiendo...' : '+ Adjuntar Factura / Foto de Evidencia'}</Text>
          </TouchableOpacity>
        )}
        {adjuntos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adjGrid}>
            {adjuntos.map((url, idx) => (
              <View key={idx} style={styles.thumbContainer}>
                <ImageBackground source={{ uri: url }} style={styles.thumbImg} />
                {!readOnly && (
                  <TouchableOpacity style={styles.delThumbBtn} onPress={() => handleRemoveAdjunto(idx)}>
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 4. RESPONSABLES Y MOTIVO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>4. RESPONSABLES Y MOTIVO</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <InputTexto label="Recibido por" value={formData.recibidoPor} onChangeText={(v) => updateHeaderField('recibidoPor', v)} placeholder="Ej. Juan Pérez (Almacén)" isRequired readOnly={readOnly} />
          </View>
          <View style={styles.flex1}>
            <InputTexto label="Entregado por" value={formData.entregadoPor} onChangeText={(v) => updateHeaderField('entregadoPor', v)} placeholder="Ej. Transporte Casa Matriz" isRequired readOnly={readOnly} />
          </View>
        </View>
        <SelectDropdown label="Motivo de Asignación" value={formData.motivoAsignacion} onSelect={(v) => updateHeaderField('motivoAsignacion', v)} options={['Instalaciones', 'Construcción', 'Verticales', 'Fallas FTTH', 'Fallas FTTX', 'Otras']} placeholder="Seleccionar motivo..." isRequired disabled={readOnly} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 10 },
  sectionCard: { backgroundColor: '#22272B', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#384148' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#0C66E4', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemBox: { backgroundColor: '#1D2125', borderRadius: 8, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#384148' },
  itemBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#2C333A' },
  itemBoxTitle: { fontSize: 12, fontWeight: 'bold', color: '#579DFF' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeBtnText: { fontSize: 11, color: '#F87171', fontWeight: '600' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(12, 102, 228, 0.15)', borderWidth: 1, borderColor: '#0C66E4', paddingVertical: 11, borderRadius: 8, marginTop: 4 },
  addItemBtnText: { color: '#579DFF', fontSize: 13, fontWeight: 'bold' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', paddingVertical: 10, borderRadius: 8, marginBottom: 10 },
  attachBtnText: { color: '#579DFF', fontSize: 12, fontWeight: '600' },
  adjGrid: { flexDirection: 'row', marginTop: 6 },
  thumbContainer: { marginRight: 10, position: 'relative' },
  thumbImg: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#1D2125', overflow: 'hidden' },
  delThumbBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  helperText: { fontSize: 11, color: '#579DFF', marginTop: -6, marginBottom: 8, fontStyle: 'italic' },
  stockBadgeExistente: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: '#22C55E', borderRadius: 6, padding: 8, marginTop: 2, marginBottom: 10 },
  stockBadgeText: { fontSize: 11, color: '#4ADE80' },
  stockBadgeNuevo: { backgroundColor: 'rgba(12, 102, 228, 0.15)', borderWidth: 1, borderColor: '#0C66E4', borderRadius: 6, padding: 8, marginTop: 2, marginBottom: 10 },
  stockBadgeTextNuevo: { fontSize: 11, color: '#579DFF', fontWeight: '600' },
});
