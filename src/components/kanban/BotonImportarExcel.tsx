import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  importarTarjetasDesdeExcel,
  procesarArchivoExcelBuffer,
} from '../../services/excelImportService';

interface BotonImportarExcelProps {
  listaId: string;
  listaNombre?: string;
  onImportComplete?: (tarjetasNuevas: any[]) => void;
}

export function BotonImportarExcel({
  listaId,
  listaNombre,
  onImportComplete,
}: BotonImportarExcelProps) {
  const { session, empresaId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filasExtraidas, setFilasExtraidas] = useState<Record<string, any>[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const fileInputRef = useRef<any>(null);

  const handleSelectFileWeb = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const filas = procesarArchivoExcelBuffer(buffer);
        setFilasExtraidas(filas);
        setModalVisible(true);
      } catch (err: any) {
        Alert.alert('Error al leer Excel', err?.message || 'Formato de archivo no válido.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePressBoton = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    } else {
      Alert.alert(
        'Importar Excel',
        'Por favor, utiliza la versión Web de Metricall para subir archivos Excel (.xlsx).'
      );
    }
  };

  const handleConfirmarCarga = async () => {
    if (!listaId || filasExtraidas.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await importarTarjetasDesdeExcel(
        filasExtraidas,
        listaId,
        empresaId,
        session?.user?.id || null
      );

      if (res.exito) {
        setModalVisible(false);
        setFilasExtraidas([]);
        Alert.alert('¡Carga Exitosa!', `Se importaron ${res.totalProcesados} tarjetas a la lista.`);
        if (onImportComplete && res.tarjetasInsertadas) {
          onImportComplete(res.tarjetasInsertadas);
        }
      } else {
        Alert.alert('Error en Carga', res.mensajes.join('\n'));
      }
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo completar la importación: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.btnImportar} onPress={handlePressBoton} disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <FileSpreadsheet size={16} color="#FFF" />
            <Text style={styles.btnText}>Cargar Clientes Excel</Text>
          </>
        )}
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          onChange={handleSelectFileWeb}
          style={{ display: 'none' }}
        />
      )}

      {/* Modal compacto emergente según AGENTS.md */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => !isProcessing && setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="#90CDF4" />
                <Text style={styles.modalTitle}>Confirmar Carga Excel</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={isProcessing}>
                <X size={20} color="#B6C2CF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.archivoTxt} numberOfLines={1}>
                📄 {nombreArchivo || 'Archivo Excel seleccionado'}
              </Text>
              <Text style={styles.infoTxt}>
                Se detectaron <Text style={styles.highlightTxt}>{filasExtraidas.length} clientes cortados</Text>.
              </Text>
              <Text style={styles.subInfoTxt}>
                Se creará una tarjeta por cada cliente dentro de la lista <Text style={styles.highlightTxt}>{listaNombre || 'Carga de cobranza'}</Text>.
              </Text>

              {filasExtraidas.length > 0 && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>Ejemplo del 1er registro:</Text>
                  <Text style={styles.previewTxt} numberOfLines={2}>
                    • Cliente: {filasExtraidas[0]?.nombreApellido || 'N/A'}
                  </Text>
                  <Text style={styles.previewTxt} numberOfLines={1}>
                    • Cédula: {filasExtraidas[0]?.documentoIdentidad || 'N/A'}
                  </Text>
                  <Text style={styles.previewTxt} numberOfLines={1}>
                    • Saldo: ${filasExtraidas[0]?.saldo || '0.00'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelBtnTxt}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmarCarga}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#1D2125" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#1D2125" />
                    <Text style={styles.confirmBtnTxt}>Importar {filasExtraidas.length}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btnImportar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#276749',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    width: '85%',
    maxWidth: 340,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  modalBody: {
    padding: 16,
    gap: 8,
  },
  archivoTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#90CDF4',
  },
  infoTxt: {
    fontSize: 14,
    color: '#B6C2CF',
  },
  subInfoTxt: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  highlightTxt: {
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  previewBox: {
    backgroundColor: '#1D2125',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    marginTop: 4,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    marginBottom: 4,
  },
  previewTxt: {
    fontSize: 12,
    color: '#B6C2CF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#384148',
  },
  cancelBtnTxt: {
    color: '#B6C2CF',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
  },
  confirmBtnTxt: {
    color: '#1D2125',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
