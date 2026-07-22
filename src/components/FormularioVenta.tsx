import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SeccionAdicionales } from './venta/SeccionAdicionales';
import { SeccionDatosCliente } from './venta/SeccionDatosCliente';
import { SeccionDatosComerciales } from './venta/SeccionDatosComerciales';

interface FormularioVentaProps {
  formData: any;
  handleChange?: (campo: string, valor: any) => void;
  isLocating?: boolean;
  onCaptarGPS?: () => void;
  onMapaManual?: () => void;
  readOnly?: boolean;
}

export default function FormularioVenta({
  formData,
  handleChange,
  isLocating,
  onCaptarGPS,
  onMapaManual,
  readOnly = false,
}: FormularioVentaProps) {
  const update = (key: string, val: any) => {
    if (readOnly) return;
    if (handleChange) handleChange(key, val);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. DATOS COMERCIALES */}
      <SeccionDatosComerciales
        formData={formData}
        update={update}
        readOnly={readOnly}
      />

      {/* 2. DATOS DEL CLIENTE (incluye Dirección de Instalación y GPS) */}
      <SeccionDatosCliente
        formData={formData}
        update={update}
        isLocating={isLocating}
        onCaptarGPS={onCaptarGPS}
        onMapaManual={onMapaManual}
        readOnly={readOnly}
      />

      {/* 3. ADICIONALES */}
      <SeccionAdicionales
        formData={formData}
        update={update}
        readOnly={readOnly}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22272B',
    padding: 16,
  },
});
