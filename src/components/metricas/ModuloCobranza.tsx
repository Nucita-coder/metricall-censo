import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ModuloCobranzaProps, PeriodoTipo } from './cobranza/types';
import { useCobranzaData } from './cobranza/useCobranzaData';
import { ResumenKpiCobranza } from './cobranza/ResumenKpiCobranza';
import { GraficaBarrasCobranza } from './cobranza/GraficaBarrasCobranza';
import { MatrizHorariaCobranza } from './cobranza/MatrizHorariaCobranza';
import { DesgloseResultadosCobranza } from './cobranza/DesgloseResultadosCobranza';
import { styles } from './cobranza/moduloCobranza.styles';

export type { ModuloCobranzaProps };

export function ModuloCobranza({ empresaId, filtroPeriodo }: ModuloCobranzaProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<PeriodoTipo>(filtroPeriodo || 'todo');
  const [mesEspecificoNum, setMesEspecificoNum] = useState<number>(new Date().getMonth());
  const [anioEspecificoStr, setAnioEspecificoStr] = useState<string>(String(new Date().getFullYear()));
  const [habilitarComparativa, setHabilitarComparativa] = useState<boolean>(false);
  const [mesCompararNum, setMesCompararNum] = useState<number>(
    new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1
  );
  const [anioCompararStr, setAnioCompararStr] = useState<string>(
    new Date().getMonth() === 0 ? String(new Date().getFullYear() - 1) : String(new Date().getFullYear())
  );
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const { isLoading, rawTarjetasCobranza, stats, statsComparativa } = useCobranzaData(
    empresaId,
    periodoLocal,
    mesEspecificoNum,
    anioEspecificoStr,
    mesCompararNum,
    anioCompararStr,
    fechaInicio,
    fechaFin
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B6C2CF" />
        <Text style={styles.loadingText}>Cargando métricas cuantitativas de cobranza...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SECCIÓN 1: FILTROS SUPERIORES Y RESUMEN KPI */}
      <ResumenKpiCobranza
        periodoLocal={periodoLocal}
        setPeriodoLocal={setPeriodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        setMesEspecificoNum={setMesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
        setAnioEspecificoStr={setAnioEspecificoStr}
        habilitarComparativa={habilitarComparativa}
        setHabilitarComparativa={setHabilitarComparativa}
        mesCompararNum={mesCompararNum}
        setMesCompararNum={setMesCompararNum}
        anioCompararStr={anioCompararStr}
        setAnioCompararStr={setAnioCompararStr}
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        stats={stats}
        statsComparativa={statsComparativa}
        isDesktop={isDesktop}
      />

      {/* SECCIÓN 2: GRÁFICA DE BARRAS MENSUALES */}
      <GraficaBarrasCobranza stats={stats} />

      {/* SECCIÓN 3: MATRIZ HORARIA Y CANALES DE CONTACTO */}
      <MatrizHorariaCobranza
        rawTarjetasCobranza={rawTarjetasCobranza}
        periodoLocal={periodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
      />

      {/* SECCIÓN 4: DESGLOSE DE RESULTADOS DE GESTIÓN */}
      <DesgloseResultadosCobranza
        rawTarjetasCobranza={rawTarjetasCobranza}
        periodoLocal={periodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />
    </View>
  );
}
