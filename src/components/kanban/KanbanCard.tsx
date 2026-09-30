import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { soundService } from '../../services/soundService';
import { Lista, Tarjeta } from '../../types/kanban';
import { extractUniversalCardData } from './card/cardExtractors';
import { styles } from './card/KanbanCard.styles';

export interface KanbanCardProps {
  item: Tarjeta;
  tarjetaEnMovimiento: Tarjeta | null;
  setTarjetaEnMovimiento: (t: Tarjeta | null) => void;
  listaEnMovimiento: Lista | null;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  setTarjetaAuditoria: (t: Tarjeta | null) => void;
  isLiberada?: boolean;
  listaNombre?: string;
  onRightClick?: (item: Tarjeta, x: number, y: number) => void;
  isResaltada?: boolean;
}

const KanbanCardComponent = ({
  item,
  tarjetaEnMovimiento,
  listaEnMovimiento,
  setTarjetaSeleccionada,
  setTarjetaAuditoria,
  isLiberada,
  listaNombre,
  onRightClick,
  isResaltada,
}: KanbanCardProps) => {
  const { userRol } = useAuth();
  const isMoveMode = tarjetaEnMovimiento !== null;
  const isMovingThis = isMoveMode && tarjetaEnMovimiento?.id === item.id;
  const isListMoveMode = listaEnMovimiento !== null;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isMovingThis ? 1.05 : 1,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [isMovingThis]);

  useEffect(() => {
    if (isResaltada) {
      highlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(highlightAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ]).start();
    }
  }, [isResaltada]);

  const card = extractUniversalCardData(item, listaNombre, isLiberada);

  const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<number | null>(null);

  const handlePress = () => {
    if (isMoveMode || isListMoveMode) return;
    soundService.playGesture('tap');
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
      lastTap.current = null;
      setTarjetaAuditoria(item);
    } else {
      lastTap.current = now;
      singleTapTimeout.current = setTimeout(() => {
        setTarjetaSeleccionada(item);
        lastTap.current = null;
      }, 300);
    }
  };

  const handlePressIn = () => {
    if (!isMoveMode && !isListMoveMode) {
      Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true, bounciness: 12, speed: 20 }).start();
    }
  };

  const handlePressOut = () => {
    if (!isMoveMode && !isListMoveMode && !isMovingThis) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 10, speed: 20 }).start();
    }
  };

  const webProps = Platform.OS === 'web' ? {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onRightClick?.(item, e.nativeEvent.pageX, e.nativeEvent.pageY);
    },
    onMouseEnter: () => {
      if (!isMoveMode && !isListMoveMode && !isMovingThis) {
        Animated.spring(hoverAnim, { toValue: 4, useNativeDriver: true, bounciness: 8, speed: 20 }).start();
      }
    },
    onMouseLeave: () => {
      if (!isMoveMode && !isListMoveMode && !isMovingThis) {
        Animated.spring(hoverAnim, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 20 }).start();
      }
    },
  } : {};

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={(e) => {
        if (!isMoveMode && !isListMoveMode) {
          soundService.playGesture('drag_start');
          const esGerencial = userRol === 'admin' || userRol === 'lider' || userRol === 'supervisor';
          if (Platform.OS !== 'web' && esGerencial && onRightClick) {
            onRightClick(item, e.nativeEvent.pageX || 50, e.nativeEvent.pageY || 200);
          }
        }
      }}
      delayPressIn={150}
      activeOpacity={0.8}
      disabled={isMoveMode || isListMoveMode}
    >
      <Reanimated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.duration(200)}>
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ scale: scaleAnim }, { translateX: hoverAnim }], backgroundColor: card.cardBg },
            isMoveMode && !isMovingThis && { opacity: 0.5 },
            card.isBloqueada && { opacity: 0.8 },
          ]}
          {...webProps}
        >
          {card.isBloqueada && (
            <View style={styles.bloqueadaBadge}>
              <Text style={styles.bloqueadaText}>{card.bloqueadaText}</Text>
            </View>
          )}

          {/* NIVEL 1 & 2: CUERPO PRINCIPAL CON CABECERA */}
          <View style={styles.cardMainBody}>
            {/* Cabecera Superior: Badge Contextual a la izq y Métrica a la der */}
            <View style={styles.cardHeader}>
              {card.topBadgeText ? (
                card.isCobranzaBadge ? (
                  <View style={styles.cobranzaBadge}>
                    <Text style={styles.cobranzaBadgeText}>COBRANZA</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: card.topBadgeBg }]}>
                    <Text style={[styles.badgeText, { color: card.topBadgeColor }]}>
                      {card.topBadgeText}
                    </Text>
                  </View>
                )
              ) : (
                <View />
              )}

              {card.topMetricText ? (
                <Text style={styles.montoText}>{card.topMetricText}</Text>
              ) : null}
            </View>

            {/* Título: Nombre del Cliente o Material */}
            <Text style={styles.cardName} numberOfLines={2}>
              {card.title}
            </Text>

            {/* Subtítulo: CI • Teléfono, o Modelo */}
            {card.subtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {card.subtitle}
              </Text>
            ) : null}

            {/* Badges de estado, contacto, internet, etc. */}
            {card.statusBadges.length > 0 && (
              <View style={styles.contactoRow}>
                {card.statusBadges.map((b, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: b.bg,
                        borderColor: b.border || 'transparent',
                        borderWidth: b.border ? 1 : 0,
                      },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: b.color }]}>
                      {b.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* NIVEL 3: BARRA INFERIOR (FOOTER BAR) */}
          <View style={styles.cardFooterBar}>
            <Text style={styles.cardFooterLeft} numberOfLines={1}>
              {card.footerLeft}
            </Text>
            <Text style={styles.cardFooterRight}>
              {card.footerRight}
            </Text>
          </View>

          {/* Overlay de resaltado */}
          <Animated.View
            pointerEvents="none"
            style={[styles.cardHighlightOverlay, { opacity: highlightAnim }]}
          />
        </Animated.View>
      </Reanimated.View>
    </TouchableOpacity>
  );
};

const areEqual = (prev: KanbanCardProps, next: KanbanCardProps) =>
  prev.item.id === next.item.id &&
  prev.item.updated_at === next.item.updated_at &&
  prev.item.lista_id === next.item.lista_id &&
  prev.listaNombre === next.listaNombre &&
  prev.isLiberada === next.isLiberada &&
  prev.isResaltada === next.isResaltada &&
  (prev.tarjetaEnMovimiento?.id === prev.item.id) === (next.tarjetaEnMovimiento?.id === next.item.id) &&
  (prev.listaEnMovimiento !== null) === (next.listaEnMovimiento !== null) &&
  JSON.stringify(prev.item.datos_valores) === JSON.stringify(next.item.datos_valores);

export const KanbanCard = React.memo(KanbanCardComponent, areEqual);
