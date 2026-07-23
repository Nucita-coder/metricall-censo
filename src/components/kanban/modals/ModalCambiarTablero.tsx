import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { LayoutGrid, X, Check } from 'lucide-react-native';
import { InputTexto } from '../../venta/CamposVenta';

interface ModalCambiarTableroProps {
  visible: boolean;
  onClose: () => void;
  tablerosDisponibles: any[];
  tableroActualId: string;
  tableroInfo?: any;
}

export function ModalCambiarTablero({
  visible,
  onClose,
  tablerosDisponibles,
  tableroActualId,
  tableroInfo,
}: ModalCambiarTableroProps) {
  const [busqueda, setBusqueda] = useState('');

  if (!visible) return null;

  const listaCompleta = (() => {
    const list = [...tablerosDisponibles];
    if (tableroInfo && !list.some(t => t.id === tableroInfo.id)) {
      list.unshift({ id: tableroInfo.id, nombre: tableroInfo.nombre });
    }
    return list;
  })();

  const filtrados = listaCompleta.filter(t =>
    t.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (tableroId: string) => {
    onClose();
    if (tableroId !== tableroActualId) {
      router.push(`/tablero/${tableroId}` as any);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LayoutGrid size={18} color="#579DFF" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Cambiar Tablero</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {tablerosDisponibles.length > 5 && (
            <View style={styles.searchContainer}>
              <InputTexto
                label=""
                placeholder="Buscar tablero..."
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
          )}

          <ScrollView style={styles.listaContainer} showsVerticalScrollIndicator={false}>
            {filtrados.length === 0 ? (
              <Text style={styles.emptyText}>No hay otros tableros disponibles.</Text>
            ) : (
              filtrados.map((t) => {
                const esActual = t.id === tableroActualId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.itemTablero, esActual && styles.itemTableroActivo]}
                    onPress={() => handleSeleccionar(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      {t.fondo_url ? (
                        <Image source={{ uri: t.fondo_url }} style={styles.boardThumb} resizeMode="cover" />
                      ) : (
                        <View style={styles.iconThumb}>
                          <LayoutGrid size={14} color={esActual ? '#579DFF' : '#9FADBC'} />
                        </View>
                      )}
                      <Text style={[styles.itemTexto, esActual && styles.itemTextoActivo]} numberOfLines={1}>
                        {t.nombre}
                      </Text>
                    </View>
                    {esActual && <Check size={16} color="#579DFF" />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '90%',
    maxWidth: 340,
    maxHeight: 420,
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderColor: '#384148',
    borderWidth: 1,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 10,
  },
  listaContainer: {
    maxHeight: 280,
  },
  emptyText: {
    color: '#8C9BAB',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 13,
  },
  itemTablero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1D2125',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  itemTableroActivo: {
    backgroundColor: '#1C2B36',
    borderColor: '#0C66E4',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemTexto: {
    color: '#B6C2CF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemTextoActivo: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  boardThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
