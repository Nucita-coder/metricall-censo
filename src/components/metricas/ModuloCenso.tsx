import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { PeriodoCensoTipo } from './censo/types';
import { useCensoData } from './censo/useCensoData';
import { ResumenKpiCenso } from './censo/ResumenKpiCenso';
import { GraficoDonutCenso } from './censo/GraficoDonutCenso';
import { DesgloseSectoresCenso } from './censo/DesgloseSectoresCenso';
import { DesgloseAsesoresCenso } from './censo/DesgloseAsesoresCenso';

interface ModuloCensoProps {
  empresaId: string;
  filtroPeriodo?: 'todo' | 'hoy' | '7dias' | 'mes';
}

export function ModuloCenso({ empresaId, filtroPeriodo }: ModuloCensoProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<PeriodoCensoTipo>(
    (filtroPeriodo as PeriodoCensoTipo) || 'mes'
  );
  const [mesEspecificoNum, setMesEspecificoNum] = useState<number>(new Date().getMonth());
  const [anioEspecificoStr, setAnioEspecificoStr] = useState<string>(
    String(new Date().getFullYear())
  );

  const { isLoading, stats } = useCensoData(
    empresaId,
    periodoLocal,
    mesEspecificoNum,
    anioEspecificoStr
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B6C2CF" />
        <Text style={styles.loadingText}>Cargando estadísticas de censo comercial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. FILTROS Y RESUMEN KPI (5 MÉTRICAS CLAVE) */}
      <ResumenKpiCenso
        periodoLocal={periodoLocal}
        setPeriodoLocal={setPeriodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        setMesEspecificoNum={setMesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
        setAnioEspecificoStr={setAnioEspecificoStr}
        kpis={stats.kpis}
        isDesktop={isDesktop}
      />

      {/* 2. GRÁFICA DONUT DE INTERÉS Y DESGLOSE POR SECTOR */}
      <View style={[styles.middleGrid, isDesktop && styles.middleGridDesktop]}>
        <GraficoDonutCenso
          totalInteresados={stats.kpis.totalInteresados}
          totalIndecisos={stats.kpis.totalIndecisos}
          totalNoInteresados={stats.kpis.totalNoInteresados}
        />
        <DesgloseSectoresCenso porSector={stats.porSector} />
      </View>

      {/* 3. DESGLOSE DE CENSADOS Y GESTIONES POR ASESOR */}
      <DesgloseAsesoresCenso porAsesor={stats.porAsesor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
  },
  middleGrid: {
    flexDirection: 'column',
  },
  middleGridDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
});
