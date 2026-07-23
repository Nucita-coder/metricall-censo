import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { Tarjeta } from '../../types/kanban';
import { useTrazabilidadEventos } from '../../hooks/useTrazabilidadEventos';
import { TrazabilidadItemRow } from './trazabilidad/TrazabilidadItemRow';

interface ModalTrazabilidadProps {
  visible: boolean;
  onClose: () => void;
  tarjeta: Tarjeta | null;
}

export const ModalTrazabilidad = ({ visible, onClose, tarjeta }: ModalTrazabilidadProps) => {
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'movimientos' | 'ediciones' | 'gestiones' | 'comentarios' | 'adjuntos'>('todos');

  const { todosEventos, eventosFiltrados } = useTrazabilidadEventos(tarjeta, filtroActivo);

  if (!visible || !tarjeta) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Trazabilidad de Tarjeta</Text>
              <Text style={styles.subtitleHeader}>
                ID: {tarjeta.id.substring(0, 8)}... | {tarjeta.datos_valores?.nombreCliente || 'Cliente'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* Filtros por Categoría */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'todos' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('todos')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'todos' && styles.filterChipTextActive]}>
                  Todos ({todosEventos.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'movimientos' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('movimientos')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'movimientos' && styles.filterChipTextActive]}>
                  Movimientos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'ediciones' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('ediciones')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'ediciones' && styles.filterChipTextActive]}>
                  Ediciones
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'gestiones' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('gestiones')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'gestiones' && styles.filterChipTextActive]}>
                  Gestiones
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'comentarios' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('comentarios')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'comentarios' && styles.filterChipTextActive]}>
                  Comentarios
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, filtroActivo === 'adjuntos' && styles.filterChipActive]} 
                onPress={() => setFiltroActivo('adjuntos')}
              >
                <Text style={[styles.filterChipText, filtroActivo === 'adjuntos' && styles.filterChipTextActive]}>
                  Adjuntos
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Timeline Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
            {eventosFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FileText size={48} color="#384148" />
                <Text style={styles.emptyText}>No hay eventos registrados en esta categoría.</Text>
              </View>
            ) : (
              eventosFiltrados.map((evento, index) => (
                <TrazabilidadItemRow
                  key={evento.id}
                  evento={evento}
                  isLast={index === eventosFiltrados.length - 1}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 750,
    height: '90%',
    backgroundColor: '#22272B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 12px 32px rgba(0,0,0,0.6)' },
      default: { elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#1D2125',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  subtitleHeader: {
    fontSize: 13,
    color: '#8C9BAB',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  filterBar: {
    backgroundColor: '#1D2125',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
  },
  filterChipActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C9BAB',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  body: {
    flex: 1,
    backgroundColor: '#22272B',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8C9BAB',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
});
