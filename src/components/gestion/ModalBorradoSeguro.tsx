import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

interface ModalBorradoSeguroProps {
  visible: boolean;
  itemToDelete: { id: string; nombre: string; type: 'sucursales' | 'tableros' } | null;
  deleteInput: string;
  setDeleteInput: (text: string) => void;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export function ModalBorradoSeguro({
  visible,
  itemToDelete,
  deleteInput,
  setDeleteInput,
  isDeleting,
  onClose,
  onConfirmar,
}: ModalBorradoSeguroProps) {
  const isDeleteEnabled = itemToDelete && deleteInput === itemToDelete.nombre;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, WEB_MODAL_CONTAINER]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleAlert}>¡Atención!</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalWarningText}>
            Esta acción es <Text style={{ fontWeight: 'bold' }}>irreversible</Text> y eliminará todos los elementos hijos (tableros, listas y tarjetas) vinculados a este recurso.
          </Text>

          <Text style={styles.modalLabel}>
            Para confirmar, escribe: <Text style={styles.modalTargetText}>{itemToDelete?.nombre}</Text>
          </Text>

          <TextInput
            style={styles.modalInput}
            placeholder={itemToDelete?.nombre}
            value={deleteInput}
            onChangeText={setDeleteInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onClose}>
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnDanger, !isDeleteEnabled && { opacity: 0.5 }]}
              onPress={onConfirmar}
              disabled={!isDeleteEnabled || isDeleting}
            >
              {isDeleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnDangerText}>Eliminar</Text>}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#22272B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#384148',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleAlert: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ef4444',
  },
  modalWarningText: {
    fontSize: 16,
    color: '#B6C2CF',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C9BAB',
    marginBottom: 8,
  },
  modalTargetText: {
    fontWeight: '900',
    color: '#1D2125',
    backgroundColor: '#B6C2CF',
    paddingHorizontal: 4,
  },
  modalInput: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBtnCancel: {
    backgroundColor: '#1D2125',
    borderColor: '#384148',
  },
  modalBtnCancelText: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBtnDanger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalBtnDangerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
