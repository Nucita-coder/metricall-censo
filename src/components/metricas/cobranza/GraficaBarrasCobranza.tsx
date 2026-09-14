import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BarChart3, Calendar } from 'lucide-react-native';
import { CobranzaStats } from './types';
import { chartStyles as styles } from './graficosCobranza.styles';

interface GraficaBarrasCobranzaProps {
  stats: CobranzaStats;
}

export function GraficaBarrasCobranza({ stats }: GraficaBarrasCobranzaProps) {
  const maxCobrados = Math.max(
    1,
    ...stats.serie12Meses.map((m) => m.totalEfectivos)
  );

  return (
    <View style={styles.chartContainerCard}>
      <View style={styles.chartHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="#A0B2C6" />
          <Text style={styles.chartTitle}>
            Gráfica Mensual de Clientes Cobrados Efectivamente
          </Text>
        </View>
        <View style={styles.periodBadge}>
          <Calendar size={14} color="#8C9BAB" />
          <Text style={styles.periodBadgeTxt}>Año {new Date().getFullYear()}</Text>
        </View>
      </View>

      {/* CONTENEDOR DE LA GRÁFICA VERTICAL DE BARRAS */}
      <View style={styles.histogramWrapper}>
        <View style={styles.gridOverlay}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.barsRowContainer}>
            {stats.serie12Meses.map((m) => {
              const porcentajeAltura = Math.round(
                (m.totalEfectivos / maxCobrados) * 100
              );
              const tieneValor = m.totalEfectivos > 0;

              return (
                <View key={m.claveMes} style={styles.columnContainer}>
                  <Text
                    style={[
                      styles.barTopValue,
                      tieneValor && styles.barTopValueActive,
                    ]}
                  >
                    {m.totalEfectivos}
                  </Text>

                  <View style={styles.verticalTrack}>
                    <View
                      style={[
                        styles.verticalBarFill,
                        {
                          height: `${Math.max(4, porcentajeAltura)}%`,
                          backgroundColor: tieneValor ? '#A0B2C6' : '#2C333A',
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.monthXLabel,
                      tieneValor && styles.monthXLabelActive,
                    ]}
                  >
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
          * Cada columna representa el total numérico de clientes con{' '}
          <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>Cobro Efectivo</Text>{' '}
          registrados en ese mes.
        </Text>
      </View>
    </View>
  );
}
