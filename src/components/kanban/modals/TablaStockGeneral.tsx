import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { fetchTodasLasTarjetas } from '../../../services/tarjetasService';
import { TarjetaMaterialItem } from '../../../types/kanban';

export interface SubItemLoteGeneral {
  codigoMaterial: string;
  modeloMaterial: string;
  cantidad: number;
}

export interface GeneralStockItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  totalRecibido: number;
  totalAsignado: number;
  stockDisponible: number;
  numRegistros: number;
  subItems?: SubItemLoteGeneral[];
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
      const data = await fetchTodasLasTarjetas({
        empresaId,
        select: 'datos_valores',
      });

      if (!data) return;

      const mapa: Record<string, GeneralStockItem> = {};
      data.forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const subItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];

        (subItems as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((sub) => {
          const nombre = (sub.nombreMaterial || '').trim().toUpperCase();
          const cod = (sub.codigoMaterial || '').trim().toUpperCase();
          const key = nombre || cod;
          if (!key) return;
          const cant = parseFloat((sub.cantidadRecibida || '0') as string) || 0;
          const modUpper = (sub.modeloMaterial || 'GENERAL').toUpperCase();

          if (!mapa[key]) {
            mapa[key] = {
              codigoMaterial: cod || key,
              nombreMaterial: nombre || cod,
              modeloMaterial: modUpper,
              totalRecibido: 0,
              totalAsignado: 0,
              stockDisponible: 0,
              numRegistros: 0,
              subItems: [],
            };
          }

          mapa[key].numRegistros += 1;
          mapa[key].subItems?.push({
            codigoMaterial: cod,
            modeloMaterial: modUpper,
            cantidad: cant,
          });

          if (cod && !mapa[key].codigoMaterial.includes(cod)) {
            mapa[key].codigoMaterial = mapa[key].codigoMaterial
              ? `${mapa[key].codigoMaterial}, ${cod}`
              : cod;
          }
          if (modUpper && modUpper !== 'GENERAL' && !mapa[key].modeloMaterial.includes(modUpper)) {
            mapa[key].modeloMaterial =
              mapa[key].modeloMaterial === 'GENERAL'
                ? modUpper
                : `${mapa[key].modeloMaterial}, ${modUpper}`;
          }
          if (nombre && (mapa[key].nombreMaterial === '—' || mapa[key].nombreMaterial === cod)) {
            mapa[key].nombreMaterial = nombre;
          }

          const isDevCentral = tipo.includes('ALMACÉN CENTRAL') || tipo.includes('ALMACEN CENTRAL');
          const isDevAsignacion = !isDevCentral && (tipo.includes('DEVOLUCIÓN') || tipo.includes('DEVOLUCION'));

          if (tipo === 'MATERIAL ASIGNADO' || (!isDevAsignacion && !isDevCentral && tipo.includes('ASIGNADO'))) {
            mapa[key].totalAsignado += cant;
          } else if (isDevAsignacion) {
            mapa[key].totalAsignado = Math.max(0, mapa[key].totalAsignado - cant);
          } else if (isDevCentral) {
            mapa[key].totalRecibido = Math.max(0, mapa[key].totalRecibido - cant);
          } else {
            mapa[key].totalRecibido += cant;
          }

          mapa[key].stockDisponible = mapa[key].totalRecibido - mapa[key].totalAsignado;
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
        <ActivityIndicator size="large" color="#8C9BAB" />
        <Text style={s.centerTxt}>Calculando stock general...</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={s.center}>
        <Package size={32} color="#8C9BAB" />
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
          <Text style={s.kpiNum}>{grandTotalAsignado}</Text>
          <Text style={s.kpiLabel}>Asignado a Personal</Text>
        </View>
        <View style={s.kpiSep} />
        <View style={s.kpi}>
          <Text style={s.kpiNum}>{grandTotalDisponible}</Text>
          <Text style={s.kpiLabel}>Disponible en Almacén</Text>
        </View>
      </View>

      {/* Header Tabla */}
      <View style={s.thead}>
        <Text style={[s.th, { width: 80 }]}>Código</Text>
        <Text style={[s.th, { flex: 1.2 }]}>Material</Text>
        <Text style={[s.th, { flex: 1 }]}>Modelo</Text>
        <Text style={[s.th, { width: 65, textAlign: 'right' }]}>Total</Text>
        <Text style={[s.th, { width: 65, textAlign: 'right' }]}>Asignado</Text>
        <Text style={[s.th, { width: 75, textAlign: 'right' }]}>Cantidad</Text>
      </View>

      {/* Listado */}
      <FlatList
        data={filtered}
        keyExtractor={(i, index) => `${i.nombreMaterial}_${i.codigoMaterial}_${index}`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={[s.row, index % 2 === 0 && s.rowAlt]}>
            <View style={{ width: 80 }}>
              <Text style={s.codTxt}>{item.codigoMaterial}</Text>
            </View>
            <View style={{ flex: 1.2, paddingRight: 6 }}>
              <Text style={s.matName} numberOfLines={1}>{item.nombreMaterial}</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={s.matModel} numberOfLines={1}>{item.modeloMaterial || '—'}</Text>
            </View>
            <View style={{ width: 65, alignItems: 'flex-end' }}>
              <Text style={s.numTxt}>{item.totalRecibido}</Text>
            </View>
            <View style={{ width: 65, alignItems: 'flex-end' }}>
              <Text style={s.numTxt}>{item.totalAsignado}</Text>
            </View>
            <View style={{ width: 75, alignItems: 'flex-end' }}>
              <Text style={[s.numTxt, { color: '#FFFFFF', fontWeight: 'bold' }]}>{item.stockDisponible}</Text>
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
  centerTxt: { color: '#8C9BAB', marginTop: 10, fontSize: 13 },
  kpiStrip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#22272B', borderBottomWidth: 1, borderBottomColor: '#384148' },
  kpi: { flex: 1, alignItems: 'center' },
  kpiNum: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  kpiLabel: { fontSize: 9, color: '#8C9BAB', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSep: { width: 1, height: 24, backgroundColor: '#384148' },
  thead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148' },
  th: { fontSize: 11, fontWeight: '700', color: '#8C9BAB', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2C333A' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  codTxt: { fontSize: 11, fontWeight: '700', color: '#8C9BAB' },
  matName: { fontSize: 12, fontWeight: '600', color: '#B6C2CF' },
  matModel: { fontSize: 10, color: '#8C9BAB' },
  numTxt: { fontSize: 13, color: '#B6C2CF' },
});
