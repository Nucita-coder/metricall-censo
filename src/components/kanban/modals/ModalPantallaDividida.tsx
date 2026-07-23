import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { Columns, X, Check, LayoutGrid } from 'lucide-react-native';
import { InputTexto } from '../../venta/CamposVenta';

interface ModalPantallaDivididaProps {
  visible: boolean;
  onClose: () => void;
  tablerosDisponibles: any[];
  tableroActualId: string;
  onSeleccionarSecundario: (tableroId: string) => void;
}

export function ModalPantallaDividida({
  visible,
  onClose,
  tablerosDisponibles,
  tableroActualId,
  onSeleccionarSecundario,
}: ModalPantallaDivididaProps) {
  const [busqueda, setBusqueda] = useState('');

  if (!visible) return null;

  const disponibles = tablerosDisponibles.filter(t => t.id !== tableroActualId);
  const filtrados = disponibles.filter(t =>
    t.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (tableroId: string) => {
    onSeleccionarSecundario(tableroId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Columns size={18} color="#579DFF" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Pantalla Dividida</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Selecciona un segundo tablero para visualizar y comparar en paralelo:
          </Text>

          {disponibles.length > 5 && (
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
              <Text style={styles.emptyText}>No hay otros tableros disponibles para dividir pantalla.</Text>
            ) : (
              filtrados.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.itemTablero}
                  onPress={() => handleSeleccionar(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    {t.fondo_url ? (
                      <Image source={{ uri: t.fondo_url }} style={styles.boardThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.iconThumb}>
                        <LayoutGrid size={14} color="#9FADBC" />
                      </View>
                    )}
                    <Text style={styles.itemTexto} numberOfLines={1}>
                      {t.nombre}
                    </Text>
                  </View>
                  <View style={styles.btnAbrir}>
                    <Text style={styles.btnAbrirTexto}>Dividir</Text>
                  </View>
                </TouchableOpacity>
              ))
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
    maxHeight: 450,
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
    marginBottom: 8,
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
  subtitle: {
    color: '#9FADBC',
    fontSize: 12,
    marginBottom: 12,
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
  btnAbrir: {
    backgroundColor: '#0C66E4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  btnAbrirTexto: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
