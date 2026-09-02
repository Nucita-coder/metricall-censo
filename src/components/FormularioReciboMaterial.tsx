import * as ImagePicker from 'expo-image-picker';
import { Paperclip, Plus, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../services/uploadImage';
import { DatePickerInput, InputTexto, SelectDropdown } from './venta/CamposVenta';
import { Tarjeta, TarjetaDatosValores, TarjetaMaterialItem } from '../types/kanban';

export interface MaterialRowItem { codigoMaterial: string; nombreMaterial: string; modeloMaterial: string; serialMaterial: string; cantidadRecibida: string; }

export const INSUMOS_PRECARGADOS: Array<{ nombre: string; codigo: string; modelo: string }> = [
  { nombre: 'TENSOR PLÁSTICO', codigo: 'MAT-TENSOR-PLASTICO', modelo: 'GENERAL' },
  { nombre: 'TENSOR HIERRO', codigo: 'MAT-TENSOR-HIERRO', modelo: 'GENERAL' },
  { nombre: 'GRAPAS', codigo: 'MAT-GRAPAS', modelo: 'GENERAL' },
  { nombre: 'TIRRAP', codigo: 'MAT-TIRRAP', modelo: 'GENERAL' },
  { nombre: 'PACH CORD APC', codigo: 'MAT-PACH-APC', modelo: 'APC' },
  { nombre: 'PACH CORD UPC', codigo: 'MAT-PACH-UPC', modelo: 'UPC' },
  { nombre: 'PACH CORD APC/UPC', codigo: 'MAT-PACH-APC-UPC', modelo: 'APC/UPC' },
  { nombre: 'CAJA TERM. CON ACCESORIOS', codigo: 'MAT-CAJA-TERM-CON', modelo: 'CON ACCESORIOS' },
  { nombre: 'CAJA TERM. SIN ACCESORIOS', codigo: 'MAT-CAJA-TERM-SIN', modelo: 'SIN ACCESORIOS' },
  { nombre: 'CONECTOR/ACOPLE H-H', codigo: 'MAT-CONECTOR-ACOPLE-HH', modelo: 'H-H' },
  { nombre: 'CONECTOR MECÁNICO APC', codigo: 'MAT-CONECTOR-MEC-APC', modelo: 'APC' },
  { nombre: 'CONECTOR MECÁNICO UPC', codigo: 'MAT-CONECTOR-MEC-UPC', modelo: 'UPC' },
  { nombre: 'PRECINTO', codigo: 'MAT-PRECINTO', modelo: 'GENERAL' },
  { nombre: 'CABLE PRECONECTORIZADO', codigo: 'MAT-CABLE-PRECONECTORIZADO', modelo: 'PRECONECTORIZADO' },
  { nombre: 'CABLE DROP', codigo: 'MAT-CABLE-DROP', modelo: 'DROP' },
];

interface StockInfo { stockExistente: number | null; esNuevoCodigo: boolean | null; isSearching: boolean; }
interface FormularioReciboMaterialProps { formData: TarjetaDatosValores; handleChange?: (campo: string, valor: unknown) => void; readOnly?: boolean; }

export default function FormularioReciboMaterial({ formData, handleChange, readOnly = false }: FormularioReciboMaterialProps) {
  const { empresaId, nombreCompleto } = useAuth();
  const [stockInfoMap, setStockInfoMap] = useState<Record<number, StockInfo>>({});
  const [modalPrecargadosIndex, setModalPrecargadosIndex] = useState<number | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [miembrosList, setMiembrosList] = useState<string[]>([]);
  const [stockDisponibles, setStockDisponibles] = useState<Array<{ codigo: string; nombre: string; modelo: string; stock: number }>>([]);
  const [stockCustodiaMiembro, setStockCustodiaMiembro] = useState<Array<{ codigo: string; nombre: string; modelo: string; stock: number }>>([]);
  const tipoUpper = (formData.tipoCarga || '').toUpperCase();
  const isDevolucionCentralMode = tipoUpper.includes('ALMACÉN CENTRAL') || tipoUpper.includes('ALMACEN CENTRAL');
  const isDevolucionAsignacionMode = (tipoUpper.includes('DEVOLUCION') || tipoUpper.includes('DEVOLUCIÓN')) && !isDevolucionCentralMode;
  const isDevolucionMode = isDevolucionCentralMode || isDevolucionAsignacionMode;
  const isAsignadoMode = !isDevolucionMode && (tipoUpper.includes('ASIGNA') || Boolean(formData.asignadoA && formData.asignadoA.trim()));

  useEffect(() => {
    if (isDevolucionMode && handleChange) {
      if (!formData.fechaRecibido) handleChange('fechaRecibido', new Date().toISOString().split('T')[0]);
      if (nombreCompleto) {
        if (isDevolucionAsignacionMode && formData.asignadoA !== nombreCompleto) handleChange('asignadoA', nombreCompleto);
        if (formData.entregadoPor !== nombreCompleto) handleChange('entregadoPor', nombreCompleto);
      }
    }
  }, [isDevolucionMode, isDevolucionAsignacionMode, nombreCompleto]);

  useEffect(() => {
    if (!empresaId) return;
    supabase.from('perfiles').select('nombre_completo').eq('empresa_id', empresaId).then(({ data }) => {
      if (data) setMiembrosList((data as Array<{ nombre_completo: string }>).map((m) => m.nombre_completo).filter(Boolean));
    });
    supabase.from('tarjetas').select('datos_valores').eq('empresa_id', empresaId).then(({ data }) => {
      if (!data) return;
      const mapa: Record<string, { codigo: string; nombre: string; modelo: string; stock: number }> = {};
      (data as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const isDevolucionAsig = tipo.includes('DEVOLUCIÓN DE ASIGNACIÓN') || tipo.includes('DEVOLUCION DE ASIGNACION');
        const isDevolucionAlmacen = tipo.includes('ALMACÉN CENTRAL') || tipo.includes('ALMACEN CENTRAL');
        const isAsignado = !isDevolucionAsig && !isDevolucionAlmacen && (tipo.includes('ASIGNA') || Boolean(v.asignadoA && v.asignadoA.toString().trim()));

        const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
        (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
          const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
          if (!cod) return;
          const cant = parseFloat(String(subItem.cantidadRecibida || '0')) || 0;
          if (!mapa[cod]) mapa[cod] = { codigo: cod, nombre: (subItem.nombreMaterial || '').toUpperCase(), modelo: (subItem.modeloMaterial || '').toUpperCase(), stock: 0 };

          if (isAsignado) {
            mapa[cod].stock -= cant;
          } else if (isDevolucionAsig) {
            mapa[cod].stock += cant;
          } else if (isDevolucionAlmacen) {
            mapa[cod].stock -= cant;
          } else {
            mapa[cod].stock += cant;
          }
        });
      });
      setStockDisponibles(Object.values(mapa).filter(m => m.stock > 0));
    });
  }, [empresaId]);

  useEffect(() => {
    if (empresaId && isDevolucionMode) {
      const targetMiembro = (formData.asignadoA || nombreCompleto || '').trim().toUpperCase();
      supabase.from('tarjetas').select('datos_valores').eq('empresa_id', empresaId).then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, { codigo: string; nombre: string; modelo: string; stock: number }> = {};
        (data as unknown as Tarjeta[]).forEach((row) => {
          const v = row.datos_valores || {};
          const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
          const miembro = (v.asignadoA || (v.recibidoPor as string) || '').toString().trim().toUpperCase();

          const matchMiembro = targetMiembro === '' || miembro === targetMiembro || (targetMiembro && miembro && (miembro.includes(targetMiembro) || targetMiembro.includes(miembro)));
          if (!matchMiembro) return;

          const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
          const isAsignado = !isDevolucion && (tipo.includes('ASIGNA') || Boolean(v.asignadoA && v.asignadoA.toString().trim()));

          if (!isAsignado && !isDevolucion) return;

          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            if (!cod) return;
            const cant = parseFloat(subItem.cantidadRecibida as string || '0') || 0;
            if (!mapa[cod]) mapa[cod] = { codigo: cod, nombre: (subItem.nombreMaterial || '').toUpperCase(), modelo: (subItem.modeloMaterial || '').toUpperCase(), stock: 0 };

            if (isAsignado) {
              mapa[cod].stock += cant;
            } else if (isDevolucion) {
              mapa[cod].stock -= cant;
            }
          });
        });
        setStockCustodiaMiembro(Object.values(mapa).filter(m => m.stock > 0));
      });
    }
  }, [empresaId, isDevolucionMode, formData.asignadoA, nombreCompleto]);

  const adjuntos: string[] = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];

  const getItems = (): MaterialRowItem[] => {
    if (Array.isArray(formData.items) && formData.items.length > 0) {
      return formData.items.map(item => ({
        codigoMaterial: item.codigoMaterial || '',
        nombreMaterial: item.nombreMaterial || '',
        modeloMaterial: item.modeloMaterial || '',
        serialMaterial: item.serialMaterial || '',
        cantidadRecibida: item.cantidadRecibida ? String(item.cantidadRecibida) : '',
      }));
    }
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

  const updateHeaderField = (key: string, val: unknown) => {
    if (readOnly || !handleChange) return;
    handleChange(key, typeof val === 'string' ? val.toUpperCase() : val);
  };

  const updateItemField = (index: number, field: keyof MaterialRowItem, val: unknown) => {
    if (readOnly || !handleChange) return;
    const upperVal = typeof val === 'string' ? val.toUpperCase() : String(val ?? '');
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: upperVal };
    updateRootAndItems(newItems);
  };

  const updateMultipleItemFields = (index: number, fields: Partial<MaterialRowItem>) => {
    if (readOnly || !handleChange) return;
    const newItems = [...items];
    const updated: MaterialRowItem = { ...(newItems[index] || { codigoMaterial: '', nombreMaterial: '', modeloMaterial: '', serialMaterial: '', cantidadRecibida: '' }) };
    Object.keys(fields).forEach((key) => {
      const k = key as keyof MaterialRowItem;
      const val = fields[k];
      if (val !== undefined) {
        updated[k] = typeof val === 'string' ? val.toUpperCase() : String(val);
      }
    });
    newItems[index] = updated;
    updateRootAndItems(newItems);
  };

  const handleAddItem = () => { if (!readOnly) updateRootAndItems([...items, { codigoMaterial: '', nombreMaterial: '', modeloMaterial: '', serialMaterial: '', cantidadRecibida: '' }]); };
  const handleRemoveItem = (index: number) => { if (!readOnly && items.length > 1) updateRootAndItems(items.filter((_, i) => i !== index)); };

  const checkStockForCodigo = async (index: number, codigo: string) => {
    const cleanCodigo = (codigo || '').trim().toUpperCase();
    if (!cleanCodigo || cleanCodigo.length < 2 || !empresaId || readOnly) {
      setStockInfoMap((prev) => ({ ...prev, [index]: { stockExistente: null, esNuevoCodigo: null, isSearching: false } }));
      return;
    }
    setStockInfoMap((prev) => ({ ...prev, [index]: { ...(prev[index] || { stockExistente: null, esNuevoCodigo: null }), isSearching: true } }));
    try {
      const { data, error } = await supabase.from('tarjetas').select('datos_valores').eq('empresa_id', empresaId);
      if (error) throw error;
      let totalStock = 0, primerNombre = '', primerModelo = '', encontrado = false;
      if (data) {
        (data as unknown as Tarjeta[]).forEach((row) => {
          const val = row.datos_valores || {};
          const rowItems = Array.isArray(val.items) ? val.items : [val];
          (rowItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            if ((subItem.codigoMaterial || '').trim().toUpperCase() === cleanCodigo) {
              encontrado = true;
              const cant = parseFloat(subItem.cantidadRecibida as string || '0');
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

  const handleCodigoChangeForItem = (index: number, codigo: string) => {
    const upperCodigo = codigo ? codigo.toUpperCase() : '';
    updateItemField(index, 'codigoMaterial', upperCodigo);
    checkStockForCodigo(index, upperCodigo);
  };

  const handleAdjuntarFotoFactura = async () => {
    if (readOnly || !handleChange) return;
    if (Platform.OS === 'web') {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (!res.canceled && res.assets && res.assets[0]) processUpload(res.assets[0].uri);
      } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
      return;
    }
    Alert.alert('Adjuntar Evidencia', '¿Desde dónde deseas adjuntar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: async () => { const { status } = await ImagePicker.requestCameraPermissionsAsync(); if (status === 'granted') { const res = await ImagePicker.launchCameraAsync({ quality: 0.7 }); if (!res.canceled && res.assets?.[0]) processUpload(res.assets[0].uri); } } },
      { text: 'Galería', onPress: async () => { const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (status === 'granted') { const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 }); if (!res.canceled && res.assets?.[0]) processUpload(res.assets[0].uri); } } },
    ]);
  };

  const processUpload = async (uri: string) => {
    setSubiendoImagen(true);
    try {
      const publicUrl = await uploadImageToSupabase(uri, 'facturas');
      const cur = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];
      handleChange?.('adjuntos', [...cur, publicUrl]);
    } catch (e: unknown) { Alert.alert('Error', (e as Error).message); } finally { setSubiendoImagen(false); }
  };

  const handleRemoveAdjunto = (index: number) => {
    if (readOnly || !handleChange) return;
    const cur = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];
    handleChange('adjuntos', cur.filter((_, i: number) => i !== index));
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
        {!isDevolucionMode ? (
          <SelectDropdown
            label="Tipo de Carga"
            value={formData.tipoCarga}
            onSelect={(v) => updateHeaderField('tipoCarga', v)}
            options={['Material Recibido', 'Material Asignado', 'Recuperados']}
            placeholder="Seleccionar tipo de carga..."
            isRequired
            disabled={readOnly}
          />
        ) : (
          <InputTexto label="Tipo de Carga" value={isDevolucionCentralMode ? "DEVOLUCIÓN A ALMACÉN CENTRAL" : "DEVOLUCIÓN DE ASIGNACIÓN"} isRequired readOnly />
        )}
        {isAsignadoMode && (
          <SelectDropdown label="Personal / Miembro Asignado" value={formData.asignadoA} onSelect={(v) => { updateHeaderField('asignadoA', v); updateHeaderField('recibidoPor', v); }} options={miembrosList.length > 0 ? miembrosList : ['No hay miembros registrados']} placeholder="Seleccionar miembro a asignar..." isRequired disabled={readOnly} />
        )}
        {isDevolucionAsignacionMode && (
          <InputTexto label="Personal / Miembro que Devuelve" value={formData.asignadoA || nombreCompleto} isRequired readOnly />
        )}
        {isDevolucionCentralMode && (
          <InputTexto label="Sede / Almacén Central de Destino" value={formData.asignadoA || 'Almacén Central (Sede Matriz)'} onChangeText={(v) => updateHeaderField('asignadoA', v)} isRequired readOnly={readOnly} />
        )}
      </View>

      {/* 2. INSUMOS / MATERIALES */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {isDevolucionCentralMode
            ? '2. MATERIALES A DEVOLVER A ALMACÉN CENTRAL'
            : isDevolucionAsignacionMode
              ? '2. MATERIALES EN CUSTODIA A DEVOLVER'
              : isAsignadoMode
                ? '2. MATERIALES A ASIGNAR (DESDE ALMACÉN)'
                : '2. MATERIALES RECIBIDOS'} ({items.length})
        </Text>
        {(isAsignadoMode || isDevolucionCentralMode) && !readOnly && stockDisponibles.length === 0 && (
          <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#F87171' }}>⚠️ Sin Stock Disponible en Almacén</Text>
            <Text style={{ fontSize: 12, color: '#D1D5DB', marginTop: 4 }}>No hay materiales en el almacén local para procesar esta operación.</Text>
          </View>
        )}
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
              {(isAsignadoMode || isDevolucionCentralMode) && !readOnly && (
                <SelectDropdown
                  label={isDevolucionCentralMode ? "Seleccionar Material de Almacén a Devolver" : "Seleccionar Material de Almacén"}
                  value={item.codigoMaterial ? `${item.codigoMaterial} - ${item.nombreMaterial}` : ''}
                  onSelect={(sel: string) => {
                    const found = stockDisponibles.find(s => sel.startsWith(s.codigo));
                    if (found) {
                      updateMultipleItemFields(idx, { codigoMaterial: found.codigo, nombreMaterial: found.nombre, modeloMaterial: found.modelo });
                      setStockInfoMap(prev => ({ ...prev, [idx]: { stockExistente: found.stock, esNuevoCodigo: false, isSearching: false } }));
                    }
                  }}
                  options={stockDisponibles.map(s => `${s.codigo} - ${s.nombre} (Stock: ${s.stock} und.)`)}
                  placeholder={stockDisponibles.length > 0 ? "Buscar / Seleccionar material..." : "No hay stock disponible en almacén"}
                  isRequired
                  disabled={stockDisponibles.length === 0}
                />
              )}
              {isDevolucionAsignacionMode && !readOnly && (
                <SelectDropdown label="Seleccionar Material en Custodia a Devolver" value={item.codigoMaterial ? `${item.codigoMaterial} - ${item.nombreMaterial}` : ''} onSelect={(sel: string) => { const found = stockCustodiaMiembro.find(s => sel.startsWith(s.codigo)); if (found) { updateMultipleItemFields(idx, { codigoMaterial: found.codigo, nombreMaterial: found.nombre, modeloMaterial: found.modelo }); setStockInfoMap(prev => ({ ...prev, [idx]: { stockExistente: found.stock, esNuevoCodigo: false, isSearching: false } })); } }} options={stockCustodiaMiembro.map(s => `${s.codigo} - ${s.nombre} (${s.stock} und. en custodia)`)} placeholder={stockCustodiaMiembro.length > 0 ? "Seleccionar material en tu poder..." : "No posees materiales en custodia"} isRequired />
              )}
              <InputTexto label="Código Material" value={item.codigoMaterial} onChangeText={(v) => handleCodigoChangeForItem(idx, v)} placeholder="Ej. MAT-0982" isRequired readOnly={readOnly || isDevolucionMode || isAsignadoMode} />
              {info?.isSearching && <Text style={styles.helperText}>Buscando stock e información...</Text>}
              {!info?.isSearching && info?.stockExistente !== null && info?.stockExistente !== undefined && (
                <View style={styles.stockBadgeExistente}>
                  <Text style={styles.stockBadgeText}>
                    {isDevolucionCentralMode
                      ? '✓ Stock disponible en almacén local: '
                      : isDevolucionAsignacionMode
                        ? '✓ En tu poder / custodia: '
                        : '✓ Stock disponible en almacén: '}
                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{info.stockExistente} und.</Text>
                  </Text>
                </View>
              )}
              {!info?.isSearching && info?.esNuevoCodigo === true && !isAsignadoMode && !isDevolucionCentralMode && (
                <View style={styles.stockBadgeNuevo}>
                  <Text style={styles.stockBadgeTextNuevo}>+ Código nuevo. Se registrará este nuevo material.</Text>
                </View>
              )}
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <InputTexto label={isDevolucionMode ? "Cantidad a Devolver" : isAsignadoMode ? "Cantidad a Asignar" : "Cantidad Recibida"} value={item.cantidadRecibida ? String(item.cantidadRecibida) : ''} onChangeText={(v) => updateItemField(idx, 'cantidadRecibida', v)} placeholder="Ej. 50" keyboardType="numeric" isRequired readOnly={readOnly} />
                  {isDevolucionCentralMode && info?.stockExistente !== null && info?.stockExistente !== undefined && parseFloat(String(item.cantidadRecibida || '0')) > info.stockExistente && (
                    <Text style={{ fontSize: 10, color: '#F87171', fontWeight: 'bold', marginTop: 2 }}>⚠️ Excede las {info.stockExistente} und. disponibles en almacén local</Text>
                  )}
                  {isDevolucionAsignacionMode && info?.stockExistente !== null && info?.stockExistente !== undefined && parseFloat(String(item.cantidadRecibida || '0')) > info.stockExistente && (
                    <Text style={{ fontSize: 10, color: '#F87171', fontWeight: 'bold', marginTop: 2 }}>⚠️ Excede las {info.stockExistente} und. en tu poder</Text>
                  )}
                  {isAsignadoMode && info?.stockExistente !== null && info?.stockExistente !== undefined && parseFloat(String(item.cantidadRecibida || '0')) > info.stockExistente && (
                    <Text style={{ fontSize: 10, color: '#F87171', fontWeight: 'bold', marginTop: 2 }}>⚠️ Excede las {info.stockExistente} und. disponibles en almacén</Text>
                  )}
                </View>
                <View style={styles.flex1}>
                  <InputTexto label="Modelo Material" value={item.modeloMaterial} onChangeText={(v) => updateItemField(idx, 'modeloMaterial', v)} placeholder="Ej. G657A2" readOnly={readOnly || isAsignadoMode || isDevolucionMode} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <InputTexto label="Nombre de Material" value={item.nombreMaterial} onChangeText={(v) => updateItemField(idx, 'nombreMaterial', v)} placeholder="Ej. Cable Fibra Óptica Drop 2 Hilos" isRequired readOnly={readOnly || isDevolucionMode || isAsignadoMode} />
                </View>
                {!readOnly && !isDevolucionMode && !isAsignadoMode && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0C66E4',
                      width: 44,
                      height: 42,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                    onPress={() => setModalPrecargadosIndex(idx)}
                  >
                    <Plus size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <InputTexto label="Serial Material (Opcional)" value={item.serialMaterial} onChangeText={(v) => updateItemField(idx, 'serialMaterial', v)} placeholder="Ej. SN-8839201" readOnly={readOnly} />
            </View>
          );
        })}
        {!readOnly && (
          <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
            <Plus size={16} color="#0C66E4" /><Text style={styles.addItemBtnText}>Añadir otro material</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. ADJUNTO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. ADJUNTO</Text>
        <Text style={{ fontSize: 11, color: '#8C9BAB', marginBottom: 12 }}>Sube fotos de la nota de entrega, guía o estado de la devolución.</Text>
        {!readOnly && (
          <TouchableOpacity style={styles.attachBtn} onPress={handleAdjuntarFotoFactura} disabled={subiendoImagen}>
            {subiendoImagen ? <ActivityIndicator size="small" color="#0C66E4" /> : <><Paperclip size={16} color="#0C66E4" /><Text style={styles.attachBtnText}>Adjuntar archivo / foto</Text></>}
          </TouchableOpacity>
        )}
        {adjuntos.length > 0 && (
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {adjuntos.map((uri, i) => (
              <View key={i} style={{ width: 64, height: 64, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1D2125' }}>
                <ImageBackground source={{ uri }} style={{ width: '100%', height: '100%' }}>
                  {!readOnly && (
                    <TouchableOpacity style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 }} onPress={() => handleRemoveAdjunto(i)}>
                      <X size={12} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </ImageBackground>
              </View>
            ))}
          </View>
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
            <InputTexto label="Entregado por" value={formData.entregadoPor} onChangeText={(v) => updateHeaderField('entregadoPor', v)} placeholder="Ej. Transporte / Personal" isRequired readOnly={readOnly} />
          </View>
        </View>
        <SelectDropdown label={isDevolucionMode ? "Motivo de Devolución" : "Motivo de Asignación"} value={formData.motivoAsignacion} onSelect={(v) => updateHeaderField('motivoAsignacion', v)} options={isDevolucionMode ? ['Sobrante de Instalación', 'Material Defectuoso', 'Cambio de Equipo', 'Fin de Proyecto', 'Otras'] : ['Instalaciones', 'Construcción', 'Verticales', 'Fallas FTTH', 'Fallas FTTX', 'Otras']} placeholder="Seleccionar motivo..." isRequired disabled={readOnly} />
      </View>

      {/* MODAL DE INSUMOS PRECARGADOS */}
      <Modal visible={modalPrecargadosIndex !== null} transparent animationType="fade" onRequestClose={() => setModalPrecargadosIndex(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalPrecargadosIndex(null)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Insumos Precargados</Text>
              <TouchableOpacity onPress={() => setModalPrecargadosIndex(null)} style={{ padding: 4 }}>
                <X size={18} color="#B6C2CF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
              {INSUMOS_PRECARGADOS.map((p: { nombre: string; codigo: string; modelo: string }, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.modalOption}
                  onPress={() => {
                    if (modalPrecargadosIndex !== null) {
                      updateMultipleItemFields(modalPrecargadosIndex, {
                        codigoMaterial: p.codigo,
                        nombreMaterial: p.nombre,
                        modeloMaterial: p.modelo,
                      });
                      checkStockForCodigo(modalPrecargadosIndex, p.codigo);
                    }
                    setModalPrecargadosIndex(null);
                  }}
                >
                  <Text style={styles.modalOptionTitle}>{p.nombre}</Text>
                  <Text style={styles.modalOptionSub}>{p.codigo} ({p.modelo})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  helperText: { fontSize: 11, color: '#579DFF', marginTop: -6, marginBottom: 8, fontStyle: 'italic' },
  stockBadgeExistente: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: '#22C55E', borderRadius: 6, padding: 8, marginTop: 2, marginBottom: 10 },
  stockBadgeText: { fontSize: 11, color: '#4ADE80' },
  stockBadgeNuevo: { backgroundColor: 'rgba(12, 102, 228, 0.15)', borderWidth: 1, borderColor: '#0C66E4', borderRadius: 6, padding: 8, marginTop: 2, marginBottom: 10 },
  stockBadgeTextNuevo: { fontSize: 11, color: '#579DFF', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#22272B', borderRadius: 12, width: '100%', maxWidth: 340, padding: 16, borderWidth: 1, borderColor: '#384148' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#384148' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#B6C2CF' },
  modalOption: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#2C333A' },
  modalOptionTitle: { fontSize: 13, fontWeight: 'bold', color: '#579DFF' },
  modalOptionSub: { fontSize: 11, color: '#8C9BAB', marginTop: 2 },
});
