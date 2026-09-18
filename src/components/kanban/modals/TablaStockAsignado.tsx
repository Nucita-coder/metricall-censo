import { Calendar, History, Package, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { TarjetaMaterialItem } from '../../../types/kanban';
import { ModalHistorialAsignaciones } from './ModalHistorialAsignaciones';
import {
  clasificarMovimientoAlmacen,
  obtenerMiembroResponsable,
  normalizarTextoAlmacen,
  fetchTarjetasAlmacen,
} from '../../../services/almacenService';

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
  searchQuery?: string;
}

export const TablaStockAsignado = ({ empresaId, searchQuery = '' }: TablaStockAsignadoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<AssignedStockRecord[]>([]);
  const [selectedMiembroHistorial, setSelectedMiembroHistorial] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedStock();
  }, [empresaId]);

  const fetchAssignedStock = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTarjetasAlmacen(
        empresaId,
        'id, datos_valores, created_at, lista_id, listas(nombre)'
      );

      if (!data) return;

      const mapa: Record<string, AssignedStockRecord> = {};

      data.forEach((row) => {
        const v = row.datos_valores || {};
        const movTipo = clasificarMovimientoAlmacen(v.tipoCarga);
        if (movTipo !== 'MATERIAL_ASIGNADO' && movTipo !== 'DEVOLUCION_ASIGNACION') return;

        const miembro = obtenerMiembroResponsable(movTipo, v) || 'SIN ASIGNAR';
        const miembroNorm = normalizarTextoAlmacen(miembro);
        const fecha = v.fechaRecibido || row.created_at?.split('T')[0] || '';
        const nroOrden = v.nroOrdenEntrega || '—';

        const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

        (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((item, idx: number) => {
          const cod = (item.codigoMaterial || '').toString().trim().toUpperCase();
          if (!cod) return;
          const cant = parseFloat(item.cantidadRecibida as string || '0') || 0;
          const key = `${miembroNorm}___${cod}`;

          if (!mapa[key]) {
            mapa[key] = {
              id: `${row.id}-${idx}`,
              miembro,
              codigoMaterial: cod,
              nombreMaterial: (item.nombreMaterial || '—').toUpperCase(),
              modeloMaterial: (item.modeloMaterial || 'GENERAL').toUpperCase(),
              cantidad: 0,
              fecha,
              nroOrden,
            };
          }

          if (movTipo === 'MATERIAL_ASIGNADO') {
            mapa[key].cantidad += cant;
          } else if (movTipo === 'DEVOLUCION_ASIGNACION') {
            mapa[key].cantidad -= cant;
          }
        });
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
        <ActivityIndicator size="small" color="#8C9BAB" />
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
                <User size={13} color="#8C9BAB" />
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
                <Calendar size={11} color="#8C9BAB" />
                <Text style={s.dateTxt}>{item.fecha}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
                <History size={10} color="#8C9BAB" />
                <Text style={{ fontSize: 9, color: '#8C9BAB', fontWeight: 'bold' }}>Historial</Text>
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
  thead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148' },
  th: { fontSize: 11, fontWeight: '700', color: '#8C9BAB', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2C333A' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miembroTxt: { fontSize: 13, fontWeight: '600', color: '#B6C2CF' },
  subTxt: { fontSize: 10, color: '#8C9BAB', marginTop: 2 },
  codTxt: { fontSize: 11, fontWeight: '700', color: '#8C9BAB' },
  matName: { fontSize: 12, color: '#B6C2CF' },
  qtyBadge: { backgroundColor: '#2C333A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#384148' },
  qtyTxt: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  dateTxt: { fontSize: 11, color: '#8C9BAB' },
  centerTxt: { color: '#8C9BAB', marginTop: 10, fontSize: 13 },
  summaryBadge: { backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', padding: 10, borderRadius: 6, margin: 16, marginBottom: 8 },
  summaryTxt: { color: '#8C9BAB', fontSize: 12 },
  summaryBold: { fontWeight: 'bold', color: '#FFFFFF' },
});
