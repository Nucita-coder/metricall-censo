import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { useKanbanDragDrop } from '../../hooks/useKanbanDragDrop';
import { useTarjetaDetalle } from '../../hooks/useTarjetaDetalle';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { useLocation } from '../../context/LocationContext';
import { useKanbanCanvasPan } from '../../hooks/useKanbanCanvasPan';
import { useKanbanDataLoader } from '../../hooks/useKanbanDataLoader';
import { supabase } from '../../lib/supabase';
import { Lista, Tarjeta } from '../../types/kanban';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToSupabase } from '../../services/uploadImage';

import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { ModalAuditoria } from '../../components/kanban/modals/ModalAuditoria';
import { ModalContextMenu } from '../../components/kanban/modals/ModalContextMenu';
import { ModalArchivadas } from '../../components/kanban/modals/ModalArchivadas';
import { ModalTableroMenu } from '../../components/kanban/modals/ModalTableroMenu';
import { ModalDetalleTarjeta } from '../../components/kanban/ModalDetalleTarjeta';
import { BoardHeader } from '../../components/kanban/BoardHeader';
import { BoardActionButtons } from '../../components/kanban/BoardActionButtons';

export default function KanbanTableroScreen() {
  const { userRol, session, permisosEspeciales, empresaId } = useAuth();
  const { id, isSecondary, abrirTarjeta } = useLocalSearchParams<{ id: string, isSecondary?: string, abrirTarjeta?: string }>();

  const { isLoading, tableroInfo, setTableroInfo, listas, setListas, miembros, fetchKanbanData } = useKanbanDataLoader({ id, session, userRol, permisosEspeciales, empresaId });

  const [startInEditMode, setStartInEditMode] = useState(false);
  const { pendingCount } = useSyncQueue();

  const boardWrapperRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);
  const { width } = useWindowDimensions();

  useKanbanCanvasPan(boardWrapperRef, flatListRef, isLoading, tableroInfo);

  const { tarjetaEnMovimiento, setTarjetaEnMovimiento, listaEnMovimiento, setListaEnMovimiento, handleMove, handleSwapLists } = useKanbanDragDrop({ listas, setListas, tableroInfo });

  const { tarjetaSeleccionada, setTarjetaSeleccionada, tarjetaAuditoria, setTarjetaAuditoria, nuevoComentario, setNuevoComentario, handleEnviarComentario } = useTarjetaDetalle(session, userRol, setListas);

  const [modalMenuVisible, setModalMenuVisible] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [modalArchivadasVisible, setModalArchivadasVisible] = useState(false);
  const [tarjetasArchivadas, setTarjetasArchivadas] = useState<any[]>([]);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, tarjeta: Tarjeta | null }>({ visible: false, x: 0, y: 0, tarjeta: null });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleCambiarFondo = async () => {
    if (!tableroInfo) return;

    Alert.alert(
      'Fondo del Tablero',
      'Elige una opción para cambiar la imagen de fondo de este tablero',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...(tableroInfo.fondo_url ? [{
          text: 'Quitar Fondo',
          style: 'destructive' as const,
          onPress: async () => {
            try {
              setIsUploadingImage(true);
              const { error } = await supabase
                .from('tableros')
                .update({ fondo_url: null })
                .eq('id', id);

              if (error) throw error;

              setTableroInfo({ ...tableroInfo, fondo_url: undefined });
              Alert.alert('Éxito', 'Fondo eliminado correctamente');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo quitar el fondo');
            } finally {
              setIsUploadingImage(false);
            }
          }
        }] : []),
        {
          text: 'Seleccionar de Galería',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la galería de fotos.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setIsUploadingImage(true);

                const publicUrl = await uploadImageToSupabase(uri, 'adjuntos', `tableros/${id}`);
                if (!publicUrl) throw new Error('No se pudo subir la imagen.');

                const { error } = await supabase
                  .from('tableros')
                  .update({ fondo_url: publicUrl })
                  .eq('id', id);

                if (error) throw error;

                setTableroInfo({ ...tableroInfo, fondo_url: publicUrl });
                Alert.alert('¡Éxito!', 'El fondo del tablero ha sido actualizado.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error al cambiar fondo');
            } finally {
              setIsUploadingImage(false);
            }
          }
        },
        {
          text: 'Tomar Foto (Cámara)',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setIsUploadingImage(true);

                const publicUrl = await uploadImageToSupabase(uri, 'adjuntos', `tableros/${id}`);
                if (!publicUrl) throw new Error('No se pudo subir la imagen.');

                const { error } = await supabase
                  .from('tableros')
                  .update({ fondo_url: publicUrl })
                  .eq('id', id);

                if (error) throw error;

                setTableroInfo({ ...tableroInfo, fondo_url: publicUrl });
                Alert.alert('¡Éxito!', 'El fondo del tablero ha sido actualizado.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error al cambiar fondo');
            } finally {
              setIsUploadingImage(false);
            }
          }
        }
      ]
    );
  };

  const { startTracking, stopTracking } = useLocation();

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (abrirTarjeta && listas.length > 0) {
      for (const lista of listas) {
        const tarjeta = lista.tarjetas.find(t => t.id === abrirTarjeta);
        if (tarjeta) {
          setTarjetaSeleccionada(tarjeta);
          router.setParams({ abrirTarjeta: undefined });
          break;
        }
      }
    }
  }, [abrirTarjeta, listas]);

  useFocusEffect(useCallback(() => { fetchKanbanData(); }, [id, userRol, permisosEspeciales, session?.user?.id]));

  const filteredListas = useMemo(() => {
    let baseListas = listas;
    if (userRol === 'empleado') baseListas = listas.filter(lista => lista.permisos_relacionales?.puede_ver === true);
    if (!searchQuery.trim()) return baseListas;
    const q = searchQuery.toLowerCase();
    return baseListas.map(lista => ({
      ...lista,
      tarjetas: lista.tarjetas.filter(t => {
        const vals = t.datos_valores || {};
        const nombre = (vals.nombreApellido || vals.nombre || vals.cliente || '').toLowerCase();
        const cedula = (vals.cedula || vals.documento || vals.rif || '').toLowerCase();
        return nombre.includes(q) || cedula.includes(q) || String(t.id).toLowerCase().includes(q);
      })
    }));
  }, [listas, searchQuery, userRol, permisosEspeciales]);

  const handleArchiveCard = async (tarjeta: Tarjeta) => {
    try {
      const { error } = await supabase.from('tarjetas').update({ estado_archivo: true }).eq('id', tarjeta.id);
      if (error) throw error;
      setListas(prev => prev.map(l => l.id === tarjeta.lista_id ? { ...l, tarjetas: l.tarjetas.filter(t => t.id !== tarjeta.id) } : l));
    } catch (e: any) { Alert.alert('Error', 'No se pudo archivar: ' + e.message); }
  };

  const autoMoverTarjeta = async (tarjetaActual: any, listaDestinoId: string) => {
    const targetLista = listas.find(l => l.id === listaDestinoId);
    const puedeVerDestino = userRol !== 'empleado' || targetLista?.permisos_relacionales?.puede_ver !== false;
    const previousListas = [...listas];
    try {
      setListas(prev => prev.map(lista => {
        if (lista.id === tarjetaActual.lista_id) return { ...lista, tarjetas: lista.tarjetas.filter(t => t.id !== tarjetaActual.id) };
        if (puedeVerDestino && lista.id === targetLista?.id) return { ...lista, tarjetas: [{ ...tarjetaActual, lista_id: targetLista!.id }, ...lista.tarjetas] };
        return lista;
      }));
      setTarjetaSeleccionada(null);
      const { error } = await supabase.rpc('mover_tarjeta_seguro', { p_tarjeta_id: tarjetaActual.id, p_lista_destino_id: listaDestinoId });
      if (error) throw error;
    } catch (error: any) {
      setListas(previousListas);
      Alert.alert('Error', 'La tarjeta no pudo moverse: ' + (error?.message || error));
      throw error;
    }
  };

  const handleDeleteCard = () => {
    if (!tarjetaEnMovimiento) return;
    Alert.alert("Eliminar Tarjeta", "¿Eliminar tarjeta de forma permanente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            const tarjetaId = tarjetaEnMovimiento.id;
            setTarjetaEnMovimiento(null);
            setListas(prev => prev.map(lista => ({ ...lista, tarjetas: lista.tarjetas.filter(t => t.id !== tarjetaId) })));
            await supabase.from('tarjetas').delete().eq('id', tarjetaId);
          } catch (e: any) { Alert.alert("Error", e.message); }
        }
      }
    ]);
  };

  const handleDuplicarTarjeta = async () => {
    if (!tarjetaEnMovimiento) return;
    try {
      const { id: _, created_at: __, perfiles: ___, listas: ____, ...tarjetaData } = tarjetaEnMovimiento;
      const nuevosDatosValores = { ...tarjetaData.datos_valores };
      if (nuevosDatosValores.nombre) nuevosDatosValores.nombre = `Copia - ${nuevosDatosValores.nombre}`;
      const tarjetaClonada = { ...tarjetaData, datos_valores: nuevosDatosValores };
      const { data, error } = await supabase.from('tarjetas').insert(tarjetaClonada).select().single();
      if (error) throw error;
      setListas(prev => prev.map(lista => lista.id === data.lista_id ? { ...lista, tarjetas: [...lista.tarjetas, data] } : lista));
      setTarjetaEnMovimiento(null);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const onUpdateTarjetaSeleccionada = async (nuevosDatos: any, targetCard?: Tarjeta | null) => {
    const cardToUpdate = targetCard || tarjetaSeleccionada;
    if (!cardToUpdate) return;
    try {
      const updatedDatosValores = { ...cardToUpdate.datos_valores, ...nuevosDatos };
      await supabase.from('tarjetas').update({ datos_valores: updatedDatosValores }).eq('id', cardToUpdate.id);
      setListas(prev => prev.map(lista => ({ ...lista, tarjetas: lista.tarjetas.map(t => t.id === cardToUpdate.id ? { ...t, datos_valores: updatedDatosValores } : t) })));
      if (tarjetaSeleccionada?.id === cardToUpdate.id) setTarjetaSeleccionada({ ...tarjetaSeleccionada, datos_valores: updatedDatosValores });
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (isLoading && !tableroInfo) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#B6C2CF" /></View>;
  }

  const renderContent = () => (
    <>
      <BoardHeader
        tableroInfo={tableroInfo}
        isSecondary={isSecondary === 'true'}
        isMobileSearchActive={isMobileSearchActive}
        setIsMobileSearchActive={setIsMobileSearchActive}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showBoardMenu={showBoardMenu}
        setShowBoardMenu={setShowBoardMenu}
        pendingCount={pendingCount}
        showSplitMenu={showSplitMenu}
        setShowSplitMenu={setShowSplitMenu}
        setModalMenuVisible={setModalMenuVisible}
        width={width}
        id={id}
      />
      {listas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyColumnText, { color: tableroInfo?.fondo_url ? '#FFF' : '#888' }]}>El tablero no tiene columnas (Listas).</Text>
        </View>
      ) : (
        <Reanimated.FlatList
          testID="board-scroll-view"
          ref={flatListRef}
          itemLayoutAnimation={LinearTransition.duration(200)}
          style={{ flex: 1 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!tarjetaEnMovimiento && !listaEnMovimiento}
          data={filteredListas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KanbanColumn
              item={item}
              tarjetaEnMovimiento={tarjetaEnMovimiento}
              setTarjetaEnMovimiento={setTarjetaEnMovimiento}
              handleMove={handleMove}
              openGestionLista={() => {}}
              baseOpacity={tableroInfo?.opacidad_listas ?? 0.85}
              listaEnMovimiento={listaEnMovimiento}
              setListaEnMovimiento={setListaEnMovimiento}
              handleSwapLists={handleSwapLists}
              setTarjetaSeleccionada={setTarjetaSeleccionada}
              setTarjetaAuditoria={setTarjetaAuditoria}
              onRightClickCard={(tarjeta, x, y) => setContextMenu({ visible: true, x, y, tarjeta })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        />
      )}
    </>
  );

  return (
    <View style={styles.container} ref={boardWrapperRef}>
      {tableroInfo?.fondo_url ? (
        <ImageBackground source={{ uri: tableroInfo.fondo_url }} style={{ flex: 1 }} resizeMode="cover">
          {renderContent()}
        </ImageBackground>
      ) : (
        renderContent()
      )}
      <ModalContextMenu contextMenu={contextMenu} onClose={() => setContextMenu({ ...contextMenu, visible: false })} userRol={userRol} listas={listas} tableroId={id} onAbrirTarjeta={(tarjeta) => setTarjetaSeleccionada(tarjeta)} onVerTrazabilidad={() => {}} onReasignarCaso={() => {}} onArchivarTarjeta={handleArchiveCard} />
      <ModalTableroMenu
        visible={modalMenuVisible}
        onClose={() => setModalMenuVisible(false)}
        tableroInfo={tableroInfo}
        miembros={miembros}
        toggleFavorite={async () => {
          if (!tableroInfo) return;
          const newFav = !tableroInfo.es_favorito;
          setTableroInfo({ ...tableroInfo, es_favorito: newFav });
          await supabase.from('tableros').update({ es_favorito: newFav }).eq('id', tableroInfo.id);
        }}
        handleCloneTablero={() => Alert.alert('Info', 'Lógica de clonado')}
        saveDescripcion={async () => {
          if (!tableroInfo) return;
          await supabase.from('tableros').update({ descripcion: tempDesc }).eq('id', tableroInfo.id);
          setTableroInfo({ ...tableroInfo, descripcion: tempDesc });
        }}
        tempDesc={tempDesc}
        setTempDesc={setTempDesc}
        fetchArchivedCards={async () => {
          const { data } = await supabase.from('tarjetas').select('*, listas!inner(nombre, tablero_id)').eq('listas.tablero_id', id).eq('estado_archivo', true);
          setTarjetasArchivadas(data || []);
          setModalArchivadasVisible(true);
        }}
        handleOpacityChange={(val) => tableroInfo && setTableroInfo({ ...tableroInfo, opacidad_listas: val })}
        saveOpacityConfig={async (val) => { await supabase.from('tableros').update({ opacidad_listas: val }).eq('id', id); }}
        handleCambiarFondo={handleCambiarFondo}
        isUploadingImage={isUploadingImage}
      />
      <BoardActionButtons tarjetaEnMovimiento={tarjetaEnMovimiento} listas={listas} userRol={userRol} onEdit={() => { setStartInEditMode(true); setTarjetaSeleccionada(tarjetaEnMovimiento); setTarjetaEnMovimiento(null); }} onDuplicar={handleDuplicarTarjeta} onDelete={handleDeleteCard} />
      <ModalDetalleTarjeta tarjetaSeleccionada={tarjetaSeleccionada} setTarjetaSeleccionada={(t) => { setTarjetaSeleccionada(t); if (!t) setStartInEditMode(false); }} startInEditMode={startInEditMode} listas={listas} miembros={miembros} onUpdateTarjeta={onUpdateTarjetaSeleccionada} autoMoverTarjeta={autoMoverTarjeta} nuevoComentario={nuevoComentario} setNuevoComentario={setNuevoComentario} handleEnviarComentario={handleEnviarComentario} />
      <ModalAuditoria visible={!!tarjetaAuditoria} tarjetaAuditoria={tarjetaAuditoria} onClose={() => setTarjetaAuditoria(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' },
  emptyColumnText: { textAlign: 'center', color: '#8C9BAB', marginTop: 16, marginBottom: 16 },
});
