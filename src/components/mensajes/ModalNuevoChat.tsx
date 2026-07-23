import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X, UserPlus, User } from 'lucide-react-native';
import { InputTexto } from '../venta/CamposVenta';
import { PerfilUsuario, obtenerMiembrosEmpresa } from '../../services/mensajesService';

interface ModalNuevoChatProps {
  visible: boolean;
  empresaId: string;
  currentUserId: string;
  onClose: () => void;
  onSelectUsuario: (usuario: PerfilUsuario) => void;
}

export function ModalNuevoChat({
  visible,
  empresaId,
  currentUserId,
  onClose,
  onSelectUsuario,
}: ModalNuevoChatProps) {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [miembros, setMiembros] = useState<PerfilUsuario[]>([]);

  useEffect(() => {
    if (visible && empresaId && currentUserId) {
      cargarMiembros();
    }
  }, [visible, empresaId, currentUserId]);

  const cargarMiembros = async () => {
    try {
      setLoading(true);
      const res = await obtenerMiembrosEmpresa(empresaId, currentUserId);
      setMiembros(res);
    } catch (e) {
      setMiembros([]);
    } finally {
      setLoading(false);
    }
  };

  const miembrosFiltrados = miembros.filter((m) =>
    (m.nombre_completo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <UserPlus size={18} color="#579DFF" />
              <Text style={styles.title}>Iniciar Conversación</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <InputTexto
              label="Buscar miembro del equipo"
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Nombre del usuario..."
            />
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color="#0C66E4" />
            </View>
          ) : miembrosFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>No hay miembros registrados.</Text>
          ) : (
            <FlatList
              data={miembrosFiltrados}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    onSelectUsuario(item);
                    onClose();
                  }}
                >
                  <View style={styles.avatarCircle}>
                    <User size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemNombre}>{item.nombre_completo}</Text>
                    <Text style={styles.itemRol}>
                      Rol: {item.rol ? item.rol.toUpperCase() : 'MIEMBRO'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    width: '90%',
    maxWidth: 340,
    maxHeight: '75%',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  closeBtn: {
    padding: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centered: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8C9BAB',
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNombre: {
    color: '#B6C2CF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemRol: {
    color: '#8C9BAB',
    fontSize: 11,
    marginTop: 2,
  },
});
