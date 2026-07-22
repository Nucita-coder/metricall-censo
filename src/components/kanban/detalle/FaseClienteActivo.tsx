import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as shareAsync from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { generarHTMLInforme } from '../../../services/reportes';

export const FaseClienteActivo = ({ tarjeta, isSaving }: FaseProps) => {
  return renderSection("Acciones de Reporte", (
    <View>
      <Text style={{ fontSize: 14, color: '#B6C2CF', marginBottom: 16 }}>
        Esta tarjeta se encuentra finalizada. Puedes descargar un informe completo en PDF con todo su historial.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: '#E53E3E', padding: 14, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        onPress={async () => {
          try {
            const htmlEstructural = generarHTMLInforme(tarjeta);
            const { base64 } = await printToFileAsync({ html: htmlEstructural, base64: true });
            
            const finalUri = FileSystem.documentDirectory + `Reporte_Instalacion_${tarjeta.id}.pdf`;
            await FileSystem.writeAsStringAsync(finalUri, base64!, { encoding: FileSystem.EncodingType.Base64 });

            await shareAsync.shareAsync(finalUri, { mimeType: 'application/pdf', dialogTitle: 'Descargar Informe' });
          } catch (error: any) {
            Alert.alert("Error", "No se pudo generar el PDF: " + error.message);
          }
        }}
        disabled={isSaving}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Generar Informe PDF</Text>
      </TouchableOpacity>
    </View>
  ));
};
