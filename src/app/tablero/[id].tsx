import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
import { ModalGestionLista } from '../../components/kanban/modals/ModalGestionLista';
import { ModalCambiarTablero } from '../../components/kanban/modals/ModalCambiarTablero';
import { ModalPantallaDividida } from '../../components/kanban/modals/ModalPantallaDividida';
import { ModalDetalleTarjeta } from '../../components/kanban/ModalDetalleTarjeta';
import { ModalTrazabilidad } from '../../components/kanban/ModalTrazabilidad';
import { BoardHeader } from '../../components/kanban/BoardHeader';
import { BoardActionButtons } from '../../components/kanban/BoardActionButtons';

export default function KanbanTableroScreen() {
  const { userRol, session, permisosEspeciales, empresaId, nombreCompleto } = useAuth();
  const { id, isSecondary, abrirTarjeta, resaltarTarjeta, resaltarLista, resaltarTablero } = useLocalSearchParams<{ id: string, isSecondary?: string, abrirTarjeta?: string, resaltarTarjeta?: string, resaltarLista?: string, resaltarTablero?: string }>();

  const [activeHighlightTarjeta, setActiveHighlightTarjeta] = useState<string | null>(null);
  const [activeHighlightLista, setActiveHighlightLista] = useState<string | null>(null);
  const tableroHighlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (resaltarTarjeta) {
      setActiveHighlightTarjeta(resaltarTarjeta);
      const t = setTimeout(() => { setActiveHighlightTarjeta(null); router.setParams({ resaltarTarjeta: undefined }); }, 5000);
      return () => clearTimeout(t);
    }
  }, [resaltarTarjeta]);

  useEffect(() => {
    if (resaltarLista) {
      setActiveHighlightLista(resaltarLista);
      const t = setTimeout(() => { setActiveHighlightLista(null); router.setParams({ resaltarLista: undefined }); }, 5000);
      return () => clearTimeout(t);
    }
  }, [resaltarLista]);

  useEffect(() => {
    if (resaltarTablero === 'true' || resaltarTablero === '1') {
      tableroHighlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(tableroHighlightAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
      const t = setTimeout(() => { router.setParams({ resaltarTablero: undefined }); }, 5000);
      return () => clearTimeout(t);
    }
  }, [resaltarTablero]);

  const { isLoading, tableroInfo, setTableroInfo, listas, setListas, tablerosDisponibles, miembros, fetchKanbanData } = useKanbanDataLoader({ id, session, userRol, permisosEspeciales, empresaId });

  const [startInEditMode, setStartInEditMode] = useState(false);
  const { pendingCount } = useSyncQueue();

  const boardWrapperRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);
  const { width } = useWindowDimensions();

  useKanbanCanvasPan(boardWrapperRef, flatListRef, isLoading, tableroInfo);

  const { tarjetaEnMovimiento, setTarjetaEnMovimiento, listaEnMovimiento, setListaEnMovimiento, handleMove, handleSwapLists } = useKanbanDragDrop({ listas, setListas, tableroInfo });

  const { tarjetaSeleccionada, setTarjetaSeleccionada, tarjetaAuditoria, setTarjetaAuditoria, nuevoComentario, setNuevoComentario, handleEnviarComentario } = useTarjetaDetalle(session, userRol, setListas);
  const [tarjetaTrazabilidad, setTarjetaTrazabilidad] = useState<Tarjeta | null>(null);

  const [modalMenuVisible, setModalMenuVisible] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [modalArchivadasVisible, setModalArchivadasVisible] = useState(false);
  const [tarjetasArchivadas, setTarjetasArchivadas] = useState<any[]>([]);
  const [listasArchivadas, setListasArchivadas] = useState<any[]>([]);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [secondaryBoardId, setSecondaryBoardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, tarjeta: Tarjeta | null }>({ visible: false, x: 0, y: 0, tarjeta: null });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'CLOSE_SPLIT_VIEW') {
          setSecondaryBoardId(null);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const handleRestoreCard = async (cardId: string) => {
    try {
      const { error } = await supabase.from('tarjetas').update({ estado_archivo: false }).eq('id', cardId);
      if (error) throw error;
      setTarjetasArchivadas(prev => prev.filter(t => t.id !== cardId));
      fetchKanbanData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleRestoreList = async (listaId: string) => {
    try {
      const { error } = await supabase.from('listas').update({ estado_archivo: false }).eq('id', listaId);
      if (error) throw error;
      setListasArchivadas(prev => prev.filter(l => l.id !== listaId));
      fetchKanbanData();
      if (Platform.OS === 'web') alert('¡Lista desarchivada y restaurada en el tablero!');
      else Alert.alert('Éxito', '¡Lista desarchivada y restaurada en el tablero!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const [modalListaVisible, setModalListaVisible] = useState(false);
  const [listaActivaGestion, setListaActivaGestion] = useState<Lista | null>(null);
  const [gestionMenuPos, setGestionMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [gestionMenuAction, setGestionMenuAction] = useState<'main' | 'rename' | 'color' | 'move'>('main');
  const [editListaNombre, setEditListaNombre] = useState('');
  const [editListaColor, setEditListaColor] = useState('');
  const [selectedTableroId, setSelectedTableroId] = useState('');

  const openGestionLista = (lista: Lista, x?: number, y?: number) => {
    setListaActivaGestion(lista);
    setEditListaNombre(lista.nombre);
    setEditListaColor(lista.color_fondo || '#22272B');
    setGestionMenuAction('main');
    if (x !== undefined && y !== undefined) {
      setGestionMenuPos({ x, y });
    } else {
      setGestionMenuPos(null);
    }
    setModalListaVisible(true);
  };

  const handleActualizarLista = async () => {
    if (!listaActivaGestion) return;
    try {
      const payload: any = {};
      if (gestionMenuAction === 'rename') payload.nombre = editListaNombre;
      if (gestionMenuAction === 'color') payload.color_fondo = editListaColor;

      const { error } = await supabase.from('listas').update(payload).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.map(l => l.id === listaActivaGestion.id ? { ...l, ...payload } : l));
      setModalListaVisible(false);
      Alert.alert('¡Éxito!', 'Lista actualizada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar la lista.');
    }
  };

  const handleArchivarLista = async () => {
    if (!listaActivaGestion) return;
    try {
      const { error } = await supabase.from('listas').update({ estado_archivo: true }).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.filter(l => l.id !== listaActivaGestion.id));
      setModalListaVisible(false);
      Alert.alert('Éxito', 'Lista archivada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo archivar la lista.');
    }
  };

  const handleMoverListaTablero = async () => {
    if (!listaActivaGestion || !selectedTableroId) return;
    try {
      const { error } = await supabase.from('listas').update({ tablero_id: selectedTableroId }).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.filter(l => l.id !== listaActivaGestion.id));
      setModalListaVisible(false);
      Alert.alert('Éxito', 'Lista movida al tablero seleccionado.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo mover la lista.');
    }
  };

  const handleCambiarFondo = async () => {
    if (!tableroInfo) return;

    if (Platform.OS === 'web') {
      try {
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
          alert('¡Éxito! El fondo del tablero ha sido actualizado.');
        }
      } catch (e: any) {
        alert('Error: ' + (e.message || 'Error al cambiar fondo'));
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

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
      const oldValues = cardToUpdate.datos_valores || {};
      const modificaciones: any[] = [];

      Object.keys(nuevosDatos).forEach(key => {
        if (key === 'historial_auditoria') return;
        const valAnterior = oldValues[key];
        const valNuevo = nuevosDatos[key];

        if (JSON.stringify(valAnterior) !== JSON.stringify(valNuevo)) {
          modificaciones.push({
            campo: key,
            valor_anterior: valAnterior !== undefined && valAnterior !== null && valAnterior !== '' ? valAnterior : 'Vacío',
            valor_nuevo: valNuevo !== undefined && valNuevo !== null && valNuevo !== '' ? valNuevo : 'Vacío',
          });
        }
      });

      let historialNuevo = Array.isArray(oldValues.historial_auditoria) ? [...oldValues.historial_auditoria] : [];

      if (modificaciones.length > 0) {
        const autorNombre = nombreCompleto || session?.user?.email || 'Usuario Registrado';
        const nuevaEntradaAuditoria = {
          id: Date.now().toString(),
          autor: autorNombre,
          fecha: new Date().toISOString(),
          tipo: 'edicion',
          modificaciones,
        };
        historialNuevo.push(nuevaEntradaAuditoria);
      }

      const updatedDatosValores = {
        ...oldValues,
        ...nuevosDatos,
        historial_auditoria: historialNuevo,
      };

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
              openGestionLista={(lista, x, y) => openGestionLista(lista, x, y)}
              baseOpacity={tableroInfo?.opacidad_listas ?? 0.85}
              listaEnMovimiento={listaEnMovimiento}
              setListaEnMovimiento={setListaEnMovimiento}
              handleSwapLists={handleSwapLists}
              setTarjetaSeleccionada={setTarjetaSeleccionada}
              setTarjetaAuditoria={setTarjetaAuditoria}
              onRightClickCard={(tarjeta, x, y) => setContextMenu({ visible: true, x, y, tarjeta })}
              resaltadaListaId={activeHighlightLista}
              resaltadaTarjetaId={activeHighlightTarjeta}
            />
          )}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        />
      )}
    </>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={styles.container} ref={boardWrapperRef}>
        <Animated.View pointerEvents="none" style={[styles.tableroHighlightOverlay, { opacity: tableroHighlightAnim }]} />
        {tableroInfo?.fondo_url ? (
          <ImageBackground source={{ uri: tableroInfo.fondo_url }} style={{ flex: 1 }} resizeMode="cover">
            {renderContent()}
          </ImageBackground>
        ) : (
          renderContent()
        )}
      </View>

      {secondaryBoardId && (
        <View style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: '#384148', backgroundColor: '#1D2125' }}>
          {Platform.OS === 'web' ? (
            <iframe
              src={`/tablero/${secondaryBoardId}?isSecondary=true`}
              style={{ width: '100%', height: '100%', border: 'none' } as any}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 16, marginBottom: 12 }}>Pantalla Dividida Activa</Text>
              <TouchableOpacity onPress={() => setSecondaryBoardId(null)} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#E53E3E', borderRadius: 8 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Cerrar Pantalla Dividida</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <ModalContextMenu contextMenu={contextMenu} onClose={() => setContextMenu({ ...contextMenu, visible: false })} userRol={userRol} listas={listas} tableroId={id} onAbrirTarjeta={(tarjeta) => setTarjetaSeleccionada(tarjeta)} onVerTrazabilidad={(t) => setTarjetaTrazabilidad(t)} onReasignarCaso={() => {}} onArchivarTarjeta={handleArchiveCard} />
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
          const { data: dataCards } = await supabase.from('tarjetas').select('*, perfiles(nombre_completo)').in('lista_id', listas.map(l => l.id)).eq('estado_archivo', true);
          setTarjetasArchivadas(dataCards || []);

          const { data: dataLists } = await supabase.from('listas').select('*').eq('tablero_id', id).eq('estado_archivo', true);
          setListasArchivadas(dataLists || []);

          setModalArchivadasVisible(true);
        }}
        handleOpacityChange={(val) => tableroInfo && setTableroInfo({ ...tableroInfo, opacidad_listas: val })}
        saveOpacityConfig={async (val) => { await supabase.from('tableros').update({ opacidad_listas: val }).eq('id', id); }}
        handleCambiarFondo={handleCambiarFondo}
        isUploadingImage={isUploadingImage}
      />
      <ModalGestionLista
        visible={modalListaVisible}
        onClose={() => setModalListaVisible(false)}
        gestionMenuPos={gestionMenuPos}
        gestionMenuAction={gestionMenuAction}
        setGestionMenuAction={setGestionMenuAction}
        listaActiva={listaActivaGestion}
        editListaNombre={editListaNombre}
        setEditListaNombre={setEditListaNombre}
        editListaColor={editListaColor}
        setEditListaColor={setEditListaColor}
        handleActualizarLista={handleActualizarLista}
        handleArchivarLista={handleArchivarLista}
        tablerosDisponibles={tablerosDisponibles}
        selectedTableroId={selectedTableroId}
        setSelectedTableroId={setSelectedTableroId}
        handleMoverListaTablero={handleMoverListaTablero}
      />
      <ModalArchivadas
        visible={modalArchivadasVisible}
        onClose={() => setModalArchivadasVisible(false)}
        tarjetasArchivadas={tarjetasArchivadas}
        listasArchivadas={listasArchivadas}
        restoreCard={handleRestoreCard}
        restoreList={handleRestoreList}
      />
      <BoardActionButtons tarjetaEnMovimiento={tarjetaEnMovimiento} listas={listas} userRol={userRol} onEdit={() => { setStartInEditMode(true); setTarjetaSeleccionada(tarjetaEnMovimiento); setTarjetaEnMovimiento(null); }} onDuplicar={handleDuplicarTarjeta} onDelete={handleDeleteCard} />
      <ModalDetalleTarjeta tarjetaSeleccionada={tarjetaSeleccionada} setTarjetaSeleccionada={(t) => { setTarjetaSeleccionada(t); if (!t) setStartInEditMode(false); }} startInEditMode={startInEditMode} listas={listas} miembros={miembros} onUpdateTarjeta={onUpdateTarjetaSeleccionada} autoMoverTarjeta={autoMoverTarjeta} nuevoComentario={nuevoComentario} setNuevoComentario={setNuevoComentario} handleEnviarComentario={handleEnviarComentario} onOpenTrazabilidad={(t) => setTarjetaTrazabilidad(t)} isResaltada={!!activeHighlightTarjeta} />
      <ModalAuditoria visible={!!tarjetaAuditoria} tarjetaAuditoria={tarjetaAuditoria} onClose={() => setTarjetaAuditoria(null)} />
      <ModalTrazabilidad visible={!!tarjetaTrazabilidad} tarjeta={tarjetaTrazabilidad} onClose={() => setTarjetaTrazabilidad(null)} />
      <ModalCambiarTablero
        visible={showBoardMenu}
        onClose={() => setShowBoardMenu(false)}
        tablerosDisponibles={tablerosDisponibles}
        tableroActualId={id}
        tableroInfo={tableroInfo}
      />
      <ModalPantallaDividida
        visible={showSplitMenu}
        onClose={() => setShowSplitMenu(false)}
        tablerosDisponibles={tablerosDisponibles}
        tableroActualId={id}
        onSeleccionarSecundario={(secId) => setSecondaryBoardId(secId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' },
  emptyColumnText: { textAlign: 'center', color: '#8C9BAB', marginTop: 16, marginBottom: 16 },
  tableroHighlightOverlay: {
    ...StyleSheet.absoluteFill,
    borderColor: '#0C66E4',
    borderWidth: 3,
    shadowColor: '#579DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    zIndex: 10,
  },
});
