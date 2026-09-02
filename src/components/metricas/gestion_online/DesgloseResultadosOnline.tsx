import { ChevronDown, ChevronUp, Layers, PieChart } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GraficoPastelDonut } from './GraficoPastelDonut';
import {
  MatrixResultadosOnlineData,
  SliceDataItem,
  TODOS_LOS_RESULTADOS_ONLINE,
} from './types';

interface DesgloseResultadosOnlineProps {
  matrixResultadosData: MatrixResultadosOnlineData;
  pieDataResultados: SliceDataItem[];
}

export function DesgloseResultadosOnline({
  matrixResultadosData,
  pieDataResultados,
}: DesgloseResultadosOnlineProps) {
  const [mostrarPieResultados, setMostrarPieResultados] = useState(false);

  return (
    <View style={styles.tableCard}>
      <View style={styles.tableTopHeaderRow}>
        <View style={styles.headerFlex}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={22} color="#06B6D4" />
            <Text style={styles.tableTitle}>Desglose por Resultado de Gestión Online</Text>
          </View>
          <TouchableOpacity
            style={styles.togglePieButton}
            onPress={() => setMostrarPieResultados(prev => !prev)}
            activeOpacity={0.7}
          >
            <PieChart size={14} color="#06B6D4" />
            <Text style={styles.togglePieButtonTxt}>Gráfica</Text>
            {mostrarPieResultados ? (
              <ChevronUp size={14} color="#06B6D4" />
            ) : (
              <ChevronDown size={14} color="#06B6D4" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* DIAGRAMA DONUT DESPLEGABLE */}
      {mostrarPieResultados && (
        <View style={styles.chartSectionWrapper}>
          <Text style={styles.sectionSubtitleHeader}>Porcentaje por Resultado de Gestión (100%)</Text>
          <GraficoPastelDonut data={pieDataResultados} tamano={160} />
        </View>
      )}

      {/* REJILLA DE TARJETAS DE RESULTADO */}
      <View style={styles.resultadosGridContainer}>
        {TODOS_LOS_RESULTADOS_ONLINE.map((item) => {
          const count = matrixResultadosData.countsMap.get(item.clave) || 0;
          const hasCount = count > 0;

          let badgeStyle = styles.badgeDefault;
          let badgeTxtColor = '#8C9BAB';

          if (hasCount) {
            if (item.tipo === 'efectivo') {
              badgeStyle = styles.badgeSuccess;
              badgeTxtColor = '#FFF';
            } else if (item.tipo === 'negativo') {
              badgeStyle = styles.badgeDanger;
              badgeTxtColor = '#FFF';
            } else if (item.tipo === 'seguimiento') {
              badgeStyle = styles.badgeInfo;
              badgeTxtColor = '#FFF';
            } else {
              badgeStyle = styles.badgeWarning;
              badgeTxtColor = '#FFF';
            }
          }

          return (
            <View
              key={item.clave}
              style={[styles.resultadoItemCard, hasCount && styles.resultadoItemCardActive]}
            >
              <View style={styles.resultadoItemLeft}>
                <Text style={styles.resultadoItemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
              <View style={[styles.resultadoBadge, badgeStyle]}>
                <Text style={[styles.resultadoBadgeTxt, { color: badgeTxtColor }]}>
                  {count}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* FILA DE TOTAL CONSOLIDADO */}
      <View style={styles.matrixTotalRow}>
        <View style={styles.totalCell}>
          <Text style={styles.totalTxt}>
            TOTAL RESULTADOS: {matrixResultadosData.totalResultadosPeriodo}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
    marginBottom: 20,
  },
  tableTopHeaderRow: {
    marginBottom: 16,
  },
  headerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 10,
  },
  tableTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  togglePieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1D2125',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#384148',
  },
  togglePieButtonTxt: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chartSectionWrapper: {
    backgroundColor: '#1D2125',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#384148',
  },
  sectionSubtitleHeader: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultadosGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultadoItemCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1D2125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultadoItemCardActive: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  resultadoItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  resultadoItemLabel: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeSuccess: {
    backgroundColor: '#059669',
  },
  badgeDanger: {
    backgroundColor: '#DC2626',
  },
  badgeInfo: {
    backgroundColor: '#4F46E5',
  },
  badgeWarning: {
    backgroundColor: '#D97706',
  },
  resultadoBadgeTxt: {
    fontSize: 12,
    fontWeight: '900',
  },
  matrixTotalRow: {
    marginTop: 14,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalCell: {
    backgroundColor: '#1D2125',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 6,
  },
  totalTxt: {
    color: '#B6C2CF',
    fontWeight: '900',
    fontSize: 12,
  },
});
