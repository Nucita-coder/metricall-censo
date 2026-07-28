import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Package, Search, X, RefreshCw, ArrowUpRight, ArrowDownRight, SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';

export interface MaterialStockItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  stockTotal: number;
  numRegistros: number;
  ultimoIngreso: string;
}

interface ModalInventarioAlmacenProps {
  visible: boolean;
  onClose: () => void;
}

import { TablaStockAsignado } from './TablaStockAsignado';
import { TablaStockGeneral } from './TablaStockGeneral';

export function ModalInventarioAlmacen({ visible, onClose }: ModalInventarioAlmacenProps) {
  const { empresaId } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [activeTab, setActiveTab] = useState<'disponible' | 'asignado' | 'general'>('disponible');
  const [isLoading, setIsLoading] = useState(false);
  const [materiales, setMateriales] = useState<MaterialStockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroStock, setFiltroStock] = useState<'all' | 'ok' | 'low' | 'zero'>('all');
  const [filtroModelo, setFiltroModelo] = useState<string>('all');
  const [orden, setOrden] = useState<'nombre' | 'stockDesc' | 'stockAsc'>('nombre');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  useEffect(() => {
    if (visible && empresaId) fetchStock();
  }, [visible, empresaId]);

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('datos_valores, created_at')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      if (!data) return;

      const mapa: Record<string, MaterialStockItem> = {};
      data.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
        itemsList.forEach((subItem: any) => {
          const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
          if (!cod) return;
          const cant = parseFloat(subItem.cantidadRecibida || '0') || 0;
          const fechaIngreso = v.fechaRecibido || row.created_at;

          if (!mapa[cod]) {
            mapa[cod] = {
              codigoMaterial: cod,
              nombreMaterial: (subItem.nombreMaterial || '—').toUpperCase(),
              modeloMaterial: (subItem.modeloMaterial || 'GENERAL').toUpperCase(),
              stockTotal: 0,
              numRegistros: 0,
              ultimoIngreso: fechaIngreso,
            };
          }

          mapa[cod].numRegistros += 1;
          if (subItem.nombreMaterial && mapa[cod].nombreMaterial === '—') {
            mapa[cod].nombreMaterial = subItem.nombreMaterial.toUpperCase();
          }

          let rec = 0, asig = 0;
          if (tipo === 'MATERIAL ASIGNADO') asig += cant;
          else if (tipo === 'DEVOLUCIÓN DE ASIGNACIÓN' || tipo === 'DEVOLUCION DE ASIGNACION') asig -= cant;
          else if (tipo === 'DEVOLUCIÓN A ALMACÉN CENTRAL' || tipo === 'DEVOLUCION A ALMACEN CENTRAL') rec -= cant;
          else rec += cant;

          mapa[cod].stockTotal += (rec - asig);
        });
      });
      setMateriales(Object.values(mapa));
    } catch (e) {
      console.error('Error inventario:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const modelosUnicos = Array.from(new Set(materiales.map(m => m.modeloMaterial).filter(Boolean)));

  const filtered = materiales
    .filter((m) => {
      const q = searchQuery.toLowerCase();
      if (!m.codigoMaterial.toLowerCase().includes(q) && !m.nombreMaterial.toLowerCase().includes(q) && !m.modeloMaterial.toLowerCase().includes(q)) return false;
      if (filtroStock === 'ok') return m.stockTotal >= 10;
      if (filtroStock === 'low') return m.stockTotal > 0 && m.stockTotal < 10;
      if (filtroStock === 'zero') return m.stockTotal <= 0;
      if (filtroModelo !== 'all') return m.modeloMaterial === filtroModelo;
      return true;
    })
    .sort((a, b) => {
      if (orden === 'stockDesc') return b.stockTotal - a.stockTotal;
      if (orden === 'stockAsc') return a.stockTotal - b.stockTotal;
      return a.nombreMaterial.localeCompare(b.nombreMaterial);
    });

  const totalUnd = materiales.reduce((s, m) => s + m.stockTotal, 0);
  const maxStock = Math.max(...materiales.map(m => m.stockTotal), 1);

  const StockBar = ({ value }: { value: number }) => {
    const pct = Math.min((value / maxStock) * 100, 100);
    const isBajo = value < 10;
    return (
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: isBajo ? '#EF4444' : pct > 70 ? '#22C55E' : '#F59E0B' }]} />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.modal, WEB_MODAL_CONTAINER, isDesktop && { maxWidth: 960 }]}>
          {/* HEADER */}
          <View style={s.hdr}>
            <View>
              <Text style={s.hdrTitle}>Inventario y Control de Stock</Text>
              <Text style={s.hdrSub}>{materiales.length} productos · {totalUnd} unidades disponibles</Text>
            </View>
            <View style={s.hdrActions}>
              <TouchableOpacity onPress={fetchStock} style={s.iconBtn}>
                <RefreshCw size={15} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={s.iconBtn}>
                <X size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* TAB SWITCHER */}
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
            <TouchableOpacity style={[{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6 }, activeTab === 'disponible' ? { backgroundColor: '#1D4ED8' } : { backgroundColor: '#1F2937' }]} onPress={() => setActiveTab('disponible')}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'disponible' ? '#FFF' : '#9CA3AF' }}>📦 Stock Disponible</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6 }, activeTab === 'asignado' ? { backgroundColor: '#1D4ED8' } : { backgroundColor: '#1F2937' }]} onPress={() => setActiveTab('asignado')}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'asignado' ? '#FFF' : '#9CA3AF' }}>👤 Stock Asignado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6 }, activeTab === 'general' ? { backgroundColor: '#1D4ED8' } : { backgroundColor: '#1F2937' }]} onPress={() => setActiveTab('general')}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'general' ? '#FFF' : '#9CA3AF' }}>📊 Stock General</Text>
            </TouchableOpacity>
          </View>

          {/* TOOLBAR CON BOTÓN PLEGABLE */}
          <View style={s.toolbar}>
            <View style={s.searchBox}>
              <Search size={14} color="#6B7280" />
              <TextInput
                style={s.searchInput as any}
                placeholder="Buscar código, material, modelo..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[s.filterToggleBtn, (filtrosExpanded || filtroStock !== 'all' || filtroModelo !== 'all') && s.filterToggleBtnActive]}
              onPress={() => setFiltrosExpanded(!filtrosExpanded)}
            >
              <SlidersHorizontal size={14} color={filtrosExpanded ? '#60A5FA' : '#9CA3AF'} />
              <Text style={[s.filterToggleTxt, filtrosExpanded && { color: '#60A5FA', fontWeight: 'bold' }]}>
                Filtros {filtroStock !== 'all' || filtroModelo !== 'all' ? '(Activos)' : ''}
              </Text>
              <ChevronDown size={14} color={filtrosExpanded ? '#60A5FA' : '#9CA3AF'} style={{ transform: [{ rotate: filtrosExpanded ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* PANEL PLEGABLE DE FILTROS AVANZADOS */}
          {filtrosExpanded && (
            <View style={s.collapsiblePanel}>
              <View style={s.filterGroup}>
                <Text style={s.filterGroupTitle}>Estado de Stock:</Text>
                <View style={s.pillsRow}>
                  {[{ key: 'all', label: `Todos (${materiales.length})` }, { key: 'ok', label: 'Óptimo (>=10)' }, { key: 'low', label: 'Crítico (<10)' }, { key: 'zero', label: 'Agotado (0)' }].map((item) => (
                    <TouchableOpacity key={item.key} onPress={() => setFiltroStock(item.key as any)} style={[s.pill, filtroStock === item.key && s.pillActive]}>
                      <Text style={[s.pillTxt, filtroStock === item.key && s.pillTxtActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.filterGroup}>
                <Text style={s.filterGroupTitle}>Ordenar por:</Text>
                <View style={s.pillsRow}>
                  {[{ key: 'nombre', label: 'Nombre A-Z' }, { key: 'stockDesc', label: 'Mayor Stock' }, { key: 'stockAsc', label: 'Menor Stock' }].map((item) => (
                    <TouchableOpacity key={item.key} onPress={() => setOrden(item.key as any)} style={[s.pill, orden === item.key && s.pillActive]}>
                      <Text style={[s.pillTxt, orden === item.key && s.pillTxtActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {modelosUnicos.length > 0 && (
                <View style={s.filterGroup}>
                  <Text style={s.filterGroupTitle}>Modelo:</Text>
                  <View style={s.pillsRow}>
                    <TouchableOpacity onPress={() => setFiltroModelo('all')} style={[s.pill, filtroModelo === 'all' && s.pillActive]}>
                      <Text style={[s.pillTxt, filtroModelo === 'all' && s.pillTxtActive]}>Todos</Text>
                    </TouchableOpacity>
                    {modelosUnicos.map((mod) => (
                      <TouchableOpacity key={mod} onPress={() => setFiltroModelo(mod)} style={[s.pill, filtroModelo === mod && s.pillActive]}>
                        <Text style={[s.pillTxt, filtroModelo === mod && s.pillTxtActive]}>{mod}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* CONTENIDO DE PESTAÑA */}
          {activeTab === 'asignado' ? (
            <TablaStockAsignado empresaId={empresaId} searchQuery={searchQuery} />
          ) : activeTab === 'general' ? (
            <TablaStockGeneral empresaId={empresaId} searchQuery={searchQuery} />
          ) : (
            <>
              {/* TABLE HEADER */}
              <View style={s.thead}>
                <Text style={[s.th, { width: 80 }]}>Código</Text>
                <Text style={[s.th, { flex: 1 }]}>Material / Modelo</Text>
                <Text style={[s.th, { width: 100, textAlign: 'center' }]}>Nivel</Text>
                <Text style={[s.th, { width: 90, textAlign: 'right' }]}>Stock</Text>
                <Text style={[s.th, { width: 60, textAlign: 'right' }]}>Rec.</Text>
              </View>

              {/* TABLE BODY */}
              {isLoading ? (
                <View style={s.center}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={s.centerTxt}>Cargando inventario...</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={s.center}>
                  <Package size={32} color="#4B5563" />
                  <Text style={s.centerTxt}>Sin resultados para los filtros aplicados</Text>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(i) => i.codigoMaterial}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => {
                    const bajo = item.stockTotal < 10;
                    return (
                      <View style={[s.row, index % 2 === 0 && s.rowAlt]}>
                        <View style={{ width: 80 }}>
                          <Text style={s.codTxt}>{item.codigoMaterial}</Text>
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={s.matName} numberOfLines={1}>{item.nombreMaterial}</Text>
                          <Text style={s.matModel}>{item.modeloMaterial}</Text>
                        </View>
                        <View style={{ width: 100 }}>
                          <StockBar value={item.stockTotal} />
                        </View>
                        <View style={{ width: 90, alignItems: 'flex-end' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {bajo
                              ? <ArrowDownRight size={12} color="#EF4444" style={{ marginRight: 2 }} />
                              : <ArrowUpRight size={12} color="#22C55E" style={{ marginRight: 2 }} />
                            }
                            <Text style={[s.stockNum, bajo && { color: '#EF4444' }]}>{item.stockTotal}</Text>
                          </View>
                          <Text style={s.stockUnd}>unidades</Text>
                        </View>
                        <View style={{ width: 60, alignItems: 'flex-end' }}>
                          <Text style={s.recNum}>{item.numRegistros}</Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </>
          )}

          {/* FOOTER */}
          <View style={s.footer}>
            <Text style={s.footerTxt}>Mostrando {filtered.length} de {materiales.length} ítems</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modal: { backgroundColor: '#111827', width: '100%', maxHeight: '92%', borderRadius: 10, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  hdrTitle: { fontSize: 17, fontWeight: '600', color: '#F9FAFB', letterSpacing: -0.3 },
  hdrSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hdrActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 6 },
  kpiStrip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  kpi: { flex: 1, alignItems: 'center' },
  kpiNum: { fontSize: 22, fontWeight: '700', color: '#F9FAFB', fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSep: { width: 1, height: 28, backgroundColor: '#1F2937' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 6, paddingHorizontal: 10, height: 34 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 13, color: '#E5E7EB', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  filterToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#374151' },
  filterToggleBtnActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  filterToggleTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  collapsiblePanel: { backgroundColor: '#0D1117', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F2937', gap: 10 },
  filterGroup: { gap: 4 },
  filterGroupTitle: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, backgroundColor: '#1F2937' },
  pillActive: { backgroundColor: '#1D4ED8' },
  pillTxt: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  pillTxtActive: { color: '#DBEAFE', fontWeight: '600' },
  thead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  th: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 },
  center: { padding: 48, alignItems: 'center' },
  centerTxt: { color: '#6B7280', marginTop: 10, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111827' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.015)' },
  codTxt: { fontSize: 12, fontWeight: '600', color: '#93C5FD', fontVariant: ['tabular-nums'] },
  matName: { fontSize: 13, fontWeight: '500', color: '#E5E7EB' },
  matModel: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  barTrack: { height: 4, backgroundColor: '#1F2937', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  stockNum: { fontSize: 14, fontWeight: '700', color: '#34D399', fontVariant: ['tabular-nums'] },
  stockUnd: { fontSize: 9, color: '#6B7280' },
  recNum: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', fontVariant: ['tabular-nums'] },
  footer: { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1F2937', backgroundColor: '#0D1117' },
  footerTxt: { fontSize: 11, color: '#6B7280' }
});
