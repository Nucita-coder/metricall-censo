import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { AlertCircle, X, Check } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

export interface ModalAvisoFaltantesProps {
  visible: boolean;
  onClose: () => void;
  titulo?: string;
  subtitulo?: string;
  faltantes: string[];
}

export const ModalAvisoFaltantes: React.FC<ModalAvisoFaltantesProps> = ({
  visible,
  onClose,
  titulo = 'Casillas Obligatorias Requeridas',
  subtitulo = 'Para proseguir, debes completar las siguientes casillas obligatorias:',
  faltantes,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, WEB_MODAL_CONTAINER]}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <AlertCircle size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
              <Text style={styles.title}>{titulo.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Cuerpo */}
          <View style={styles.body}>
            <Text style={styles.subtitulo}>{subtitulo}</Text>

            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
              {faltantes.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Pie de acción */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.actionBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' } as unknown as ViewStyle,
      default: { elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2C333A',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B6C2CF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  body: {
    padding: 20,
    maxHeight: 380,
  },
  subtitulo: {
    fontSize: 13,
    color: '#8C9BAB',
    marginBottom: 14,
    lineHeight: 18,
  },
  listContainer: {
    maxHeight: 260,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8FA3B7',
    marginRight: 10,
  },
  itemText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#2C333A',
    borderTopWidth: 1,
    borderTopColor: '#384148',
    alignItems: 'flex-end',
  },
  actionBtn: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B6C2CF',
  },
});
