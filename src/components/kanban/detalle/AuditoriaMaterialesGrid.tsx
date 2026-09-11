import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';

interface AuditoriaMaterialesGridProps {
  materiales?: Record<string, string | number | undefined>;
  cablePreconectorizadoFallback?: string;
}

const ITEMS_MATERIALES = [
  { key: 'tensorPlastico', label: 'TENSOR PLÁSTICO' },
  { key: 'tensorHierro', label: 'TENSOR HIERRO' },
  { key: 'grapas', label: 'GRAPAS' },
  { key: 'tirrap', label: 'TIRRAP' },
  { key: 'pachCordApc', label: 'PACH CORD APC' },
  { key: 'pachCordUpc', label: 'PACH CORD UPC' },
  { key: 'pachCordApcUpc', label: 'PACH CORD APC/UPC' },
  { key: 'cajaTerminalCon', label: 'CAJA TERM. CON ACCESORIOS' },
  { key: 'cajaTerminalSin', label: 'CAJA TERM. SIN ACCESORIOS' },
  { key: 'conectorAcople', label: 'CONECTOR/ACOPLE H-H' },
  { key: 'conectorMecanicoApc', label: 'CONECTOR MECÁNICO APC' },
  { key: 'conectorMecanicoUpc', label: 'CONECTOR MECÁNICO UPC' },
  { key: 'precinto', label: 'PRECINTO' },
  { key: 'cablePreconectorizado', label: 'CABLE PRECONECTORIZADO' },
];

export function AuditoriaMaterialesGrid({
  materiales = {},
  cablePreconectorizadoFallback,
}: AuditoriaMaterialesGridProps) {
  const getValor = (key: string) => {
    if (key === 'cablePreconectorizado') {
      const val = materiales[key] || cablePreconectorizadoFallback;
      return val && String(val).trim() !== '' ? String(val) : '-';
    }
    const val = materiales[key];
    if (val === undefined || val === null || String(val).trim() === '') return '-';
    return String(val);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Package size={16} color="#579DFF" />
        <Text style={styles.cardTitle}>Materiales Utilizados (Consumo)</Text>
      </View>

      <View style={styles.grid}>
        {ITEMS_MATERIALES.map((item, idx) => {
          const valor = getValor(item.key);
          const tieneConsumo = valor !== '-' && valor !== '0';

          return (
            <View key={item.key || idx} style={styles.gridItem}>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.itemValue, tieneConsumo && styles.itemValueActive]}>
                {valor}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
    padding: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 6,
  },
  cardTitle: {
    color: '#579DFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#2C333A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  itemLabel: {
    fontSize: 9,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  itemValue: {
    fontSize: 12,
    color: '#8C9BAB',
    fontWeight: 'bold',
  },
  itemValueActive: {
    color: '#4ADE80',
  },
});
