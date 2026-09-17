import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronLeft, CloudUpload, Columns, Search, Settings, X, Boxes, SlidersHorizontal, Lock } from 'lucide-react-native';
import { router, Href } from 'expo-router';
import { TableroInfo } from '../../types/kanban';
import { BoardSearchBar } from './BoardSearchBar';
import { CriterioBusqueda } from '../../hooks/useKanbanFiltros';

interface BoardHeaderProps {
  tableroInfo: TableroInfo | null;
  isSecondary?: boolean;
  isMobileSearchActive: boolean;
  setIsMobileSearchActive: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  criterioBusqueda?: CriterioBusqueda;
  setCriterioBusqueda?: (val: CriterioBusqueda) => void;
  showBoardMenu: boolean;
  setShowBoardMenu: (val: boolean) => void;
  pendingCount: number;
  showSplitMenu: boolean;
  setShowSplitMenu: (val: boolean) => void;
  setModalMenuVisible: (val: boolean) => void;
  width: number;
  id: string;
  onOpenInventario?: () => void;
  onOpenFiltros?: () => void;
  isFiltroActivo?: boolean;
  resumenFiltro?: string;
}

export function BoardHeader({
  tableroInfo,
  isSecondary,
  isMobileSearchActive,
  setIsMobileSearchActive,
  searchQuery,
  setSearchQuery,
  criterioBusqueda = 'todos',
  setCriterioBusqueda,
  showBoardMenu,
  setShowBoardMenu,
  pendingCount,
  showSplitMenu,
  setShowSplitMenu,
  setModalMenuVisible,
  width,
  id,
  onOpenInventario,
  onOpenFiltros,
  isFiltroActivo = false,
  resumenFiltro = '',
}: BoardHeaderProps) {
  return (
    <View style={styles.header}>
      {width <= 600 && isMobileSearchActive ? (
        <BoardSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          criterioBusqueda={criterioBusqueda}
          setCriterioBusqueda={setCriterioBusqueda || (() => {})}
          isMobileActive
          onCloseMobile={() => setIsMobileSearchActive(false)}
        />
      ) : (
        <>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
              <ChevronLeft size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {tableroInfo?.nombre}
              </Text>
            </View>
            {!isSecondary && (
              <TouchableOpacity style={styles.boardSwitchBtn} onPress={() => setShowBoardMenu(!showBoardMenu)}>
                {width > 600 && <Text style={[styles.boardSwitchText, { color: '#FFF' }]}>Cambiar</Text>}
                <ChevronDown size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerActions}>
            {onOpenFiltros && (
              <TouchableOpacity
                onPress={onOpenFiltros}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isFiltroActivo ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0, 0, 0, 0.35)',
                  borderWidth: 1,
                  borderColor: isFiltroActivo ? '#3B82F6' : 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <SlidersHorizontal size={15} color={isFiltroActivo ? '#93C5FD' : '#E5E7EB'} />
                <Text
                  style={{
                    color: isFiltroActivo ? '#93C5FD' : '#E5E7EB',
                    fontWeight: 'bold',
                    fontSize: 12,
                    marginLeft: 6,
                  }}
                >
                  {isFiltroActivo ? `Filtros (${resumenFiltro || 'Activos'})` : 'Filtros'}
                </Text>
              </TouchableOpacity>
            )}

            {onOpenInventario && (
              <TouchableOpacity
                onPress={onOpenInventario}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <Boxes size={15} color="#E5E7EB" />
                <Text style={{ color: '#E5E7EB', fontWeight: 'bold', fontSize: 12, marginLeft: 6 }}>
                  Stock Inventario
                </Text>
              </TouchableOpacity>
            )}
            {isSecondary && (
              <TouchableOpacity
                style={[styles.boardSwitchBtn, { marginRight: 8, marginLeft: 0, paddingVertical: 6, paddingHorizontal: 10 }]}
                onPress={() => window.parent.postMessage({ type: 'CLOSE_SPLIT_VIEW' }, '*')}
              >
                <X size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, marginLeft: 6 }}>Cerrar</Text>
              </TouchableOpacity>
            )}

            {width > 600 ? (
              <BoardSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                criterioBusqueda={criterioBusqueda}
                setCriterioBusqueda={setCriterioBusqueda || (() => {})}
              />
            ) : (
              <TouchableOpacity onPress={() => setIsMobileSearchActive(true)} style={[styles.headerIconBtn, { marginRight: 4 }]}>
                <Search size={20} color="#FFF" />
              </TouchableOpacity>
            )}

            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <CloudUpload size={16} color="#DD6B20" style={{ marginRight: 4 }} />
                <Text style={styles.pendingBadgeText}>({pendingCount})</Text>
              </View>
            )}

            {tableroInfo?.tipo === 'privado' && (
              <TouchableOpacity onPress={() => router.push({ pathname: '/tablero/[id]/privacidad' as unknown as '/tablero/[id]', params: { id } } as unknown as Href)} style={styles.headerIconBtn}>
                <Lock size={18} color="#FFF" />
              </TouchableOpacity>
            )}

            {width > 800 && (
              <TouchableOpacity
                onPress={() => setShowSplitMenu(!showSplitMenu)}
                style={[styles.headerIconBtn, showSplitMenu ? { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 } : {}]}
              >
                <Columns size={20} color="#FFF" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setModalMenuVisible(true)} style={styles.headerIconBtn}>
              <Settings size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    overflow: 'visible',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitleBox: { flexShrink: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  boardSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boardSwitchText: {
    color: '#B6C2CF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 6 },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DD6B20',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DD6B20',
  },
});
