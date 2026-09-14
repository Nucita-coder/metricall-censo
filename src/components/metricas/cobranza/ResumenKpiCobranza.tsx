import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { CobranzaStats, PeriodoTipo } from './types';
import {
  OPCIONES_PERIODO,
  PERIODO_MAP_TO_KEY,
  PERIODO_MAP_TO_LABEL,
  NOMBRES_MESES_DROPDOWN,
  OPCIONES_ANIO_DROPDOWN,
} from './cobranzaConstants';
import { DatePickerInput, SelectDropdown } from '../../venta/CamposVenta';
import { styles } from './moduloCobranza.styles';
import { TarjetaComparativaCobranza } from './TarjetaComparativaCobranza';

interface ResumenKpiCobranzaProps {
  periodoLocal: PeriodoTipo;
  setPeriodoLocal: (p: PeriodoTipo) => void;
  mesEspecificoNum: number;
  setMesEspecificoNum: (m: number) => void;
  anioEspecificoStr: string;
  setAnioEspecificoStr: (a: string) => void;
  habilitarComparativa: boolean;
  setHabilitarComparativa: (h: boolean | ((prev: boolean) => boolean)) => void;
  mesCompararNum: number;
  setMesCompararNum: (m: number) => void;
  anioCompararStr: string;
  setAnioCompararStr: (a: string) => void;
  fechaInicio: string;
  setFechaInicio: (f: string) => void;
  fechaFin: string;
  setFechaFin: (f: string) => void;
  stats: CobranzaStats;
  statsComparativa: {
    totalCortados: number;
    totalEfectivos: number;
    totalNegativos: number;
    totalSinAtender: number;
    tasaRecuperacion: number;
    tasaSinAtender: number;
  } | null;
  isDesktop: boolean;
}

export function ResumenKpiCobranza({
  periodoLocal,
  setPeriodoLocal,
  mesEspecificoNum,
  setMesEspecificoNum,
  anioEspecificoStr,
  setAnioEspecificoStr,
  habilitarComparativa,
  setHabilitarComparativa,
  mesCompararNum,
  setMesCompararNum,
  anioCompararStr,
  setAnioCompararStr,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  stats,
  statsComparativa,
  isDesktop,
}: ResumenKpiCobranzaProps) {
  return (
    <View>
      {/* BARRA DE FILTROS SUPERIOR */}
      <View style={styles.filterBarRow}>
        <View style={styles.filterDropdownWrapper}>
          <SelectDropdown
            label="Período de Análisis"
            value={PERIODO_MAP_TO_LABEL[periodoLocal] || 'Este Mes'}
            options={OPCIONES_PERIODO}
            onSelect={(selected) => {
              const key = PERIODO_MAP_TO_KEY[selected] || 'todo';
              setPeriodoLocal(key);
              if (key === 'comparativa') {
                setHabilitarComparativa(true);
              } else {
                setHabilitarComparativa(false);
              }
            }}
            placeholder="Seleccione período..."
          />
        </View>

        {periodoLocal === 'mes_especifico' && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
            <View style={{ width: 140 }}>
              <SelectDropdown
                label="Mes a Consultar"
                value={NOMBRES_MESES_DROPDOWN[mesEspecificoNum]}
                options={NOMBRES_MESES_DROPDOWN}
                onSelect={(val) => {
                  const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                  if (idx !== -1) setMesEspecificoNum(idx);
                }}
              />
            </View>
            <View style={{ width: 100 }}>
              <SelectDropdown
                label="Año"
                value={anioEspecificoStr}
                options={OPCIONES_ANIO_DROPDOWN}
                onSelect={(val) => setAnioEspecificoStr(val)}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnCompararTop, habilitarComparativa && styles.btnCompararTopActive]}
          onPress={() => {
            if (!habilitarComparativa) {
              setHabilitarComparativa(true);
              setPeriodoLocal('comparativa');
            } else {
              setHabilitarComparativa(false);
              if (periodoLocal === 'comparativa') {
                setPeriodoLocal('mes');
              }
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnCompararTopTxt, habilitarComparativa && styles.btnCompararTopTxtActive]}>
            {habilitarComparativa ? 'Ocultar Comparativa' : 'Comparar con Otro Mes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SELECTORES DE COMPARATIVA */}
      {habilitarComparativa && (
        <View style={{
          backgroundColor: '#22272B',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#384148',
          padding: 12,
          marginBottom: 16,
        }}>
          <Text style={{ color: '#B6C2CF', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>
            Configuración de Comparativa entre Dos Meses
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ color: '#8C9BAB', fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>
                MES BASE (A)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <SelectDropdown
                    label="Mes Base"
                    value={NOMBRES_MESES_DROPDOWN[mesEspecificoNum]}
                    options={NOMBRES_MESES_DROPDOWN}
                    onSelect={(val) => {
                      const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                      if (idx !== -1) setMesEspecificoNum(idx);
                    }}
                  />
                </View>
                <View style={{ width: 90 }}>
                  <SelectDropdown
                    label="Año Base"
                    value={anioEspecificoStr}
                    options={OPCIONES_ANIO_DROPDOWN}
                    onSelect={(val) => setAnioEspecificoStr(val)}
                  />
                </View>
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ color: '#8C9BAB', fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>
                MES A COMPARAR (B)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <SelectDropdown
                    label="Mes a Comparar"
                    value={NOMBRES_MESES_DROPDOWN[mesCompararNum]}
                    options={NOMBRES_MESES_DROPDOWN}
                    onSelect={(val) => {
                      const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                      if (idx !== -1) setMesCompararNum(idx);
                    }}
                  />
                </View>
                <View style={{ width: 90 }}>
                  <SelectDropdown
                    label="Año Comparar"
                    value={anioCompararStr}
                    options={OPCIONES_ANIO_DROPDOWN}
                    onSelect={(val) => setAnioCompararStr(val)}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* RANGO PERSONALIZADO */}
      {periodoLocal === 'personalizado' && (
        <View style={styles.customDateContainer}>
          <Text style={styles.customDateTitle}>Rango de Fecha Personalizado</Text>
          <View style={styles.customDateRow}>
            <View style={{ width: '48%' }}>
              <DatePickerInput
                label="Desde"
                value={fechaInicio}
                onDateChange={(val) => setFechaInicio(val || '')}
                placeholder="dd/mm/aaaa"
              />
            </View>
            <View style={{ width: '48%' }}>
              <DatePickerInput
                label="Hasta"
                value={fechaFin}
                onDateChange={(val) => setFechaFin(val || '')}
                placeholder="dd/mm/aaaa"
              />
            </View>
          </View>
          {(fechaInicio || fechaFin) && (
            <TouchableOpacity
              style={styles.clearDatesBtn}
              onPress={() => {
                setFechaInicio('');
                setFechaFin('');
              }}
            >
              <X size={12} color="#8C9BAB" />
              <Text style={styles.clearDatesTxt}>Limpiar Rango</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* TARJETAS DE RESUMEN EJECUTIVO (SOBER SUMMARY CARDS) */}
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
        {/* TARJETA 1: MES ACTUAL / SELECCIONADO */}
        <View style={[styles.soberSummaryCard, { flex: 1, marginBottom: 0 }]}>
          <Text style={styles.soberCardHeaderTitle}>
            {periodoLocal === 'comparativa'
              ? `Resumen Base (${NOMBRES_MESES_DROPDOWN[mesEspecificoNum]} ${anioEspecificoStr})`
              : 'Resumen Cuantitativo de Cobranza'}
          </Text>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Cobro Efectivo (Clientes)</Text>
              <Text style={styles.soberMetricSubtext}>Total de clientes cobrados efectivamente</Text>
            </View>
            <Text style={styles.soberMetricValue}>{stats.totalEfectivos}</Text>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Acción Negativa (Sin Cobro)</Text>
              <Text style={styles.soberMetricSubtext}>Total de clientes no recuperados</Text>
            </View>
            <Text style={styles.soberMetricValue}>{stats.totalNegativos}</Text>
          </View>

          <View style={styles.soberMetricRow}>
            <View style={styles.soberMetricInfo}>
              <Text style={styles.soberMetricLabel}>Casos Sin Atender</Text>
              <Text style={styles.soberMetricSubtext}>Permanecieron en carga sin pasar a acción</Text>
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
            <Text style={styles.soberMetricValue}>{stats.tasaRecuperacion}%</Text>
          </View>
        </View>

        {/* TARJETA 2: MES A COMPARAR */}
        {periodoLocal === 'comparativa' && statsComparativa && (
          <TarjetaComparativaCobranza
            mesCompararNum={mesCompararNum}
            anioCompararStr={anioCompararStr}
            stats={stats}
            statsComparativa={statsComparativa}
          />
        )}
      </View>
    </View>
  );
}
