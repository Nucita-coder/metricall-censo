import React from 'react';
import { Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
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

    const processEntry = (k: string, v: unknown, prefix = '') => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return;

      const ignoredKeys = ['adjuntos', 'geofotos', 'lch_imagen', 'historial_auditoria', 'comentarios', 'geo_nap', 'geo_casa', 'gestiones'];
      if (ignoredKeys.includes(k)) return;

      const geoVal = v as { lat?: number | string; lng?: number | string } | undefined;
      if (k === 'geo_censo' && geoVal?.lat && geoVal?.lng) {
        reporte += `\n*${prefix}Geolocalización GPS:*\nhttps://www.google.com/maps/search/?api=1&query=${geoVal.lat},${geoVal.lng}\n\n`;
        return;
      }

      if (typeof v === 'object' && !Array.isArray(v)) {
        for (const [subK, subV] of Object.entries(v as Record<string, unknown>)) {
          processEntry(subK, subV, `${prefix}${formatKeyName(k)} - `);
        }
      } else {
        reporte += `*${prefix}${formatKeyName(k)}:* ${String(v)}\n`;
      }
    };

    for (const [key, value] of Object.entries(data)) {
      processEntry(key, value);
    }

    if (data.geo_nap && data.geo_nap.lat && data.geo_nap.lng) {
      reporte += `\n*Ubicación GPS NAP:*\nhttps://www.google.com/maps/search/?api=1&query=${data.geo_nap.lat},${data.geo_nap.lng}\n`;
    }

    if (data.geo_casa && data.geo_casa.lat && data.geo_casa.lng) {
      reporte += `\n*Ubicación GPS Casa:*\nhttps://www.google.com/maps/search/?api=1&query=${data.geo_casa.lat},${data.geo_casa.lng}\n`;
    }

    // Escáner dinámico recursivo para extraer todas las fotos, LCH, GeoFotos y adjuntos de datos_valores
    const urlMap = new Map<string, string>(); // url -> label

    const scanForUrls = (obj: unknown, currentLabel = '') => {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (obj.startsWith('http://') || obj.startsWith('https://')) {
          if (!obj.includes('google.com/maps')) {
            if (!urlMap.has(obj)) {
              urlMap.set(obj, currentLabel || 'Evidencia');
            }
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, idx) => scanForUrls(item, `${currentLabel} ${idx + 1}`));
      } else if (typeof obj === 'object') {
        const objRecord = obj as Record<string, unknown>;
        if (objRecord.url && typeof objRecord.url === 'string') {
          scanForUrls(objRecord.url, currentLabel || (objRecord.nombre as string) || 'Evidencia');
        } else if (objRecord.uri && typeof objRecord.uri === 'string') {
          scanForUrls(objRecord.uri, currentLabel || (objRecord.nombre as string) || 'Evidencia');
        } else {
          for (const [k, v] of Object.entries(objRecord)) {
            if (['historial_auditoria', 'comentarios'].includes(k)) continue;
            scanForUrls(v, currentLabel ? `${currentLabel} - ${formatKeyName(k)}` : formatKeyName(k));
          }
        }
      }
    };

    scanForUrls(data);

    if (urlMap.size > 0) {
      let evidenciasText = '';
      urlMap.forEach((label, url) => {
        evidenciasText += `• *${label}:*\n${url}\n\n`;
      });
      reporte += `\n*EVIDENCIAS Y FOTOGRAFÍAS:*\n${evidenciasText}`;
    }

    if (data.gestiones && Array.isArray(data.gestiones) && data.gestiones.length > 0) {
      reporte += `\n*GESTIONES COMERCIALES*\n\n`;
      (data.gestiones as Array<Record<string, unknown>>).forEach((g) => {
        reporte += `*Etapa:* ${g.etapa === 'gestion_1' ? 'Gestión 1' : 'Gestión 2 (Cierre)'}\n`;
        reporte += `*Fecha:* ${String(g.fecha || '')}\n`;
        reporte += `*Tipo de Contacto:* ${String(g.tipoContacto || g.tipo || '')}\n`;
        reporte += `*Resultado:* ${String(g.resultado || '')}\n`;
        if (g.motivoRechazo) {
          reporte += `*Motivo de Rechazo:* ${String(g.motivoRechazo)}\n`;
        }
        if (g.evidenciaUrl) {
          reporte += `*Evidencia:* ${String(g.evidenciaUrl)}\n`;
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
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = `Censo_${tarjetaSeleccionada.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const finalUri = (FileSystem.documentDirectory || '') + `Censo_${tarjetaSeleccionada.id}.pdf`;
        await FileSystem.writeAsStringAsync(finalUri, base64!, { encoding: FileSystem.EncodingType.Base64 });
        await shareAsync.shareAsync(finalUri, { mimeType: 'application/pdf', dialogTitle: 'Descargar Censo PDF' });
      }
    } catch (error: unknown) {
      const msg = (error as Error).message || String(error);
      if (Platform.OS === 'web') {
        alert('Error al generar PDF: ' + msg);
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF: ' + msg);
      }
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
