import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronLeft, CloudUpload, Columns, Search, Settings, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { TableroInfo } from '../../types/kanban';

interface BoardHeaderProps {
  tableroInfo: TableroInfo | null;
  isSecondary?: boolean;
  isMobileSearchActive: boolean;
  setIsMobileSearchActive: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showBoardMenu: boolean;
  setShowBoardMenu: (val: boolean) => void;
  pendingCount: number;
  showSplitMenu: boolean;
  setShowSplitMenu: (val: boolean) => void;
  setModalMenuVisible: (val: boolean) => void;
  width: number;
  id: string;
}

export function BoardHeader({
  tableroInfo,
  isSecondary,
  isMobileSearchActive,
  setIsMobileSearchActive,
  searchQuery,
  setSearchQuery,
  showBoardMenu,
  setShowBoardMenu,
  pendingCount,
  showSplitMenu,
  setShowSplitMenu,
  setModalMenuVisible,
  width,
  id,
}: BoardHeaderProps) {
  return (
    <View style={styles.header}>
      {width <= 600 && isMobileSearchActive ? (
        <View style={styles.mobileSearchBox}>
          <Search size={18} color="#9FADBC" />
          <TextInput
            style={styles.mobileSearchInput as any}
            placeholder="Buscar tarjeta..."
            placeholderTextColor="#9FADBC"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setIsMobileSearchActive(false);
            }}
          >
            <X size={20} color="#9FADBC" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
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
              <View style={styles.desktopSearchBox}>
                <Search size={16} color="#FFF" />
                <TextInput
                  style={styles.desktopSearchInput as any}
                  placeholder="Buscar..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
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
              <TouchableOpacity onPress={() => router.push(`/tablero/${id}/privacidad` as any)} style={styles.headerIconBtn}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
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
  mobileSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282E33',
    borderRadius: 8,
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
  },
  mobileSearchInput: {
    flex: 1,
    color: '#FFF',
    marginLeft: 8,
    outlineStyle: 'none',
    paddingVertical: 0,
  } as any,
  desktopSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
    height: 32,
  },
  desktopSearchInput: {
    color: '#FFF',
    paddingVertical: 0,
    paddingHorizontal: 8,
    minWidth: 200,
    height: '100%',
    outlineStyle: 'none',
  } as any,
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
