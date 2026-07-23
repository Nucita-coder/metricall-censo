import { router } from 'expo-router';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import { KANBAN_THEME } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Lista, Tarjeta } from '../../types/kanban';
import { KanbanCard } from './KanbanCard';

export interface KanbanColumnProps {
  item: Lista;
  tarjetaEnMovimiento: Tarjeta | null;
  setTarjetaEnMovimiento: (t: Tarjeta | null) => void;
  handleMove: (id: string) => void;
  openGestionLista: (lista: Lista, x?: number, y?: number) => void;
  baseOpacity: number;
  listaEnMovimiento: Lista | null;
  setListaEnMovimiento: (l: Lista | null) => void;
  handleSwapLists: (id: string) => void;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  setTarjetaAuditoria: (t: Tarjeta | null) => void;
  onRightClickCard?: (item: Tarjeta, x: number, y: number) => void;
  resaltadaListaId?: string | null;
  resaltadaTarjetaId?: string | null;
}

const KanbanColumnComponent = ({
  item,
  tarjetaEnMovimiento,
  setTarjetaEnMovimiento,
  handleMove,
  openGestionLista,
  baseOpacity,
  listaEnMovimiento,
  setListaEnMovimiento,
  handleSwapLists,
  setTarjetaSeleccionada,
  setTarjetaAuditoria,
  onRightClickCard,
  resaltadaListaId,
  resaltadaTarjetaId,
}: KanbanColumnProps) => {
  const isMoveMode = tarjetaEnMovimiento !== null;
  const isSourceColumn = isMoveMode && tarjetaEnMovimiento.lista_id === item.id;
  const isDestinationColumn = isMoveMode && !isSourceColumn;

  const isMoveListMode = listaEnMovimiento !== null;
  const isMovingThisList = isMoveListMode && listaEnMovimiento.id === item.id;

  const { userRol } = useAuth();
  const puedeCrear = userRol !== 'empleado' || item.permisos_relacionales?.puede_crear === true;

  const dotsRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (resaltadaListaId === item.id) {
      highlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [resaltadaListaId, item.id]);

  useEffect(() => {
    let targetScale = 1;
    let targetOpacity = 1;

    if (isMoveMode) {
      if (isSourceColumn) {
        targetScale = 0.96;
        targetOpacity = 0.7;
      } else if (isDestinationColumn) {
        targetScale = 1.02;
        targetOpacity = 1;
      }
    }

    if (isMoveListMode) {
      if (isMovingThisList) {
        targetScale = 1.05;
        targetOpacity = 0.9;
      } else {
        targetScale = 0.98;
        targetOpacity = 0.6;
      }
    }

    Animated.spring(scaleAnim, {
      toValue: targetScale,
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();

    Animated.timing(opacityAnim, {
      toValue: targetOpacity,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isMoveMode, isSourceColumn, isDestinationColumn, isMoveListMode, isMovingThisList]);

  const getDynamicBgColor = () => {
    if (!item.color_fondo) return `rgba(255, 255, 255, ${baseOpacity})`;
    if (item.color_fondo.startsWith('rgba')) {
      return item.color_fondo.replace(/[\d.]+\)$/, `${baseOpacity})`);
    }
    return item.color_fondo;
  };

  const bgColor = getDynamicBgColor();

  return (
    <View style={styles.kanbanColumnWrapper}>
      <Pressable
        onPress={() => {
          if (isDestinationColumn) {
            handleMove(item.id);
          } else if (isMoveListMode && !isMovingThisList) {
            handleSwapLists(item.id);
          }
        }}
        disabled={(!isDestinationColumn) && !(isMoveListMode && !isMovingThisList)}
        style={{ flex: 1 }}
      >
        <Animated.View style={[
          styles.kanbanColumn,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: bgColor,
            elevation: isMovingThisList ? 10 : 0,
            shadowOpacity: isMovingThisList ? 0.3 : 0,
            shadowRadius: isMovingThisList ? 10 : 0,
          },
        ]}>
          <Animated.View pointerEvents="none" style={[styles.columnHighlightOverlay, { opacity: highlightAnim }]} />
          <View style={[styles.columnHeader, { borderTopColor: item.color || '#000' }]}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onLongPress={() => {
                if (!isMoveMode && !isMoveListMode) {
                  setListaEnMovimiento(item);
                }
              }}
              onPress={() => {
                if (isMoveListMode && !isMovingThisList) {
                  handleSwapLists(item.id);
                }
              }}
              activeOpacity={0.7}
              disabled={isMoveMode || (isMoveListMode && isMovingThisList)}
            >
              <Text style={styles.columnTitle} numberOfLines={1}>
                {item.nombre}
              </Text>

              <Text style={styles.columnCount}>{item.tarjetas.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              ref={dotsRef}
              style={styles.moreBtn}
              onPress={() => {
                dotsRef.current?.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                  openGestionLista(item, px, py + height);
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreHorizontal size={20} color="#718096" />
            </TouchableOpacity>
          </View>

          <Reanimated.FlatList
            itemLayoutAnimation={LinearTransition.duration(200)}
            style={{ flex: 1 }}
            data={item.tarjetas}
            keyExtractor={(t) => t.id}
            removeClippedSubviews={true}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            renderItem={({ item: t }) => (
              <KanbanCard
                item={t}
                tarjetaEnMovimiento={tarjetaEnMovimiento}
                setTarjetaEnMovimiento={setTarjetaEnMovimiento}
                listaEnMovimiento={listaEnMovimiento}
                setTarjetaSeleccionada={setTarjetaSeleccionada}
                setTarjetaAuditoria={setTarjetaAuditoria}
                isLiberada={t.datos_valores?.estadoLiberacion === 'bloqueada'}
                listaNombre={item.nombre}
                onRightClick={onRightClickCard}
                isResaltada={t.id === resaltadaTarjetaId}
              />
            )}
            showsVerticalScrollIndicator={false}
            directionalLockEnabled={true}
            contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
            ListFooterComponent={() => {
              if (!puedeCrear) return null;
              if (!item.nombre) return null;
              const nombreLower = item.nombre.toLowerCase();
              if (!(nombreLower.includes('venta') || nombreLower.includes('censo'))) return null;

              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: '#333',
                    borderStyle: 'dashed',
                    marginTop: 12,
                    marginBottom: 20
                  }}
                  onPress={() => router.push({ pathname: '/tarjeta/nueva', params: { lista_id: item.id, lista_nombre: item.nombre } })}
                  activeOpacity={0.6}
                >
                  <Plus size={22} color="#111" strokeWidth={2} />
                  <Text style={{ marginLeft: 8, fontWeight: '600', color: '#111', fontSize: 16, fontStyle: 'italic' }}>
                    Añadir Tarjeta
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const areEqualColumn = (prevProps: KanbanColumnProps, nextProps: KanbanColumnProps) => {
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.nombre !== nextProps.item.nombre) return false;
  if (prevProps.item.color_fondo !== nextProps.item.color_fondo) return false;
  if (prevProps.baseOpacity !== nextProps.baseOpacity) return false;
  if (prevProps.item.tarjetas.length !== nextProps.item.tarjetas.length) return false;

  const prevIsMovingThisList = prevProps.listaEnMovimiento?.id === prevProps.item.id;
  const nextIsMovingThisList = nextProps.listaEnMovimiento?.id === nextProps.item.id;
  if (prevIsMovingThisList !== nextIsMovingThisList) return false;

  const prevIsListMoveMode = prevProps.listaEnMovimiento !== null;
  const nextIsListMoveMode = nextProps.listaEnMovimiento !== null;
  if (prevIsListMoveMode !== nextIsListMoveMode) return false;

  const prevIsSourceColumn = prevProps.tarjetaEnMovimiento?.lista_id === prevProps.item.id;
  const nextIsSourceColumn = nextProps.tarjetaEnMovimiento?.lista_id === nextProps.item.id;
  if (prevIsSourceColumn !== nextIsSourceColumn) return false;

  // We are relying on the parent to pass new `tarjetas` object when a card is updated so the length or references change.
  // We can do a quick shallow comparison of card IDs and their updated_at or datos_valores.
  for (let i = 0; i < prevProps.item.tarjetas.length; i++) {
    const pt = prevProps.item.tarjetas[i];
    const nt = nextProps.item.tarjetas[i];
    if (pt.id !== nt.id) return false;
    if (pt.updated_at !== nt.updated_at) return false;
    if (JSON.stringify(pt.datos_valores) !== JSON.stringify(nt.datos_valores)) return false;
  }

  return true;
};

export const KanbanColumn = React.memo(KanbanColumnComponent, areEqualColumn);

const { width, height } = Dimensions.get('window');
export const COLUMN_WIDTH = Platform.OS === 'web' || width > 768 ? 350 : width * 0.85;
export const GAP = 16;
export const SNAP_INTERVAL = COLUMN_WIDTH + GAP;

const styles = StyleSheet.create({
  kanbanColumnWrapper: {
    width: COLUMN_WIDTH,
    marginRight: GAP,
    height: height * 0.86, // Aumentado para mayor espacio vertical
    paddingBottom: 10,
  },
  kanbanColumn: {
    flex: 1,
    borderRadius: KANBAN_THEME.column.borderRadius,
    paddingHorizontal: KANBAN_THEME.column.paddingHorizontal,
    paddingTop: KANBAN_THEME.column.paddingTop,
    paddingBottom: KANBAN_THEME.column.paddingBottom,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  columnTitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1A202C',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnCount: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600'
  },
  moreBtn: {
    padding: 4,
  },
  columnHighlightOverlay: {
    ...StyleSheet.absoluteFill,
    borderColor: '#0C66E4',
    borderWidth: 2.5,
    borderRadius: KANBAN_THEME.column.borderRadius,
    shadowColor: '#579DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
});
