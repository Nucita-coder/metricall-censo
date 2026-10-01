import React from 'react';
import { Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { FileText, MessageCircle, Send } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { formatKeyName } from './SeccionRegistro';
import { generarHTMLInforme, imprimirODescargarReporte } from '../../../services/reportes';
import { Tarjeta } from '../../../types/kanban';
import { useAuth } from '../../../context/AuthContext';

interface AccionesExportacionCensoProps {
  tarjetaSeleccionada: Tarjeta;
  isSaving: boolean;
}

export function AccionesExportacionCenso({ tarjetaSeleccionada, isSaving }: AccionesExportacionCensoProps) {
  const { nombreCompleto } = useAuth();

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
      await imprimirODescargarReporte(htmlEstructural, `Censo_${tarjetaSeleccionada.id}`);
    } catch (error: unknown) {
      const msg = (error as Error).message || String(error);
      if (Platform.OS === 'web') {
        alert('Error al generar PDF: ' + msg);
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF: ' + msg);
      }
    }
  };

  const handleContactarWhatsApp = () => {
    const data = tarjetaSeleccionada.datos_valores || {};
    const rawTelefono =
      data.telefonoMovil ||
      data.nroTelefonoMovil ||
      data.telefono ||
      data.telefonoAdicional;

    if (!rawTelefono || String(rawTelefono).trim() === '') {
      const msg = 'No hay un número de teléfono móvil registrado en este censo.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Sin Teléfono', msg);
      return;
    }

    const cleanDigits = String(rawTelefono).replace(/\D/g, '');
    if (!cleanDigits) {
      const msg = 'El número de teléfono registrado no es válido.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Teléfono Inválido', msg);
      return;
    }

    let waNumber = cleanDigits;
    if (cleanDigits.startsWith('0')) {
      waNumber = '58' + cleanDigits.slice(1);
    } else if (!cleanDigits.startsWith('58') && cleanDigits.length === 10) {
      waNumber = '58' + cleanDigits;
    }

    const rawNombre = String(data.nombreApellido || data.nombre || '').trim();
    const asesor = (nombreCompleto || String(data.asesorComercial || '')).trim();

    let mensaje = '';
    if (rawNombre && asesor) {
      mensaje = `Hola ${rawNombre}, te saluda ${asesor} de parte de FIBEX Telecom con respecto a la solicitud de servicio de Internet.`;
    } else if (rawNombre) {
      mensaje = `Hola ${rawNombre}, te escribimos de parte de FIBEX Telecom con respecto a la solicitud de servicio de Internet.`;
    } else if (asesor) {
      mensaje = `Hola, te saluda ${asesor} de parte de FIBEX Telecom con respecto a la solicitud de servicio de Internet.`;
    } else {
      mensaje = 'Hola, te escribimos de parte de FIBEX Telecom con respecto a la solicitud de servicio de Internet.';
    }

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: '#25D366',
          paddingVertical: 12,
          paddingHorizontal: 6,
          borderRadius: 8,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
        onPress={handleContactarWhatsApp}
      >
        <MessageCircle size={16} color="#FFF" />
        <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }} numberOfLines={1}>
          Contactar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: '#1D2125',
          borderWidth: 1,
          borderColor: '#384148',
          paddingVertical: 12,
          paddingHorizontal: 6,
          borderRadius: 8,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
        onPress={handleExportWhatsApp}
      >
        <Send size={16} color="#B6C2CF" />
        <Text style={{ color: '#B6C2CF', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }} numberOfLines={1}>
          Reporte WS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: '#E53E3E',
          paddingVertical: 12,
          paddingHorizontal: 6,
          borderRadius: 8,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
        onPress={handleExportPDF}
        disabled={isSaving}
      >
        <FileText size={16} color="#FFF" />
        <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }} numberOfLines={1}>
          Exportar PDF
        </Text>
      </TouchableOpacity>
    </View>
  );
}
