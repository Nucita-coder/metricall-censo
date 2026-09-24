import { CheckCircle2, Upload, X } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TarjetaDatosValores } from '../../../types/kanban';

interface ModalConfirmarCargaExcelProps {
  visible: boolean;
  isProcessing: boolean;
  nombreArchivo: string;
  listaNombre?: string;
  filasExtraidas: TarjetaDatosValores[];
  onClose: () => void;
  onConfirmar: () => void;
}

export function ModalConfirmarCargaExcel({
  visible,
  isProcessing,
  nombreArchivo,
  listaNombre,
  filasExtraidas,
  onClose,
  onConfirmar,
}: ModalConfirmarCargaExcelProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => !isProcessing && onClose()}
          activeOpacity={1}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Upload size={18} color="#B6C2CF" />
              <Text style={styles.modalTitle}>Confirmar Carga Excel</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isProcessing}>
              <X size={20} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.archivoTxt} numberOfLines={1}>
              {nombreArchivo || 'Archivo Excel seleccionado'}
            </Text>
            <Text style={styles.infoTxt}>
              Se detectaron{' '}
              <Text style={styles.highlightTxt}>{filasExtraidas.length} clientes cortados</Text>.
            </Text>
            <Text style={styles.subInfoTxt}>
              Se creará una tarjeta por cada cliente en{' '}
              <Text style={styles.highlightTxt}>{listaNombre || 'Carga de cobranza'}</Text>.
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
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelBtnTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirmar}
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
  );
}

const styles = StyleSheet.create({
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: '#B6C2CF',
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
    color: '#FFFFFF',
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
    backgroundColor: '#A0B2C6',
  },
  confirmBtnTxt: {
    color: '#1D2125',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
