import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { AsesorVentasStat } from './types';
import { COLORES_VENTAS } from './ventasConstants';

interface ItemAsesorVentasProps {
  item: AsesorVentasStat;
  idx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ItemAsesorVentas({
  item,
  idx,
  isExpanded,
  onToggleExpand,
}: ItemAsesorVentasProps) {
  const tasaFact = item.tasaFactibilidad.toFixed(1);

  return (
    <View style={styles.advisorCard}>
      <TouchableOpacity
        style={styles.advisorHeader}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.advisorLeft}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{idx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.advisorName} numberOfLines={1}>
              {item.asesorNombre}
            </Text>
            <Text style={styles.advisorSub}>
              Factibilidad: {tasaFact}% • {item.porInstalar} Por Instalar
            </Text>
          </View>
        </View>

        <View style={styles.pillsRow}>
          <View style={styles.pillStat}>
            <Text style={styles.pillValue}>{item.totalVentas}</Text>
            <Text style={styles.pillLabel}>Ventas</Text>
          </View>
          <View style={styles.pillStat}>
            <Text style={[styles.pillValue, { color: COLORES_VENTAS.factible }]}>
              {item.factibles}
            </Text>
            <Text style={styles.pillLabel}>Factibles</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={16} color="#8C9BAB" />
          ) : (
            <ChevronDown size={16} color="#8C9BAB" />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>Desglose Operativo del Asesor:</Text>
          </View>

          <View style={styles.metricsDetailGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>Ventas Totales</Text>
              <Text style={[styles.detailBoxValue, { color: '#FFFFFF' }]}>
                {item.totalVentas}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>Factibles</Text>
              <Text style={[styles.detailBoxValue, { color: COLORES_VENTAS.factible }]}>
                {item.factibles}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>Por Instalar</Text>
              <Text style={[styles.detailBoxValue, { color: COLORES_VENTAS.porInstalar }]}>
                {item.porInstalar}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>No Factibles</Text>
              <Text style={[styles.detailBoxValue, { color: COLORES_VENTAS.rechazada }]}>
                {item.rechazadas}
              </Text>
            </View>
          </View>

          {Object.keys(item.desglosePlanes).length > 0 && (
            <View style={styles.plansSection}>
              <Text style={styles.plansTitle}>Planes Contratados:</Text>
              <View style={styles.plansGrid}>
                {Object.entries(item.desglosePlanes).map(([plan, count]) => (
                  <View key={plan} style={styles.planItem}>
                    <Text style={styles.planItemName} numberOfLines={1}>{plan}</Text>
                    <Text style={styles.planItemCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  advisorCard: {
    backgroundColor: '#22272B',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  advisorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: '#1D2125',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#384148',
  },
  rankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A0B2C6',
  },
  advisorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  advisorSub: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillStat: {
    alignItems: 'center',
    backgroundColor: '#1D2125',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
  },
  pillValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pillLabel: {
    fontSize: 9,
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: '#384148',
    padding: 12,
    backgroundColor: '#1D2125',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  metricsDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBox: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#22272B',
    padding: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
    alignItems: 'center',
  },
  detailBoxLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    marginBottom: 2,
  },
  detailBoxValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  plansSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
    paddingTop: 10,
  },
  plansTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  planItemName: {
    fontSize: 11,
    color: '#B6C2CF',
  },
  planItemCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
