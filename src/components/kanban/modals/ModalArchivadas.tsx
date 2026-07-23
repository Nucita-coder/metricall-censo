import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { X, RotateCcw, LayoutList, Layers } from 'lucide-react-native';

const WEB_MODAL_CONTAINER = Platform.OS === 'web' ? {
  width: '55%',
  maxWidth: 650,
  alignSelf: 'center',
  marginTop: '4%'
} as any : {};

interface ModalArchivadasProps {
  visible: boolean;
  onClose: () => void;
  tarjetasArchivadas: any[];
  listasArchivadas: any[];
  restoreCard: (id: string) => void;
  restoreList: (id: string) => void;
}

export const ModalArchivadas = ({
  visible,
  onClose,
  tarjetasArchivadas,
  listasArchivadas,
  restoreCard,
  restoreList
}: ModalArchivadasProps) => {
  const [activeTab, setActiveTab] = useState<'tarjetas' | 'listas'>('listas');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '80%' }, WEB_MODAL_CONTAINER]}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Elementos Archivados</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'listas' && styles.tabBtnActive]}
              onPress={() => setActiveTab('listas')}
            >
              <LayoutList size={16} color={activeTab === 'listas' ? '#FFF' : '#9FADBC'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'listas' && styles.tabTextActive]}>
                Listas ({listasArchivadas.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'tarjetas' && styles.tabBtnActive]}
              onPress={() => setActiveTab('tarjetas')}
            >
              <Layers size={16} color={activeTab === 'tarjetas' ? '#FFF' : '#9FADBC'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'tarjetas' && styles.tabTextActive]}>
                Tarjetas ({tarjetasArchivadas.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Listas Archivadas */}
          {activeTab === 'listas' ? (
            <FlatList
              data={listasArchivadas}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay listas archivadas en este tablero.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.archivedCard}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color_fondo || '#0052CC' }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#FFF', fontSize: 15 }}>{item.nombre}</Text>
                      <Text style={{ color: '#8C9BAB', fontSize: 12, marginTop: 2 }}>Lista de columnas</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.restoreBtn} onPress={() => restoreList(item.id)}>
                    <RotateCcw size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Desarchivar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            /* Tab 2: Tarjetas Archivadas */
            <FlatList
              data={tarjetasArchivadas}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay tarjetas archivadas.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.archivedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#579DFF', fontSize: 13 }}>{item.listas?.nombre || 'Sin Lista'}</Text>
                    <Text numberOfLines={2} style={{ color: '#FFF', fontSize: 14, marginTop: 4 }}>
                      {item.datos_valores?.nombreCliente || item.datos_valores?.texto_libre || item.nombre || 'Sin contenido'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.restoreBtn} onPress={() => restoreCard(item.id)}>
                    <RotateCcw size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Desarchivar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1D2125',
    borderRadius: 12,
    padding: 20,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#0C66E4',
  },
  tabText: {
    color: '#9FADBC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FFF',
  },
  archivedCard: {
    flexDirection: 'row',
    backgroundColor: '#22272B',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#384148',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8C9BAB',
    fontSize: 14,
  }
});
