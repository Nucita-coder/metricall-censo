import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { PeriodoVentasTipo } from './ventas/types';
import { useVentasData } from './ventas/useVentasData';
import { ResumenKpiVentas } from './ventas/ResumenKpiVentas';
import { GraficoFactibilidadTipoVentas } from './ventas/GraficoFactibilidadTipoVentas';
import { DesgloseZonasPlanesVentas } from './ventas/DesgloseZonasPlanesVentas';
import { DesgloseAsesoresVentas } from './ventas/DesgloseAsesoresVentas';

interface ModuloVentasProps {
  empresaId: string;
  filtroPeriodo?: 'todo' | 'hoy' | '7dias' | 'mes';
}

export function ModuloVentas({ empresaId, filtroPeriodo }: ModuloVentasProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<PeriodoVentasTipo>(
    (filtroPeriodo as PeriodoVentasTipo) || 'mes'
  );
  const [mesEspecificoNum, setMesEspecificoNum] = useState<number>(new Date().getMonth());
  const [anioEspecificoStr, setAnioEspecificoStr] = useState<string>(
    String(new Date().getFullYear())
  );
  const [asesorFiltro, setAsesorFiltro] = useState<string>('Todos los Asesores');

  const { isLoading, stats, listaAsesores } = useVentasData(
    empresaId,
    periodoLocal,
    mesEspecificoNum,
    anioEspecificoStr,
    asesorFiltro
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B6C2CF" />
        <Text style={styles.loadingText}>Cargando estadísticas de ventas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. FILTROS Y RESUMEN KPI (VENTAS, POR INSTALAR, FACTIBILIDAD) */}
      <ResumenKpiVentas
        periodoLocal={periodoLocal}
        setPeriodoLocal={setPeriodoLocal}
        mesEspecificoNum={mesEspecificoNum}
        setMesEspecificoNum={setMesEspecificoNum}
        anioEspecificoStr={anioEspecificoStr}
        setAnioEspecificoStr={setAnioEspecificoStr}
        asesorFiltro={asesorFiltro}
        setAsesorFiltro={setAsesorFiltro}
        listaAsesores={listaAsesores}
        kpis={stats.kpis}
        isDesktop={isDesktop}
      />

      {/* 2. VENTAS POR FACTIBILIDAD Y POR TIPO DE SERVICIO (PEGADAS Y CUADRADAS) */}
      <GraficoFactibilidadTipoVentas
        porFactibilidad={stats.porFactibilidad}
        porTipo={stats.porTipo}
        isDesktop={isDesktop}
      />

      {/* 3. VENTAS POR ZONAS Y POR PLANES (PEGADAS Y CUADRADAS) */}
      <DesgloseZonasPlanesVentas
        porZona={stats.porZona}
        porPlan={stats.porPlan}
        isDesktop={isDesktop}
      />

      {/* 4. RENDIMIENTO DE VENTAS POR ASESOR */}
      <DesgloseAsesoresVentas porAsesor={stats.porAsesor} />
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
});
