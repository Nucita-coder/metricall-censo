import { User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { KANBAN_COLORS, getResultadoColor } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { soundService } from '../../services/soundService';
import { Lista, Tarjeta, TarjetaMaterialItem } from '../../types/kanban';

export interface KanbanCardProps {
  item: Tarjeta;
  tarjetaEnMovimiento: Tarjeta | null;
  setTarjetaEnMovimiento: (t: Tarjeta | null) => void;
  listaEnMovimiento: Lista | null;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  setTarjetaAuditoria: (t: Tarjeta | null) => void;
  isLiberada?: boolean; listaNombre?: string; onRightClick?: (item: Tarjeta, x: number, y: number) => void; isResaltada?: boolean;
}

const cleanEmojis = (str: string) => (!str ? '' : str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s{2,}/g, ' ').trim());
const toTitleCase = (str: string) => (!str ? '' : str.toLowerCase().replace(/(?:^|\s)\S/g, (m) => m.toUpperCase()));
const formatCedula = (doc?: string | number) => !doc ? '' : (String(doc).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') || String(doc));
const formatTelefono = (tel?: string | number) => {
  if (!tel) return '';
  const clean = String(tel).replace(/\D/g, '');
  return clean.length === 11 && clean.startsWith('0') ? `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}` : String(tel);
};

const KanbanCardComponent = ({
  item, tarjetaEnMovimiento, listaEnMovimiento, setTarjetaSeleccionada, setTarjetaAuditoria, isLiberada, listaNombre, onRightClick, isResaltada,
}: KanbanCardProps) => {
  const { userRol } = useAuth();
  const isMoveMode = tarjetaEnMovimiento !== null;
  const isMovingThis = isMoveMode && tarjetaEnMovimiento?.id === item.id;
  const isListMoveMode = listaEnMovimiento !== null;
  const data = item.datos_valores || {};

  const scaleAnim = useRef(new Animated.Value(1)).current, hoverAnim = useRef(new Animated.Value(0)).current, highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: isMovingThis ? 1.05 : 1, useNativeDriver: true, bounciness: 10 }).start();
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

  const rawTipoServicio = String(data.tipoServicio || '').toLowerCase().trim();
  const tipoServicio = (rawTipoServicio === 'n/a' || rawTipoServicio === 'none') ? '' : rawTipoServicio;
  const esHogar = tipoServicio === 'hogar', esPymes = tipoServicio === 'pymes', isBloqueada = data.estadoLiberacion === 'bloqueada' || isLiberada;

  const lowerLista = (listaNombre || '').toLowerCase();
  const esListaLimpia = lowerLista.includes('ventas') || lowerLista.includes('falla') || lowerLista.includes('soporte');
  const isFalla = Boolean(data.tipoFalla || data.estadoSoporte || lowerLista.includes('falla') || lowerLista.includes('soporte'));
  const esReportePago = !esListaLimpia && !isFalla && (lowerLista.includes('pago') || Boolean(data.comprobantePagoUrl || data.bancoOrigen || data.montoPago));

  const bCfg = esHogar ? KANBAN_COLORS.badge.hogar : esPymes ? KANBAN_COLORS.badge.pymes : tipoServicio === 'dedicado' ? KANBAN_COLORS.badge.dedicado : tipoServicio === 'isp' ? KANBAN_COLORS.badge.isp : KANBAN_COLORS.badge.default;
  const badgeBg = bCfg.bg, badgeColor = bCfg.text;

  const isCobranza = Boolean(data.origenImportacion === 'COBRANZA-RECUPERO-CHURN' || lowerLista.includes('cobranza') || lowerLista.includes('recupero'));
  const isVentaOnline = Boolean(lowerLista.includes('ventas online') || lowerLista.includes('gestion online') || lowerLista.includes('gestión online'));
  const esWhatsappOrigin = Boolean(data.origen === 'WhatsApp Bot' || data.origen === 'whatsapp' || data.origen === 'Gestión Online' || data.origen === 'gestion online' || data.origenImportacion === 'WHATSAPP');
  const isProcesadoSAE = Boolean(data.estadoSoporte === 'Procesado en SAE' || data.accionFalla === 'Procesado en SAE' || data.estadoGestion === 'procesado_en_sae');

  let topBadgeText = '', topBadgeBg = badgeBg, topBadgeColor = badgeColor;
  if (isProcesadoSAE) {
    topBadgeBg = KANBAN_COLORS.badge.procesadoSAE?.bg || 'rgba(59, 130, 246, 0.15)';
    topBadgeColor = KANBAN_COLORS.badge.procesadoSAE?.text || '#3B82F6';
    topBadgeText = 'PROCESADO EN SAE';
  } else if (esReportePago) {
    const est = data.estadoCobranza || 'Pago Pendiente Revisión';
    const isProc = est === 'Pago Procesado', isRech = est === 'Pago Rechazado';
    topBadgeBg = isProc ? KANBAN_COLORS.badge.pagoProcesado.bg : isRech ? KANBAN_COLORS.badge.pagoRechazado.bg : KANBAN_COLORS.badge.pagoPendiente.bg;
    topBadgeColor = isProc ? KANBAN_COLORS.badge.pagoProcesado.text : isRech ? KANBAN_COLORS.badge.pagoRechazado.text : KANBAN_COLORS.badge.pagoPendiente.text;
    topBadgeText = isProc ? 'PAGO PROCESADO' : isRech ? 'PAGO RECHAZADO' : 'PAGO EN REVISIÓN';
  } else if (tipoServicio) {
    topBadgeText = tipoServicio.toUpperCase();
  } else if (isCobranza) {
    topBadgeText = 'COBRANZA';
  } else if (esWhatsappOrigin && !isVentaOnline) {
    topBadgeBg = 'rgba(56, 189, 248, 0.15)';
    topBadgeColor = '#38BDF8';
    topBadgeText = 'WHATSAPP';
  }

  const rawSaldo = data.saldo ?? data['SALDO'] ?? data.monto ?? data.Monto ?? data['MONTO'] ?? data.montoDeuda;
  const saldoFormateado = (() => {
    if (rawSaldo === undefined || rawSaldo === null || rawSaldo === '') return '';
    const cleanStr = String(rawSaldo).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return `$${rawSaldo}`;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  })();

  const docVal = data.documentoIdentidad || data.nroIdentidad;
  const formattedDoc = docVal ? `${data.tipoDocumento || 'CI'}: ${formatCedula(String(docVal))}` : '';
  const telVal = data.telefonoMovil || data.nroTelefonoMovil;
  const formattedTel = telVal ? formatTelefono(String(telVal)) : '';
  const middleRowText = [formattedDoc, formattedTel].filter(Boolean).join(' • ');

  const abonadoVal = data.nroAbonado || data['NRO SUSCRIPTOR'] || data.abonado;
  const formattedAbonado = abonadoVal ? (String(abonadoVal).startsWith('#') ? String(abonadoVal) : `#${abonadoVal}`) : '';

  const isCensoFormat = ['Censo', 'si desea', 'no desea', 'es posible'].includes(listaNombre || '');
  const isMaterialesFormat = ['Carga de Materiales', 'Material Recibido', 'Material Asignado', 'Devolución de Asignación', 'Devolución a Almacén Central', 'Recuperados'].includes(listaNombre || '') || data.codigoMaterial !== undefined || data.nroOrdenEntrega !== undefined;
  let cardBg = KANBAN_COLORS.card.defaultBg;
  if (listaNombre === 'si desea' || listaNombre === 'Acción efectiva' || listaNombre === 'Acción efectiva (Recupero)') cardBg = KANBAN_COLORS.card.censoInteresadosBg;
  else if (listaNombre === 'no desea' || listaNombre === 'Acción negativa' || listaNombre === 'Acción negativa (Recupero)') cardBg = KANBAN_COLORS.card.censoNoInteresadosBg;
  else if (listaNombre === 'es posible') cardBg = KANBAN_COLORS.card.censoPosiblesBg;
  if (isBloqueada) cardBg = KANBAN_COLORS.card.bloqueadaBg;

  const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null), lastTap = useRef<number | null>(null);

  const handlePress = () => {
    if (isMoveMode || isListMoveMode) return;
    soundService.playGesture('tap');
    const now = Date.now();
    if (lastTap.current && (now - lastTap.current) < 300) {
      if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
      lastTap.current = null;
      setTarjetaAuditoria(item);
    } else {
      lastTap.current = now;
      singleTapTimeout.current = setTimeout(() => { setTarjetaSeleccionada(item); lastTap.current = null; }, 300);
    }
  };

  const handlePressIn = () => { if (!isMoveMode && !isListMoveMode) Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true, bounciness: 12, speed: 20 }).start(); };
  const handlePressOut = () => { if (!isMoveMode && !isListMoveMode && !isMovingThis) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 10, speed: 20 }).start(); };


  const webProps = Platform.OS === 'web' ? {
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); onRightClick?.(item, e.nativeEvent.pageX, e.nativeEvent.pageY); },
    onMouseEnter: () => { if (!isMoveMode && !isListMoveMode && !isMovingThis) Animated.spring(hoverAnim, { toValue: 4, useNativeDriver: true, bounciness: 8, speed: 20 }).start(); },
    onMouseLeave: () => { if (!isMoveMode && !isListMoveMode && !isMovingThis) Animated.spring(hoverAnim, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 20 }).start(); }
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
          if (Platform.OS !== 'web' && esGerencial && onRightClick) onRightClick(item, e.nativeEvent.pageX || 50, e.nativeEvent.pageY || 200);
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
            { transform: [{ scale: scaleAnim }, { translateX: hoverAnim }], backgroundColor: cardBg },
            (isMoveMode && !isMovingThis) && { opacity: 0.5 },
            isBloqueada && { opacity: 0.8 },
          ]}
          {...webProps}
        >
          {isMaterialesFormat ? (
            <View style={{ padding: 14 }}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, styles.materialBadge]}>
                  <Text style={styles.materialBadgeText}>
                    {Array.isArray(data.items) && data.items.length > 1 ? `GUÍA (${data.items.length} ÍTEMS)` : data.codigoMaterial || 'COD-MAT'}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{data.fechaRecibido || new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.cardName} numberOfLines={2}>
                {data.nombreMaterial || (Array.isArray(data.items) && (data.items as TarjetaMaterialItem[])[0]?.nombreMaterial) || 'Carga de Material'}
              </Text>
              <View style={styles.materialFooter}>
                <Text style={styles.materialCantText}>
                  Cant: {Array.isArray(data.items) ? (data.items as TarjetaMaterialItem[]).reduce((s: number, i) => s + (parseFloat(String(i.cantidadRecibida || '0')) || 0), 0) : (data.cantidadRecibida || 0)} und.
                </Text>
                {data.nroOrdenEntrega ? <Text style={styles.materialOrdenText}>Orden: {data.nroOrdenEntrega}</Text> : null}
              </View>
              {data.asignadoA ? (
                <View style={styles.asignadoBadge}>
                  <User size={12} color="#60A5FA" style={{ marginRight: 4 }} />
                  <Text style={styles.asignadoText} numberOfLines={1}>Asignado a: {data.asignadoA}</Text>
                </View>
              ) : null}
            </View>
          ) : isCensoFormat ? (
            <View style={{ padding: 14 }}>
              {data.es_reasignada && (
                <View style={styles.reasignadaBadge}>
                  <Text style={styles.reasignadaText}>REASIGNADA</Text>
                </View>
              )}
              <View style={styles.censoHeader}>
                <Text style={styles.censoClient} numberOfLines={2}>
                  Cliente: {cleanEmojis(data.nombreApellido || data.nombre || 'Nuevo Censo (Borrador)')}
                </Text>
              </View>
              {data.origen === 'censo' && (
                <View style={styles.censoOriginRow}>
                  <View style={styles.censoBadge}><Text style={styles.censoBadgeText}>CENSO</Text></View>
                </View>
              )}
              <Text style={styles.censoMeta}>Tel: {data.nroTelefonoMovil || data.telefonoMovil || data.telefono || 'N/A'}</Text>
              <Text style={styles.censoMeta}>Fecha: {data.fechaCenso || data.fechaVenta || new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.censoMeta}>Vendedor/Origen: {data.asesorComercial || (data.origen === 'WhatsApp Bot' ? 'WhatsApp Bot' : 'N/A')}</Text>
            </View>
          ) : !data.nombreApellido ? (
            <View style={{ padding: 14 }}><Text style={styles.emptyCardText}>Tarjeta sin datos</Text></View>
          ) : (
            <>
              {isBloqueada && (
                <View style={styles.bloqueadaBadge}>
                  <Text style={styles.bloqueadaText}>INSTALACIÓN LIBERADA (CAÍDA)</Text>
                </View>
              )}
              <View style={styles.cardMainBody}>
                <View style={styles.cardHeader}>
                  {topBadgeText ? (
                    topBadgeText === 'COBRANZA' ? (
                      <View style={styles.cobranzaBadge}>
                        <Text style={styles.cobranzaBadgeText}>COBRANZA</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: topBadgeBg }]}>
                        <Text style={[styles.badgeText, { color: topBadgeColor }]}>{topBadgeText}</Text>
                      </View>
                    )
                  ) : <View />}

                  {saldoFormateado ? (
                    <Text style={styles.montoText}>{saldoFormateado}</Text>
                  ) : (
                    <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  )}
                </View>

                <Text style={styles.cardName} numberOfLines={2}>
                  {toTitleCase(cleanEmojis(data.nombreApellido))}
                </Text>

                {middleRowText ? (
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{middleRowText}</Text>
                ) : null}

                {(data.tipoContacto || data.resultadoContacto) && (
                  <View style={styles.contactoRow}>
                    {data.tipoContacto ? (
                      <View style={styles.tipoContactoBadge}>
                        <Text style={styles.tipoContactoText}>{data.tipoContacto}</Text>
                      </View>
                    ) : null}
                    {data.resultadoContacto ? (
                      (() => {
                        const resColor = getResultadoColor(data.resultadoContacto);
                        return (
                          <View style={[styles.resultadoContactoBadge, { backgroundColor: resColor.bg, borderColor: resColor.border }]}>
                            <Text style={[styles.resultadoContactoText, { color: resColor.text }]}>{data.resultadoContacto}</Text>
                          </View>
                        );
                      })()
                    ) : null}
                  </View>
                )}
              </View>

              <View style={styles.cardFooterBar}>
                <Text style={styles.cardFooterAbonado}>{formattedAbonado || ' '}</Text>
                <Text style={styles.cardFooterDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </>
          )}
          <Animated.View pointerEvents="none" style={[styles.cardHighlightOverlay, { opacity: highlightAnim }]} />
        </Animated.View>
      </Reanimated.View>
    </TouchableOpacity>
  );
};

const areEqual = (prev: KanbanCardProps, next: KanbanCardProps) => (
  prev.item.id === next.item.id && prev.item.updated_at === next.item.updated_at && prev.item.lista_id === next.item.lista_id &&
  prev.listaNombre === next.listaNombre && prev.isLiberada === next.isLiberada && prev.isResaltada === next.isResaltada &&
  (prev.tarjetaEnMovimiento?.id === prev.item.id) === (next.tarjetaEnMovimiento?.id === next.item.id) &&
  (prev.listaEnMovimiento !== null) === (next.listaEnMovimiento !== null) &&
  JSON.stringify(prev.item.datos_valores) === JSON.stringify(next.item.datos_valores)
);

export const KanbanCard = React.memo(KanbanCardComponent, areEqual);

const styles = StyleSheet.create({
  cardContainer: { borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardMainBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cobranzaBadge: { borderWidth: 1.5, borderColor: '#000000', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#FFFFFF' },
  cobranzaBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#000000', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  montoText: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, fontWeight: '500', color: '#000000' },
  cardFooterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  cardFooterAbonado: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  cardFooterDate: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  cardDate: { fontSize: 11, color: KANBAN_COLORS.text.light, fontWeight: '500' },
  emptyCardText: { color: KANBAN_COLORS.text.empty, fontStyle: 'italic', fontSize: 13 },
  bloqueadaBadge: { backgroundColor: KANBAN_COLORS.tags.bloqueadaBg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start', margin: 10, marginBottom: 0 },
  bloqueadaText: { color: KANBAN_COLORS.text.danger, fontSize: 10, fontWeight: '900' },
  censoClient: { fontWeight: 'bold', fontSize: 16, color: KANBAN_COLORS.text.primary, marginBottom: 6 },
  censoMeta: { fontSize: 13, color: KANBAN_COLORS.text.secondary, marginBottom: 4 },
  censoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  censoOriginRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  censoBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  censoBadgeText: { fontSize: 9, color: '#38BDF8', fontWeight: 'bold' },
  materialBadge: { backgroundColor: 'rgba(12, 102, 228, 0.25)', borderColor: '#0C66E4', borderWidth: 1 },
  materialBadgeText: { color: '#579DFF', fontWeight: 'bold', fontSize: 10 },
  materialFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  materialCantText: { fontSize: 13, fontWeight: 'bold', color: '#4ADE80' },
  materialOrdenText: { fontSize: 11, color: '#8C9BAB' },
  asignadoBadge: { marginTop: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  asignadoText: { fontSize: 11, fontWeight: 'bold', color: '#93C5FD' },
  reasignadaBadge: { backgroundColor: '#E53E3E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  reasignadaText: { fontSize: 9, color: '#FFF', fontWeight: 'bold' },
  contactoRow: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tipoContactoBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tipoContactoText: { fontSize: 10, color: '#38BDF8', fontWeight: 'bold' },
  resultadoContactoBadge: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  resultadoContactoText: { fontSize: 10, fontWeight: 'bold' },
  cardHighlightOverlay: { ...StyleSheet.absoluteFill, borderColor: '#0C66E4', borderWidth: 2.5, borderRadius: 14, shadowColor: '#579DFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8, zIndex: 10 },
});
