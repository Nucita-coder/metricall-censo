import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

export interface GeneralStockItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  totalRecibido: number;
  totalAsignado: number;
  stockDisponible: number;
  numRegistros: number;
}

interface TablaStockGeneralProps {
  empresaId: string | null;
  searchQuery?: string;
}

export function TablaStockGeneral({ empresaId, searchQuery = '' }: TablaStockGeneralProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<GeneralStockItem[]>([]);

  useEffect(() => {
    if (empresaId) fetchGeneralStock();
  }, [empresaId]);

  const fetchGeneralStock = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('datos_valores')
        .eq('empresa_id', empresaId);

      if (error) throw error;
      if (!data) return;

      const mapa: Record<string, GeneralStockItem> = {};
      data.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const subItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

        subItems.forEach((sub: any) => {
          const cod = (sub.codigoMaterial || '').trim().toUpperCase();
          if (!cod) return;
          const cant = parseFloat(sub.cantidadRecibida || '0') || 0;

          if (!mapa[cod]) {
            mapa[cod] = {
              codigoMaterial: cod,
              nombreMaterial: (sub.nombreMaterial || '—').toUpperCase(),
              modeloMaterial: (sub.modeloMaterial || 'GENERAL').toUpperCase(),
              totalRecibido: 0,
              totalAsignado: 0,
              stockDisponible: 0,
              numRegistros: 0,
            };
          }

          mapa[cod].numRegistros += 1;
          if (sub.nombreMaterial && mapa[cod].nombreMaterial === '—') {
            mapa[cod].nombreMaterial = sub.nombreMaterial.toUpperCase();
          }

          if (tipo === 'MATERIAL ASIGNADO') {
            mapa[cod].totalAsignado += cant;
          } else if (tipo === 'DEVOLUCIÓN DE ASIGNACIÓN' || tipo === 'DEVOLUCION DE ASIGNACION') {
            mapa[cod].totalAsignado = Math.max(0, mapa[cod].totalAsignado - cant);
          } else if (tipo === 'DEVOLUCIÓN A ALMACÉN CENTRAL' || tipo === 'DEVOLUCION A ALMACEN CENTRAL') {
            mapa[cod].totalRecibido = Math.max(0, mapa[cod].totalRecibido - cant);
          } else {
            mapa[cod].totalRecibido += cant;
          }

          mapa[cod].stockDisponible = mapa[cod].totalRecibido - mapa[cod].totalAsignado;
        });
      });

      setItems(Object.values(mapa));
    } catch (err) {
      console.error('Error al obtener stock general:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = items.filter((i) => {
    const q = searchQuery.toLowerCase();
    return (
      i.codigoMaterial.toLowerCase().includes(q) ||
      i.nombreMaterial.toLowerCase().includes(q) ||
      i.modeloMaterial.toLowerCase().includes(q)
    );
  });

  const grandTotalRecibido = items.reduce((s, i) => s + i.totalRecibido, 0);
  const grandTotalAsignado = items.reduce((s, i) => s + i.totalAsignado, 0);
  const grandTotalDisponible = items.reduce((s, i) => s + i.stockDisponible, 0);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={s.centerTxt}>Calculando stock general...</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={s.center}>
        <Package size={32} color="#4B5563" />
        <Text style={s.centerTxt}>No se encontraron registros de stock general</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Kpis Globales */}
      <View style={s.kpiStrip}>
        <View style={s.kpi}>
          <Text style={s.kpiNum}>{grandTotalRecibido}</Text>
          <Text style={s.kpiLabel}>Total Recibido</Text>
        </View>
        <View style={s.kpiSep} />
        <View style={s.kpi}>
          <Text style={[s.kpiNum, { color: '#F59E0B' }]}>{grandTotalAsignado}</Text>
          <Text style={s.kpiLabel}>Asignado a Personal</Text>
        </View>
        <View style={s.kpiSep} />
        <View style={s.kpi}>
          <Text style={[s.kpiNum, { color: '#10B981' }]}>{grandTotalDisponible}</Text>
          <Text style={s.kpiLabel}>Disponible en Almacén</Text>
        </View>
      </View>

      {/* Header Tabla */}
      <View style={s.thead}>
        <Text style={[s.th, { width: 85 }]}>Código</Text>
        <Text style={[s.th, { flex: 1 }]}>Material / Modelo</Text>
        <Text style={[s.th, { width: 75, textAlign: 'right' }]}>Total</Text>
        <Text style={[s.th, { width: 75, textAlign: 'right' }]}>Asignado</Text>
        <Text style={[s.th, { width: 85, textAlign: 'right' }]}>Disponible</Text>
      </View>

      {/* Listado */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.codigoMaterial}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={[s.row, index % 2 === 0 && s.rowAlt]}>
            <View style={{ width: 85 }}>
              <Text style={s.codTxt}>{item.codigoMaterial}</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={s.matName} numberOfLines={1}>{item.nombreMaterial}</Text>
              <Text style={s.matModel}>{item.modeloMaterial}</Text>
            </View>
            <View style={{ width: 75, alignItems: 'flex-end' }}>
              <Text style={s.numTxt}>{item.totalRecibido}</Text>
            </View>
            <View style={{ width: 75, alignItems: 'flex-end' }}>
              <Text style={[s.numTxt, { color: '#F59E0B' }]}>{item.totalAsignado}</Text>
            </View>
            <View style={{ width: 85, alignItems: 'flex-end' }}>
              <Text style={[s.numTxt, { color: '#10B981', fontWeight: 'bold' }]}>{item.stockDisponible}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { padding: 48, alignItems: 'center' },
  centerTxt: { color: '#6B7280', marginTop: 10, fontSize: 13 },
  kpiStrip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  kpi: { flex: 1, alignItems: 'center' },
  kpiNum: { fontSize: 18, fontWeight: '700', color: '#F9FAFB' },
  kpiLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSep: { width: 1, height: 24, backgroundColor: '#1F2937' },
  thead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  th: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111827' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.015)' },
  codTxt: { fontSize: 11, fontWeight: '600', color: '#93C5FD' },
  matName: { fontSize: 12, fontWeight: '500', color: '#E5E7EB' },
  matModel: { fontSize: 10, color: '#6B7280' },
  numTxt: { fontSize: 13, color: '#E5E7EB' },
});
