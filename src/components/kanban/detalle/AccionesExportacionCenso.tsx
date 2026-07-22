import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FileText, Send } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as shareAsync from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { formatKeyName } from './SeccionRegistro';
import { generarHTMLInforme } from '../../../services/reportes';
import { Tarjeta } from '../../../types/kanban';

interface AccionesExportacionCensoProps {
  tarjetaSeleccionada: Tarjeta;
  isSaving: boolean;
}

export function AccionesExportacionCenso({ tarjetaSeleccionada, isSaving }: AccionesExportacionCensoProps) {
  const handleExportWhatsApp = () => {
    const data = tarjetaSeleccionada.datos_valores || {};
    let reporte = '*REPORTE DE CENSO*\n\n';

    const processEntry = (k: string, v: any, prefix = '') => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return;

      const ignoredKeys = ['adjuntos', 'geofotos', 'lch_imagen', 'historial_auditoria', 'comentarios', 'geo_nap', 'geo_casa', 'gestiones'];
      if (ignoredKeys.includes(k)) return;

      if (k === 'geo_censo' && v.lat && v.lng) {
        reporte += `\n*${prefix}Geolocalización GPS:*\nhttps://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}\n\n`;
        return;
      }

      if (typeof v === 'object' && !Array.isArray(v)) {
        for (const [subK, subV] of Object.entries(v)) {
          processEntry(subK, subV, `${prefix}${formatKeyName(k)} - `);
        }
      } else {
        reporte += `*${prefix}${formatKeyName(k)}:* ${String(v)}\n`;
      }
    };

    for (const [key, value] of Object.entries(data)) {
      processEntry(key, value);
    }

    if (data.gestiones && Array.isArray(data.gestiones) && data.gestiones.length > 0) {
      reporte += `\n*GESTIONES COMERCIALES*\n\n`;
      data.gestiones.forEach((g: any) => {
        reporte += `*Etapa:* ${g.etapa === 'gestion_1' ? 'Gestión 1' : 'Gestión 2 (Cierre)'}\n`;
        reporte += `*Fecha:* ${g.fecha}\n`;
        reporte += `*Tipo de Contacto:* ${g.tipoContacto}\n`;
        reporte += `*Resultado:* ${g.resultado}\n`;
        if (g.motivoRechazo) {
          reporte += `*Motivo de Rechazo:* ${g.motivoRechazo}\n`;
        }
        if (g.evidenciaUrl) {
          reporte += `*Evidencia:* ${g.evidenciaUrl}\n`;
        }
        reporte += `\n`;
      });
    }

    const textoCodificado = encodeURIComponent(reporte);
    Linking.openURL('https://wa.me/?text=' + textoCodificado);
  };

  const handleExportPDF = async () => {
    try {
      const htmlEstructural = generarHTMLInforme(tarjetaSeleccionada);
      const { base64 } = await printToFileAsync({ html: htmlEstructural, base64: true });
      const finalUri = FileSystem.documentDirectory + `Censo_${tarjetaSeleccionada.id}.pdf`;
      await FileSystem.writeAsStringAsync(finalUri, base64!, { encoding: FileSystem.EncodingType.Base64 });
      await shareAsync.shareAsync(finalUri, { mimeType: 'application/pdf', dialogTitle: 'Descargar Censo PDF' });
    } catch (error: any) {
      alert('Error al generar PDF: ' + error.message);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#25D366', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        onPress={handleExportWhatsApp}
      >
        <Send size={18} color="#FFF" />
        <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 13 }}>WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#E53E3E', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        onPress={handleExportPDF}
        disabled={isSaving}
      >
        <FileText size={18} color="#FFF" />
        <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 13 }}>Exportar PDF</Text>
      </TouchableOpacity>
    </View>
  );
}
