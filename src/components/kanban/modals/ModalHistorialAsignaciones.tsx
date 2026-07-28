import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Calendar, FileText, History, Package, User, X, CheckCircle, Tag } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';

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
        .eq('empresa_id', empresaId);

      if (error) throw error;
      if (!data) return;

      const results: AssignmentHistoryItem[] = [];
      const targetName = (miembroNombre || '').trim().toUpperCase();

      data.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const asignadoA = (v.asignadoA || v.recibidoPor || '').toString().trim().toUpperCase();

        const isDevolucion = tipo === 'DEVOLUCIÓN DE ASIGNACIÓN' || tipo === 'DEVOLUCION DE ASIGNACION';
        const isAsignacion = tipo === 'MATERIAL ASIGNADO' || (!tipo && v.asignadoA);

        if (isDevolucion || isAsignacion) {
          if (asignadoA === targetName || (targetName && (asignadoA.includes(targetName) || targetName.includes(asignadoA)))) {
            const rawItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
            const mappedItems: Array<{ codigoMaterial: string; nombreMaterial: string; modeloMaterial: string; serialMaterial?: string; cantidad: number }> = [];
            let cardTotal = 0;

            rawItems.forEach((sub: any) => {
              const cod = (sub.codigoMaterial || '').trim().toUpperCase();
              const cant = parseFloat(sub.cantidadRecibida || '0') || 0;
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
              motivo: v.motivoAsignacion || (isDevolucion ? 'Devolución de Material' : 'Asignación de Material'),
              tipoCarga: isDevolucion ? 'DEVOLUCION' : 'ASIGNACION',
              entregadoPor: (v.entregadoPor || '—').toUpperCase(),
              recibidoPor: (v.recibidoPor || v.asignadoA || '—').toUpperCase(),
              items: mappedItems,
              totalUnidades: cardTotal,
            });
          }
        }
      });

      results.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
                <User size={20} color="#60A5FA" />
              </View>
              <View>
                <Text style={s.hdrTitle}>Historial de Asignaciones y Devoluciones</Text>
                <Text style={s.hdrSub}>{miembroNombre || 'Personal'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color="#9CA3AF" />
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
              <Text style={[s.kpiNum, { color: '#F59E0B' }]}>{totalUnidadesCustodia}</Text>
              <Text style={s.kpiTxt}>Unidades en Custodia Actual</Text>
            </View>
          </View>

          {/* CONTENIDO / LISTA */}
          {isLoading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={s.centerTxt}>Cargando historial de asignaciones...</Text>
            </View>
          ) : historyList.length === 0 ? (
            <View style={s.center}>
              <Package size={36} color="#4B5563" />
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
                  <View style={[s.cardItem, isDevolucion && { borderColor: '#8B5CF6' }]}>
                    <View style={s.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color={isDevolucion ? '#C084FC' : '#60A5FA'} />
                        <Text style={[s.ordenTxt, isDevolucion && { color: '#C084FC' }]}>Orden: {item.nroOrden}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color="#9CA3AF" />
                        <Text style={s.fechaTxt}>{item.fecha}</Text>
                      </View>
                    </View>

                    <View style={[s.motivoBadge, isDevolucion && { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Tag size={12} color={isDevolucion ? '#C084FC' : '#93C5FD'} />
                      <Text style={[s.motivoTxt, isDevolucion && { color: '#C084FC' }]}>
                        {isDevolucion ? 'DEVOLUCIÓN: ' : 'ASIGNACIÓN: '}{item.motivo}
                      </Text>
                    </View>

                    {/* LISTADO DE MATERIALES EN ESTA ORDEN */}
                    <View style={s.itemsContainer}>
                      {item.items.map((sub, idx) => (
                        <View key={idx} style={s.subItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.itemCod, isDevolucion && { color: '#C084FC' }]}>{sub.codigoMaterial}</Text>
                            <Text style={s.itemName}>{sub.nombreMaterial}</Text>
                            <Text style={s.itemModel}>Modelo: {sub.modeloMaterial}{sub.serialMaterial ? ` · Serial: ${sub.serialMaterial}` : ''}</Text>
                          </View>
                          <View style={[s.qtyTag, isDevolucion && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                            <Text style={[s.qtyTagTxt, isDevolucion && { color: '#FCA5A5' }]}>
                              {isDevolucion ? '-' : '+'}{sub.cantidad} und.
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={s.footerInfo}>
                      <Text style={s.footerMeta}>{isDevolucion ? 'Entregado a almacén por: ' : 'Entregado por: '}<Text style={{ color: '#E5E7EB' }}>{item.entregadoPor}</Text></Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modal: { backgroundColor: '#111827', width: '100%', maxHeight: '90%', borderRadius: 10, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  userAvatarIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.15)', justifyContent: 'center', alignItems: 'center' },
  hdrTitle: { fontSize: 16, fontWeight: '700', color: '#F9FAFB' },
  hdrSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  closeBtn: { padding: 6, borderRadius: 6 },
  kpiBar: { flexDirection: 'row', backgroundColor: '#0D1117', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiNum: { fontSize: 18, fontWeight: '700', color: '#60A5FA' },
  kpiTxt: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 },
  kpiSep: { width: 1, height: 24, backgroundColor: '#1F2937' },
  center: { padding: 48, alignItems: 'center' },
  centerTxt: { color: '#6B7280', marginTop: 12, fontSize: 13 },
  cardItem: { backgroundColor: '#1F2937', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ordenTxt: { fontSize: 13, fontWeight: '700', color: '#93C5FD' },
  fechaTxt: { fontSize: 11, color: '#9CA3AF' },
  motivoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 10 },
  motivoTxt: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },
  itemsContainer: { backgroundColor: '#111827', borderRadius: 6, padding: 10, gap: 8 },
  subItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 6 },
  itemCod: { fontSize: 11, fontWeight: '700', color: '#60A5FA' },
  itemName: { fontSize: 12, color: '#F3F4F6', fontWeight: '500', marginTop: 1 },
  itemModel: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  qtyTag: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  qtyTagTxt: { fontSize: 12, fontWeight: 'bold', color: '#FBBF24' },
  footerInfo: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#374151' },
  footerMeta: { fontSize: 10, color: '#9CA3AF' },
});
