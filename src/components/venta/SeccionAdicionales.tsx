import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InputTexto } from './CamposVenta';

interface Props {
  formData: any;
  update: (key: string, val: any) => void;
  readOnly?: boolean;
}

export const SeccionAdicionales = ({ formData, update, readOnly = false }: Props) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>ADICIONALES</Text>

      <InputTexto
        label="Solicitud Equipo Adicional"
        value={formData.equipoAdicional}
        onChangeText={(v: string) => update('equipoAdicional', v)}
        placeholder="Ej. Router extra"
        readOnly={readOnly}
      />

      <InputTexto
        label="Nro. de Abonado"
        value={formData.nroAbonado}
        onChangeText={(v: string) => update('nroAbonado', v)}
        placeholder="Si aplica"
        keyboardType="numeric"
        readOnly={readOnly}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
});
