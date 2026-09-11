import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Package, ChevronRight } from 'lucide-react-native';
import { MaterialStockItem } from './types';
import { ModalDetalleCargaMaterial } from './ModalDetalleCargaMaterial';

interface TablaStockDisponibleProps {
  filtered: MaterialStockItem[];
  isLoading: boolean;
  maxStock?: number;
}

export const TablaStockDisponible: React.FC<TablaStockDisponibleProps> = ({
  filtered,
  isLoading,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStockItem | null>(null);

  return (
    <>
      <View style={styles.thead}>
        <Text style={[styles.th, { width: 90 }]}>Código</Text>
        <Text style={[styles.th, { flex: 1 }]}>Material / Modelo</Text>
        <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Stock</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8C9BAB" />
          <Text style={styles.centerTxt}>Cargando inventario...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Package size={32} color="#8C9BAB" />
          <Text style={styles.centerTxt}>Sin resultados para los filtros aplicados</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i, index) => `${i.nombreMaterial}_${i.codigoMaterial}_${index}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const bajo = item.stockTotal < 10;
            return (
              <TouchableOpacity
                style={[styles.row, index % 2 === 0 && styles.rowAlt]}
                onPress={() => setSelectedMaterial(item)}
                activeOpacity={0.7}
              >
                <View style={{ width: 90 }}>
                  <Text style={styles.codTxt}>{item.codigoMaterial}</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.matName} numberOfLines={1}>
                    {item.nombreMaterial}
                  </Text>
                  <Text style={styles.matModel} numberOfLines={1}>
                    {item.modeloMaterial}
                  </Text>
                </View>
                <View style={{ width: 110, alignItems: 'flex-end' }}>
                  <Text style={[styles.stockNum, bajo && styles.stockNumBajo]}>
                    {item.stockTotal}
                  </Text>
                  <Text style={styles.stockUnd}>unidades</Text>
                </View>
                <View style={{ width: 24, alignItems: 'flex-end', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#8C9BAB" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* MODAL DE DETALLE COMPLETO DE CARGA */}
      <ModalDetalleCargaMaterial
        visible={selectedMaterial !== null}
        onClose={() => setSelectedMaterial(null)}
        material={selectedMaterial}
      />
    </>
  );
};

const styles = StyleSheet.create({
  thead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2C333A',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  center: { padding: 48, alignItems: 'center' },
  centerTxt: { color: '#8C9BAB', marginTop: 10, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  codTxt: { fontSize: 12, fontWeight: '700', color: '#8C9BAB', fontVariant: ['tabular-nums'] },
  matName: { fontSize: 13, fontWeight: '600', color: '#B6C2CF' },
  matModel: { fontSize: 11, color: '#8C9BAB', marginTop: 1 },
  stockNum: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  stockNumBajo: { color: '#E57373' },
  stockUnd: { fontSize: 9, color: '#8C9BAB' },
});
