import { BarChart3, Calendar } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MesOnlineData } from './types';

interface GraficaBarrasMensualProps {
  serie12Meses: MesOnlineData[];
  anioActual: number | string;
}

export function GraficaBarrasMensual({ serie12Meses, anioActual }: GraficaBarrasMensualProps) {
  const maxEfectivos = Math.max(1, ...serie12Meses.map(m => m.totalEfectivos));

  return (
    <View style={styles.chartContainerCard}>
      <View style={styles.chartHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="#10B981" />
          <Text style={styles.chartTitle}>Gráfica Mensual de Gestiones Online Efectivas</Text>
        </View>
        <View style={styles.periodBadge}>
          <Calendar size={14} color="#8C9BAB" />
          <Text style={styles.periodBadgeTxt}>Año {anioActual}</Text>
        </View>
      </View>

      {/* CONTENEDOR DE LA GRÁFICA VERTICAL DE BARRAS */}
      <View style={styles.histogramWrapper}>
        {/* LÍNEAS DE GUÍA HORIZONTALES */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        {/* BARRAS VERTICALES POR MES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.barsRowContainer}>
            {serie12Meses.map((m) => {
              const porcentajeAltura = Math.round((m.totalEfectivos / maxEfectivos) * 100);
              const tieneValor = m.totalEfectivos > 0;

              return (
                <View key={m.claveMes} style={styles.columnContainer}>
                  {/* VALOR SUPERIOR DE LA BARRA */}
                  <Text style={[styles.barTopValue, tieneValor && styles.barTopValueActive]}>
                    {m.totalEfectivos}
                  </Text>

                  {/* BARRA VERTICAL */}
                  <View style={styles.verticalTrack}>
                    <View
                      style={[
                        styles.verticalBarFill,
                        {
                          height: `${Math.max(4, porcentajeAltura)}%`,
                          backgroundColor: tieneValor ? '#10B981' : '#384148',
                        },
                      ]}
                    />
                  </View>

                  {/* NOMBRE CORTO DEL MES */}
                  <Text style={[styles.monthXLabel, tieneValor && styles.monthXLabelActive]}>
                    {m.nombreCorto}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.chartFooterNotice}>
        <Text style={styles.chartFooterTxt}>
          * Cada columna representa el total numérico de casos con <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Gestión Efectiva</Text> registrados en ese mes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainerCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#384148',
  },
  periodBadgeTxt: {
    color: '#8C9BAB',
    fontSize: 11,
    fontWeight: '600',
  },
  histogramWrapper: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    marginVertical: 8,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  barsRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: '100%',
    paddingHorizontal: 8,
  },
  columnContainer: {
    alignItems: 'center',
    width: 38,
    marginHorizontal: 4,
  },
  barTopValue: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barTopValueActive: {
    color: '#10B981',
  },
  verticalTrack: {
    width: 14,
    height: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  monthXLabel: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  monthXLabelActive: {
    color: '#FFF',
  },
  chartFooterNotice: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartFooterTxt: {
    color: '#8C9BAB',
    fontSize: 11,
  },
});
