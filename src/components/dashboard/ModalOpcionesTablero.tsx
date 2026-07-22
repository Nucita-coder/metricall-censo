import React from 'react';
import { Alert, Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { ArrowLeftRight, Copy, Pin, Star, Trash2, X } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';
import { Tablero } from '../../hooks/useDashboardData';

interface ModalOpcionesTableroProps {
  visible: boolean;
  selectedBoard: Tablero | null;
  onToggleBoolean: (field: 'es_favorito' | 'es_anclado') => void;
  onIniciarIntercambio: () => void;
  onConfirmarBorrado: () => void;
  onClose: () => void;
}

export function ModalOpcionesTablero({
  visible,
  selectedBoard,
  onToggleBoolean,
  onIniciarIntercambio,
  onConfirmarBorrado,
  onClose,
}: ModalOpcionesTableroProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { padding: 16 }, WEB_MODAL_CONTAINER]} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: 18 }]} numberOfLines={1}>
              {selectedBoard?.nombre}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.optionBtn} onPress={() => onToggleBoolean('es_favorito')}>
            <Star
              size={20}
              color={selectedBoard?.es_favorito ? '#EAB308' : '#B6C2CF'}
              fill={selectedBoard?.es_favorito ? '#EAB308' : 'transparent'}
            />
            <Text style={styles.optionBtnText}>{selectedBoard?.es_favorito ? 'Quitar de Favoritos' : 'Marcar como Favorito'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={() => onToggleBoolean('es_anclado')}>
            <Pin size={20} color={selectedBoard?.es_anclado ? '#FFF' : '#B6C2CF'} />
            <Text style={styles.optionBtnText}>{selectedBoard?.es_anclado ? 'Desanclar tablero' : 'Anclar tablero'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={onIniciarIntercambio}>
            <ArrowLeftRight size={20} color="#B6C2CF" />
            <Text style={styles.optionBtnText}>Mover tablero</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={() => Alert.alert('En desarrollo', 'Función de copiado en construcción')}>
            <Copy size={20} color="#B6C2CF" />
            <Text style={styles.optionBtnText}>Copiar tablero</Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#384148', marginVertical: 8 }} />

          <TouchableOpacity style={styles.optionBtn} onPress={onConfirmarBorrado}>
            <Trash2 size={20} color="#ef4444" />
            <Text style={[styles.optionBtnText, { color: '#ef4444' }]}>Eliminar tablero</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
    backgroundColor: '#2C333A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#384148',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B6C2CF',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  optionBtnText: {
    fontSize: 16,
    color: '#B6C2CF',
    fontWeight: '500',
  },
});
