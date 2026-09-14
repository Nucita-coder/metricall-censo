import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Clock, ChevronDown, ChevronUp, PieChart } from 'lucide-react-native';
import { Tarjeta, GestionItem } from '../../../types/kanban';
import { SliceDataItem, PeriodoTipo } from './types';
import {
  HORAS_JORNADA,
  NOMBRES_MESES_DROPDOWN,
  OPCIONES_ANIO_DROPDOWN,
  OPCIONES_FILTRO_CONTACTO,
  OPCIONES_PERIODO_MATRIZ,
  RESULTADOS_EFECTIVOS_COBRANZA,
  TIPOS_CONTACTO_HEADERS,
  getTodayString,
  parseFechaAObjeto,
} from './cobranzaConstants';
import { DatePickerInput, SelectDropdown } from '../../venta/CamposVenta';
import { GraficoPastelDonutCobranza } from './GraficoPastelDonutCobranza';
import { matrixStyles as styles } from './matrizCobranza.styles';

interface MatrizHorariaCobranzaProps {
  rawTarjetasCobranza: Tarjeta[];
  periodoLocal: PeriodoTipo;
  mesEspecificoNum: number;
  anioEspecificoStr: string;
}

export function MatrizHorariaCobranza({
  rawTarjetasCobranza,
  periodoLocal,
  mesEspecificoNum,
  anioEspecificoStr,
}: MatrizHorariaCobranzaProps) {
  const [periodoMatriz, setPeriodoMatriz] = useState<string>('Hoy');
  const [mesMatrizNum, setMesMatrizNum] = useState<number>(new Date().getMonth());
  const [anioMatrizStr, setAnioMatrizStr] = useState<string>(String(new Date().getFullYear()));
  const [filtroTipoContacto, setFiltroTipoContacto] = useState<string>('Todos los Contactos');
  const [fechaMatriz, setFechaMatriz] = useState<string>(getTodayString());
  const [mostrarPieContactos, setMostrarPieContactos] = useState<boolean>(false);

  const matrixData = useMemo(() => {
    const grid: number[][] = Array(HORAS_JORNADA.length)
      .fill(0)
      .map(() => Array(5).fill(0));
    const columnTotals: number[] = Array(5).fill(0);
    let totalActividadesPeriodo = 0;

    const ahora = new Date();
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    hace7.setHours(0, 0, 0, 0);

    const hace15 = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    hace15.setHours(0, 0, 0, 0);

    const targetDateObj = parseFechaAObjeto(fechaMatriz);
    const targetDayStr = targetDateObj ? targetDateObj.toDateString() : '';

    if (!rawTarjetasCobranza.length) {
      return { grid, columnTotals, totalActividadesPeriodo };
    }

    rawTarjetasCobranza.forEach((t) => {
      const data = t.datos_valores || {};
      const gestiones =
        Array.isArray(data.gestionesCobranza) && data.gestionesCobranza.length > 0
          ? data.gestionesCobranza
          : data.tipoContacto || data['TIPO DE CONTACTO']
          ? [
              {
                fecha: data.fechaCobroReconciliacion || t.updated_at || t.created_at,
                tipoContacto: data.tipoContacto || data['TIPO DE CONTACTO'],
                resultado: data.resultadoContacto || data.RESULTADO || data.resultado || '',
              },
            ]
          : [];

      (gestiones as GestionItem[]).forEach((g: GestionItem) => {
        if (!g.fecha) return;
        const gDate = parseFechaAObjeto(g.fecha);
        if (!gDate) return;

        if (
          periodoMatriz === 'Mes Específico (Selector)' ||
          periodoMatriz.includes('Mes Específico')
        ) {
          const targetYear = parseInt(anioMatrizStr, 10) || ahora.getFullYear();
          if (gDate.getMonth() !== mesMatrizNum || gDate.getFullYear() !== targetYear) return;
        } else if (periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') {
          const targetYear = parseInt(anioEspecificoStr, 10) || ahora.getFullYear();
          if (gDate.getMonth() !== mesEspecificoNum || gDate.getFullYear() !== targetYear) return;
        } else if (periodoMatriz === 'Hoy') {
          if (gDate.toDateString() !== ahora.toDateString()) return;
        } else if (periodoMatriz === 'Semanal (7 días)') {
          if (gDate < hace7) return;
        } else if (periodoMatriz === 'Quincenal (15 días)') {
          if (gDate < hace15) return;
        } else if (periodoMatriz === 'Mensual (Este Mes)') {
          if (gDate.getMonth() !== ahora.getMonth() || gDate.getFullYear() !== ahora.getFullYear())
            return;
        } else if (periodoMatriz === 'Almanaque') {
          if (!targetDayStr || gDate.toDateString() !== targetDayStr) return;
        }

        const resStr = (g.resultado || '').toString().trim().toUpperCase();
        const esEfectivo =
          RESULTADOS_EFECTIVOS_COBRANZA.includes(resStr) ||
          resStr === 'COBRO EFECTIVO' ||
          resStr === 'RECUPERADO';

        if (filtroTipoContacto === 'Solo Cobro Efectivo' && !esEfectivo) return;
        if (filtroTipoContacto === 'Acción Negativa' && (esEfectivo || !resStr)) return;

        const tcStr = (g.tipoContacto || '').toString().trim().toUpperCase();
        let colIdx = -1;
        if (tcStr.includes('LLAMADA') || tcStr.includes('TELEFON')) colIdx = 0;
        else if (tcStr.includes('WHATSAPP') || tcStr.includes('WHASSAPP')) colIdx = 1;
        else if (tcStr.includes('TEXTO') || tcStr.includes('SMS')) colIdx = 2;
        else if (tcStr.includes('CORREO') || tcStr.includes('EMAIL')) colIdx = 3;
        else if (tcStr.includes('VISITA') || tcStr.includes('RESIDENCIAL')) colIdx = 4;

        if (colIdx === -1) return;

        const h = gDate.getHours();
        let rowIdx = -1;
        if (h >= 8 && h <= 18) rowIdx = h - 8;

        if (rowIdx >= 0 && rowIdx < HORAS_JORNADA.length) {
          grid[rowIdx][colIdx] += 1;
          columnTotals[colIdx] += 1;
          totalActividadesPeriodo += 1;
        }
      });
    });

    return { grid, columnTotals, totalActividadesPeriodo };
  }, [
    rawTarjetasCobranza,
    periodoMatriz,
    fechaMatriz,
    mesMatrizNum,
    anioMatrizStr,
    periodoLocal,
    mesEspecificoNum,
    anioEspecificoStr,
    filtroTipoContacto,
  ]);

  const pieDataContactos: SliceDataItem[] = useMemo(() => {
    return TIPOS_CONTACTO_HEADERS.map((label, idx) => ({
      label,
      count: matrixData.columnTotals[idx] || 0,
    }));
  }, [matrixData]);

  return (
    <View style={styles.tableCard}>
      <View style={styles.tableTopHeaderRow}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <View style={{ width: periodoMatriz.includes('Mes Específico') ? 190 : 175 }}>
            <SelectDropdown
              label="Línea de Tiempo"
              value={
                periodoMatriz === 'Almanaque'
                  ? `Almanaque (${fechaMatriz})`
                  : periodoMatriz.includes('Mes Específico')
                  ? `Mes Específico (${NOMBRES_MESES_DROPDOWN[mesMatrizNum]} ${anioMatrizStr})`
                  : periodoMatriz
              }
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
          <View style={{ width: 165 }}>
            <SelectDropdown
              label="Filtro Resultado"
              value={filtroTipoContacto}
              options={OPCIONES_FILTRO_CONTACTO}
              onSelect={(selected) => setFiltroTipoContacto(selected)}
              placeholder="Filtro..."
            />
          </View>
        </View>

        <View style={styles.tableHeaderTitleWrapper}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.tableTitle}>Desglose por Hora y Tipo de Contacto</Text>
            <TouchableOpacity
              style={styles.togglePieButton}
              onPress={() => setMostrarPieContactos((prev) => !prev)}
              activeOpacity={0.7}
            >
              <PieChart size={14} color="#B6C2CF" />
              <Text style={styles.togglePieButtonTxt}>Gráfica</Text>
              {mostrarPieContactos ? (
                <ChevronUp size={14} color="#B6C2CF" />
              ) : (
                <ChevronDown size={14} color="#B6C2CF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {mostrarPieContactos && (
        <View style={styles.chartSectionWrapper}>
          <Text style={styles.sectionSubtitleHeader}>Porcentaje por Tipo de Contacto (Canales)</Text>
          <GraficoPastelDonutCobranza data={pieDataContactos} tamano={150} />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
        <View style={styles.matrixContainer}>
          <View style={styles.matrixHeaderRow}>
            <View style={[styles.matrixHeaderCell, styles.matrixHourHeaderCell]}>
              <Text style={styles.matrixHeaderTxt}>HORA</Text>
            </View>
            {TIPOS_CONTACTO_HEADERS.map((tipo, idx) => (
              <View key={idx} style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderTxt}>{tipo}</Text>
              </View>
            ))}
          </View>

          {HORAS_JORNADA.map((hora, rIdx) => (
            <View
              key={hora}
              style={[
                styles.matrixBodyRow,
                rIdx % 2 === 1 && { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
              ]}
            >
              <View style={[styles.matrixBodyCell, styles.matrixHourCell]}>
                <Clock size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                <Text style={styles.matrixHourTxt}>{hora}</Text>
              </View>

              {TIPOS_CONTACTO_HEADERS.map((_, cIdx) => {
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

          <View style={styles.matrixTotalRow}>
            <View style={[styles.matrixBodyCell, styles.matrixHourCell, { backgroundColor: '#1D2125' }]}>
              <Text style={[styles.matrixHourTxt, { color: '#B6C2CF', fontWeight: '900', fontSize: 10 }]} numberOfLines={1}>
                TOTAL: {matrixData.totalActividadesPeriodo}
              </Text>
            </View>
            {TIPOS_CONTACTO_HEADERS.map((_, cIdx) => {
              const totalCol = matrixData.columnTotals[cIdx];
              return (
                <View key={cIdx} style={[styles.matrixBodyCell, { backgroundColor: '#1D2125' }]}>
                  <Text style={[styles.matrixTotalTxt, totalCol > 0 && { color: '#B6C2CF' }]}>
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
