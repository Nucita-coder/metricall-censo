import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingCart, Clock, ShieldCheck, Percent } from 'lucide-react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { VentasKpis, PeriodoVentasTipo } from './types';
import {
  OPCIONES_PERIODO_VENTAS,
  MESES_VENTAS,
  COLORES_VENTAS,
} from './ventasConstants';

interface ResumenKpiVentasProps {
  periodoLocal: PeriodoVentasTipo;
  setPeriodoLocal: (p: PeriodoVentasTipo) => void;
  mesEspecificoNum: number;
  setMesEspecificoNum: (m: number) => void;
  anioEspecificoStr: string;
  setAnioEspecificoStr: (a: string) => void;
  asesorFiltro: string;
  setAsesorFiltro: (a: string) => void;
  listaAsesores: string[];
  kpis: VentasKpis;
  isDesktop: boolean;
}

const OPCIONES_ANIO_VENTAS = ['2024', '2025', '2026', '2027'];

const PERIODO_LABEL_MAP: Record<PeriodoVentasTipo, string> = {
  mes: 'Este Mes',
  mes_especifico: 'Mes Específico',
  '7dias': 'Últimos 7 Días',
  hoy: 'Hoy',
  todo: 'Todo el Historial',
};

const PERIODO_KEY_MAP: Record<string, PeriodoVentasTipo> = {
  'Este Mes': 'mes',
  'Mes Específico': 'mes_especifico',
  'Últimos 7 Días': '7dias',
  Hoy: 'hoy',
  'Todo el Historial': 'todo',
};

export function ResumenKpiVentas({
  periodoLocal,
  setPeriodoLocal,
  mesEspecificoNum,
  setMesEspecificoNum,
  anioEspecificoStr,
  setAnioEspecificoStr,
  asesorFiltro,
  setAsesorFiltro,
  listaAsesores,
  kpis,
  isDesktop,
}: ResumenKpiVentasProps) {
  return (
    <View style={styles.container}>
      {/* BARRA DE FILTROS SUPERIOR */}
      <View style={styles.filterBar}>
        <View style={styles.filterBarRow}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <SelectDropdown
              label="Período de Análisis (Ventas)"
              value={PERIODO_LABEL_MAP[periodoLocal] || 'Este Mes'}
              options={OPCIONES_PERIODO_VENTAS.map((o) => o.label)}
              onSelect={(selected: string) => {
                const key = PERIODO_KEY_MAP[selected];
                if (key) setPeriodoLocal(key);
              }}
            />
          </View>

          {periodoLocal === 'mes_especifico' && (
            <>
              <View style={{ flex: 1, minWidth: 140 }}>
                <SelectDropdown
                  label="Mes"
                  value={MESES_VENTAS[mesEspecificoNum] || 'Enero'}
                  options={MESES_VENTAS}
                  onSelect={(selected: string) => {
                    const idx = MESES_VENTAS.indexOf(selected);
                    if (idx >= 0) setMesEspecificoNum(idx);
                  }}
                />
              </View>
              <View style={{ width: 100 }}>
                <SelectDropdown
                  label="Año"
                  value={anioEspecificoStr}
                  options={OPCIONES_ANIO_VENTAS}
                  onSelect={(selected: string) => setAnioEspecificoStr(selected)}
                />
              </View>
            </>
          )}

          <View style={{ flex: 1, minWidth: 200 }}>
            <SelectDropdown
              label="Filtrar por Asesor"
              value={asesorFiltro}
              options={listaAsesores}
              onSelect={(selected: string) => setAsesorFiltro(selected)}
            />
          </View>
        </View>
      </View>

      {/* FILA DE TARJETAS KPI (TOTALMENTE CUADRADAS Y PEGADAS) */}
      <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
        {/* KPI 1: VENTAS TOTALES */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Cantidad de Ventas</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <ShoppingCart size={15} color="#A0B2C6" />
            </View>
          </View>
          <Text style={styles.kpiValuePrincipal}>{kpis.totalVentas}</Text>
          <Text style={styles.kpiSub}>En el período seleccionado</Text>
        </View>

        {/* KPI 2: POR INSTALAR */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Ventas por Instalar</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <Clock size={15} color={COLORES_VENTAS.porInstalar} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: COLORES_VENTAS.porInstalar }]}>
            {kpis.ventasPorInstalar}
          </Text>
          <Text style={styles.kpiSub}>Pendientes de instalación</Text>
        </View>

        {/* KPI 3: FACTIBILIDAD APROBADA */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Ventas Factibles</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <ShieldCheck size={15} color={COLORES_VENTAS.factible} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: COLORES_VENTAS.factible }]}>
            {kpis.ventasFactibles}
          </Text>
          <Text style={styles.kpiSub}>Con LCH verificado</Text>
        </View>

        {/* KPI 4: TASA DE FACTIBILIDAD */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Efectividad Factible</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <Percent size={15} color="#A0B2C6" />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: '#B6C2CF' }]}>
            {kpis.tasaFactibilidad.toFixed(1)}%
          </Text>
          <Text style={styles.kpiSub}>
            {kpis.ventasRechazadas} no factibles • {kpis.ventasEnVerificacion} en revisión
          </Text>
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
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    padding: 14,
    marginBottom: 16,
  },
  filterBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
  },
  kpiGrid: {
    flexDirection: 'column',
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    overflow: 'hidden',
  },
  kpiGridDesktop: {
    flexDirection: 'row',
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2C333A',
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#384148',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
  },
  kpiValuePrincipal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#8C9BAB',
  },
});
