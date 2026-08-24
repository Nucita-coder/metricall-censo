import { Hash, Phone, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { KANBAN_COLORS, KANBAN_THEME, getResultadoColor } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Lista, Tarjeta } from '../../types/kanban';

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
  setTarjetaEnMovimiento,
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
  const data = item.datos_valores || {};

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
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isResaltada]);

  const tipoServicio = String(data.tipoServicio || '').toLowerCase();
  const esHogar = tipoServicio === 'hogar';
  const esPymes = tipoServicio === 'pymes';
  const isBloqueada = data.estadoLiberacion === 'bloqueada' || isLiberada;

  let badgeBg = KANBAN_COLORS.badge.default.bg;
  let badgeColor = KANBAN_COLORS.badge.default.text;

  if (esHogar) { badgeBg = KANBAN_COLORS.badge.hogar.bg; badgeColor = KANBAN_COLORS.badge.hogar.text; }
  else if (esPymes) { badgeBg = KANBAN_COLORS.badge.pymes.bg; badgeColor = KANBAN_COLORS.badge.pymes.text; }
  else if (tipoServicio === 'dedicado') { badgeBg = KANBAN_COLORS.badge.dedicado.bg; badgeColor = KANBAN_COLORS.badge.dedicado.text; }
  else if (tipoServicio === 'isp') { badgeBg = KANBAN_COLORS.badge.isp.bg; badgeColor = KANBAN_COLORS.badge.isp.text; }

  const isCensoFormat = ['Censo', 'si desea', 'no desea', 'es posible'].includes(listaNombre || '');
  const isMaterialesFormat = ['Carga de Materiales', 'Material Recibido', 'Material Asignado', 'Devolución de Asignación', 'Devolución a Almacén Central', 'Recuperados'].includes(listaNombre || '') || data.codigoMaterial !== undefined || data.nroOrdenEntrega !== undefined;
  let cardBg = KANBAN_COLORS.card.defaultBg;
  if (listaNombre === 'si desea' || listaNombre === 'Acción efectiva') cardBg = KANBAN_COLORS.card.censoInteresadosBg;
  else if (listaNombre === 'no desea' || listaNombre === 'Acción negativa') cardBg = KANBAN_COLORS.card.censoNoInteresadosBg;
  else if (listaNombre === 'es posible') cardBg = KANBAN_COLORS.card.censoPosiblesBg;

  if (isBloqueada) {
    cardBg = KANBAN_COLORS.card.bloqueadaBg;
  }

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<number | null>(null);

  const handlePress = () => {
    if (isMoveMode || isListMoveMode) return;

    const now = Date.now();
    if (lastTap.current && (now - lastTap.current) < 300) {
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
    if (isMoveMode || isListMoveMode) return;
    Animated.spring(scaleAnim, {
      toValue: 1.04,
      useNativeDriver: true,
      bounciness: 12,
      speed: 20
    }).start();
  };

  const handlePressOut = () => {
    if (isMoveMode || isListMoveMode || isMovingThis) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 10,
      speed: 20
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={(e) => {
        if (!isMoveMode && !isListMoveMode) {
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
        <Animated.View style={[
          styles.cardContainer,
          {
            transform: [{ scale: scaleAnim }, { translateX: hoverAnim }],
            backgroundColor: cardBg
          },
          (isMoveMode && !isMovingThis) && { opacity: 0.5 },
          isBloqueada && { opacity: 0.8 },
        ]}
          {...(Platform.OS === 'web' ? {
            onContextMenu: (e: any) => {
              e.preventDefault();
              onRightClick?.(item, e.nativeEvent.pageX, e.nativeEvent.pageY);
            },
            onMouseEnter: () => {
              if (isMoveMode || isListMoveMode || isMovingThis) return;
              Animated.spring(hoverAnim, {
                toValue: 4,
                useNativeDriver: true,
                bounciness: 8,
                speed: 20
              }).start();
            },
            onMouseLeave: () => {
              if (isMoveMode || isListMoveMode || isMovingThis) return;
              Animated.spring(hoverAnim, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 8,
                speed: 20
              }).start();
            }
          } : {})}
        >
          {isMaterialesFormat ? (
            <View>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: 'rgba(12, 102, 228, 0.25)', borderColor: '#0C66E4', borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: '#579DFF', fontWeight: 'bold' }]}>
                    {Array.isArray(data.items) && data.items.length > 1
                      ? `GUÍA (${data.items.length} ÍTEMS)`
                      : data.codigoMaterial || 'COD-MAT'}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{data.fechaRecibido || new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.cardName} numberOfLines={2}>
                {data.nombreMaterial || (Array.isArray(data.items) && data.items[0]?.nombreMaterial) || 'Carga de Material'}
              </Text>
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4ADE80' }}>
                  Cant: {Array.isArray(data.items) ? data.items.reduce((s: number, i: any) => s + (parseFloat(i.cantidadRecibida) || 0), 0) : (data.cantidadRecibida || 0)} und.
                </Text>
                {data.nroOrdenEntrega ? (
                  <Text style={{ fontSize: 11, color: '#8C9BAB' }}>
                    Orden: {data.nroOrdenEntrega}
                  </Text>
                ) : null}
              </View>
              {data.asignadoA ? (
                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' }}>
                  <User size={12} color="#60A5FA" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#93C5FD' }} numberOfLines={1}>
                    Asignado a: {data.asignadoA}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : isCensoFormat ? (
            <View>
              {data.es_reasignada && (
                <View style={{ backgroundColor: '#E53E3E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold' }}>REASIGNADA</Text>
                </View>
              )}
              <Text style={styles.censoClient} numberOfLines={2}>
                Cliente: {data.nombreApellido || 'Nuevo Censo (Borrador)'}
              </Text>
              <Text style={styles.censoMeta}>Tel: {data.nroTelefonoMovil || 'N/A'}</Text>
              <Text style={styles.censoMeta}>Fecha: {data.fechaCenso || 'N/A'}</Text>
              <Text style={styles.censoMeta}>Vendedor: {data.asesorComercial || 'N/A'}</Text>
            </View>
          ) : (
            !data.nombreApellido ? (
              <Text style={styles.emptyCardText}>Tarjeta sin datos</Text>
            ) : (
              <>
                {isBloqueada && (
                  <View style={styles.bloqueadaBadge}>
                    <Text style={styles.bloqueadaText}>INSTALACIÓN LIBERADA (CAÍDA)</Text>
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {tipoServicio ? tipoServicio.toUpperCase() : 'N/A'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {data.origen === 'censo' && (
                      <View style={{ backgroundColor: '#EBF8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#BEE3F8' }}>
                        <Text style={{ fontSize: 9, color: '#2B6CB0', fontWeight: 'bold' }}>EXTRAÍDA DE CENSO</Text>
                      </View>
                    )}
                    <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.cardName} numberOfLines={2}>
                  {data.nombreApellido}
                </Text>
                <View style={styles.contactInfoRow}>
                  {data.nroAbonado || data['NRO SUSCRIPTOR'] || data.abonado ? (
                    <View style={styles.contactInfoItem}>
                      <Hash size={11} color="#38BDF8" style={{ marginRight: 3 }} />
                      <Text style={[styles.contactInfoText, { color: '#38BDF8', fontWeight: 'bold', marginRight: 6 }]}>
                        {data.nroAbonado || data['NRO SUSCRIPTOR'] || data.abonado}
                      </Text>
                    </View>
                  ) : null}
                  {data.documentoIdentidad || data.nroIdentidad ? (
                    <View style={styles.contactInfoItem}>
                      <User size={11} color="#A0AEC0" style={{ marginRight: 4 }} />
                      <Text style={styles.contactInfoText}>{data.tipoDocumento ? `${data.tipoDocumento} ` : ''}{data.documentoIdentidad || data.nroIdentidad}</Text>
                    </View>
                  ) : null}
                  {data.telefonoMovil || data.nroTelefonoMovil ? (
                    <View style={styles.contactInfoItem}>
                      <Phone size={11} color="#A0AEC0" style={{ marginRight: 4, marginLeft: 8 }} />
                      <Text style={styles.contactInfoText}>{data.telefonoMovil || data.nroTelefonoMovil}</Text>
                    </View>
                  ) : null}
                </View>
                {(data.tipoContacto || data.resultadoContacto) && (
                  <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {data.tipoContacto ? (
                      <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, color: '#38BDF8', fontWeight: 'bold' }}>
                          {data.tipoContacto}
                        </Text>
                      </View>
                    ) : null}
                    {data.resultadoContacto ? (
                      (() => {
                        const resColor = getResultadoColor(data.resultadoContacto);
                        return (
                          <View style={{ backgroundColor: resColor.bg, borderWidth: 1, borderColor: resColor.border, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, color: resColor.text, fontWeight: 'bold' }}>
                              {data.resultadoContacto}
                            </Text>
                          </View>
                        );
                      })()
                    ) : null}
                  </View>
                )}
              </>
            )
          )}
          <Animated.View pointerEvents="none" style={[styles.cardHighlightOverlay, { opacity: highlightAnim }]} />
        </Animated.View>
      </Reanimated.View>
    </TouchableOpacity>
  );
};

const areEqual = (prev: KanbanCardProps, next: KanbanCardProps) => {
  if (prev.item.id !== next.item.id || prev.item.updated_at !== next.item.updated_at || prev.item.lista_id !== next.item.lista_id) return false;
  if (prev.listaNombre !== next.listaNombre || prev.isLiberada !== next.isLiberada || prev.isResaltada !== next.isResaltada) return false;
  if (JSON.stringify(prev.item.datos_valores) !== JSON.stringify(next.item.datos_valores)) return false;
  if ((prev.tarjetaEnMovimiento?.id === prev.item.id) !== (next.tarjetaEnMovimiento?.id === next.item.id)) return false;
  if ((prev.listaEnMovimiento !== null) !== (next.listaEnMovimiento !== null)) return false;
  return true;
};

export const KanbanCard = React.memo(KanbanCardComponent, areEqual);

const styles = StyleSheet.create({
  cardContainer: { padding: KANBAN_THEME.card.padding, borderRadius: KANBAN_THEME.card.borderRadius, marginBottom: KANBAN_THEME.card.marginBottom, borderWidth: KANBAN_THEME.card.borderWidth, borderColor: KANBAN_COLORS.card.borderColor, overflow: 'hidden' },
  censoClient: { fontWeight: 'bold', fontSize: 16, color: KANBAN_COLORS.text.primary, marginBottom: 6 },
  censoMeta: { fontSize: 13, color: KANBAN_COLORS.text.secondary, marginBottom: 4 },
  emptyCardText: { color: KANBAN_COLORS.text.empty, fontStyle: 'italic', fontSize: 13 },
  bloqueadaBadge: { backgroundColor: KANBAN_COLORS.tags.bloqueadaBg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
  bloqueadaText: { color: KANBAN_COLORS.text.danger, fontSize: 10, fontWeight: '900' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardDate: { fontSize: 11, color: KANBAN_COLORS.text.light, fontWeight: '500' },
  cardName: { fontWeight: 'bold', fontSize: 16, color: KANBAN_COLORS.text.primary, marginBottom: 4 },
  contactInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  contactInfoItem: { flexDirection: 'row', alignItems: 'center' },
  contactInfoText: { fontSize: 11, color: '#718096', fontWeight: '500' },
  cardHighlightOverlay: { ...StyleSheet.absoluteFill, borderColor: '#0C66E4', borderWidth: 2.5, borderRadius: KANBAN_THEME.card.borderRadius, shadowColor: '#579DFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8, zIndex: 10 },
});
