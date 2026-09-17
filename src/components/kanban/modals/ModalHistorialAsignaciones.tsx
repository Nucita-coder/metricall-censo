import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Calendar, FileText, History, Package, User, X, CheckCircle, Tag } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';
import { Tarjeta, TarjetaMaterialItem } from '../../../types/kanban';
import {
  clasificarMovimientoAlmacen,
  obtenerMiembroResponsable,
} from '../../../services/almacenService';

export interface AssignmentHistoryItem {
  cardId: string;
  nroOrden: string;
  fecha: string;
  motivo: string;
  tipoCarga: 'ASIGNACION' | 'DEVOLUCION';
  entregadoPor: string;
  recibidoPor: string;
  items: Array<{
    codigoMaterial: string;
    nombreMaterial: string;
    modeloMaterial: string;
    serialMaterial?: string;
    cantidad: number;
  }>;
  totalUnidades: number;
}

interface ModalHistorialAsignacionesProps {
  visible: boolean;
  onClose: () => void;
  miembroNombre: string | null;
  empresaId: string | null;
}

export function ModalHistorialAsignaciones({ visible, onClose, miembroNombre, empresaId }: ModalHistorialAsignacionesProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState<AssignmentHistoryItem[]>([]);

  useEffect(() => {
    if (visible && miembroNombre && empresaId) {
      fetchUserHistory();
    }
  }, [visible, miembroNombre, empresaId]);

  const fetchUserHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('id, datos_valores, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return;

      const results: Array<AssignmentHistoryItem & { createdAt: string }> = [];
      const targetName = (miembroNombre || '').trim().toUpperCase();

      (data as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const movTipo = clasificarMovimientoAlmacen(v.tipoCarga);
        if (movTipo !== 'MATERIAL_ASIGNADO' && movTipo !== 'DEVOLUCION_ASIGNACION') return;

        const miembro = obtenerMiembroResponsable(movTipo, v);
        const matchMiembro =
          miembro === targetName ||
          (targetName && miembro && (miembro.includes(targetName) || targetName.includes(miembro)));
        if (!matchMiembro) return;

        const isDevolucion = movTipo === 'DEVOLUCION_ASIGNACION';
        const rawItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
        const mappedItems: Array<{ codigoMaterial: string; nombreMaterial: string; modeloMaterial: string; serialMaterial?: string; cantidad: number }> = [];
        let cardTotal = 0;

        (rawItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((sub) => {
          const cod = (sub.codigoMaterial || '').trim().toUpperCase();
          const cant = parseFloat(String(sub.cantidadRecibida || '0')) || 0;
          if (cod || cant > 0) {
            mappedItems.push({
              codigoMaterial: cod || 'SIN-CÓDIGO',
              nombreMaterial: (sub.nombreMaterial || 'Material').toUpperCase(),
              modeloMaterial: (sub.modeloMaterial || 'GENERAL').toUpperCase(),
              serialMaterial: sub.serialMaterial || undefined,
              cantidad: cant,
            });
            cardTotal += cant;
          }
        });

        results.push({
          cardId: row.id,
          nroOrden: v.nroOrdenEntrega || 'S/N',
          fecha: v.fechaRecibido || row.created_at?.split('T')[0] || '—',
          createdAt: row.created_at || '',
          motivo: v.motivoAsignacion || (isDevolucion ? 'Devolución de Material' : 'Asignación de Material'),
          tipoCarga: isDevolucion ? 'DEVOLUCION' : 'ASIGNACION',
          entregadoPor: (v.entregadoPor || '—').toUpperCase(),
          recibidoPor: (v.recibidoPor || v.asignadoA || '—').toUpperCase(),
          items: mappedItems,
          totalUnidades: cardTotal,
        });
      });

      const getTimestamp = (item: { createdAt?: string; fecha?: string }): number => {
        if (item.createdAt) {
          const t = new Date(item.createdAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        if (item.fecha && item.fecha.includes('/')) {
          const parts = item.fecha.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              return new Date(year, month, day).getTime();
            }
          }
        }
        if (item.fecha && item.fecha !== '—') {
          const t = new Date(item.fecha).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };

      results.sort((a, b) => getTimestamp(b) - getTimestamp(a));
      setHistoryList(results);
    } catch (e) {
      console.error('Error al cargar historial de asignaciones:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalUnidadesCustodia = Math.max(0, historyList.reduce((acc, curr) => {
    return curr.tipoCarga === 'DEVOLUCION' ? acc - curr.totalUnidades : acc + curr.totalUnidades;
  }, 0));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.modal, WEB_MODAL_CONTAINER, isDesktop && { maxWidth: 840 }]}>
          {/* HEADER */}
          <View style={s.hdr}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={s.userAvatarIcon}>
                <User size={18} color="#8C9BAB" />
              </View>
              <View>
                <Text style={s.hdrTitle}>Historial de Asignaciones y Devoluciones</Text>
                <Text style={s.hdrSub}>{miembroNombre || 'Personal'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* KPI BAR */}
          <View style={s.kpiBar}>
            <View style={s.kpiItem}>
              <Text style={s.kpiNum}>{historyList.length}</Text>
              <Text style={s.kpiTxt}>Movimientos Registrados</Text>
            </View>
            <View style={s.kpiSep} />
            <View style={s.kpiItem}>
              <Text style={s.kpiNum}>{totalUnidadesCustodia}</Text>
              <Text style={s.kpiTxt}>Unidades en Custodia Actual</Text>
            </View>
          </View>

          {/* CONTENIDO / LISTA */}
          {isLoading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#8C9BAB" />
              <Text style={s.centerTxt}>Cargando historial de asignaciones...</Text>
            </View>
          ) : historyList.length === 0 ? (
            <View style={s.center}>
              <Package size={36} color="#8C9BAB" />
              <Text style={s.centerTxt}>No hay registros de asignaciones ni devoluciones para este usuario.</Text>
            </View>
          ) : (
            <FlatList
              data={historyList}
              keyExtractor={(item) => item.cardId}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isDevolucion = item.tipoCarga === 'DEVOLUCION';
                return (
                  <View style={s.cardItem}>
                    <View style={s.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#8C9BAB" />
                        <Text style={s.ordenTxt}>Orden: {item.nroOrden}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color="#8C9BAB" />
                        <Text style={s.fechaTxt}>{item.fecha}</Text>
                      </View>
                    </View>

                    <View style={s.motivoBadge}>
                      <Tag size={12} color="#8C9BAB" />
                      <Text style={s.motivoTxt}>
                        {isDevolucion ? 'DEVOLUCIÓN: ' : 'ASIGNACIÓN: '}{item.motivo}
                      </Text>
                    </View>

                    {/* LISTADO DE MATERIALES EN ESTA ORDEN */}
                    <View style={s.itemsContainer}>
                      {item.items.map((sub, idx) => (
                        <View key={idx} style={s.subItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.itemCod}>{sub.codigoMaterial}</Text>
                            <Text style={s.itemName}>{sub.nombreMaterial}</Text>
                            <Text style={s.itemModel}>Modelo: {sub.modeloMaterial}{sub.serialMaterial ? ` · Serial: ${sub.serialMaterial}` : ''}</Text>
                          </View>
                          <View style={s.qtyTag}>
                            <Text style={s.qtyTagTxt}>
                              {isDevolucion ? '-' : '+'}{sub.cantidad} und.
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={s.footerInfo}>
                      <Text style={s.footerMeta}>{isDevolucion ? 'Entregado a almacén por: ' : 'Entregado por: '}<Text style={{ color: '#B6C2CF' }}>{item.entregadoPor}</Text></Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modal: { backgroundColor: '#22272B', width: '100%', maxHeight: '90%', borderRadius: 12, borderWidth: 1, borderColor: '#384148', overflow: 'hidden' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#384148', backgroundColor: '#2C333A' },
  userAvatarIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', justifyContent: 'center', alignItems: 'center' },
  hdrTitle: { fontSize: 15, fontWeight: '700', color: '#B6C2CF' },
  hdrSub: { fontSize: 11, color: '#8C9BAB', marginTop: 1 },
  closeBtn: { padding: 4, borderRadius: 6 },
  kpiBar: { flexDirection: 'row', backgroundColor: '#2C333A', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#384148' },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiNum: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  kpiTxt: { fontSize: 10, color: '#8C9BAB', textTransform: 'uppercase', marginTop: 2 },
  kpiSep: { width: 1, height: 24, backgroundColor: '#384148' },
  center: { padding: 48, alignItems: 'center' },
  centerTxt: { color: '#8C9BAB', marginTop: 12, fontSize: 13 },
  cardItem: { backgroundColor: '#2C333A', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#384148' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ordenTxt: { fontSize: 12, fontWeight: '700', color: '#B6C2CF' },
  fechaTxt: { fontSize: 11, color: '#8C9BAB' },
  motivoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22272B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#384148', alignSelf: 'flex-start', marginBottom: 10 },
  motivoTxt: { fontSize: 11, color: '#8C9BAB', fontWeight: '600' },
  itemsContainer: { backgroundColor: '#1D2125', borderRadius: 6, borderWidth: 1, borderColor: '#384148', padding: 10, gap: 8 },
  subItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2C333A', paddingBottom: 6 },
  itemCod: { fontSize: 11, fontWeight: '700', color: '#8C9BAB' },
  itemName: { fontSize: 12, color: '#B6C2CF', fontWeight: '500', marginTop: 1 },
  itemModel: { fontSize: 10, color: '#8C9BAB', marginTop: 1 },
  qtyTag: { backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  qtyTagTxt: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  footerInfo: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#384148' },
  footerMeta: { fontSize: 10, color: '#8C9BAB' },
});
