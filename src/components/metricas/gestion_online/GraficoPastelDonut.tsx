import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { SliceDataItem } from './types';

interface GraficoPastelDonutProps {
  data: SliceDataItem[];
  tamano?: number;
}

const DEFAULT_PALETA = [
  '#10B981', '#0C66E4', '#F59E0B', '#8B5CF6', '#06B6D4',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B'
];

export function GraficoPastelDonut({ data, tamano = 160 }: GraficoPastelDonutProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const itemsConValor = data.filter(d => d.count > 0);

  const cx = tamano / 2;
  const cy = tamano / 2;
  const outerRadius = tamano / 2 - 8;
  const innerRadius = outerRadius * 0.55;

  let currentAngle = -Math.PI / 2;

  const slices = itemsConValor.map((item, idx) => {
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
    const color = item.color || DEFAULT_PALETA[idx % DEFAULT_PALETA.length];

    return { pathData, color, label: item.label, count: item.count };
  });

  return (
    <View style={styles.pieContainerWrapper}>
      <View style={styles.pieChartCenterWrapper}>
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
        <View style={styles.pieCenterOverlay}>
          <Text style={styles.pieCenterTotalNumber}>{total}</Text>
          <Text style={styles.pieCenterTotalTxt}>100%</Text>
        </View>
      </View>

      <View style={styles.pieLegendContainer}>
        {data.map((item, idx) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
          const color = item.color || DEFAULT_PALETA[idx % DEFAULT_PALETA.length];
          const hasVal = item.count > 0;

          return (
            <View key={idx} style={[styles.pieLegendRow, !hasVal && { opacity: 0.35 }]}>
              <View style={[styles.pieLegendColorBox, { backgroundColor: color }]} />
              <Text style={styles.pieLegendLabel} numberOfLines={1}>
                {item.label}:
              </Text>
              <Text style={styles.pieLegendValue}>
                {item.count} <Text style={{ color: '#8C9BAB', fontSize: 10 }}>({pct}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pieContainerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 12,
  },
  pieChartCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterTotalNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  pieCenterTotalTxt: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: '600',
  },
  pieLegendContainer: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pieLegendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8,
  },
  pieLegendLabel: {
    color: '#B6C2CF',
    fontSize: 11,
    flex: 1,
  },
  pieLegendValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
