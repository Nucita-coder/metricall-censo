import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Platform, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Lista } from '../../../types/kanban';

const TRANSLUCENT_COLORS = [
  '#0052CC', '#172B4D', '#00875A', '#FF991F', '#DE350B',
  '#5243AA', '#00A3BF', '#0098B7', '#42526E', '#253858',
  '#0065FF', '#22272B'
];

interface ModalGestionListaProps {
  visible: boolean;
  onClose: () => void;
  gestionMenuPos: { x: number; y: number } | null;
  gestionMenuAction: 'main' | 'rename' | 'color' | 'move';
  setGestionMenuAction: (action: 'main' | 'rename' | 'color' | 'move') => void;
  listaActiva: Lista | null;
  editListaNombre: string;
  setEditListaNombre: (val: string) => void;
  editListaColor: string;
  setEditListaColor: (val: string) => void;
  handleActualizarLista: () => void;
  handleArchivarLista: () => void;
  tablerosDisponibles: any[];
  selectedTableroId: string;
  setSelectedTableroId: (id: string) => void;
  handleMoverListaTablero: () => void;
}

export const ModalGestionLista = ({
  visible,
  onClose,
  gestionMenuPos,
  gestionMenuAction,
  setGestionMenuAction,
  listaActiva,
  editListaNombre,
  setEditListaNombre,
  editListaColor,
  setEditListaColor,
  handleActualizarLista,
  handleArchivarLista,
  tablerosDisponibles,
  selectedTableroId,
  setSelectedTableroId,
  handleMoverListaTablero
}: ModalGestionListaProps) => {
  const { width } = useWindowDimensions();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: 'transparent' }} onPress={onClose}>
        <Pressable
          style={{
            width: 320,
            backgroundColor: '#282E33',
            borderRadius: 8,
            padding: 12,
            ...Platform.select({ 
              web: { boxShadow: '0px 0px 10px rgba(0,0,0,0.3)' } as any, 
              default: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 } 
            }),
            position: gestionMenuPos ? 'absolute' : 'relative',
            top: gestionMenuPos ? gestionMenuPos.y + 4 : undefined,
            left: gestionMenuPos ? Math.min(gestionMenuPos.x, width - 336) : undefined,
          }}
        >
          {/* Cabecera del Menú */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
            {gestionMenuAction !== 'main' && (
              <TouchableOpacity style={{ position: 'absolute', left: 0, padding: 4 }} onPress={() => setGestionMenuAction('main')}>
                <ChevronLeft size={18} color="#9FADBC" />
              </TouchableOpacity>
            )}
            <Text style={{ color: '#9FADBC', fontWeight: 'bold', fontSize: 14 }}>
              {gestionMenuAction === 'main' && 'Acciones de la lista'}
              {gestionMenuAction === 'rename' && 'Renombrar lista'}
              {gestionMenuAction === 'color' && 'Cambiar color'}
              {gestionMenuAction === 'move' && 'Mover lista'}
            </Text>
            <TouchableOpacity style={{ position: 'absolute', right: 0, padding: 4 }} onPress={onClose}>
              <X size={18} color="#9FADBC" />
            </TouchableOpacity>
          </View>

          {/* Vista Principal */}
          {gestionMenuAction === 'main' && (
            <View>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 }}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/tarjeta/nueva', params: { lista_id: listaActiva?.id, lista_nombre: listaActiva?.nombre } });
                }}
              >
                <Text style={{ color: '#B6C2CF', fontSize: 14 }}>Añadir tarjeta...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 }} onPress={() => setGestionMenuAction('rename')}>
                <Text style={{ color: '#B6C2CF', fontSize: 14 }}>Renombrar lista...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 }} onPress={() => setGestionMenuAction('move')}>
                <Text style={{ color: '#B6C2CF', fontSize: 14 }}>Mover lista...</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#A6B6C5', opacity: 0.2, marginVertical: 8 }} />

              <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginBottom: 4 }} onPress={() => setGestionMenuAction('color')}>
                <Text style={{ color: '#B6C2CF', fontSize: 14 }}>Cambiar color de lista...</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#A6B6C5', opacity: 0.2, marginVertical: 8 }} />

              <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 }} onPress={handleArchivarLista}>
                <Text style={{ color: '#B6C2CF', fontSize: 14 }}>Archivar esta lista</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Vista Renombrar */}
          {gestionMenuAction === 'rename' && (
            <View>
              <Text style={{ color: '#9FADBC', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Nombre</Text>
              <TextInput
                style={{ backgroundColor: '#22272B', color: '#FFF', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#384148', marginBottom: 16 }}
                value={editListaNombre}
                onChangeText={setEditListaNombre}
                autoFocus
              />
              <TouchableOpacity style={{ backgroundColor: '#579DFF', paddingVertical: 8, borderRadius: 4, alignItems: 'center' }} onPress={handleActualizarLista}>
                <Text style={{ color: '#1D2125', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Vista Color */}
          {gestionMenuAction === 'color' && (
            <View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16, gap: 10 }}>
                {TRANSLUCENT_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{ width: 48, height: 32, borderRadius: 4, backgroundColor: color, borderWidth: editListaColor === color ? 2 : 0, borderColor: '#579DFF' }}
                    onPress={() => setEditListaColor(color)}
                  />
                ))}
              </View>
              <TouchableOpacity style={{ backgroundColor: '#579DFF', paddingVertical: 8, borderRadius: 4, alignItems: 'center' }} onPress={handleActualizarLista}>
                <Text style={{ color: '#1D2125', fontWeight: 'bold' }}>Guardar Color</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Vista Mover */}
          {gestionMenuAction === 'move' && (
            <View>
              <Text style={{ color: '#9FADBC', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Tablero Destino</Text>
              <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
                {tablerosDisponibles.map(tab => (
                  <TouchableOpacity
                    key={tab.id}
                    style={{ padding: 10, borderRadius: 4, backgroundColor: selectedTableroId === tab.id ? '#1C2B41' : 'transparent', borderWidth: 1, borderColor: selectedTableroId === tab.id ? '#579DFF' : 'transparent' }}
                    onPress={() => setSelectedTableroId(tab.id)}
                  >
                    <Text style={{ color: selectedTableroId === tab.id ? '#579DFF' : '#B6C2CF' }}>{tab.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{ backgroundColor: selectedTableroId ? '#579DFF' : '#454F59', paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                disabled={!selectedTableroId}
                onPress={handleMoverListaTablero}
              >
                <Text style={{ color: selectedTableroId ? '#1D2125' : '#9FADBC', fontWeight: 'bold' }}>Mover</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
