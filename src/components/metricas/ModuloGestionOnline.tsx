import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { DatePickerInput, SelectDropdown } from '../venta/CamposVenta';
import { DesgloseResultadosOnline } from './gestion_online/DesgloseResultadosOnline';
import { GraficaBarrasMensual } from './gestion_online/GraficaBarrasMensual';
import { MatrizHorariaOnline } from './gestion_online/MatrizHorariaOnline';
import { ResumenEjecutivoOnline } from './gestion_online/ResumenEjecutivoOnline';
import {
  NOMBRES_MESES_DROPDOWN,
  OPCIONES_ANIO_DROPDOWN,
  OPCIONES_PERIODO,
  PERIODO_MAP_TO_KEY,
  PERIODO_MAP_TO_LABEL,
  PeriodoKey,
} from './gestion_online/types';
import { getTodayString } from './gestion_online/gestionOnlineUtils';
import { useGestionOnlineData } from './gestion_online/useGestionOnlineData';

interface ModuloGestionOnlineProps {
  empresaId: string | null;
  filtroPeriodo: 'todo' | 'hoy' | '7dias' | 'mes';
  busquedaTexto: string;
}

export function ModuloGestionOnline({ empresaId, filtroPeriodo }: ModuloGestionOnlineProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<PeriodoKey>(filtroPeriodo || 'mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [mesEspecificoNum, setMesEspecificoNum] = useState<number>(new Date().getMonth());
  const [anioEspecificoStr, setAnioEspecificoStr] = useState<string>(String(new Date().getFullYear()));

  const mesAnterior = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
  const anioAnterior = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
  const [mesCompararNum, setMesCompararNum] = useState<number>(mesAnterior);
  const [anioCompararStr, setAnioCompararStr] = useState<string>(String(anioAnterior));

  const [periodoMatriz, setPeriodoMatriz] = useState<string>('Hoy');
  const [fechaMatriz, setFechaMatriz] = useState<string>(getTodayString());
  const [mesMatrizNum, setMesMatrizNum] = useState<number>(new Date().getMonth());
  const [anioMatrizStr, setAnioMatrizStr] = useState<string>(String(new Date().getFullYear()));

  const {
    isLoading,
    stats,
    statsComparativa,
    matrixData,
    matrixResultadosData,
    pieDataCanales,
    pieDataResultados,
  } = useGestionOnlineData({
    empresaId,
    periodoLocal,
    fechaInicio,
    fechaFin,
    mesEspecificoNum,
    anioEspecificoStr,
    mesCompararNum,
    anioCompararStr,
    periodoMatriz,
    fechaMatriz,
    mesMatrizNum,
    anioMatrizStr,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Calculando estadísticas de Gestión Online...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SELECTOR DE PERÍODO PRINCIPAL */}
      <View style={styles.filterDropdownWrapper}>
        <SelectDropdown
          label="Filtrar Período"
          value={PERIODO_MAP_TO_LABEL[periodoLocal] || 'Todo el Historial'}
          options={OPCIONES_PERIODO}
          onSelect={(selectedLabel) => {
            const key = PERIODO_MAP_TO_KEY[selectedLabel] || 'todo';
            setPeriodoLocal(key);
          }}
          placeholder="Seleccionar..."
        />
      </View>

      {/* SELECTORES DE MES ESPECÍFICO O COMPARATIVA */}
      {(periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') && (
        <View style={styles.customDateContainer}>
          <Text style={styles.customDateTitle}>
            {periodoLocal === 'comparativa'
              ? 'Seleccionar Meses para Comparativa Lado a Lado'
              : 'Seleccionar Mes y Año en Concreto'}
          </Text>
          <View style={styles.customDateRow}>
            <SelectDropdown
              label="Mes Principal"
              value={NOMBRES_MESES_DROPDOWN[mesEspecificoNum]}
              options={NOMBRES_MESES_DROPDOWN}
              onSelect={(val) => {
                const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                if (idx !== -1) setMesEspecificoNum(idx);
              }}
              halfWidth
            />
            <SelectDropdown
              label="Año Principal"
              value={anioEspecificoStr}
              options={OPCIONES_ANIO_DROPDOWN}
              onSelect={(val) => setAnioEspecificoStr(val)}
              halfWidth
            />

            {periodoLocal === 'comparativa' && (
              <>
                <SelectDropdown
                  label="Mes a Comparar"
                  value={NOMBRES_MESES_DROPDOWN[mesCompararNum]}
                  options={NOMBRES_MESES_DROPDOWN}
                  onSelect={(val) => {
                    const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                    if (idx !== -1) setMesCompararNum(idx);
                  }}
                  halfWidth
                />
                <SelectDropdown
                  label="Año a Comparar"
                  value={anioCompararStr}
                  options={OPCIONES_ANIO_DROPDOWN}
                  onSelect={(val) => setAnioCompararStr(val)}
                  halfWidth
                />
              </>
            )}
          </View>
        </View>
      )}

      {/* SELECTOR RANGO PERSONALIZADO CON CALENDARIO */}
      {periodoLocal === 'personalizado' && (
        <View style={styles.customDateContainer}>
          <Text style={styles.customDateTitle}>Rango de Fechas (Calendario)</Text>
          <View style={styles.customDateRow}>
            <DatePickerInput
              label="Desde"
              value={fechaInicio}
              onDateChange={setFechaInicio}
              placeholder="dd/mm/aaaa"
              halfWidth
            />
            <DatePickerInput
              label="Hasta"
              value={fechaFin}
              onDateChange={setFechaFin}
              placeholder="dd/mm/aaaa"
              halfWidth
            />
          </View>
          {(fechaInicio !== '' || fechaFin !== '') && (
            <TouchableOpacity
              style={styles.clearDatesBtn}
              onPress={() => {
                setFechaInicio('');
                setFechaFin('');
              }}
            >
              <X size={12} color="#8C9BAB" />
              <Text style={styles.clearDatesTxt}>Limpiar Fechas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 1. RESUMEN EJECUTIVO Y COMPARATIVA LADO A LADO */}
      <ResumenEjecutivoOnline
        stats={stats}
        statsComparativa={statsComparativa}
        periodoLocal={periodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
        mesCompararNum={mesCompararNum}
        anioCompararStr={anioCompararStr}
        isDesktop={isDesktop}
      />

      {/* 2. GRÁFICA DE BARRAS MENSUALES (12 MESES) */}
      <GraficaBarrasMensual
        serie12Meses={stats.serie12Meses}
        anioActual={periodoLocal === 'mes_especifico' ? anioEspecificoStr : new Date().getFullYear()}
      />

      {/* 3. DESGLOSE MATRICIAL POR HORA Y CANAL */}
      <MatrizHorariaOnline
        matrixData={matrixData}
        pieDataCanales={pieDataCanales}
        periodoMatriz={periodoMatriz}
        setPeriodoMatriz={setPeriodoMatriz}
        fechaMatriz={fechaMatriz}
        setFechaMatriz={setFechaMatriz}
        mesMatrizNum={mesMatrizNum}
        setMesMatrizNum={setMesMatrizNum}
        anioMatrizStr={anioMatrizStr}
        setAnioMatrizStr={setAnioMatrizStr}
      />

      {/* 4. DESGLOSE POR RESULTADO DE GESTIÓN */}
      <DesgloseResultadosOnline
        matrixResultadosData={matrixResultadosData}
        pieDataResultados={pieDataResultados}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8C9BAB',
    fontSize: 13,
    marginTop: 12,
  },
  filterDropdownWrapper: {
    width: 240,
    marginBottom: 8,
  },
  customDateContainer: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 10,
    marginBottom: 14,
    maxWidth: 420,
  },
  customDateTitle: {
    color: '#B6C2CF',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  customDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  clearDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDatesTxt: {
    color: '#8C9BAB',
    fontSize: 11,
  },
});
