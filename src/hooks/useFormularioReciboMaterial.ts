import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../services/uploadImage';
import { Tarjeta, TarjetaDatosValores, TarjetaMaterialItem } from '../types/kanban';
import { MaterialRowItem, StockInfo } from '../components/almacen/formulario/types';
import { useFormularioStockDisponibles } from './useFormularioStockDisponibles';

interface UseFormularioReciboMaterialParams {
  formData: TarjetaDatosValores;
  handleChange?: (campo: string, valor: unknown) => void;
  readOnly?: boolean;
}

export function useFormularioReciboMaterial({
  formData,
  handleChange,
  readOnly = false,
}: UseFormularioReciboMaterialParams) {
  const { empresaId, nombreCompleto } = useAuth();
  const [stockInfoMap, setStockInfoMap] = useState<Record<number, StockInfo>>({});
  const [modalPrecargadosIndex, setModalPrecargadosIndex] = useState<number | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const tipoUpper = (formData.tipoCarga || '').toUpperCase();
  const isDevolucionCentralMode =
    tipoUpper.includes('ALMACÉN CENTRAL') || tipoUpper.includes('ALMACEN CENTRAL');
  const isDevolucionAsignacionMode =
    (tipoUpper.includes('DEVOLUCION') || tipoUpper.includes('DEVOLUCIÓN')) &&
    !isDevolucionCentralMode;
  const isDevolucionMode = isDevolucionCentralMode || isDevolucionAsignacionMode;
  const isAsignadoMode =
    !isDevolucionMode &&
    (tipoUpper ? tipoUpper.includes('ASIGNA') : Boolean(formData.asignadoA && formData.asignadoA.trim()));

  const { miembrosList, stockDisponibles, stockCustodiaMiembro } =
    useFormularioStockDisponibles({
      empresaId,
      nombreCompleto,
      isDevolucionMode,
      asignadoA: formData.asignadoA,
    });

  useEffect(() => {
    if (isDevolucionMode && handleChange) {
      if (!formData.fechaRecibido) {
        handleChange('fechaRecibido', new Date().toISOString().split('T')[0]);
      }
      if (!formData.nroOrdenEntrega) {
        handleChange('nroOrdenEntrega', 'S/N');
      }
      if (!formData.origen) {
        handleChange('origen', 'EMPLEADO');
      }
      if (nombreCompleto) {
        if (isDevolucionAsignacionMode && formData.asignadoA !== nombreCompleto) {
          handleChange('asignadoA', nombreCompleto);
        }
        if (formData.entregadoPor !== nombreCompleto) {
          handleChange('entregadoPor', nombreCompleto);
        }
      }
    } else if (isAsignadoMode && handleChange) {
      if (formData.origen !== 'ALMACÉN PRINCIPAL') {
        handleChange('origen', 'ALMACÉN PRINCIPAL');
      }
    }
  }, [isDevolucionMode, isDevolucionAsignacionMode, isAsignadoMode, nombreCompleto]);

  const adjuntos: string[] = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];

  const getItems = (): MaterialRowItem[] => {
    if (Array.isArray(formData.items) && formData.items.length > 0) {
      return formData.items.map((item) => ({
        codigoMaterial: item.codigoMaterial || '',
        nombreMaterial: item.nombreMaterial || '',
        modeloMaterial: item.modeloMaterial || '',
        serialMaterial: item.serialMaterial || '',
        cantidadRecibida: item.cantidadRecibida ? String(item.cantidadRecibida) : '',
      }));
    }
    return [
      {
        codigoMaterial: formData.codigoMaterial || '',
        nombreMaterial: formData.nombreMaterial || '',
        modeloMaterial: formData.modeloMaterial || '',
        serialMaterial: formData.serialMaterial || '',
        cantidadRecibida: formData.cantidadRecibida ? String(formData.cantidadRecibida) : '',
      },
    ];
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
    const updated: MaterialRowItem = {
      ...(newItems[index] || {
        codigoMaterial: '',
        nombreMaterial: '',
        modeloMaterial: '',
        serialMaterial: '',
        cantidadRecibida: '',
      }),
    };
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

  const handleAddItem = () => {
    if (!readOnly) {
      updateRootAndItems([
        ...items,
        {
          codigoMaterial: '',
          nombreMaterial: '',
          modeloMaterial: '',
          serialMaterial: '',
          cantidadRecibida: '',
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!readOnly && items.length > 1) {
      updateRootAndItems(items.filter((_, i) => i !== index));
    }
  };

  const checkStockForCodigo = async (index: number, codigo: string) => {
    const cleanCodigo = (codigo || '').trim().toUpperCase();
    if (!cleanCodigo || cleanCodigo.length < 2 || !empresaId || readOnly) {
      setStockInfoMap((prev) => ({
        ...prev,
        [index]: { stockExistente: null, esNuevoCodigo: null, isSearching: false },
      }));
      return;
    }
    setStockInfoMap((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || { stockExistente: null, esNuevoCodigo: null }),
        isSearching: true,
      },
    }));
    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('datos_valores')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      let totalStock = 0;
      let primerNombre = '';
      let primerModelo = '';
      let encontrado = false;
      if (data) {
        (data as unknown as Tarjeta[]).forEach((row) => {
          const val = row.datos_valores || {};
          const tipo = (val.tipoCarga || '').toString().trim().toUpperCase();
          const isDevCentral = tipo.includes('ALMACÉN CENTRAL') || tipo.includes('ALMACEN CENTRAL');
          const isDevAsig = !isDevCentral && (tipo.includes('DEVOLUCIÓN') || tipo.includes('DEVOLUCION'));
          const isAsig = !isDevCentral && !isDevAsig && (tipo ? tipo.includes('ASIGNA') : Boolean(val.asignadoA && val.asignadoA.toString().trim()));
          const rowItems = Array.isArray(val.items) ? val.items : [val];
          (rowItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            if ((subItem.codigoMaterial || '').trim().toUpperCase() === cleanCodigo) {
              encontrado = true;
              const cant = parseFloat((subItem.cantidadRecibida as string) || '0');
              if (!isNaN(cant)) totalStock += (isAsig || isDevCentral) ? -cant : cant;
              if (!primerNombre && subItem.nombreMaterial) primerNombre = subItem.nombreMaterial;
              if (!primerModelo && subItem.modeloMaterial) primerModelo = subItem.modeloMaterial;
            }
          });
        });
      }

      setStockInfoMap((prev) => ({
        ...prev,
        [index]: {
          stockExistente: encontrado ? totalStock : 0,
          esNuevoCodigo: !encontrado,
          isSearching: false,
        },
      }));

      if (encontrado && handleChange) {
        const cur = getItems()[index];
        if (cur) {
          if (primerNombre && !cur.nombreMaterial) {
            updateItemField(index, 'nombreMaterial', primerNombre);
          }
          if (primerModelo && !cur.modeloMaterial) {
            updateItemField(index, 'modeloMaterial', primerModelo);
          }
        }
      }
    } catch {
      setStockInfoMap((prev) => ({
        ...prev,
        [index]: {
          ...(prev[index] || { stockExistente: null, esNuevoCodigo: null }),
          isSearching: false,
        },
      }));
    }
  };

  const handleCodigoChangeForItem = (index: number, codigo: string) => {
    const upperCodigo = codigo ? codigo.toUpperCase() : '';
    updateItemField(index, 'codigoMaterial', upperCodigo);
    checkStockForCodigo(index, upperCodigo);
  };

  const processUpload = async (uri: string) => {
    setSubiendoImagen(true);
    try {
      const publicUrl = await uploadImageToSupabase(uri, 'facturas');
      const cur = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];
      handleChange?.('adjuntos', [...cur, publicUrl]);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSubiendoImagen(false);
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
      } catch (e: unknown) {
        Alert.alert('Error', (e as Error).message);
      }
      return;
    }
    Alert.alert('Adjuntar Evidencia', '¿Desde dónde deseas adjuntar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status === 'granted') {
            const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
            if (!res.canceled && res.assets?.[0]) processUpload(res.assets[0].uri);
          }
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status === 'granted') {
            const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
            if (!res.canceled && res.assets?.[0]) processUpload(res.assets[0].uri);
          }
        },
      },
    ]);
  };

  const handleRemoveAdjunto = (index: number) => {
    if (readOnly || !handleChange) return;
    const cur = Array.isArray(formData.adjuntos) ? formData.adjuntos : [];
    handleChange(
      'adjuntos',
      cur.filter((_, i: number) => i !== index)
    );
  };

  return {
    nombreCompleto,
    stockInfoMap,
    setStockInfoMap,
    modalPrecargadosIndex,
    setModalPrecargadosIndex,
    subiendoImagen,
    miembrosList,
    stockDisponibles,
    stockCustodiaMiembro,
    isDevolucionMode,
    isDevolucionCentralMode,
    isDevolucionAsignacionMode,
    isAsignadoMode,
    adjuntos,
    items,
    updateHeaderField,
    updateItemField,
    updateMultipleItemFields,
    handleAddItem,
    handleRemoveItem,
    checkStockForCodigo,
    handleCodigoChangeForItem,
    handleAdjuntarFotoFactura,
    handleRemoveAdjunto,
  };
}
