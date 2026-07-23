import { Archive, Calendar, Columns, Copy, Info, Tag, UserPlus } from 'lucide-react-native';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Lista, Tarjeta } from '../../../types/kanban';

interface ModalContextMenuProps {
  contextMenu: { visible: boolean; x: number; y: number; tarjeta: Tarjeta | null };
  onClose: () => void;
  userRol: string | undefined;
  listas: Lista[];
  onAbrirTarjeta: (tarjeta: Tarjeta) => void;
  onMoverTarjeta?: (tarjeta: Tarjeta) => void;
  onVerTrazabilidad: (tarjeta: Tarjeta) => void;
  onReasignarCaso: (tarjeta: Tarjeta) => void;
  onArchivarTarjeta: (tarjeta: Tarjeta) => void;
  tableroId: string;
}

export const ModalContextMenu = ({
  contextMenu,
  onClose,
  userRol,
  listas,
  onAbrirTarjeta,
  onMoverTarjeta,
  onVerTrazabilidad,
  onReasignarCaso,
  onArchivarTarjeta,
  tableroId
}: ModalContextMenuProps) => {
  if (!contextMenu.visible || !contextMenu.tarjeta) return null;

  return (
    <Modal transparent visible={contextMenu.visible} onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={{
        position: 'absolute',
        top: contextMenu.y,
        left: contextMenu.x,
        backgroundColor: '#2C333A',
        borderRadius: 8,
        paddingVertical: 8,
        minWidth: 220,
        borderWidth: 1,
        borderColor: '#384148',
        ...Platform.select({
          web: { boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' } as any,
          default: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }
        })
      }}>
        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => { onClose(); onAbrirTarjeta(contextMenu.tarjeta!); }}>
          <Columns size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Abrir tarjeta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => { onClose(); onAbrirTarjeta(contextMenu.tarjeta!); }}>
          <Tag size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Editar etiquetas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => { onClose(); onAbrirTarjeta(contextMenu.tarjeta!); }}>
          <UserPlus size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Cambiar miembros</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => { onClose(); onAbrirTarjeta(contextMenu.tarjeta!); }}>
          <Calendar size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Editar las fechas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={async () => {
          onClose();
          const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://metricall-censo.app';
          const cardUrl = `${origin}/tablero/${tableroId}?tarjeta=${contextMenu.tarjeta?.id}`;
          await Clipboard.setStringAsync(cardUrl);
          Alert.alert('Copiado', 'Enlace de la tarjeta copiado al portapapeles.');
        }}>
          <Copy size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Copiar enlace</Text>
        </TouchableOpacity>

        {(userRol === 'admin' || userRol === 'lider' || userRol === 'supervisor') && (
          <>
            <View style={{ height: 1, backgroundColor: '#384148', marginVertical: 4 }} />

            <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => {
              onClose();
              onVerTrazabilidad(contextMenu.tarjeta!);
            }}>
              <Info size={16} color="#8A2BE2" style={{ marginLeft: 16 }} />
              <Text style={[styles.menuListText, { fontSize: 14, color: '#8A2BE2', fontWeight: 'bold' }]}>Ver Trazabilidad</Text>
            </TouchableOpacity>

            {['Censo', 'si desea', 'no desea', 'es posible'].includes(listas.find(l => l.id === contextMenu.tarjeta?.lista_id)?.nombre || '') && (
              <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => {
                onClose();
                onReasignarCaso(contextMenu.tarjeta!);
              }}>
                <UserPlus size={16} color="#E53E3E" style={{ marginLeft: 16 }} />
                <Text style={[styles.menuListText, { fontSize: 14, color: '#E53E3E', fontWeight: 'bold' }]}>Reasignar Caso</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 1, backgroundColor: '#384148', marginVertical: 4 }} />

        <TouchableOpacity style={[styles.menuListItem, { paddingVertical: 8 }]} onPress={() => {
          onClose();
          onArchivarTarjeta(contextMenu.tarjeta!);
        }}>
          <Archive size={16} color="#B6C2CF" style={{ marginLeft: 16 }} />
          <Text style={[styles.menuListText, { fontSize: 14 }]}>Archivar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuListText: {
    color: '#B6C2CF',
    fontSize: 14,
    marginLeft: 12,
  }
});
