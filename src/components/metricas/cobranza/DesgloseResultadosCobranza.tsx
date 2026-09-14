import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Layers, PieChart } from 'lucide-react-native';
import { Tarjeta, GestionItem } from '../../../types/kanban';
import { SliceDataItem, PeriodoTipo } from './types';
import {
  TODOS_LOS_RESULTADOS,
  parseFechaAObjeto,
} from './cobranzaConstants';
import { GraficoPastelDonutCobranza } from './GraficoPastelDonutCobranza';
import { styles } from './moduloCobranza.styles';
import { matrixStyles } from './matrizCobranza.styles';

interface DesgloseResultadosCobranzaProps {
  rawTarjetasCobranza: Tarjeta[];
  periodoLocal: PeriodoTipo;
  mesEspecificoNum: number;
  anioEspecificoStr: string;
  fechaInicio: string;
  fechaFin: string;
}

export function DesgloseResultadosCobranza({
  rawTarjetasCobranza,
  periodoLocal,
  mesEspecificoNum,
  anioEspecificoStr,
  fechaInicio,
  fechaFin,
}: DesgloseResultadosCobranzaProps) {
  const [mostrarPieResultados, setMostrarPieResultados] = useState<boolean>(false);

  const matrixResultadosData = useMemo(() => {
    const countsMap = new Map<string, number>();
    TODOS_LOS_RESULTADOS.forEach((r) => countsMap.set(r.clave, 0));
    let totalResultadosPeriodo = 0;

    const ahora = new Date();
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    hace7.setHours(0, 0, 0, 0);

    const inicioObj = fechaInicio ? parseFechaAObjeto(fechaInicio) : null;
    if (inicioObj) inicioObj.setHours(0, 0, 0, 0);

    const finObj = fechaFin ? parseFechaAObjeto(fechaFin) : null;
    if (finObj) finObj.setHours(23, 59, 59, 999);

    if (!rawTarjetasCobranza.length) {
      return { countsMap, totalResultadosPeriodo };
    }

    rawTarjetasCobranza.forEach((t) => {
      const data = t.datos_valores || {};
      const gestiones =
        Array.isArray(data.gestionesCobranza) && data.gestionesCobranza.length > 0
          ? data.gestionesCobranza
          : data.resultadoContacto || data.RESULTADO || data.resultado
          ? [
              {
                fecha: data.fechaCobroReconciliacion || t.updated_at || t.created_at,
                tipoContacto: data.tipoContacto || data['TIPO DE CONTACTO'] || '',
                resultado: data.resultadoContacto || data.RESULTADO || data.resultado || '',
              },
            ]
          : [];

      (gestiones as GestionItem[]).forEach((g: GestionItem) => {
        if (!g.fecha) return;
        const gDate = parseFechaAObjeto(g.fecha);
        if (!gDate) return;

        if (periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') {
          const targetYear = parseInt(anioEspecificoStr, 10) || ahora.getFullYear();
          if (gDate.getMonth() !== mesEspecificoNum || gDate.getFullYear() !== targetYear) return;
        } else if (periodoLocal === 'hoy') {
          if (gDate.toDateString() !== ahora.toDateString()) return;
        } else if (periodoLocal === '7dias') {
          if (gDate < hace7) return;
        } else if (periodoLocal === 'mes') {
          if (gDate.getMonth() !== ahora.getMonth() || gDate.getFullYear() !== ahora.getFullYear())
            return;
        } else if (periodoLocal === 'personalizado') {
          if (inicioObj && gDate < inicioObj) return false;
          if (finObj && gDate > finObj) return false;
        }

        const resStr = (g.resultado || '').toString().trim().toUpperCase();
        if (!resStr) return;

        let matchedClave: string | null = null;
        for (const item of TODOS_LOS_RESULTADOS) {
          if (resStr === item.clave) {
            matchedClave = item.clave;
            break;
          }
        }

        if (matchedClave) {
          countsMap.set(matchedClave, (countsMap.get(matchedClave) || 0) + 1);
          totalResultadosPeriodo += 1;
        }
      });
    });

    return { countsMap, totalResultadosPeriodo };
  }, [rawTarjetasCobranza, periodoLocal, mesEspecificoNum, anioEspecificoStr, fechaInicio, fechaFin]);

  const pieDataResultados: SliceDataItem[] = useMemo(() => {
    return TODOS_LOS_RESULTADOS.map((item) => ({
      label: item.label,
      count: matrixResultadosData.countsMap.get(item.clave) || 0,
    }));
  }, [matrixResultadosData]);

  return (
    <View style={[matrixStyles.tableCard, { marginTop: 20 }]}>
      <View style={matrixStyles.tableTopHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={22} color="#B6C2CF" />
            <Text style={matrixStyles.tableTitle}>Desglose por Resultado de Gestión</Text>
          </View>
          <TouchableOpacity
            style={matrixStyles.togglePieButton}
            onPress={() => setMostrarPieResultados((prev) => !prev)}
            activeOpacity={0.7}
          >
            <PieChart size={14} color="#B6C2CF" />
            <Text style={[matrixStyles.togglePieButtonTxt, { color: '#B6C2CF' }]}>Gráfica</Text>
            {mostrarPieResultados ? (
              <ChevronUp size={14} color="#B6C2CF" />
            ) : (
              <ChevronDown size={14} color="#B6C2CF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {mostrarPieResultados && (
        <View style={matrixStyles.chartSectionWrapper}>
          <Text style={matrixStyles.sectionSubtitleHeader}>Porcentaje por Resultado de Gestión (Resultados)</Text>
          <GraficoPastelDonutCobranza data={pieDataResultados} tamano={160} />
        </View>
      )}

      {/* REJILLA / LISTADO DE RESULTADOS */}
      <View style={styles.resultadosGridContainer}>
        {TODOS_LOS_RESULTADOS.map((item) => {
          const count = matrixResultadosData.countsMap.get(item.clave) || 0;
          const hasCount = count > 0;
          const isEfectivo = item.tipo === 'efectivo';

          return (
            <View key={item.clave} style={[styles.resultadoItemCard, hasCount && styles.resultadoItemCardActive]}>
              <View style={styles.resultadoItemLeft}>
                <Text style={styles.resultadoItemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
              <View style={[styles.resultadoBadge, hasCount && (isEfectivo ? styles.badgeSuccess : styles.badgeDanger)]}>
                <Text style={[styles.resultadoBadgeTxt, hasCount && { color: '#FFFFFF' }]}>
                  {count}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* FILA DE TOTAL DE RESULTADOS COMBINADOS */}
      <View style={[matrixStyles.matrixTotalRow, { marginTop: 14, borderRadius: 8, overflow: 'hidden' }]}>
        <View style={[matrixStyles.matrixBodyCell, { flex: 1, backgroundColor: '#1D2125', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#B6C2CF', fontWeight: '900', fontSize: 13 }}>
            TOTAL: {matrixResultadosData.totalResultadosPeriodo}
          </Text>
        </View>
      </View>
    </View>
  );
}
