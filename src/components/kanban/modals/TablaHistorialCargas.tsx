import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { History, Package, Calendar, User, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { fetchTodasLasTarjetas } from '../../../services/tarjetasService';

export interface LoadHistoryRecord {
  id: string;
  nroOrden: string;
  fecha: string;
  tipoCarga: string;
  asignadoA: string;
  entregadoPor: string;
  items: Array<{
    codigoMaterial: string;
    nombreMaterial: string;
    modeloMaterial: string;
    serialMaterial?: string;
    cantidad: number;
  }>;
  totalUnidades: number;
}

interface TablaHistorialCargasProps {
  empresaId: string | null;
  searchQuery: string;
}

export function TablaHistorialCargas({ empresaId, searchQuery }: TablaHistorialCargasProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<LoadHistoryRecord[]>([]);

  useEffect(() => {
    if (empresaId) fetchLoadHistory();
  }, [empresaId]);

  const fetchLoadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTodasLasTarjetas({
        empresaId,
        select: 'id, datos_valores, created_at',
        orderBy: 'created_at',
        ascending: false,
      });

      if (!data) return;

      const list: Array<LoadHistoryRecord & { createdAt: string }> = [];

      data.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();

        if (tipo.length > 0) {
          const rawItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          const mappedItems: Array<{ codigoMaterial: string; nombreMaterial: string; modeloMaterial: string; serialMaterial?: string; cantidad: number }> = [];
          let totalCant = 0;

          rawItems.forEach((sub: any) => {
            const cod = (sub.codigoMaterial || '').trim().toUpperCase();
            const cant = parseFloat(sub.cantidadRecibida || '0') || 0;
            if (cod || cant > 0) {
              mappedItems.push({
                codigoMaterial: cod || 'S/C',
                nombreMaterial: (sub.nombreMaterial || 'Material').toUpperCase(),
                modeloMaterial: (sub.modeloMaterial || 'GENERAL').toUpperCase(),
                serialMaterial: sub.serialMaterial || undefined,
                cantidad: cant,
              });
              totalCant += cant;
            }
          });

          if (mappedItems.length > 0) {
            list.push({
              id: row.id,
              nroOrden: v.nroOrdenEntrega || 'S/N',
              fecha: v.fechaRecibido || row.created_at?.split('T')[0] || '—',
              createdAt: row.created_at || '',
              tipoCarga: tipo,
              asignadoA: (v.asignadoA || v.recibidoPor || '—').toUpperCase(),
              entregadoPor: (v.entregadoPor || '—').toUpperCase(),
              items: mappedItems,
              totalUnidades: totalCant,
            });
          }
        }
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

      list.sort((a, b) => getTimestamp(b) - getTimestamp(a));
      setRecords(list);
    } catch (e) {
      console.error('Error al cargar historial de cargas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = records.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchHeader = r.nroOrden.toLowerCase().includes(q) || r.asignadoA.toLowerCase().includes(q) || r.tipoCarga.toLowerCase().includes(q);
    const matchItems = r.items.some(i => i.codigoMaterial.toLowerCase().includes(q) || i.nombreMaterial.toLowerCase().includes(q) || i.modeloMaterial.toLowerCase().includes(q));
    return matchHeader || matchItems;
  });

  const getTipoBadgeStyle = (tipo: string) => {
    if (tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#F87171' };
    }
    if (tipo.includes('ASIGNA')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#FBBF24' };
    }
    return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ADE80' };
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={s.centerTxt}>Cargando historial de cargas y asignaciones...</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={s.center}>
        <History size={32} color="#4B5563" />
        <Text style={s.centerTxt}>No se encontraron cargas o asignaciones registradas.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const badge = getTipoBadgeStyle(item.tipoCarga);
          const isDevolucion = item.tipoCarga.includes('DEVOLUCION') || item.tipoCarga.includes('DEVOLUCIÓN');
          return (
            <View style={s.card}>
              <View style={s.cardHdr}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} color="#9CA3AF" />
                  <Text style={s.nroOrdenTxt}>Orden: {item.nroOrden}</Text>
                  <View style={[s.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    {isDevolucion ? <ArrowUpRight size={12} color={badge.text} /> : <ArrowDownRight size={12} color={badge.text} />}
                    <Text style={[s.badgeTxt, { color: badge.text }]}>{item.tipoCarga}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} color="#6B7280" />
                  <Text style={s.dateTxt}>{item.fecha}</Text>
                </View>
              </View>

              <View style={s.metaRow}>
                <Text style={s.metaTxt}>
                  Personal: <Text style={{ color: '#F3F4F6', fontWeight: 'bold' }}>{item.asignadoA}</Text>
                </Text>
                {item.entregadoPor !== '—' && (
                  <Text style={s.metaTxt}>
                    Entregado por: <Text style={{ color: '#D1D5DB' }}>{item.entregadoPor}</Text>
                  </Text>
                )}
              </View>

              <View style={s.itemsTable}>
                {item.items.map((sub, idx) => (
                  <View key={idx} style={[s.itemRow, idx % 2 === 1 && s.itemRowAlt]}>
                    <View style={{ flex: 2 }}>
                      <Text style={s.codTxt}>{sub.codigoMaterial}</Text>
                      <Text style={s.nameTxt}>{sub.nombreMaterial}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={s.qtyTxt}>{sub.cantidad} und.</Text>
                      {sub.modeloMaterial !== 'GENERAL' && <Text style={s.modelTxt}>{sub.modeloMaterial}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  centerTxt: { color: '#6B7280', marginTop: 10, fontSize: 13 },
  card: { backgroundColor: '#111827', borderRadius: 8, borderWidth: 1, borderColor: '#1F2937', padding: 14 },
  cardHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nroOrdenTxt: { fontSize: 13, fontWeight: 'bold', color: '#60A5FA' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  badgeTxt: { fontSize: 10, fontWeight: 'bold' },
  dateTxt: { fontSize: 11, color: '#9CA3AF' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  metaTxt: { fontSize: 11, color: '#9CA3AF' },
  itemsTable: { gap: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  itemRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  codTxt: { fontSize: 11, fontWeight: 'bold', color: '#38BDF8' },
  nameTxt: { fontSize: 12, color: '#E5E7EB' },
  qtyTxt: { fontSize: 12, fontWeight: 'bold', color: '#F59E0B' },
  modelTxt: { fontSize: 10, color: '#6B7280' },
});
