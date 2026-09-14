import React from 'react';
import { Text, View } from 'react-native';
import { CobranzaStats } from './types';
import { NOMBRES_MESES_DROPDOWN } from './cobranzaConstants';
import { styles } from './moduloCobranza.styles';

interface TarjetaComparativaCobranzaProps {
  mesCompararNum: number;
  anioCompararStr: string;
  stats: CobranzaStats;
  statsComparativa: {
    totalCortados: number;
    totalEfectivos: number;
    totalNegativos: number;
    totalSinAtender: number;
    tasaRecuperacion: number;
    tasaSinAtender: number;
  };
}

export function TarjetaComparativaCobranza({
  mesCompararNum,
  anioCompararStr,
  stats,
  statsComparativa,
}: TarjetaComparativaCobranzaProps) {
  const diffEfectivos = stats.totalEfectivos - statsComparativa.totalEfectivos;
  const isDiffEfectivosPos = diffEfectivos > 0;
  const isDiffEfectivosNeg = diffEfectivos < 0;

  const diffNegativos = stats.totalNegativos - statsComparativa.totalNegativos;

  const diffTasa = stats.tasaRecuperacion - statsComparativa.tasaRecuperacion;
  const isDiffTasaPos = diffTasa > 0;
  const isDiffTasaNeg = diffTasa < 0;

  return (
    <View style={[styles.soberSummaryCard, { flex: 1, marginBottom: 0, borderColor: '#384148' }]}>
      <Text style={[styles.soberCardHeaderTitle, { color: '#B6C2CF' }]}>
        Resumen Comparativo ({NOMBRES_MESES_DROPDOWN[mesCompararNum]} {anioCompararStr})
      </Text>

      <View style={styles.soberMetricRow}>
        <View style={styles.soberMetricInfo}>
          <Text style={styles.soberMetricLabel}>Cobro Efectivo (Clientes)</Text>
          <Text style={styles.soberMetricSubtext}>Total de clientes cobrados efectivamente</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.soberMetricValue}>{statsComparativa.totalEfectivos}</Text>
          <View
            style={[
              styles.diffBadge,
              isDiffEfectivosPos && styles.diffBadgeSuccess,
              isDiffEfectivosNeg && styles.diffBadgeDanger,
            ]}
          >
            <Text
              style={[
                styles.diffBadgeTxt,
                isDiffEfectivosPos && { color: '#B6C2CF' },
                isDiffEfectivosNeg && { color: '#E2A3A3' },
              ]}
            >
              {isDiffEfectivosPos ? `+${diffEfectivos} VS MES BASE` : `${diffEfectivos} VS MES BASE`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.soberMetricRow}>
        <View style={styles.soberMetricInfo}>
          <Text style={styles.soberMetricLabel}>Acción Negativa (Sin Cobro)</Text>
          <Text style={styles.soberMetricSubtext}>Total de clientes no recuperados</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.soberMetricValue}>{statsComparativa.totalNegativos}</Text>
          <View style={styles.diffBadge}>
            <Text style={styles.diffBadgeTxt}>
              {diffNegativos > 0 ? `+${diffNegativos} VS MES BASE` : `${diffNegativos} VS MES BASE`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.soberMetricRow}>
        <View style={styles.soberMetricInfo}>
          <Text style={styles.soberMetricLabel}>Casos Sin Atender</Text>
          <Text style={styles.soberMetricSubtext}>Permanecieron en carga sin pasar a acción</Text>
        </View>
        <Text style={styles.soberMetricValue}>{statsComparativa.totalSinAtender}</Text>
      </View>

      <View style={styles.soberMetricRow}>
        <View style={styles.soberMetricInfo}>
          <Text style={styles.soberMetricLabel}>% Casos Sin Atender</Text>
          <Text style={styles.soberMetricSubtext}>Porcentaje de casos que no se atendieron</Text>
        </View>
        <Text style={styles.soberMetricValue}>{statsComparativa.tasaSinAtender}%</Text>
      </View>

      <View style={[styles.soberMetricRow, { borderBottomWidth: 0 }]}>
        <View style={styles.soberMetricInfo}>
          <Text style={styles.soberMetricLabel}>Efectividad General</Text>
          <Text style={styles.soberMetricSubtext}>Porcentaje de efectividad del total</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.soberMetricValue}>{statsComparativa.tasaRecuperacion}%</Text>
          <View
            style={[
              styles.diffBadge,
              isDiffTasaPos && styles.diffBadgeSuccess,
              isDiffTasaNeg && styles.diffBadgeDanger,
            ]}
          >
            <Text
              style={[
                styles.diffBadgeTxt,
                isDiffTasaPos && { color: '#B6C2CF' },
                isDiffTasaNeg && { color: '#E2A3A3' },
              ]}
            >
              {isDiffTasaPos ? `+${diffTasa}% EFECTIVIDAD` : `${diffTasa}% EFECTIVIDAD`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
