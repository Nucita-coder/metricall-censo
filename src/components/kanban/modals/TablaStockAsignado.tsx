import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { User, Package, Calendar, History } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { ModalHistorialAsignaciones } from './ModalHistorialAsignaciones';

export interface AssignedStockRecord {
  id: string;
  miembro: string;
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  cantidad: number;
  fecha: string;
  nroOrden: string;
}

interface TablaStockAsignadoProps {
  empresaId: string | null;
  searchQuery: string;
}

export function TablaStockAsignado({ empresaId, searchQuery }: TablaStockAsignadoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<AssignedStockRecord[]>([]);
  const [selectedMiembroHistorial, setSelectedMiembroHistorial] = useState<string | null>(null);

  useEffect(() => {
    if (empresaId) fetchAssignedStock();
  }, [empresaId]);

  const fetchAssignedStock = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('id, datos_valores, created_at')
        .eq('empresa_id', empresaId);

      if (error) throw error;
      if (!data) return;

      const mapa: Record<string, AssignedStockRecord> = {};

      data.forEach((row: any) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const rawMiembro = (v.asignadoA || v.recibidoPor || '').toString().trim();
        const hasAsignadoA = Boolean(rawMiembro && rawMiembro.toUpperCase() !== 'SIN ASIGNAR' && rawMiembro !== '—');

        const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
        const isAsignado = !isDevolucion && (tipo.includes('ASIGNA') || hasAsignadoA);

        if (isAsignado || isDevolucion) {
          const miembro = rawMiembro.toUpperCase() || 'SIN ASIGNAR';
          const fecha = v.fechaRecibido || row.created_at?.split('T')[0] || '';
          const nroOrden = v.nroOrdenEntrega || '—';

          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

          itemsList.forEach((item: any, idx: number) => {
            const cod = (item.codigoMaterial || '').trim().toUpperCase();
            if (!cod) return;
            const cant = parseFloat(item.cantidadRecibida || '0') || 0;
            const key = `${miembro}___${cod}`;

            if (!mapa[key]) {
              mapa[key] = {
                id: `${row.id}-${idx}`,
                miembro,
                codigoMaterial: cod,
                nombreMaterial: (item.nombreMaterial || '—').toUpperCase(),
                modeloMaterial: (item.modeloMaterial || 'GENERAL').toUpperCase(),
                cantidad: 0,
                fecha,
                nroOrden
              };
            }

            if (isAsignado) {
              mapa[key].cantidad += cant;
            } else if (isDevolucion) {
              mapa[key].cantidad -= cant;
            }
          });
        }
      });

      const list = Object.values(mapa).filter(r => r.cantidad > 0);
      setRecords(list);
    } catch (e) {
      console.error('Error al cargar stock asignado:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.miembro.toLowerCase().includes(q) ||
      r.codigoMaterial.toLowerCase().includes(q) ||
      r.nombreMaterial.toLowerCase().includes(q) ||
      r.modeloMaterial.toLowerCase().includes(q)
    );
  });

  const totalUnidades = filtered.reduce((acc, curr) => acc + curr.cantidad, 0);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={s.centerTxt}>Cargando material asignado a personal...</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={s.center}>
        <Package size={32} color="#4B5563" />
        <Text style={s.centerTxt}>No se registraron materiales asignados a personal.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.summaryBadge}>
        <Text style={s.summaryTxt}>Total en Custodia de Personal: <Text style={s.summaryBold}>{totalUnidades} und.</Text></Text>
      </View>

      <View style={s.thead}>
        <Text style={[s.th, { flex: 2 }]}>PERSONAL / MIEMBRO</Text>
        <Text style={[s.th, { flex: 2 }]}>CÓDIGO Y MATERIAL</Text>
        <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>CANTIDAD</Text>
        <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>FECHA</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[s.row, index % 2 === 1 && s.rowAlt]}
            onPress={() => setSelectedMiembroHistorial(item.miembro)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 2 }}>
              <View style={s.flexRow}>
                <User size={13} color="#60A5FA" />
                <Text style={s.miembroTxt}>{item.miembro}</Text>
              </View>
              <Text style={s.subTxt}>Orden: {item.nroOrden}</Text>
            </View>

            <View style={{ flex: 2 }}>
              <Text style={s.codTxt}>{item.codigoMaterial}</Text>
              <Text style={s.matName} numberOfLines={1}>{item.nombreMaterial}</Text>
            </View>

            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={s.qtyBadge}>
                <Text style={s.qtyTxt}>{item.cantidad} und.</Text>
              </View>
            </View>

            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={s.flexRow}>
                <Calendar size={11} color="#9CA3AF" />
                <Text style={s.dateTxt}>{item.fecha}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
                <History size={10} color="#60A5FA" />
                <Text style={{ fontSize: 9, color: '#60A5FA', fontWeight: 'bold' }}>Historial</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <ModalHistorialAsignaciones
        visible={!!selectedMiembroHistorial}
        onClose={() => setSelectedMiembroHistorial(null)}
        miembroNombre={selectedMiembroHistorial}
        empresaId={empresaId}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  centerTxt: { color: '#6B7280', marginTop: 10, fontSize: 13 },
  summaryBadge: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', padding: 10, borderRadius: 6, margin: 16, marginBottom: 8 },
  summaryTxt: { color: '#93C5FD', fontSize: 12 },
  summaryBold: { fontWeight: 'bold', color: '#FFF' },
  thead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0D1117', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  th: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111827' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.015)' },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miembroTxt: { fontSize: 13, fontWeight: '600', color: '#F3F4F6' },
  subTxt: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  codTxt: { fontSize: 11, fontWeight: '600', color: '#60A5FA' },
  matName: { fontSize: 12, color: '#D1D5DB' },
  qtyBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  qtyTxt: { fontSize: 12, fontWeight: 'bold', color: '#FBBF24' },
  dateTxt: { fontSize: 11, color: '#9CA3AF' },
});
