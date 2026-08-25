import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Tarjeta } from '../../types/kanban';
import { DatePickerInput, SelectDropdown } from '../venta/CamposVenta';

interface ModuloCobranzaProps {
  empresaId: string | null;
  filtroPeriodo: 'todo' | 'hoy' | '7dias' | 'mes';
  busquedaTexto: string;
}

export interface MesCobranzaData {
  claveMes: string;
  nombreMes: string;
  nombreCorto: string;
  totalEfectivos: number;
  totalNegativos: number;
  totalSinAtender: number;
  totalGeneral: number;
  tasaEfectividad: number;
  tasaSinAtender: number;
}

export interface CobranzaStats {
  totalCortados: number;
  totalEfectivos: number;
  totalNegativos: number;
  totalSinAtender: number;
  tasaRecuperacion: number;
  tasaSinAtender: number;
  serie12Meses: MesCobranzaData[];
}

const OPCIONES_PERIODO = [
  'Todo el Historial',
  'Este Mes',
  'Últimos 7 días',
  'Hoy',
  'Rango Personalizado (Calendario)',
];

const PERIODO_MAP_TO_KEY: Record<string, 'todo' | 'mes' | '7dias' | 'hoy' | 'personalizado'> = {
  'Todo el Historial': 'todo',
  'Este Mes': 'mes',
  'Últimos 7 días': '7dias',
  'Hoy': 'hoy',
  'Rango Personalizado (Calendario)': 'personalizado',
};

const PERIODO_MAP_TO_LABEL: Record<string, string> = {
  todo: 'Todo el Historial',
  mes: 'Este Mes',
  '7dias': 'Últimos 7 días',
  hoy: 'Hoy',
  personalizado: 'Rango Personalizado (Calendario)',
};

function parseFechaAObjeto(val?: string): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split('T')[0].split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function ModuloCobranza({ empresaId, filtroPeriodo, busquedaTexto }: ModuloCobranzaProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<'todo' | 'hoy' | '7dias' | 'mes' | 'personalizado'>(filtroPeriodo || 'todo');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CobranzaStats>({
    totalCortados: 0,
    totalEfectivos: 0,
    totalNegativos: 0,
    totalSinAtender: 0,
    tasaRecuperacion: 0,
    tasaSinAtender: 0,
    serie12Meses: [],
  });

  const cargarDatosCobranza = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);

      // 1. Cargar sucursales
      const { data: sucursales } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      const sucursalIds = (sucursales || []).map(s => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Cargar tableros (coincidencia por tipo 'cobranza' O por nombre que contenga cobranza/recupero/cortado)
      const { data: tableros } = await supabase
        .from('tableros')
        .select('id, nombre, tipo, archivado, mes_periodo')
        .in('sucursal_id', sucursalIds);

      const tablerosCobranza = (tableros || []).filter(t => {
        const n = (t.nombre || '').toLowerCase();
        return t.tipo === 'cobranza' || n.includes('cobranza') || n.includes('recupero') || n.includes('cortado');
      });

      const tableroIds = tablerosCobranza.map(t => t.id);
      if (tableroIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 3. Cargar listas de los tableros de cobranza
      const { data: listas } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id')
        .in('tablero_id', tableroIds);

      if (!listas || listas.length === 0) {
        setIsLoading(false);
        return;
      }

      const listasCobranza = listas;
      const listaIdsCobranza = listasCobranza.map(l => l.id);
      if (listaIdsCobranza.length === 0) {
        setIsLoading(false);
        return;
      }

      // 4. Cargar tarjetas de Cobranza y Recupero (incluye tableros archivados para historial)
      const { data: tarjetasData, error } = await supabase
        .from('tarjetas')
        .select('*')
        .in('lista_id', listaIdsCobranza);

      if (error) throw error;
      const tarjetas = (tarjetasData || []) as Tarjeta[];

      // 5. Filtrar por periodo seleccionado (admite rango personalizado con calendario)
      const ahora = new Date();
      const inicioObj = fechaInicio ? parseFechaAObjeto(fechaInicio) : null;
      if (inicioObj) inicioObj.setHours(0, 0, 0, 0);

      const finObj = fechaFin ? parseFechaAObjeto(fechaFin) : null;
      if (finObj) finObj.setHours(23, 59, 59, 999);

      const tarjetasFiltradas = tarjetas.filter(t => {
        if (periodoLocal === 'todo') return true;
        const data = t.datos_valores || {};
        const fechaStr = data.fechaCobroReconciliacion || t.created_at || t.updated_at;
        if (!fechaStr) return true;
        const fechaTarjeta = parseFechaAObjeto(fechaStr);
        if (!fechaTarjeta) return true;

        if (periodoLocal === 'hoy') {
          return fechaTarjeta.toDateString() === ahora.toDateString();
        }
        if (periodoLocal === '7dias') {
          const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          return fechaTarjeta >= hace7;
        }
        if (periodoLocal === 'mes') {
          return (
            fechaTarjeta.getMonth() === ahora.getMonth() &&
            fechaTarjeta.getFullYear() === ahora.getFullYear()
          );
        }
        if (periodoLocal === 'personalizado') {
          if (inicioObj && fechaTarjeta < inicioObj) return false;
          if (finObj && fechaTarjeta > finObj) return false;
          return true;
        }
        return true;
      });

      // 6. Procesar métricas numéricas globales
      let efectivos = 0;
      let negativos = 0;
      let sinAtender = 0;

      const mapMeses = new Map<string, MesCobranzaData>();
      const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mesesNombresLargos = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      tarjetasFiltradas.forEach(t => {
        const data = t.datos_valores || {};
        const listaObj = listasCobranza.find(l => l.id === t.lista_id);
        const listaNombre = (listaObj?.nombre || '').toLowerCase();

        const esEfectiva =
          listaNombre.includes('efectiva') ||
          data.resultadoContacto === 'COBRO EFECTIVO' ||
          data.RESULTADO === 'COBRO EFECTIVO';

        const esNegativa =
          listaNombre.includes('negativa') ||
          (data.resultadoContacto && data.resultadoContacto !== 'COBRO EFECTIVO');

        if (esEfectiva) {
          efectivos++;
        } else if (esNegativa) {
          negativos++;
        } else {
          // Caso que se quedó en la lista de carga únicamente y nunca pasó a acción efectiva o negativa (Caso Sin Atender)
          sinAtender++;
        }

        // Agrupación mensual por fecha
        const fechaStr = data.fechaCobroReconciliacion || t.updated_at || t.created_at;
        const fechaObj = fechaStr ? new Date(fechaStr) : new Date();
        const year = fechaObj.getFullYear();
        const monthIndex = fechaObj.getMonth();
        const claveMes = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const nombreMes = `${mesesNombresLargos[monthIndex]} ${year}`;
        const nombreCorto = mesesCortos[monthIndex];

        if (!mapMeses.has(claveMes)) {
          mapMeses.set(claveMes, {
            claveMes,
            nombreMes,
            nombreCorto,
            totalEfectivos: 0,
            totalNegativos: 0,
            totalSinAtender: 0,
            totalGeneral: 0,
            tasaEfectividad: 0,
            tasaSinAtender: 0,
          });
        }

        const mData = mapMeses.get(claveMes)!;
        mData.totalGeneral++;
        if (esEfectiva) {
          mData.totalEfectivos++;
        } else if (esNegativa) {
          mData.totalNegativos++;
        } else {
          mData.totalSinAtender++;
        }
      });

      const totalTotal = tarjetasFiltradas.length;
      const tasaEfectivaGeneral = totalTotal > 0 ? Math.round((efectivos / totalTotal) * 100) : 0;
      const tasaSinAtenderGeneral = totalTotal > 0 ? Math.round((sinAtender / totalTotal) * 100) : 0;

      // Generar serie de 12 meses cronológicos del año actual
      const yearActual = ahora.getFullYear();
      const serie12Meses: MesCobranzaData[] = mesesCortos.map((corto, i) => {
        const claveMes = `${yearActual}-${String(i + 1).padStart(2, '0')}`;
        const mData = mapMeses.get(claveMes);
        if (mData) {
          const tasaM = mData.totalGeneral > 0 ? Math.round((mData.totalEfectivos / mData.totalGeneral) * 100) : 0;
          const tasaSA = mData.totalGeneral > 0 ? Math.round((mData.totalSinAtender / mData.totalGeneral) * 100) : 0;
          return { ...mData, tasaEfectividad: tasaM, tasaSinAtender: tasaSA };
        }
        return {
          claveMes,
          nombreMes: `${mesesNombresLargos[i]} ${yearActual}`,
          nombreCorto: corto,
          totalEfectivos: 0,
          totalNegativos: 0,
          totalSinAtender: 0,
          totalGeneral: 0,
          tasaEfectividad: 0,
          tasaSinAtender: 0,
        };
      });

      setStats({
        totalCortados: totalTotal,
        totalEfectivos: efectivos,
        totalNegativos: negativos,
        totalSinAtender: sinAtender,
        tasaRecuperacion: tasaEfectivaGeneral,
        tasaSinAtender: tasaSinAtenderGeneral,
        serie12Meses,
      });
    } catch (err) {
      console.error('Error al cargar métricas cuantitativas de cobranza:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, periodoLocal, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatosCobranza();
  }, [cargarDatosCobranza]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Calculando totales de cobro por mes...</Text>
      </View>
    );
  }

  // Valor máximo para la escala vertical de la gráfica
  const maxCobrados = Math.max(1, ...stats.serie12Meses.map(m => m.totalEfectivos));

  return (
    <View style={styles.container}>
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
      <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
        <View style={[styles.kpiCard, { borderColor: '#7C3AED' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiLabel}>Cobro Efectivo (Clientes)</Text>
            <CheckCircle2 size={22} color="#7C3AED" />
          </View>
          <Text style={[styles.kpiValue, { color: '#A78BFA' }]}>{stats.totalEfectivos}</Text>
          <Text style={styles.kpiSubtext}>Total de clientes cobrados efectivamente</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#E53E3E' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiLabel}>Acción Negativa (Sin Cobro)</Text>
            <XCircle size={22} color="#E53E3E" />
          </View>
          <Text style={[styles.kpiValue, { color: '#FF6B6B' }]}>{stats.totalNegativos}</Text>
          <Text style={styles.kpiSubtext}>Total de clientes no recuperados</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#F59E0B' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiLabel}>Casos Sin Atender</Text>
            <AlertCircle size={22} color="#F59E0B" />
          </View>
          <Text style={[styles.kpiValue, { color: '#FBBF24' }]}>{stats.totalSinAtender}</Text>
          <Text style={styles.kpiSubtext}>Permanecieron en carga sin pasar a acción</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiLabel}>% Casos Sin Atender</Text>
            <Clock size={22} color="#3B82F6" />
          </View>
          <Text style={[styles.kpiValue, { color: '#60A5FA' }]}>{stats.tasaSinAtender}%</Text>
          <Text style={styles.kpiSubtext}>Porcentaje de casos que no se atendieron</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#DD6B20' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiLabel}>Efectividad General</Text>
            <TrendingUp size={22} color="#DD6B20" />
          </View>
          <Text style={[styles.kpiValue, { color: '#F6AD55' }]}>{stats.tasaRecuperacion}%</Text>
          <Text style={styles.kpiSubtext}>Porcentaje de efectividad del total</Text>
        </View>
      </View>

      {/* GRÁFICA DE BARRAS VERTICALES POR MES (FORMATO SOLICITADO) */}
      <View style={styles.chartContainerCard}>
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} color="#A78BFA" />
            <Text style={styles.chartTitle}>Gráfica Mensual de Clientes Cobrados Efectivamente</Text>
          </View>
          <View style={styles.periodBadge}>
            <Calendar size={14} color="#8C9BAB" />
            <Text style={styles.periodBadgeTxt}>Año {new Date().getFullYear()}</Text>
          </View>
        </View>

        {/* CONTENEDOR DE LA GRÁFICA VERTICAL DE BARRAS */}
        <View style={styles.histogramWrapper}>
          {/* LÍNEAS DE REJILLA HORIZONTALES (GRID) */}
          <View style={styles.gridOverlay}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          {/* BARRAS VERTICALES (UN MES POR COLUMNA) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.barsRowContainer}>
              {stats.serie12Meses.map((m) => {
                const porcentajeAltura = Math.round((m.totalEfectivos / maxCobrados) * 100);
                const tieneValor = m.totalEfectivos > 0;

                return (
                  <View key={m.claveMes} style={styles.columnContainer}>
                    {/* VALOR SUPERIOR DE LA BARRA */}
                    <Text style={[styles.barTopValue, tieneValor && styles.barTopValueActive]}>
                      {m.totalEfectivos}
                    </Text>

                    {/* BARRA VERTICAL CILÍNDRICA/MORADA */}
                    <View style={styles.verticalTrack}>
                      <View
                        style={[
                          styles.verticalBarFill,
                          {
                            height: `${Math.max(4, porcentajeAltura)}%`,
                            backgroundColor: tieneValor ? '#7C3AED' : '#384148',
                          },
                        ]}
                      />
                    </View>

                    {/* EJE X: NOMBRE CORTO DEL MES */}
                    <Text style={[styles.monthXLabel, tieneValor && styles.monthXLabelActive]}>
                      {m.nombreCorto}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.chartFooterNotice}>
          <Text style={styles.chartFooterTxt}>
            * Cada columna representa el total numérico de clientes con <Text style={{ color: '#A78BFA', fontWeight: 'bold' }}>Cobro Efectivo</Text> registrados en ese mes.
          </Text>
        </View>
      </View>

      {/* RESUMEN CUANTITATIVO TABULAR MENSUAL */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Desglose Numérico y Porcentual por Mes</Text>
        </View>

        <View style={styles.tableHeadRow}>
          <Text style={[styles.thCell, { flex: 2 }]}>Mes</Text>
          <Text style={[styles.thCell, { flex: 1.4, textAlign: 'center' }]}>Cobro Efectivo</Text>
          <Text style={[styles.thCell, { flex: 1.4, textAlign: 'center' }]}>Sin Cobro (Negativo)</Text>
          <Text style={[styles.thCell, { flex: 1.4, textAlign: 'center' }]}>Sin Atender</Text>
          <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>% Efectividad</Text>
          <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>% Sin Atender</Text>
        </View>

        {stats.serie12Meses.map((m, index) => (
          <View
            key={m.claveMes}
            style={[
              styles.tableBodyRow,
              index % 2 === 1 && { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
            ]}
          >
            <Text style={[styles.tdCellBold, { flex: 2 }]}>{m.nombreMes}</Text>
            <Text style={[styles.tdCellNumberSuccess, { flex: 1.4, textAlign: 'center' }]}>
              {m.totalEfectivos}
            </Text>
            <Text style={[styles.tdCellNumberDanger, { flex: 1.4, textAlign: 'center' }]}>
              {m.totalNegativos}
            </Text>
            <Text style={[styles.tdCellNumberWarning, { flex: 1.4, textAlign: 'center' }]}>
              {m.totalSinAtender}
            </Text>
            <Text style={[styles.tdCellBadge, { flex: 1.2, textAlign: 'right' }]}>
              {m.tasaEfectividad}%
            </Text>
            <Text style={[styles.tdCellBadgeWarning, { flex: 1.2, textAlign: 'right' }]}>
              {m.tasaSinAtender}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterDropdownWrapper: {
    maxWidth: 240,
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
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  clearDatesTxt: {
    color: '#8C9BAB',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
  },
  kpiGrid: {
    gap: 16,
    marginBottom: 20,
  },
  kpiGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#22272B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiLabel: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 6,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  chartContainerCard: {
    backgroundColor: '#22272B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 18,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 12,
  },
  chartTitle: {
    color: '#B6C2CF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D2125',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
  },
  periodBadgeTxt: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  histogramWrapper: {
    height: 240,
    justifyContent: 'flex-end',
    position: 'relative',
    paddingTop: 20,
    marginBottom: 10,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingVertical: 25,
    pointerEvents: 'none',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#2C333A',
    width: '100%',
  },
  barsRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: '100%',
    paddingHorizontal: 8,
    gap: 12,
  },
  columnContainer: {
    flex: 1,
    minWidth: 36,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopValue: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  barTopValueActive: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '900',
  },
  verticalTrack: {
    width: 28,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalBarFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  monthXLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
  },
  monthXLabelActive: {
    color: '#B6C2CF',
  },
  chartFooterNotice: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
  },
  chartFooterTxt: {
    color: '#8C9BAB',
    fontSize: 11,
    fontStyle: 'italic',
  },
  tableCard: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 18,
  },
  tableHeader: {
    marginBottom: 14,
  },
  tableTitle: {
    color: '#B6C2CF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tableHeadRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#1D2125',
    borderRadius: 6,
    marginBottom: 8,
  },
  thCell: {
    color: '#8C9BAB',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  tdCellBold: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tdCellNumberSuccess: {
    color: '#A78BFA',
    fontWeight: '900',
    fontSize: 14,
  },
  tdCellNumberDanger: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tdCellNumberInfo: {
    color: '#579DFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tdCellNumberWarning: {
    color: '#FBBF24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tdCellBadge: {
    color: '#F6AD55',
    fontWeight: '900',
    fontSize: 13,
  },
  tdCellBadgeWarning: {
    color: '#60A5FA',
    fontWeight: '900',
    fontSize: 13,
  },
});
