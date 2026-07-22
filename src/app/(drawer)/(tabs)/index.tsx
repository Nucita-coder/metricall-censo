import { router, useFocusEffect } from 'expo-router';
import { ArrowLeftRight, Building2, MoreVertical, Plus, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useGlobalUi } from '../../../context/GlobalUiContext';
import { supabase } from '../../../lib/supabase';
import { useDashboardData, Tablero } from '../../../hooks/useDashboardData';
import { ModalCrearRecurso } from '../../../components/dashboard/ModalCrearRecurso';
import { ModalOpcionesTablero } from '../../../components/dashboard/ModalOpcionesTablero';
import { DashboardBoardCard } from '../../../components/dashboard/DashboardBoardCard';

export default function DashboardScreen() {
  const { userRol, empresaId } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const { searchQuery, setSearchQuery, createTrigger } = useGlobalUi();

  const {
    isLoading,
    refreshing,
    liderNombre,
    empresaNombre,
    empresaLogo,
    sucursales,
    setSucursales,
    fetchDashboardData,
    onRefresh,
  } = useDashboardData();

  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<'sucursal' | 'tablero'>('sucursal');
  const [targetSucursalId, setTargetSucursalId] = useState<string | null>(null);
  const [tipoTablero, setTipoTablero] = useState<'instalaciones' | 'censo'>('instalaciones');
  const [inputNombre, setInputNombre] = useState('');
  const [inputSecundario, setInputSecundario] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [selectedBoard, setSelectedBoard] = useState<Tablero | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [isSwappingMode, setIsSwappingMode] = useState(false);
  const [boardToSwap, setBoardToSwap] = useState<Tablero | null>(null);

  useEffect(() => {
    if (createTrigger > 0) openCreateModal('sucursal');
  }, [createTrigger]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData(true);
    }, [empresaId])
  );

  const openCreateModal = (type: 'sucursal' | 'tablero', sucursalId?: string) => {
    setCreateType(type);
    setTargetSucursalId(sucursalId || null);
    setInputNombre('');
    setInputSecundario('');
    setTipoTablero('instalaciones');
    setModalVisible(true);
  };

  const openOptionsModal = (tablero: Tablero) => {
    setSelectedBoard(tablero);
    setOptionsModalVisible(true);
  };

  const toggleBoolean = async (field: 'es_favorito' | 'es_anclado') => {
    if (!selectedBoard) return;
    try {
      const newValue = !selectedBoard[field];
      const { error } = await supabase.from('tableros').update({ [field]: newValue }).eq('id', selectedBoard.id);
      if (error) throw error;
      setOptionsModalVisible(false);
      fetchDashboardData(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const iniciarIntercambio = () => {
    if (!selectedBoard) return;
    setOptionsModalVisible(false);
    setBoardToSwap(selectedBoard);
    setIsSwappingMode(true);
  };

  const ejecutarIntercambio = async (tableroDestino: Tablero) => {
    if (!boardToSwap || boardToSwap.id === tableroDestino.id) {
      setIsSwappingMode(false);
      setBoardToSwap(null);
      return;
    }
    try {
      let payloadToSave: any[] = [];
      const updatedSucursales = sucursales.map(s => {
        if (!s.tableros) return s;
        const indexA = s.tableros.findIndex(t => t.id === boardToSwap.id);
        const indexB = s.tableros.findIndex(t => t.id === tableroDestino.id);

        if (indexA !== -1 && indexB !== -1) {
          const newTableros = [...s.tableros];
          const temp = newTableros[indexA];
          newTableros[indexA] = newTableros[indexB];
          newTableros[indexB] = temp;

          newTableros.forEach((t, index) => {
            t.orden = index;
            payloadToSave.push({ id: t.id, orden: index });
          });
          return { ...s, tableros: newTableros };
        }
        return s;
      });

      setSucursales(updatedSucursales);
      setIsSwappingMode(false);
      setBoardToSwap(null);

      if (payloadToSave.length > 0) {
        const { error } = await supabase.rpc('actualizar_orden_tableros', { payload: payloadToSave });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert('Error al mover', e.message);
      fetchDashboardData(true);
    }
  };

  const ejecutarBorrado = async () => {
    if (!selectedBoard) return;
    try {
      const { error } = await supabase.from('tableros').delete().eq('id', selectedBoard.id);
      if (error) throw error;
      setOptionsModalVisible(false);
      fetchDashboardData(true);
    } catch (error: any) {
      Alert.alert('Error al eliminar', error.message);
    }
  };

  const ejecutarCreacion = async () => {
    if (!inputNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    try {
      setIsCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: perfilData } = await supabase.from('perfiles').select('empresa_id').eq('id', user?.id).single();

      if (createType === 'sucursal') {
        const { error } = await supabase.from('sucursales').insert([
          { empresa_id: perfilData?.empresa_id, nombre: inputNombre.trim(), ubicacion: inputSecundario.trim() || null }
        ]);
        if (error) throw error;
      } else if (createType === 'tablero' && targetSucursalId) {
        const { data: newTablero, error } = await supabase.from('tableros').insert([
          { sucursal_id: targetSucursalId, empresa_id: perfilData?.empresa_id, nombre: inputNombre.trim(), descripcion: inputSecundario.trim() || null, tipo: tipoTablero }
        ]).select().single();
        if (error) throw error;

        if (newTablero) {
          const nombresListas = tipoTablero === 'instalaciones'
            ? ['Venta', 'Factibilidad', 'Por Instalar', 'Asignado A', 'Liberada', 'En Proceso', 'Por Activar', 'Cliente Activo']
            : ['Censo', 'si desea', 'no desea', 'es posible'];

          const defaultListas = nombresListas.map((nombre, index) => ({
            empresa_id: perfilData?.empresa_id,
            tablero_id: newTablero.id,
            nombre,
            orden: index + 1,
            color_fondo: 'rgba(255, 255, 255, 0.85)'
          }));

          await supabase.from('listas').insert(defaultListas);
        }
      }

      setModalVisible(false);
      fetchDashboardData(true);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B6C2CF" />}>
        <View style={[styles.webContainer, isDesktop && { maxWidth: '100%', paddingHorizontal: 32 }]}>
          <View style={{ 
            marginBottom: 32, 
            marginTop: 16, 
            paddingHorizontal: isDesktop ? 0 : 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.companyName}>{empresaNombre}</Text>
              <Text style={styles.greeting}>Hola, {liderNombre.split(' ')[0]}</Text>
            </View>
            {empresaLogo ? (
              <Image 
                source={{ uri: empresaLogo }} 
                style={{ width: isDesktop ? 160 : 110, height: isDesktop ? 60 : 45, borderRadius: 8 }} 
                resizeMode="contain" 
              />
            ) : null}
          </View>

          {!isDesktop && sucursales.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#22272B', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 24, marginTop: 4, borderWidth: 1, borderColor: '#384148', marginHorizontal: 24 }}>
              <Search size={20} color="#9FADBC" />
              <TextInput
                style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#FFF', outlineStyle: 'none' } as any}
                placeholder="Buscar tablero por nombre..."
                placeholderTextColor="#9FADBC"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#9FADBC" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {sucursales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Building2 size={48} color="#8C9BAB" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No hay sucursales registradas</Text>
              <Text style={styles.emptySubtext}>
                Tu empresa no posee sucursales activas. Crea una sucursal para poder organizar tus tableros y flujos de trabajo.
              </Text>
              {userRol !== 'empleado' && (
                <TouchableOpacity 
                  style={styles.btnCrearSucursalEmpresa}
                  activeOpacity={0.8}
                  onPress={() => openCreateModal('sucursal')}
                >
                  <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnCrearSucursalEmpresaText}>Crear Sucursal Principal</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            sucursales.map((sucursal) => {
              const filteredTableros = sucursal.tableros?.filter(t => t.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim())) || [];
              if (searchQuery.trim().length > 0 && filteredTableros.length === 0) return null;

              return (
                <View key={sucursal.id} style={styles.sucursalSection}>
                  <View style={styles.sucursalHeader}>
                    <Text style={styles.sucursalTitle}>{sucursal.nombre}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {sucursal.ubicacion && <Text style={styles.sucursalLocation}>{sucursal.ubicacion}</Text>}
                      <TouchableOpacity style={{ marginLeft: 12 }}>
                        <MoreVertical size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.boardGroupContainer, isDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16, paddingBottom: 24, backgroundColor: 'transparent', borderTopWidth: 0, borderBottomWidth: 0 }]}>
                    {filteredTableros.map((tablero, index) => (
                      <DashboardBoardCard
                        key={tablero.id}
                        tablero={tablero}
                        isLast={index === sucursal.tableros!.length - 1 && userRol === 'empleado'}
                        isDesktop={isDesktop}
                        isSwappingMode={isSwappingMode}
                        boardToSwap={boardToSwap}
                        onPress={() => isSwappingMode ? ejecutarIntercambio(tablero) : router.push(`/tablero/${tablero.id}`)}
                        onLongPress={() => !isSwappingMode && openOptionsModal(tablero)}
                      />
                    ))}

                    {userRol !== 'empleado' && (
                      <TouchableOpacity style={[styles.cardDashedGroup, isDesktop && { width: 250, height: 120, borderRadius: 8 }]} activeOpacity={0.6} onPress={() => openCreateModal('tablero', sucursal.id)}>
                        <Text style={styles.dashedText}>{isDesktop ? 'Crear un tablero nuevo' : '+ Tablero'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {isSwappingMode && (
        <View style={styles.swappingBanner}>
          <ArrowLeftRight size={20} color="#FFF" />
          <Text style={styles.swappingBannerText}>Selecciona el tablero a intercambiar con "{boardToSwap?.nombre}"</Text>
          <TouchableOpacity onPress={() => setIsSwappingMode(false)}>
            <X size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <ModalCrearRecurso
        visible={modalVisible}
        createType={createType}
        inputNombre={inputNombre}
        setInputNombre={setInputNombre}
        inputSecundario={inputSecundario}
        setInputSecundario={setInputSecundario}
        tipoTablero={tipoTablero}
        setTipoTablero={setTipoTablero}
        isCreating={isCreating}
        onConfirmar={ejecutarCreacion}
        onClose={() => setModalVisible(false)}
      />

      <ModalOpcionesTablero
        visible={optionsModalVisible}
        selectedBoard={selectedBoard}
        onToggleBoolean={toggleBoolean}
        onIniciarIntercambio={iniciarIntercambio}
        onConfirmarBorrado={ejecutarBorrado}
        onClose={() => setOptionsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' },
  webContainer: { width: '100%', maxWidth: 1024, alignSelf: 'center' },
  greeting: { fontSize: 14, color: '#9FADBC', fontWeight: '500' },
  companyName: { fontSize: 32, fontWeight: '900', color: '#B6C2CF', marginTop: 0 },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
  sucursalSection: { marginBottom: 32 },
  sucursalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 24, marginBottom: 8 },
  sucursalTitle: { fontSize: 14, fontWeight: 'bold', color: '#B6C2CF', textTransform: 'uppercase', letterSpacing: 2 },
  sucursalLocation: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  boardGroupContainer: { backgroundColor: 'transparent' },
  cardDashedGroup: { width: '100%', height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148' },
  dashedText: { fontSize: 16, fontWeight: 'bold', color: '#B6C2CF' },
  emptyText: { paddingHorizontal: 24, fontSize: 16, color: '#8C9BAB', fontStyle: 'italic', marginBottom: 16 },
  emptyContainer: {
    padding: 32,
    marginHorizontal: 24,
    backgroundColor: '#22272B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#384148',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8C9BAB',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
    marginBottom: 24,
  },
  btnCrearSucursalEmpresa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnCrearSucursalEmpresaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  swappingBanner: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: 'rgba(0,0,0,0.85)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, zIndex: 100 },
  swappingBannerText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#FFF', fontWeight: '600' },
});
