import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, UserCheck, HelpCircle, UserX, PhoneCall } from 'lucide-react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { CensoKpis, PeriodoCensoTipo } from './types';
import {
  OPCIONES_PERIODO_CENSO,
  PERIODO_CENSO_MAP_TO_KEY,
  PERIODO_CENSO_MAP_TO_LABEL,
  NOMBRES_MESES_CENSO,
  OPCIONES_ANIO_CENSO,
  COLORES_CENSO,
} from './censoConstants';

interface ResumenKpiCensoProps {
  periodoLocal: PeriodoCensoTipo;
  setPeriodoLocal: (p: PeriodoCensoTipo) => void;
  mesEspecificoNum: number;
  setMesEspecificoNum: (m: number) => void;
  anioEspecificoStr: string;
  setAnioEspecificoStr: (a: string) => void;
  kpis: CensoKpis;
  isDesktop: boolean;
}

export function ResumenKpiCenso({
  periodoLocal,
  setPeriodoLocal,
  mesEspecificoNum,
  setMesEspecificoNum,
  anioEspecificoStr,
  setAnioEspecificoStr,
  kpis,
  isDesktop,
}: ResumenKpiCensoProps) {
  return (
    <View style={styles.container}>
      {/* BARRA DE FILTROS SUPERIOR */}
      <View style={styles.filterBar}>
        <View style={styles.filterDropdownCol}>
          <SelectDropdown
            label="Período de Análisis (Censo)"
            value={PERIODO_CENSO_MAP_TO_LABEL[periodoLocal] || 'Este Mes'}
            options={OPCIONES_PERIODO_CENSO}
            onSelect={(selected: string) => {
              const key = PERIODO_CENSO_MAP_TO_KEY[selected];
              if (key) setPeriodoLocal(key);
            }}
          />
        </View>

        {periodoLocal === 'mes_especifico' && (
          <View style={styles.specificMonthRow}>
            <View style={{ flex: 1 }}>
              <SelectDropdown
                label="Mes"
                value={NOMBRES_MESES_CENSO[mesEspecificoNum] || 'Enero'}
                options={NOMBRES_MESES_CENSO}
                onSelect={(selected: string) => {
                  const idx = NOMBRES_MESES_CENSO.indexOf(selected);
                  if (idx >= 0) setMesEspecificoNum(idx);
                }}
              />
            </View>
            <View style={{ width: 110 }}>
              <SelectDropdown
                label="Año"
                value={anioEspecificoStr}
                options={OPCIONES_ANIO_CENSO}
                onSelect={(selected: string) => setAnioEspecificoStr(selected)}
              />
            </View>
          </View>
        )}
      </View>

      {/* FILA DE TARJETAS KPI */}
      <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
        {/* KPI 1: TOTAL CENSADOS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Personas Censadas</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <Users size={16} color="#B6C2CF" />
            </View>
          </View>
          <Text style={styles.kpiMainValue}>{kpis.totalCensados}</Text>
          <Text style={styles.kpiSubtitle}>Total general registrado</Text>
        </View>

        {/* KPI 2: INTERESADAS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Interesadas en Servicio</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <UserCheck size={16} color={COLORES_CENSO.interesados} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalInteresados}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.interesados }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.interesados }]}>
                {kpis.tasaInteres.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Prospectos con disposición afirmativa</Text>
        </View>

        {/* KPI 3: INDECISOS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Indecisos en Contratar</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <HelpCircle size={16} color={COLORES_CENSO.indecisos} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalIndecisos}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.indecisos }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.indecisos }]}>
                {kpis.tasaIndecision.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Posible contratación o en evaluación</Text>
        </View>

        {/* KPI 4: NO INTERESADOS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>No Interesados</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <UserX size={16} color={COLORES_CENSO.noInteresados} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalNoInteresados}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.noInteresados }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.noInteresados }]}>
                {kpis.tasaNoInteres.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Rechazaron contratación o con contrato</Text>
        </View>

        {/* KPI 5: GESTIONES REALIZADAS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Gestión Realizada</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <PhoneCall size={16} color={COLORES_CENSO.gestiones} />
            </View>
          </View>
          <Text style={styles.kpiMainValue}>{kpis.totalGestiones}</Text>
          <Text style={styles.kpiSubtitle}>Contactos comerciales efectuados</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  filterBar: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 16,
  },
  filterDropdownCol: {
    width: '100%',
  },
  specificMonthRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiGridDesktop: {
    flexWrap: 'nowrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#2C333A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    flex: 1,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  kpiMainValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#1D2125',
  },
  pillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 4,
  },
});
