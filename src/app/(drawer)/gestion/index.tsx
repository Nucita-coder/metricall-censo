import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { Plus, Building2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { ModalBorradoSeguro } from '../../../components/gestion/ModalBorradoSeguro';
import { SucursalItemRow, Sucursal } from '../../../components/gestion/SucursalItemRow';
import { ModalCrearRecurso } from '../../../components/dashboard/ModalCrearRecurso';

export default function GestionOrganizacionScreen() {
  const { userRol, empresaId } = useAuth();
  
  if (userRol === 'empleado') {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedSucursales, setExpandedSucursales] = useState<{ [id: string]: boolean }>({});
  const [expandedTableros, setExpandedTableros] = useState<{ [id: string]: boolean }>({});

  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, nombre: string, type: 'sucursales' | 'tableros' } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inputNombre, setInputNombre] = useState('');
  const [inputSecundario, setInputSecundario] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchJerarquia(true);
    }, [])
  );

  const fetchJerarquia = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const { data, error } = await supabase
        .from('sucursales')
        .select(`
          id, 
          nombre, 
          tableros (
            id, 
            nombre, 
            listas (
              id, 
              nombre
            )
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSucursales((data as any) || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la jerarquía de la organización');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJerarquia(true).then(() => setRefreshing(false));
  };

  const toggleSucursal = (id: string) => {
    setExpandedSucursales((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTablero = (id: string) => {
    setExpandedTableros((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const confirmarBorrado = (id: string, nombre: string, type: 'sucursales' | 'tableros') => {
    setItemToDelete({ id, nombre, type });
    setDeleteInput('');
    setModalVisible(true);
  };

  const ejecutarBorrado = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from(itemToDelete.type).delete().eq('id', itemToDelete.id);
      if (error) throw error;

      setModalVisible(false);
      setItemToDelete(null);
      fetchJerarquia(true);
    } catch (error: any) {
      Alert.alert('Error al eliminar', error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateSucursalModal = () => {
    setInputNombre('');
    setInputSecundario('');
    setCreateModalVisible(true);
  };

  const ejecutarCreacionSucursal = async () => {
    if (!inputNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    try {
      setIsCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: perfilData } = await supabase.from('perfiles').select('empresa_id').eq('id', user?.id).single();

      const { error } = await supabase.from('sucursales').insert([
        { empresa_id: perfilData?.empresa_id, nombre: inputNombre.trim(), ubicacion: inputSecundario.trim() || null }
      ]);
      if (error) throw error;

      setCreateModalVisible(false);
      fetchJerarquia(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && !refreshing && sucursales.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B6C2CF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B6C2CF" />}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Gestión de Organización</Text>
            <Text style={styles.pageSubtitle}>
              Peligro: Eliminar una sucursal o tablero borrará todos los datos dependientes en cascada.
            </Text>
          </View>
          <TouchableOpacity style={styles.btnHeaderCrear} onPress={openCreateSucursalModal}>
            <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnHeaderCrearText}>Crear Sucursal</Text>
          </TouchableOpacity>
        </View>

        {sucursales.length === 0 && !isLoading && (
          <View style={styles.emptyBox}>
            <Building2 size={40} color="#8C9BAB" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No hay sucursales registradas</Text>
            <Text style={styles.emptySubtext}>
              Tu organización no tiene sucursales actualmente. Crea una sucursal para organizar tus tableros y flujos de trabajo.
            </Text>
            <TouchableOpacity style={styles.btnCrear} onPress={openCreateSucursalModal}>
              <Plus size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnCrearText}>Crear Nueva Sucursal</Text>
            </TouchableOpacity>
          </View>
        )}

        {sucursales.map((sucursal) => (
          <SucursalItemRow
            key={sucursal.id}
            sucursal={sucursal}
            isSucExpanded={Boolean(expandedSucursales[sucursal.id])}
            expandedTableros={expandedTableros}
            onToggleSucursal={toggleSucursal}
            onToggleTablero={toggleTablero}
            onConfirmarBorrado={confirmarBorrado}
          />
        ))}
      </ScrollView>

      <ModalBorradoSeguro
        visible={modalVisible}
        itemToDelete={itemToDelete}
        deleteInput={deleteInput}
        setDeleteInput={setDeleteInput}
        isDeleting={isDeleting}
        onClose={() => setModalVisible(false)}
        onConfirmar={ejecutarBorrado}
      />

      <ModalCrearRecurso
        visible={createModalVisible}
        createType="sucursal"
        inputNombre={inputNombre}
        setInputNombre={setInputNombre}
        inputSecundario={inputSecundario}
        setInputSecundario={setInputSecundario}
        tipoTablero="instalaciones"
        setTipoTablero={() => {}}
        isCreating={isCreating}
        onConfirmar={ejecutarCreacionSucursal}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' },
  scrollContent: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 24,
    fontWeight: '600'
  },
  btnHeaderCrear: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  btnHeaderCrearText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 32,
    borderWidth: 1,
    borderColor: '#384148',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#22272B',
    marginTop: 12,
  },
  emptyTitle: {
    color: '#B6C2CF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#8C9BAB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 400,
    lineHeight: 20,
  },
  btnCrear: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnCrearText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
