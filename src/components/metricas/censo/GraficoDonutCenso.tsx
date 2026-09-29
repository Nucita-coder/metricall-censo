import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { SliceDataItem } from './types';
import { COLORES_CENSO } from './censoConstants';

interface GraficoDonutCensoProps {
  totalInteresados: number;
  totalIndecisos: number;
  totalNoInteresados: number;
  tamano?: number;
  isDesktop?: boolean;
}

export function GraficoDonutCenso({
  totalInteresados,
  totalIndecisos,
  totalNoInteresados,
  tamano = 170,
  isDesktop = false,
}: GraficoDonutCensoProps) {
  const data: SliceDataItem[] = [
    {
      label: 'Interesadas en el Servicio',
      count: totalInteresados,
      color: COLORES_CENSO.interesados,
    },
    {
      label: 'Indecisos en Contratar',
      count: totalIndecisos,
      color: COLORES_CENSO.indecisos,
    },
    {
      label: 'No Interesados',
      count: totalNoInteresados,
      color: COLORES_CENSO.noInteresados,
    },
  ];

  const total = totalInteresados + totalIndecisos + totalNoInteresados;
  const itemsConValor = data.filter((d) => d.count > 0);

  const cx = tamano / 2;
  const cy = tamano / 2;
  const outerRadius = tamano / 2 - 8;
  const innerRadius = outerRadius * 0.58;

  let currentAngle = -Math.PI / 2;

  const slices = itemsConValor.map((item) => {
    const pct = total > 0 ? item.count / total : 0;
    const angle = pct * 2 * Math.PI;

    const startAngle = currentAngle;
    const endAngle = angle >= 2 * Math.PI ? startAngle + 1.9999 * Math.PI : startAngle + angle;
    currentAngle += angle;

    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const pathData = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

    return {
      pathData,
      color: item.color,
      label: item.label,
      count: item.count,
    };
  });

  return (
    <View style={[styles.cardContainer, isDesktop ? styles.borderRight : styles.borderBottom]}>
      <Text style={styles.cardTitle}>Distribución de Interés en el Censo</Text>
      <Text style={styles.cardSubtitle}>Disposición de los prospectos a contratar el servicio</Text>

      <View style={styles.contentRow}>
        <View style={styles.chartWrapper}>
          <Svg width={tamano} height={tamano}>
            <G>
              {total === 0 ? (
                <Circle
                  cx={cx}
                  cy={cy}
                  r={(outerRadius + innerRadius) / 2}
                  stroke="#384148"
                  strokeWidth={outerRadius - innerRadius}
                  fill="none"
                />
              ) : (
                slices.map((s, idx) => (
                  <Path key={idx} d={s.pathData} fill={s.color} stroke="#1D2125" strokeWidth={1.5} />
                ))
              )}
            </G>
          </Svg>
          <View style={styles.centerOverlay}>
            <Text style={styles.centerNumber}>{total}</Text>
            <Text style={styles.centerLabel}>100%</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {data.map((item) => {
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
            const hasVal = item.count > 0;

            return (
              <View key={item.label} style={[styles.legendItem, !hasVal && { opacity: 0.45 }]}>
                <View style={styles.legendLeft}>
                  <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.legendRight}>
                  <Text style={[styles.legendCount, hasVal && { color: '#FFFFFF' }]}>
                    {item.count}
                  </Text>
                  <Text style={[styles.legendPct, hasVal && { color: '#B6C2CF' }]}>
                    ({pct}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#2C333A',
    borderRadius: 0,
    padding: 16,
    flex: 1,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#384148',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  centerLabel: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legendContainer: {
    flex: 1,
    minWidth: 200,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  colorBox: {
    width: 10,
    height: 10,
    borderRadius: 0,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#B6C2CF',
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  legendPct: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});
