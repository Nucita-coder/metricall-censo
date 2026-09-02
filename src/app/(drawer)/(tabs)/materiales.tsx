import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  useWindowDimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { Package, History, FileText, Calendar, Tag, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Tarjeta, TarjetaMaterialItem } from '../../../types/kanban';

interface ListaAlmacenRel {
  id: string;
  nombre: string;
  tablero_id: string;
  tableros?: { tipo?: string; empresa_id?: string } | null;
}

export interface CustodiaItem {
  codigo: string;
  nombre: string;
  modelo: string;
  serial?: string;
  cantidad: number;
}

export interface MovimientoItem {
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

export default function MaterialesScreen() {
  const { empresaId, nombreCompleto, userRol, isDeveloper } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const canSeeAdmin = isDeveloper || ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(rolLower);

  if (!canSeeAdmin) {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [activeTab, setActiveTab] = useState<'custodia' | 'devoluciones' | 'historial'>('custodia');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [custodiaList, setCustodiaList] = useState<CustodiaItem[]>([]);
  const [devueltosList, setDevueltosList] = useState<CustodiaItem[]>([]);
  const [movimientosList, setMovimientosList] = useState<MovimientoItem[]>([]);

  const handleDevolverMaterial = async (item: CustodiaItem) => {
    if (!empresaId) return;
    try {
      const { data: listasData, error } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id, tableros!inner(tipo, empresa_id)')
        .eq('tableros.empresa_id', empresaId);

      if (error) throw error;

      const devList = (listasData as unknown as ListaAlmacenRel[])?.find((l) => 
        l.tableros?.tipo === 'almacen' && (
          l.nombre.toLowerCase().includes('devolución de asignación') ||
          l.nombre.toLowerCase().includes('devolucion de asignacion') ||
          l.nombre.toLowerCase().includes('devolucion')
        )
      ) || (listasData as unknown as ListaAlmacenRel[])?.find((l) => l.nombre.toLowerCase().includes('devolucion'));

      if (!devList) {
        Alert.alert('Almacén no encontrado', 'No se encontró la lista de Devolución de Asignación en los tableros de Almacén de tu empresa.');
        return;
      }

      router.push({
        pathname: '/tarjeta/nueva',
        params: {
          lista_id: devList.id,
          lista_nombre: devList.nombre,
          tipoCarga: 'DEVOLUCIÓN DE ASIGNACIÓN',
          codigoMaterial: item.codigo,
          nombreMaterial: item.nombre,
          modeloMaterial: item.modelo,
          serialMaterial: item.serial || '',
          cantidad: String(item.cantidad)
        }
      });
    } catch (e: unknown) {
      console.error('Error al buscar lista de devolución:', e);
      Alert.alert('Error', (e as Error).message || 'No se pudo abrir el formulario de devolución.');
    }
  };

  const fetchMaterialesData = useCallback(async () => {
    if (!empresaId || !nombreCompleto) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('id, datos_valores, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return;

      const targetName = nombreCompleto.trim().toUpperCase();
      const mapaCustodia: Record<string, CustodiaItem> = {};
      const mapaDevueltos: Record<string, CustodiaItem> = {};
      const movimientos: Array<MovimientoItem & { createdAt?: string }> = [];

      (data as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const asignadoA = (v.asignadoA || v.recibidoPor || '').toString().trim().toUpperCase();

        const matchMiembro = asignadoA === targetName || (targetName && asignadoA && (asignadoA.includes(targetName) || targetName.includes(asignadoA)));
        if (!matchMiembro) return;

        const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
        const hasAsignadoA = Boolean(v.asignadoA && v.asignadoA.toString().trim() !== '' && v.asignadoA.toString().trim() !== '—');
        const isAsignacion = !isDevolucion && (tipo.includes('ASIGNA') || hasAsignadoA);

        if (!isDevolucion && !isAsignacion) return;

        const rawItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
        const mappedItems: Array<{ codigoMaterial: string; nombreMaterial: string; modeloMaterial: string; serialMaterial?: string; cantidad: number }> = [];
        let cardTotal = 0;

        (rawItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((sub) => {
          const cod = (sub.codigoMaterial || '').trim().toUpperCase();
          const cant = parseFloat(String(sub.cantidadRecibida || '0')) || 0;
          if (cod || cant > 0) {
            const itemCod = cod || 'SIN-CÓDIGO';
            const itemName = (sub.nombreMaterial || 'Material').toUpperCase();
            const itemModel = (sub.modeloMaterial || 'GENERAL').toUpperCase();
            const serial = sub.serialMaterial || undefined;

            mappedItems.push({
              codigoMaterial: itemCod,
              nombreMaterial: itemName,
              modeloMaterial: itemModel,
              serialMaterial: serial,
              cantidad: cant,
            });
            cardTotal += cant;

            // Actualizar custodia activa y devueltos
            if (isAsignacion) {
              if (!mapaCustodia[itemCod]) {
                mapaCustodia[itemCod] = { codigo: itemCod, nombre: itemName, modelo: itemModel, serial, cantidad: 0 };
              }
              mapaCustodia[itemCod].cantidad += cant;
            } else if (isDevolucion) {
              if (!mapaCustodia[itemCod]) {
                mapaCustodia[itemCod] = { codigo: itemCod, nombre: itemName, modelo: itemModel, serial, cantidad: 0 };
              }
              mapaCustodia[itemCod].cantidad -= cant;

              if (!mapaDevueltos[itemCod]) {
                mapaDevueltos[itemCod] = { codigo: itemCod, nombre: itemName, modelo: itemModel, serial, cantidad: 0 };
              }
              mapaDevueltos[itemCod].cantidad += cant;
            }
          }
        });

        movimientos.push({
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

      movimientos.sort((a, b) => getTimestamp(b) - getTimestamp(a));

      setCustodiaList(Object.values(mapaCustodia).filter(i => i.cantidad > 0));
      setDevueltosList(Object.values(mapaDevueltos).filter(i => i.cantidad > 0));
      setMovimientosList(movimientos);
    } catch (e) {
      console.error('Error al cargar pantalla de materiales:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, nombreCompleto]);

  useEffect(() => {
    fetchMaterialesData();
  }, [fetchMaterialesData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterialesData();
  };

  const totalActivo = custodiaList.reduce((acc, curr) => acc + curr.cantidad, 0);
  const totalDevuelto = devueltosList.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <View style={s.container}>
      <View style={[s.innerContainer, isDesktop && { maxWidth: 1024, alignSelf: 'center', width: '100%' }]}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.headerIcon}>
              <Package size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={s.title}>Mis Materiales Asignados</Text>
              <Text style={s.subtitle}>Gestión y control de inventario personal en custodia</Text>
            </View>
          </View>
        </View>

        {/* TABS */}
        <View style={s.tabBar}>
          <TouchableOpacity
            style={[s.tabItem, activeTab === 'custodia' && s.tabItemActive]}
            onPress={() => setActiveTab('custodia')}
          >
            <Package size={16} color={activeTab === 'custodia' ? '#FBBF24' : '#8C9BAB'} />
            <Text style={[s.tabText, activeTab === 'custodia' && s.tabTextActive]}>
              En Custodia ({custodiaList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabItem, activeTab === 'devoluciones' && s.tabItemActiveDev]}
            onPress={() => setActiveTab('devoluciones')}
          >
            <RotateCcw size={16} color={activeTab === 'devoluciones' ? '#C084FC' : '#8C9BAB'} />
            <Text style={[s.tabText, activeTab === 'devoluciones' && s.tabTextActiveDev]}>
              Devueltos ({devueltosList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabItem, activeTab === 'historial' && s.tabItemActiveHis]}
            onPress={() => setActiveTab('historial')}
          >
            <History size={16} color={activeTab === 'historial' ? '#60A5FA' : '#8C9BAB'} />
            <Text style={[s.tabText, activeTab === 'historial' && s.tabTextActiveHis]}>
              Historial ({movimientosList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {isLoading ? (
          <View style={s.centerLoading}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={s.loadingTxt}>Cargando materiales...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          >
            {activeTab === 'custodia' && (
              custodiaList.length === 0 ? (
                <View style={s.emptyBox}>
                  <Package size={40} color="#4B5563" />
                  <Text style={s.emptyTxt}>No tienes materiales en custodia actualmente.</Text>
                </View>
              ) : (
                custodiaList.map(item => (
                  <View key={item.codigo} style={s.itemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemCod}>{item.codigo}</Text>
                      <Text style={s.itemName}>{item.nombre}</Text>
                      <Text style={s.itemSub}>Modelo: {item.modelo}{item.serial ? ` · Serial: ${item.serial}` : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={s.qtyBadgeActive}>
                        <Text style={s.qtyTextActive}>{item.cantidad} und.</Text>
                      </View>
                      <TouchableOpacity
                        style={s.btnDevolverMini}
                        activeOpacity={0.7}
                        onPress={() => handleDevolverMaterial(item)}
                      >
                        <RotateCcw size={12} color="#C084FC" />
                        <Text style={s.btnDevolverMiniText}>Devolver</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )
            )}

            {activeTab === 'devoluciones' && (
              devueltosList.length === 0 ? (
                <View style={s.emptyBox}>
                  <RotateCcw size={40} color="#4B5563" />
                  <Text style={s.emptyTxt}>No hay registro de materiales devueltos.</Text>
                </View>
              ) : (
                devueltosList.map(item => (
                  <View key={item.codigo} style={[s.itemCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemCod, { color: '#C084FC' }]}>{item.codigo}</Text>
                      <Text style={s.itemName}>{item.nombre}</Text>
                      <Text style={s.itemSub}>Modelo: {item.modelo}{item.serial ? ` · Serial: ${item.serial}` : ''}</Text>
                    </View>
                    <View style={s.qtyBadgeDev}>
                      <Text style={s.qtyTextDev}>{item.cantidad} und.</Text>
                    </View>
                  </View>
                ))
              )
            )}

            {activeTab === 'historial' && (
              movimientosList.length === 0 ? (
                <View style={s.emptyBox}>
                  <History size={40} color="#4B5563" />
                  <Text style={s.emptyTxt}>No hay historial de movimientos de asignación/devolución.</Text>
                </View>
              ) : (
                movimientosList.map(mov => {
                  const isDev = mov.tipoCarga === 'DEVOLUCION';
                  return (
                    <View key={mov.cardId} style={[s.movCard, isDev && { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                      <View style={s.movHdr}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} color={isDev ? '#C084FC' : '#60A5FA'} />
                          <Text style={[s.movOrden, isDev && { color: '#C084FC' }]}>Orden: {mov.nroOrden}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="#9CA3AF" />
                          <Text style={s.movFecha}>{mov.fecha}</Text>
                        </View>
                      </View>

                      <View style={[s.motivoBadge, isDev && { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                        <Tag size={12} color={isDev ? '#C084FC' : '#93C5FD'} />
                        <Text style={[s.motivoTxt, isDev && { color: '#C084FC' }]}>
                          {isDev ? 'DEVOLUCIÓN: ' : 'ASIGNACIÓN: '}{mov.motivo}
                        </Text>
                      </View>

                      <View style={s.movItemsBox}>
                        {mov.items.map((sub, idx) => (
                          <View key={idx} style={s.subRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[s.subCod, isDev && { color: '#C084FC' }]}>{sub.codigoMaterial}</Text>
                              <Text style={s.subName}>{sub.nombreMaterial}</Text>
                              <Text style={s.subModel}>Modelo: {sub.modeloMaterial}{sub.serialMaterial ? ` · Serial: ${sub.serialMaterial}` : ''}</Text>
                            </View>
                            <Text style={[s.subQty, isDev && { color: '#FCA5A5' }]}>
                              {isDev ? '-' : '+'}{sub.cantidad} und.
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={s.movFooter}>
                        <Text style={s.movFooterTxt}>
                          {isDev ? 'Entregado a almacén por: ' : 'Entregado por: '}
                          <Text style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{mov.entregadoPor}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })
              )
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  innerContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#F9FAFB' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#22272B', borderRadius: 8, padding: 4, gap: 4 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 6 },
  tabItemActive: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  tabItemActiveDev: { backgroundColor: 'rgba(139, 92, 246, 0.15)' },
  tabItemActiveHis: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  tabText: { fontSize: 13, color: '#8C9BAB', fontWeight: '600' },
  tabTextActive: { color: '#FBBF24', fontWeight: 'bold' },
  tabTextActiveDev: { color: '#C084FC', fontWeight: 'bold' },
  tabTextActiveHis: { color: '#60A5FA', fontWeight: 'bold' },
  centerLoading: { padding: 40, alignItems: 'center' },
  loadingTxt: { color: '#8C9BAB', marginTop: 12, fontSize: 14 },
  emptyBox: { backgroundColor: '#22272B', borderRadius: 10, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#384148', borderStyle: 'dashed' },
  emptyTxt: { color: '#8C9BAB', marginTop: 12, fontSize: 14, textAlign: 'center' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22272B', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  itemCod: { fontSize: 12, fontWeight: 'bold', color: '#FBBF24' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#F3F4F6', marginTop: 2 },
  itemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  qtyBadgeActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  qtyTextActive: { color: '#FBBF24', fontWeight: 'bold', fontSize: 13 },
  btnDevolverMini: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  btnDevolverMiniText: { color: '#C084FC', fontSize: 11, fontWeight: 'bold' },
  qtyBadgeDev: { backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.4)' },
  qtyTextDev: { color: '#C084FC', fontWeight: 'bold', fontSize: 13 },
  movCard: { backgroundColor: '#22272B', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#384148' },
  movHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  movOrden: { fontSize: 13, fontWeight: 'bold', color: '#60A5FA' },
  movFecha: { fontSize: 11, color: '#9CA3AF' },
  motivoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 10 },
  motivoTxt: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },
  movItemsBox: { backgroundColor: '#1D2125', borderRadius: 6, padding: 10, gap: 8 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2C333A', paddingBottom: 6 },
  subCod: { fontSize: 11, fontWeight: 'bold', color: '#60A5FA' },
  subName: { fontSize: 12, color: '#F3F4F6', marginTop: 1 },
  subModel: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  subQty: { fontSize: 12, fontWeight: 'bold', color: '#FBBF24' },
  movFooter: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#384148' },
  movFooterTxt: { fontSize: 11, color: '#9CA3AF' },
});
