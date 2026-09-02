import { ChevronDown, ChevronUp, Clock, PieChart } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DatePickerInput, SelectDropdown } from '../../venta/CamposVenta';
import { gestionOnlineStyles as styles } from './gestionOnlineStyles';
import { getTodayString } from './gestionOnlineUtils';
import { GraficoPastelDonut } from './GraficoPastelDonut';
import {
  CANALES_GESTION_HEADERS,
  HORAS_JORNADA,
  MatrizOnlineData,
  NOMBRES_MESES_DROPDOWN,
  OPCIONES_ANIO_DROPDOWN,
  OPCIONES_PERIODO_MATRIZ,
  SliceDataItem,
} from './types';

interface MatrizHorariaOnlineProps {
  matrixData: MatrizOnlineData;
  pieDataCanales: SliceDataItem[];
  periodoMatriz: string;
  setPeriodoMatriz: (v: string) => void;
  fechaMatriz: string;
  setFechaMatriz: (v: string) => void;
  mesMatrizNum: number;
  setMesMatrizNum: (v: number) => void;
  anioMatrizStr: string;
  setAnioMatrizStr: (v: string) => void;
}

export function MatrizHorariaOnline({
  matrixData,
  pieDataCanales,
  periodoMatriz,
  setPeriodoMatriz,
  fechaMatriz,
  setFechaMatriz,
  mesMatrizNum,
  setMesMatrizNum,
  anioMatrizStr,
  setAnioMatrizStr,
}: MatrizHorariaOnlineProps) {
  const [mostrarPieCanales, setMostrarPieCanales] = useState(false);

  const valorSelector =
    periodoMatriz === 'Almanaque'
      ? `Almanaque (${fechaMatriz})`
      : periodoMatriz.includes('Mes Específico')
      ? `Mes Específico (${NOMBRES_MESES_DROPDOWN[mesMatrizNum]} ${anioMatrizStr})`
      : periodoMatriz;

  return (
    <View style={styles.tableCard}>
      <View style={styles.tableTopHeaderRow}>
        <View style={styles.filterControlsRow}>
          <View style={{ width: periodoMatriz.includes('Mes Específico') ? 190 : 175 }}>
            <SelectDropdown
              label="Línea de Tiempo"
              value={valorSelector}
              options={OPCIONES_PERIODO_MATRIZ}
              onSelect={(selected) => setPeriodoMatriz(selected)}
              placeholder="Período..."
            />
          </View>

          {periodoMatriz.includes('Mes Específico') ? (
            <>
              <View style={{ width: 140 }}>
                <SelectDropdown
                  label="Mes (Matriz)"
                  value={NOMBRES_MESES_DROPDOWN[mesMatrizNum]}
                  options={NOMBRES_MESES_DROPDOWN}
                  onSelect={(val) => {
                    const idx = NOMBRES_MESES_DROPDOWN.indexOf(val);
                    if (idx !== -1) setMesMatrizNum(idx);
                  }}
                />
              </View>
              <View style={{ width: 110 }}>
                <SelectDropdown
                  label="Año"
                  value={anioMatrizStr}
                  options={OPCIONES_ANIO_DROPDOWN}
                  onSelect={(val) => setAnioMatrizStr(val)}
                />
              </View>
            </>
          ) : (
            <View style={{ width: 160 }}>
              <DatePickerInput
                label="Fecha (Almanaque)"
                value={fechaMatriz}
                onDateChange={(val) => {
                  setFechaMatriz(val || getTodayString());
                  setPeriodoMatriz('Almanaque');
                }}
                placeholder="dd/mm/aaaa"
              />
            </View>
          )}
        </View>

        <View style={styles.tableHeaderTitleWrapper}>
          <View style={styles.tableHeaderFlex}>
            <Text style={styles.tableTitle}>Desglose por Hora y Canal Online</Text>
            <TouchableOpacity
              style={styles.togglePieButton}
              onPress={() => setMostrarPieCanales(prev => !prev)}
              activeOpacity={0.7}
            >
              <PieChart size={14} color="#10B981" />
              <Text style={styles.togglePieButtonTxt}>Gráfica</Text>
              {mostrarPieCanales ? (
                <ChevronUp size={14} color="#10B981" />
              ) : (
                <ChevronDown size={14} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DIAGRAMA DONUT DESPLEGABLE */}
      {mostrarPieCanales && (
        <View style={styles.chartSectionWrapper}>
          <Text style={styles.sectionSubtitleHeader}>Porcentaje por Canal / Entrada Online (100%)</Text>
          <GraficoPastelDonut data={pieDataCanales} tamano={150} />
        </View>
      )}

      {/* MATRIZ HORARIA SCROLLABLE */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: '100%' }}>
        <View style={styles.matrixContainer}>
          {/* CABECERA */}
          <View style={styles.matrixHeaderRow}>
            <View style={[styles.matrixHeaderCell, styles.matrixHourHeaderCell]}>
              <Text style={styles.matrixHeaderTxt}>HORA</Text>
            </View>
            {CANALES_GESTION_HEADERS.map((canal, idx) => (
              <View key={idx} style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderTxt}>{canal}</Text>
              </View>
            ))}
          </View>

          {/* FILAS DE HORARIOS */}
          {HORAS_JORNADA.map((hora, rIdx) => (
            <View
              key={hora}
              style={[
                styles.matrixBodyRow,
                rIdx % 2 === 1 && { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
              ]}
            >
              <View style={[styles.matrixBodyCell, styles.matrixHourCell]}>
                <Clock size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.matrixHourTxt}>{hora}</Text>
              </View>

              {CANALES_GESTION_HEADERS.map((_, cIdx) => {
                const count = matrixData.grid[rIdx][cIdx];
                const hasCount = count > 0;
                return (
                  <View key={cIdx} style={styles.matrixBodyCell}>
                    <View style={[styles.matrixCountBadge, hasCount && styles.matrixCountBadgeActive]}>
                      <Text style={[styles.matrixCountTxt, hasCount && styles.matrixCountTxtActive]}>
                        {count}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* FILA DE TOTALES */}
          <View style={styles.matrixTotalRow}>
            <View style={[styles.matrixBodyCell, styles.matrixHourCell, { backgroundColor: '#1D2125' }]}>
              <Text style={styles.matrixTotalHourTxt} numberOfLines={1}>
                TOTAL: {matrixData.totalActividadesPeriodo}
              </Text>
            </View>
            {CANALES_GESTION_HEADERS.map((_, cIdx) => {
              const totalCol = matrixData.columnTotals[cIdx];
              return (
                <View key={cIdx} style={[styles.matrixBodyCell, { backgroundColor: '#1D2125' }]}>
                  <Text style={[styles.matrixTotalTxt, totalCol > 0 && { color: '#10B981' }]}>
                    {totalCol}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
