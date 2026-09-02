import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, ImageBackground,
  FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { useKanbanDragDrop } from '../../hooks/useKanbanDragDrop';
import { useTarjetaDetalle } from '../../hooks/useTarjetaDetalle';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { useLocation } from '../../context/LocationContext';
import { useKanbanCanvasPan } from '../../hooks/useKanbanCanvasPan';
import { useKanbanDataLoader } from '../../hooks/useKanbanDataLoader';
import { useKanbanFiltros } from '../../hooks/useKanbanFiltros';
import { useKanbanGestionLista } from '../../hooks/useKanbanGestionLista';
import { useKanbanFondoTablero } from '../../hooks/useKanbanFondoTablero';
import { useKanbanCardActions } from '../../hooks/useKanbanCardActions';
import { useKanbanTableroConfig } from '../../hooks/useKanbanTableroConfig';

import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { ModalAuditoria } from '../../components/kanban/modals/ModalAuditoria';
import { ModalContextMenu } from '../../components/kanban/modals/ModalContextMenu';
import { ModalArchivadas } from '../../components/kanban/modals/ModalArchivadas';
import { ModalTableroMenu } from '../../components/kanban/modals/ModalTableroMenu';
import { ModalGestionLista } from '../../components/kanban/modals/ModalGestionLista';
import { ModalCambiarTablero } from '../../components/kanban/modals/ModalCambiarTablero';
import { ModalPantallaDividida } from '../../components/kanban/modals/ModalPantallaDividida';
import { ModalInventarioAlmacen } from '../../components/kanban/modals/ModalInventarioAlmacen';
import { ModalTablerosArchivados } from '../../components/kanban/modals/ModalTablerosArchivados';
import { ModalDetalleTarjeta } from '../../components/kanban/ModalDetalleTarjeta';
import { ModalTrazabilidad } from '../../components/kanban/ModalTrazabilidad';
import { ModalFiltrosTablero, FILTROS_DEFAULT } from '../../components/kanban/modals/ModalFiltrosTablero';
import { BoardHeader } from '../../components/kanban/BoardHeader';
import { BoardActionButtons } from '../../components/kanban/BoardActionButtons';
import { Lista, Tarjeta } from '../../types/kanban';

export default function KanbanTableroScreen() {
  const { userRol, session, permisosEspeciales, empresaId, nombreCompleto, isDeveloper } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const canSeeAdmin = isDeveloper || ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(rolLower);
  const { id, isSecondary, abrirTarjeta, resaltarTarjeta, resaltarLista, resaltarTablero } =
    useLocalSearchParams<{ id: string; isSecondary?: string; abrirTarjeta?: string; resaltarTarjeta?: string; resaltarLista?: string; resaltarTablero?: string }>();

  // Resaltado temporal por parámetros de URL
  const [activeHighlightTarjeta, setActiveHighlightTarjeta] = useState<string | null>(null);
  const [activeHighlightLista, setActiveHighlightLista] = useState<string | null>(null);
  const tableroHighlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!resaltarTarjeta) return;
    setActiveHighlightTarjeta(resaltarTarjeta);
    const t = setTimeout(() => { setActiveHighlightTarjeta(null); router.setParams({ resaltarTarjeta: undefined }); }, 5000);
    return () => clearTimeout(t);
  }, [resaltarTarjeta]);
  useEffect(() => {
    if (!resaltarLista) return;
    setActiveHighlightLista(resaltarLista);
    const t = setTimeout(() => { setActiveHighlightLista(null); router.setParams({ resaltarLista: undefined }); }, 5000);
    return () => clearTimeout(t);
  }, [resaltarLista]);
  useEffect(() => {
    if (resaltarTablero !== 'true' && resaltarTablero !== '1') return;
    tableroHighlightAnim.setValue(1);
    Animated.sequence([
      Animated.delay(3000),
      Animated.timing(tableroHighlightAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ]).start();
    const t = setTimeout(() => { router.setParams({ resaltarTablero: undefined }); }, 5000);
    return () => clearTimeout(t);
  }, [resaltarTablero]);

  // Data principal + layout
  const { isLoading, tableroInfo, setTableroInfo, listas, setListas, tablerosDisponibles, miembros, fetchKanbanData } =
    useKanbanDataLoader({ id, session, userRol, permisosEspeciales, empresaId });
  const [startInEditMode, setStartInEditMode] = useState(false);
  const { pendingCount } = useSyncQueue();
  const boardWrapperRef = useRef<View>(null);
  const flatListRef = useRef<FlatList<Lista>>(null);
  const { width } = useWindowDimensions();
  useKanbanCanvasPan(boardWrapperRef, flatListRef, isLoading, tableroInfo);

  const { tarjetaEnMovimiento, setTarjetaEnMovimiento, listaEnMovimiento, setListaEnMovimiento, handleMove, handleSwapLists } =
    useKanbanDragDrop({ listas, setListas, tableroInfo });
  const { tarjetaSeleccionada, setTarjetaSeleccionada, tarjetaAuditoria, setTarjetaAuditoria, nuevoComentario, setNuevoComentario, handleEnviarComentario } =
    useTarjetaDetalle(session, userRol, setListas);
  const [tarjetaTrazabilidad, setTarjetaTrazabilidad] = useState<Tarjeta | null>(null);
  // UI state — modales globales
  const [modalMenuVisible, setModalMenuVisible] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [secondaryBoardId, setSecondaryBoardId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; tarjeta: Tarjeta | null }>({ visible: false, x: 0, y: 0, tarjeta: null });
  const [modalInventarioVisible, setModalInventarioVisible] = useState(false);
  const [modalHistorialVisible, setModalHistorialVisible] = useState(false);
  // Hooks especializados
  const filtros       = useKanbanFiltros({ listas, userRol });
  const gestionLista  = useKanbanGestionLista({ setListas, fetchKanbanData, tablerosDisponibles });
  const fondoTablero  = useKanbanFondoTablero({ tableroInfo, setTableroInfo, id });
  const cardActions   = useKanbanCardActions({
    state:   { listas, tarjetaSeleccionada, tarjetaEnMovimiento },
    setters: { setListas, setTarjetaSeleccionada, setTarjetaEnMovimiento },
    auth:    { session, nombreCompleto, userRol },
    tableroId: id,
  });
  const tableroConfig = useKanbanTableroConfig({ tableroInfo, setTableroInfo, listas, id, fetchKanbanData });

  const isCobranzaBoard = tableroInfo?.tipo === 'cobranza' ||
    listas.some(l => { const n = (l.nombre || '').toLowerCase(); return n.includes('cobranza') || n.includes('recupero'); });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CLOSE_SPLIT_VIEW') setSecondaryBoardId(null);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const { startTracking, stopTracking } = useLocation();
  useEffect(() => { startTracking(); return () => stopTracking(); }, []);
  useEffect(() => {
    if (!abrirTarjeta || listas.length === 0) return;
    for (const lista of listas) {
      const tarjeta = lista.tarjetas.find(t => t.id === abrirTarjeta);
      if (tarjeta) { setTarjetaSeleccionada(tarjeta); router.setParams({ abrirTarjeta: undefined }); break; }
    }
  }, [abrirTarjeta, listas]);
  useFocusEffect(useCallback(() => { fetchKanbanData(); }, [id, userRol, permisosEspeciales, session?.user?.id]));

  if (isLoading && !tableroInfo) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#B6C2CF" /></View>;
  }

  const renderContent = () => (
    <>
      <BoardHeader
        tableroInfo={tableroInfo}
        isSecondary={isSecondary === 'true'}
        isMobileSearchActive={filtros.isMobileSearchActive}
        setIsMobileSearchActive={filtros.setIsMobileSearchActive}
        searchQuery={filtros.searchQuery}
        setSearchQuery={filtros.setSearchQuery}
        showBoardMenu={showBoardMenu}
        setShowBoardMenu={setShowBoardMenu}
        pendingCount={pendingCount}
        showSplitMenu={showSplitMenu}
        setShowSplitMenu={setShowSplitMenu}
        setModalMenuVisible={setModalMenuVisible}
        width={width}
        id={id}
        onOpenInventario={canSeeAdmin && (tableroInfo?.tipo === 'almacen' || listas.some(l => l.nombre === 'Carga de Materiales')) ? () => setModalInventarioVisible(true) : undefined}
        onOpenFiltros={() => filtros.setModalFiltrosVisible(true)}
        isFiltroActivo={filtros.isFiltroActivo}
        resumenFiltro={filtros.resumenFiltro}
      />
      {tableroInfo?.tipo === 'almacen' && !canSeeAdmin ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyColumnText, { color: '#FFF', fontSize: 16, fontWeight: 'bold' }]}>Acceso Restringido</Text>
          <Text style={[styles.emptyColumnText, { color: '#8C9BAB', marginTop: 8 }]}>El módulo de Almacén es de acceso exclusivo para administración.</Text>
        </View>
      ) : listas.length === 0 ? (
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
          data={filtros.filteredListas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KanbanColumn
              item={item}
              tarjetaEnMovimiento={tarjetaEnMovimiento}
              setTarjetaEnMovimiento={setTarjetaEnMovimiento}
              handleMove={handleMove}
              openGestionLista={(lista, x, y) => gestionLista.openGestionLista(lista, x, y)}
              baseOpacity={tableroInfo?.opacidad_listas ?? 0.85}
              listaEnMovimiento={listaEnMovimiento}
              setListaEnMovimiento={setListaEnMovimiento}
              handleSwapLists={handleSwapLists}
              setTarjetaSeleccionada={setTarjetaSeleccionada}
              setTarjetaAuditoria={setTarjetaAuditoria}
              onRightClickCard={(tarjeta, x, y) => setContextMenu({ visible: true, x, y, tarjeta })}
              resaltadaListaId={activeHighlightLista}
              resaltadaTarjetaId={activeHighlightTarjeta}
              onRefreshKanbanData={fetchKanbanData}
              isCobranzaBoard={isCobranzaBoard}
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
        ) : renderContent()}
      </View>
      {secondaryBoardId && (
        <View style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: '#384148', backgroundColor: '#1D2125' }}>
          {Platform.OS === 'web' ? (
            <iframe src={`/tablero/${secondaryBoardId}?isSecondary=true`} style={{ width: '100%', height: '100%', border: 'none' } as React.CSSProperties} />
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
      <ModalContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        userRol={userRol}
        listas={listas}
        tableroId={id}
        onAbrirTarjeta={(tarjeta) => setTarjetaSeleccionada(tarjeta)}
        onVerTrazabilidad={(t) => setTarjetaTrazabilidad(t)}
        onReasignarCaso={() => {}}
        onArchivarTarjeta={cardActions.handleArchiveCard}
        onEliminarTarjeta={cardActions.handleDeleteCardDirecta}
      />
      <ModalTableroMenu
        visible={modalMenuVisible}
        onClose={() => setModalMenuVisible(false)}
        tableroInfo={tableroInfo}
        miembros={miembros}
        toggleFavorite={tableroConfig.toggleFavorite}
        handleCloneTablero={() => Alert.alert('Info', 'Lógica de clonado')}
        saveDescripcion={tableroConfig.saveDescripcion}
        tempDesc={tableroConfig.tempDesc} setTempDesc={tableroConfig.setTempDesc}
        fetchArchivedCards={tableroConfig.fetchArchivedCards}
        handleOpacityChange={tableroConfig.handleOpacityChange} saveOpacityConfig={tableroConfig.saveOpacityConfig}
        handleCambiarFondo={fondoTablero.handleCambiarFondo} isUploadingImage={fondoTablero.isUploadingImage}
        isCobranzaBoard={isCobranzaBoard}
        onArchivarTablero={isCobranzaBoard ? () => cardActions.handleArchivarTablero(tableroInfo?.nombre || 'Cobranza') : undefined}
        onVerHistorial={isCobranzaBoard ? () => { setModalMenuVisible(false); setModalHistorialVisible(true); } : undefined}
      />
      <ModalGestionLista
        visible={gestionLista.modalListaVisible}
        onClose={() => gestionLista.setModalListaVisible(false)}
        gestionMenuPos={gestionLista.gestionMenuPos}
        gestionMenuAction={gestionLista.gestionMenuAction} setGestionMenuAction={gestionLista.setGestionMenuAction}
        listaActiva={gestionLista.listaActivaGestion}
        editListaNombre={gestionLista.editListaNombre} setEditListaNombre={gestionLista.setEditListaNombre}
        editListaColor={gestionLista.editListaColor} setEditListaColor={gestionLista.setEditListaColor}
        handleActualizarLista={gestionLista.handleActualizarLista}
        handleArchivarLista={gestionLista.handleArchivarLista}
        tablerosDisponibles={tablerosDisponibles}
        selectedTableroId={gestionLista.selectedTableroId} setSelectedTableroId={gestionLista.setSelectedTableroId}
        handleMoverListaTablero={gestionLista.handleMoverListaTablero}
      />
      <ModalArchivadas
        visible={tableroConfig.modalArchivadasVisible}
        onClose={() => tableroConfig.setModalArchivadasVisible(false)}
        tarjetasArchivadas={tableroConfig.tarjetasArchivadas}
        listasArchivadas={tableroConfig.listasArchivadas}
        restoreCard={tableroConfig.handleRestoreCard}
        restoreList={tableroConfig.handleRestoreList}
      />
      <BoardActionButtons
        tarjetaEnMovimiento={tarjetaEnMovimiento}
        listas={listas}
        userRol={userRol}
        onEdit={() => { setStartInEditMode(true); setTarjetaSeleccionada(tarjetaEnMovimiento); setTarjetaEnMovimiento(null); }}
        onDuplicar={cardActions.handleDuplicarTarjeta}
        onDelete={cardActions.handleDeleteCard}
      />
      <ModalDetalleTarjeta
        tarjetaSeleccionada={tarjetaSeleccionada}
        setTarjetaSeleccionada={(t) => { setTarjetaSeleccionada(t); if (!t) setStartInEditMode(false); }}
        startInEditMode={startInEditMode}
        listas={listas}
        miembros={miembros}
        onUpdateTarjeta={cardActions.onUpdateTarjetaSeleccionada}
        autoMoverTarjeta={cardActions.autoMoverTarjeta}
        nuevoComentario={nuevoComentario}
        setNuevoComentario={setNuevoComentario}
        handleEnviarComentario={handleEnviarComentario}
        onOpenTrazabilidad={(t) => setTarjetaTrazabilidad(t)}
        isResaltada={!!activeHighlightTarjeta}
      />
      <ModalAuditoria visible={!!tarjetaAuditoria} tarjetaAuditoria={tarjetaAuditoria} onClose={() => setTarjetaAuditoria(null)} />
      <ModalTrazabilidad visible={!!tarjetaTrazabilidad} tarjeta={tarjetaTrazabilidad} onClose={() => setTarjetaTrazabilidad(null)} />
      <ModalFiltrosTablero
        visible={filtros.modalFiltrosVisible}
        onClose={() => filtros.setModalFiltrosVisible(false)}
        filtros={filtros.filtrosTablero}
        setFiltros={filtros.setFiltrosTablero}
        onLimpiar={() => filtros.setFiltrosTablero(FILTROS_DEFAULT)}
        isCobranzaBoard={isCobranzaBoard}
        listas={listas}
      />
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
      <ModalInventarioAlmacen visible={modalInventarioVisible} onClose={() => setModalInventarioVisible(false)} />
      <ModalTablerosArchivados visible={modalHistorialVisible} onClose={() => setModalHistorialVisible(false)} empresaId={empresaId} />
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
