import * as XLSX from 'xlsx';
import { Alert, Platform } from 'react-native';

export interface FilaPlantillaCobranza {
  LCH: string;
  Cliente: string;
  Cedula: string;
  Monto: number;
  Telefono: string;
}

export const FILAS_EJEMPLO_COBRANZA: FilaPlantillaCobranza[] = [
  {
    LCH: 'LCH30878',
    Cliente: 'VEDALIS DEL CARMEN ZURITA',
    Cedula: '20447088',
    Monto: 69.60,
    Telefono: '04121829994',
  },
  {
    LCH: 'LCH39960',
    Cliente: 'DANIEL OCTAVIO YENDI TOVAR',
    Cedula: '4503090',
    Monto: 32.50,
    Telefono: '04248712229',
  },
];

/**
 * Genera y descarga el archivo Plantilla_Cobranza_Metricall.xlsx
 */
export async function descargarPlantillaCobranza(): Promise<void> {
  try {
    const ws = XLSX.utils.json_to_sheet(FILAS_EJEMPLO_COBRANZA, {
      header: ['LCH', 'Cliente', 'Cedula', 'Monto', 'Telefono'],
    });

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 14 }, // LCH
      { wch: 32 }, // Cliente
      { wch: 14 }, // Cedula
      { wch: 12 }, // Monto
      { wch: 16 }, // Telefono
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cobranza');

    if (Platform.OS === 'web') {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Plantilla_Cobranza_Metricall.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } else {
      // Entorno nativo (móvil)
      Alert.alert(
        'Plantilla de Cobranza',
        'Se recomienda descargar la plantilla desde la versión Web para cargarla en tu computadora.'
      );
    }
  } catch (error: unknown) {
    Alert.alert('Error', 'No se pudo generar la plantilla: ' + ((error as Error)?.message || String(error)));
  }
}
