import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestionOnlineStats, NOMBRES_MESES_DROPDOWN, PeriodoKey } from './types';

interface ResumenEjecutivoOnlineProps {
  stats: GestionOnlineStats;
  statsComparativa: GestionOnlineStats | null;
  periodoLocal: PeriodoKey;
  mesEspecificoNum: number;
  anioEspecificoStr: string;
  mesCompararNum: number;
  anioCompararStr: string;
  isDesktop: boolean;
}

export function ResumenEjecutivoOnline({
  stats,
  statsComparativa,
  periodoLocal,
  mesEspecificoNum,
  anioEspecificoStr,
  mesCompararNum,
  anioCompararStr,
  isDesktop,
}: ResumenEjecutivoOnlineProps) {
  const isComparativa = periodoLocal === 'comparativa' && Boolean(statsComparativa);

  return (
    <View style={[styles.container, isDesktop && isComparativa && styles.containerRow]}>
      {/* TARJETA 1: MES / PERIODO PRINCIPAL */}
      <View style={[styles.soberSummaryCard, isComparativa && { flex: 1, marginBottom: 0 }]}>
        <Text style={styles.soberCardHeaderTitle}>
          Resumen Ejecutivo ({`${NOMBRES_MESES_DROPDOWN[mesEspecificoNum]} ${anioEspecificoStr}`})
        </Text>

        <View style={styles.soberMetricRow}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>Gestiones Efectivas (Clientes)</Text>
            <Text style={styles.soberMetricSubtext}>Ventas efectivas, pagos procesados y fallas solventadas</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.totalEfectivos}</Text>
        </View>

        <View style={styles.soberMetricRow}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>Acción Negativa / Rechazos</Text>
            <Text style={styles.soberMetricSubtext}>No quisieron servicio, pagos rechazados o sin caja</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.totalNegativos}</Text>
        </View>

        <View style={styles.soberMetricRow}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>En Seguimiento (Comprará Luego)</Text>
            <Text style={styles.soberMetricSubtext}>Prospectos interesados que aplazaron la compra</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.totalSeguimiento}</Text>
        </View>

        <View style={styles.soberMetricRow}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>Casos Sin Atender</Text>
            <Text style={styles.soberMetricSubtext}>Permanecieron en cola sin acción o en revisión</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.totalSinAtender}</Text>
        </View>

        <View style={styles.soberMetricRow}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>% Casos Sin Atender</Text>
            <Text style={styles.soberMetricSubtext}>Porcentaje de casos que no se atendieron</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.tasaSinAtender}%</Text>
        </View>

        <View style={[styles.soberMetricRow, { borderBottomWidth: 0 }]}>
          <View style={styles.soberMetricInfo}>
            <Text style={styles.soberMetricLabel}>Efectividad General</Text>
            <Text style={styles.soberMetricSubtext}>Porcentaje de efectividad del total</Text>
          </View>
          <Text style={styles.soberMetricValue}>{stats.tasaEfectividad}%</Text>
        </View>
      </View>

      {/* TARJETA 2: COMPARATIVA LADO A LADO */}
      {isComparativa && statsComparativa && (
        <View style={[styles.soberSummaryCard, styles.comparativaBorder, { flex: 1, marginBottom: 0 }]}>
          <Text style={[styles.soberCardHeaderTitle, { color: '#06B6D4' }]}>
            Resumen Comparativo ({NOMBRES_MESES_DROPDOWN[mesCompararNum]} {anioCompararStr})
          </Text>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Gestiones Efectivas (Clientes)</Text>
              <Text style={styles.soberMetricSubtext}>Total de clientes atendidos con éxito</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.soberMetricValue}>{statsComparativa.totalEfectivos}</Text>
              {(() => {
                const diff = stats.totalEfectivos - statsComparativa.totalEfectivos;
                const isPos = diff > 0;
                const isNeg = diff < 0;
                return (
                  <View style={[styles.diffBadge, isPos && styles.diffBadgeSuccess, isNeg && styles.diffBadgeDanger]}>
                    <Text style={[styles.diffBadgeTxt, isPos && { color: '#34D399' }, isNeg && { color: '#F87171' }]}>
                      {isPos ? `+${diff} VS MES BASE` : `${diff} VS MES BASE`}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Acción Negativa / Rechazos</Text>
              <Text style={styles.soberMetricSubtext}>Total no recuperados o caídos</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.soberMetricValue}>{statsComparativa.totalNegativos}</Text>
              {(() => {
                const diff = stats.totalNegativos - statsComparativa.totalNegativos;
                return (
                  <View style={styles.diffBadge}>
                    <Text style={styles.diffBadgeTxt}>
                      {diff > 0 ? `+${diff} VS MES BASE` : `${diff} VS MES BASE`}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>En Seguimiento (Comprará Luego)</Text>
              <Text style={styles.soberMetricSubtext}>Interesados diferidos</Text>
            </View>
            <Text style={styles.soberMetricValue}>{statsComparativa.totalSeguimiento}</Text>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Casos Sin Atender</Text>
              <Text style={styles.soberMetricSubtext}>Permanecieron en cola sin acción</Text>
            </View>
            <Text style={styles.soberMetricValue}>{statsComparativa.totalSinAtender}</Text>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>% Casos Sin Atender</Text>
              <Text style={styles.soberMetricSubtext}>Porcentaje de casos sin atención</Text>
            </View>
            <Text style={styles.soberMetricValue}>{statsComparativa.tasaSinAtender}%</Text>
          </View>

          <View style={[styles.soberMetricRow, { borderBottomWidth: 0 }]}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Efectividad General</Text>
              <Text style={styles.soberMetricSubtext}>Porcentaje de efectividad del total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.soberMetricValue}>{statsComparativa.tasaEfectividad}%</Text>
              {(() => {
                const diff = stats.tasaEfectividad - statsComparativa.tasaEfectividad;
                const isPos = diff > 0;
                const isNeg = diff < 0;
                return (
                  <View style={[styles.diffBadge, isPos && styles.diffBadgeSuccess, isNeg && styles.diffBadgeDanger]}>
                    <Text style={[styles.diffBadgeTxt, isPos && { color: '#34D399' }, isNeg && { color: '#F87171' }]}>
                      {isPos ? `+${diff}% EFECTIVIDAD` : `${diff}% EFECTIVIDAD`}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  containerRow: {
    flexDirection: 'row',
  },
  soberSummaryCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
  },
  comparativaBorder: {
    borderColor: '#06B6D4',
  },
  soberCardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soberMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  soberMetricInfo: {
    flex: 1,
    paddingRight: 10,
  },
  soberMetricLabel: {
    color: '#B6C2CF',
    fontSize: 13,
    fontWeight: '600',
  },
  soberMetricSubtext: {
    color: '#8C9BAB',
    fontSize: 10,
    marginTop: 2,
  },
  soberMetricValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 4,
  },
  diffBadgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  diffBadgeDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  diffBadgeTxt: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
});
