import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as shareAsync from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { FileText, ShieldCheck } from 'lucide-react-native';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { generarHTMLInforme } from '../../../services/reportes';
import { AuditoriaDatosClienteVenta } from './AuditoriaDatosClienteVenta';
import { AuditoriaDatosTecnicosActivo } from './AuditoriaDatosTecnicosActivo';
import { AuditoriaEvidenciasActivo } from './AuditoriaEvidenciasActivo';
import { AuditoriaMaterialesGrid } from './AuditoriaMaterialesGrid';
import { AuditoriaCamposEnBlanco } from './AuditoriaCamposEnBlanco';

export const FaseClienteActivo = ({ tarjeta, isSaving, setImagenExpandida }: FaseProps) => {
  const data = tarjeta.datos_valores || {};

  const handleDescargarPDF = async () => {
    try {
      const htmlEstructural = generarHTMLInforme(tarjeta);
      const { base64 } = await printToFileAsync({ html: htmlEstructural, base64: true });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = `Reporte_Instalacion_${tarjeta.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const finalUri = (FileSystem.documentDirectory || '') + `Reporte_Instalacion_${tarjeta.id}.pdf`;
        await FileSystem.writeAsStringAsync(finalUri, base64!, { encoding: FileSystem.EncodingType.Base64 });
        await shareAsync.shareAsync(finalUri, { mimeType: 'application/pdf', dialogTitle: 'Descargar Informe' });
      }
    } catch (error: unknown) {
      const msg = (error as Error).message || String(error);
      if (Platform.OS === 'web') {
        alert('Error al generar el PDF: ' + msg);
      } else {
        Alert.alert('Error', 'No se pudo generar el PDF: ' + msg);
      }
    }
  };

  return renderSection(
    'Registro y Auditoría: Cliente Activo',
    <View>
      {/* 1. Tarjeta de Acreditación y Activación */}
      <View style={styles.cardAcreditacion}>
        <View style={styles.acreditacionHeader}>
          <ShieldCheck size={18} color="#4ADE80" />
          <Text style={styles.acreditacionTitle}>Servicio Instalado y Activo</Text>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>ACTIVADO POR</Text>
            <Text style={[styles.gridVal, { color: '#4ADE80', fontWeight: 'bold' }]}>
              {(data.activadoPor as string) || 'N/A'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>FECHA DE ACTIVACIÓN</Text>
            <Text style={styles.gridVal}>
              {data.fechaActivacion ? new Date(data.fechaActivacion as string).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>TÉCNICO INSTALADOR</Text>
            <Text style={styles.gridVal}>
              {(data.tecnicoAsignado as string) || (data.asignadoA as string) || 'N/A'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>NRO LCH</Text>
            <Text style={styles.gridVal}>
              {(data.lch_numero || data.lchNumero || data.nro_lch || 'N/A') as string}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Datos del Cliente y Venta */}
      <AuditoriaDatosClienteVenta data={data} />

      {/* 3. Parámetros Técnicos de Instalación en Sitio */}
      <AuditoriaDatosTecnicosActivo data={data} />

      {/* 4. Evidencia LCH y Geolocalización */}
      <AuditoriaEvidenciasActivo data={data} setImagenExpandida={setImagenExpandida} />

      {/* 5. Desglose de Materiales Utilizados */}
      <AuditoriaMaterialesGrid
        materiales={data.materiales as Record<string, string | number | undefined>}
        cablePreconectorizadoFallback={(data.cable_preconectorizado || data.cablePreconectorizado) as string}
      />

      {/* 6. Resumen de Campos Dejados de Lado / En Blanco */}
      <AuditoriaCamposEnBlanco data={data as Record<string, unknown>} />

      {/* 7. Botón Descargar Informe PDF */}
      <TouchableOpacity style={styles.btnPdf} onPress={handleDescargarPDF} disabled={isSaving}>
        <FileText size={16} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.btnPdfText}>Descargar Informe Completo en PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardAcreditacion: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  acreditacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.15)',
    paddingBottom: 6,
  },
  acreditacionTitle: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 12,
    color: '#B6C2CF',
  },
  btnPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  btnPdfText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
