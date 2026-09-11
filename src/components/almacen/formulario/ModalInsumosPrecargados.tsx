import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { INSUMOS_PRECARGADOS, InsumoPrecargado } from './types';

interface ModalInsumosPrecargadosProps {
  visible: boolean;
  onClose: () => void;
  onSelectInsumo: (insumo: InsumoPrecargado) => void;
}

export const ModalInsumosPrecargados: React.FC<ModalInsumosPrecargadosProps> = ({
  visible,
  onClose,
  onSelectInsumo,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insumos Precargados</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#B6C2CF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
            {INSUMOS_PRECARGADOS.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={styles.modalOption}
                onPress={() => onSelectInsumo(p)}
              >
                <Text style={styles.modalOptionTitle}>{p.nombre}</Text>
                <Text style={styles.modalOptionSub}>
                  {p.codigo} ({p.modelo})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    width: '100%',
    maxWidth: 340,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  modalOptionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
  },
});
