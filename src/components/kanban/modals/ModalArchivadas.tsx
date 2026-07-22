import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';

const WEB_MODAL_CONTAINER = Platform.OS === 'web' ? {
  width: '50%',
  alignSelf: 'center',
  marginTop: '5%'
} as any : {};

interface ModalArchivadasProps {
  visible: boolean;
  onClose: () => void;
  tarjetasArchivadas: any[];
  restoreCard: (id: string) => void;
}

export const ModalArchivadas = ({
  visible,
  onClose,
  tarjetasArchivadas,
  restoreCard
}: ModalArchivadasProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '80%' }, WEB_MODAL_CONTAINER]}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Archivo</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={tarjetasArchivadas}
            keyExtractor={item => item.id}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#8C9BAB' }}>No hay tarjetas archivadas.</Text>}
            renderItem={({ item }) => (
              <View style={styles.archivedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{item.listas?.nombre}</Text>
                  <Text numberOfLines={2} style={{ color: '#9FADBC', marginTop: 4 }}>
                    {item.datos_valores?.texto_libre || 'Sin contenido'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.restoreBtn} onPress={() => restoreCard(item.id)}>
                  <RotateCcw size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  archivedCard: {
    flexDirection: 'row',
    backgroundColor: '#2C333A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#384148',
  },
  restoreBtn: {
    backgroundColor: '#0C66E4',
    padding: 8,
    borderRadius: 4,
    marginLeft: 12,
  }
});
