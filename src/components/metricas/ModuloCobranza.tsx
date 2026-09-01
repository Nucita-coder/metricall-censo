import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  PieChart,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
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
  'Mes Específico (Selector)',
  'Comparación entre Meses (Comparativa)',
  'Últimos 7 días',
  'Hoy',
  'Rango Personalizado (Calendario)',
];

const PERIODO_MAP_TO_KEY: Record<string, 'todo' | 'mes' | 'mes_especifico' | 'comparativa' | '7dias' | 'hoy' | 'personalizado'> = {
  'Todo el Historial': 'todo',
  'Este Mes': 'mes',
  'Mes Específico (Selector)': 'mes_especifico',
  'Comparación entre Meses (Comparativa)': 'comparativa',
  'Últimos 7 días': '7dias',
  'Hoy': 'hoy',
  'Rango Personalizado (Calendario)': 'personalizado',
};

const PERIODO_MAP_TO_LABEL: Record<string, string> = {
  todo: 'Todo el Historial',
  mes: 'Este Mes',
  mes_especifico: 'Mes Específico (Selector)',
  comparativa: 'Comparación entre Meses (Comparativa)',
  '7dias': 'Últimos 7 días',
  hoy: 'Hoy',
  personalizado: 'Rango Personalizado (Calendario)',
};

const NOMBRES_MESES_DROPDOWN = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const OPCIONES_ANIO_DROPDOWN = ['2026', '2025', '2024', '2023'];

const OPCIONES_FILTRO_CONTACTO = [
  'Todos los Contactos',
  'Solo Cobro Efectivo',
  'Acción Negativa',
];

const TIPOS_CONTACTO_HEADERS = [
  'LLAMADA TELEFON',
  'MENSAJE WHASSAPP',
  'MENSAJE TEXTO',
  'CORREO',
  'VISITA RESIDENCIAL',
];

const OPCIONES_PERIODO_MATRIZ = [
  'Hoy',
  'Semanal (7 días)',
  'Quincenal (15 días)',
  'Mensual (Este Mes)',
  'Mes Específico (Selector)',
];

const HORAS_JORNADA = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

const RESULTADOS_EFECTIVOS_COBRANZA = [
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'NO CONTESTO',
  'LUEGO PASA POR OFIC',
  'PIDE AJUSTE DE PLAN',
];

const TODOS_LOS_RESULTADOS = [
  { clave: 'COBRO EFECTIVO', label: 'COBRO EFECTIVO', tipo: 'efectivo' },
  { clave: 'CONVENIO DE PAGO', label: 'CONVENIO DE PAGO', tipo: 'efectivo' },
  { clave: 'ABONO PARCIALMENTE', label: 'ABONO PARCIALMENTE', tipo: 'efectivo' },
  { clave: 'RECUPERADO', label: 'RECUPERADO', tipo: 'efectivo' },
  { clave: 'NO CONTESTO', label: 'NO CONTESTO', tipo: 'efectivo' },
  { clave: 'LUEGO PASA POR OFIC', label: 'LUEGO PASA POR OFIC', tipo: 'efectivo' },
  { clave: 'PIDE RETIRO', label: 'PIDE RETIRO', tipo: 'negativo' },
  { clave: 'FUERA DE ZONA', label: 'FUERA DE ZONA', tipo: 'negativo' },
  { clave: 'RECHAZO A PAGAR POR DIAS SIN SERVICIO', label: 'RECHAZO A PAGAR POR DIAS SIN SERVICIO', tipo: 'negativo' },
  { clave: 'TIENE FALLA', label: 'TIENE FALLA', tipo: 'negativo' },
  { clave: 'INCONFORMIDAD CON MONTO', label: 'INCONFORMIDAD CON MONTO', tipo: 'negativo' },
  { clave: 'NO RECONOCE DEUDA', label: 'NO RECONOCE DEUDA', tipo: 'negativo' },
  { clave: 'REHUSA ENTREGAR EQUIPO', label: 'REHUSA ENTREGAR EQUIPO', tipo: 'negativo' },
  { clave: 'PUERTO LIBERADO', label: 'PUERTO LIBERADO', tipo: 'negativo' },
  { clave: 'PIDE AJUSTE DE PLAN', label: 'PIDE AJUSTE DE PLAN', tipo: 'efectivo' },
  { clave: 'TIENE OTRO SERVICIO', label: 'TIENE OTRO SERVICIO', tipo: 'negativo' },
  { clave: 'NO DESEA PAGAR', label: 'NO DESEA PAGAR', tipo: 'negativo' },
];

const PALETA_COLORES_GRAFICO = [
  '#7C3AED', '#60A5FA', '#34D399', '#F59E0B', '#F87171',
  '#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F97316',
  '#E11D48', '#A855F7', '#3B82F6', '#22C55E', '#EAB308',
  '#EF4444', '#6366F1'
];

interface SliceDataItem {
  label: string;
  count: number;
  color?: string;
}

interface GraficoPastelDonutProps {
  data: SliceDataItem[];
  tamano?: number;
}

function GraficoPastelDonut({ data, tamano = 160 }: GraficoPastelDonutProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const itemsConValor = data.filter(d => d.count > 0);

  const cx = tamano / 2;
  const cy = tamano / 2;
  const outerRadius = tamano / 2 - 8;
  const innerRadius = outerRadius * 0.55;

  let currentAngle = -Math.PI / 2;

  const slices = itemsConValor.map((item, idx) => {
    const pct = total > 0 ? item.count / total : 0;
    const angle = pct * 2 * Math.PI;

    const startAngle = currentAngle;
    const endAngle = angle >= 2 * Math.PI ? startAngle + 1.9999 * Math.PI : startAngle + angle;
    currentAngle += angle;

    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

    const color = item.color || PALETA_COLORES_GRAFICO[idx % PALETA_COLORES_GRAFICO.length];

    return {
      pathData,
      color,
      label: item.label,
      count: item.count,
    };
  });

  return (
    <View style={styles.pieContainerWrapper}>
      <View style={styles.pieChartCenterWrapper}>
        <Svg width={tamano} height={tamano}>
          <G>
            {total === 0 ? (
              <Circle
                cx={cx}
                cy={cy}
                r={(outerRadius + innerRadius) / 2}
                stroke="#384148"
                strokeWidth={outerRadius - innerRadius}
                fill="none"
              />
            ) : (
              slices.map((s, idx) => (
                <Path key={idx} d={s.pathData} fill={s.color} stroke="#1D2125" strokeWidth={1.5} />
              ))
            )}
          </G>
        </Svg>
        <View style={styles.pieCenterOverlay}>
          <Text style={styles.pieCenterTotalNumber}>{total}</Text>
          <Text style={styles.pieCenterTotalTxt}>100%</Text>
        </View>
      </View>

      <View style={styles.pieLegendContainer}>
        {data.map((item, idx) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
          const color = item.color || PALETA_COLORES_GRAFICO[idx % PALETA_COLORES_GRAFICO.length];
          const hasVal = item.count > 0;

          return (
            <View key={item.label} style={[styles.pieLegendItemRow, !hasVal && { opacity: 0.4 }]}>
              <View style={styles.pieLegendLeft}>
                <View style={[styles.pieLegendColorBox, { backgroundColor: color }]} />
                <Text style={styles.pieLegendLabelTxt} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.pieLegendRight}>
                <Text style={[styles.pieLegendCountTxt, hasVal && { color: '#FFF' }]}>
                  {item.count}
                </Text>
                <Text style={[styles.pieLegendPctTxt, hasVal && { color: '#A78BFA' }]}>
                  ({pct}%)
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function getTodayString(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function parseFechaAObjeto(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();
  if (!str) return null;

  // DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split(/[,\s]+/);
    const [d, m, y] = parts[0].split('/').map(Number);
    let hh = 0, mm = 0, ss = 0;
    if (parts.length > 1) {
      const timeStr = parts.slice(1).join(' ');
      const dummyDate = new Date(`1970-01-01 ${timeStr}`);
      if (!isNaN(dummyDate.getTime())) {
        hh = dummyDate.getHours();
        mm = dummyDate.getMinutes();
        ss = dummyDate.getSeconds();
      }
    }
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  // YYYY-MM-DD SOLAMENTE (sin hora explícita -> medianoche local)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Cadenas ISO completas (ej: "2026-08-26T14:32:10.000Z") o formatos estándar de fecha y hora
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function ModuloCobranza({ empresaId, filtroPeriodo, busquedaTexto }: ModuloCobranzaProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [periodoLocal, setPeriodoLocal] = useState<'todo' | 'hoy' | '7dias' | 'mes' | 'mes_especifico' | 'comparativa' | 'personalizado'>(filtroPeriodo || 'todo');
  const [mesEspecificoNum, setMesEspecificoNum] = useState<number>(new Date().getMonth());
  const [anioEspecificoStr, setAnioEspecificoStr] = useState<string>(String(new Date().getFullYear()));
  const [periodoMatriz, setPeriodoMatriz] = useState<string>('Hoy');
  const [mesMatrizNum, setMesMatrizNum] = useState<number>(new Date().getMonth());
  const [anioMatrizStr, setAnioMatrizStr] = useState<string>(String(new Date().getFullYear()));
  const [filtroTipoContacto, setFiltroTipoContacto] = useState<string>('Todos los Contactos');
  const [fechaMatriz, setFechaMatriz] = useState<string>(getTodayString());
  const [mostrarPieContactos, setMostrarPieContactos] = useState<boolean>(false);
  const [mostrarPieResultados, setMostrarPieResultados] = useState<boolean>(false);
  const [rawTarjetasCobranza, setRawTarjetasCobranza] = useState<Tarjeta[]>([]);
  const [habilitarComparativa, setHabilitarComparativa] = useState<boolean>(false);
  const [mesCompararNum, setMesCompararNum] = useState<number>(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1);
  const [anioCompararStr, setAnioCompararStr] = useState<string>(
    new Date().getMonth() === 0 ? String(new Date().getFullYear() - 1) : String(new Date().getFullYear())
  );

  const statsComparativa = React.useMemo(() => {
    if (periodoLocal !== 'comparativa' || !rawTarjetasCobranza.length) {
      return null;
    }

    const targetYear = parseInt(anioCompararStr, 10) || new Date().getFullYear();
    let efectivos = 0;
    let negativos = 0;
    let sinAtender = 0;

    const tarjetasMesB = rawTarjetasCobranza.filter(t => {
      const data = t.datos_valores || {};
      const fechaStr = data.fechaCobroReconciliacion || t.created_at || t.updated_at;
      if (!fechaStr) return false;
      const fechaTarjeta = parseFechaAObjeto(fechaStr);
      if (!fechaTarjeta) return false;

      return (
        fechaTarjeta.getMonth() === mesCompararNum &&
        fechaTarjeta.getFullYear() === targetYear
      );
    });

    tarjetasMesB.forEach(t => {
      const data = t.datos_valores || {};
      const resStr = (data.resultadoContacto || data.RESULTADO || data.resultado || '').toString().trim().toUpperCase();
      const esCobroExitoso = (resStr === 'COBRO EFECTIVO' || resStr === 'RECUPERADO') && resStr !== 'FUERA DE ZONA';

      if (esCobroExitoso) {
        efectivos++;
      } else if (resStr === 'FUERA DE ZONA' || Boolean(data.resultadoContacto)) {
        negativos++;
      } else {
        sinAtender++;
      }
    });

    const totalTotal = tarjetasMesB.length;
    const tasaRecuperacion = totalTotal > 0 ? Math.round((efectivos / totalTotal) * 100) : 0;
    const tasaSinAtender = totalTotal > 0 ? Math.round((sinAtender / totalTotal) * 100) : 0;

    return {
      totalCortados: totalTotal,
      totalEfectivos: efectivos,
      totalNegativos: negativos,
      totalSinAtender: sinAtender,
      tasaRecuperacion,
      tasaSinAtender,
    };
  }, [rawTarjetasCobranza, periodoLocal, mesCompararNum, anioCompararStr]);
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
      setRawTarjetasCobranza(tarjetas);

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
        if (periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') {
          const targetYear = parseInt(anioEspecificoStr, 10) || ahora.getFullYear();
          return (
            fechaTarjeta.getMonth() === mesEspecificoNum &&
            fechaTarjeta.getFullYear() === targetYear
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

        const resStr = (data.resultadoContacto || data.RESULTADO || data.resultado || '').toString().trim().toUpperCase();

        const esCobroExitoso = (resStr === 'COBRO EFECTIVO' || resStr === 'RECUPERADO') && resStr !== 'FUERA DE ZONA';

        const esNegativa =
          listaNombre.includes('negativa') ||
          resStr === 'FUERA DE ZONA' ||
          (Boolean(data.resultadoContacto) && !esCobroExitoso);

        if (esCobroExitoso) {
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
        if (esCobroExitoso) {
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
  }, [empresaId, periodoLocal, fechaInicio, fechaFin, mesEspecificoNum, anioEspecificoStr]);

  // Cálculo memorizado de la matriz horaria por línea de tiempo (Semanal, 15 días, Mensual, etc.)
  const matrixData = React.useMemo(() => {
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

    rawTarjetasCobranza.forEach(t => {
      const data = t.datos_valores || {};
      const gestiones = Array.isArray(data.gestionesCobranza) && data.gestionesCobranza.length > 0
        ? data.gestionesCobranza
        : (data.tipoContacto || data['TIPO DE CONTACTO']
            ? [{
                fecha: data.fechaCobroReconciliacion || t.updated_at || t.created_at,
                tipoContacto: data.tipoContacto || data['TIPO DE CONTACTO'],
                resultado: data.resultadoContacto || data.RESULTADO || data.resultado || '',
              }]
            : []);

      gestiones.forEach((g: any) => {
        if (!g.fecha) return;
        const gDate = parseFechaAObjeto(g.fecha);
        if (!gDate) return;

        // 1. Filtrado por Línea de Tiempo (Periodo Matriz)
        if (periodoMatriz === 'Mes Específico (Selector)' || periodoMatriz.includes('Mes Específico')) {
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
          if (gDate.getMonth() !== ahora.getMonth() || gDate.getFullYear() !== ahora.getFullYear()) return;
        } else if (periodoMatriz === 'Almanaque') {
          if (!targetDayStr || gDate.toDateString() !== targetDayStr) return;
        }

        // 2. Filtrado por Resultado de Contacto
        const resStr = (g.resultado || '').toString().trim().toUpperCase();
        const esEfectivo = RESULTADOS_EFECTIVOS_COBRANZA.includes(resStr) || resStr === 'COBRO EFECTIVO' || resStr === 'RECUPERADO';

        if (filtroTipoContacto === 'Solo Cobro Efectivo' && !esEfectivo) return;
        if (filtroTipoContacto === 'Acción Negativa' && (esEfectivo || !resStr)) return;

        // 3. Mapeo por Tipo de Contacto
        const tcStr = (g.tipoContacto || '').toString().trim().toUpperCase();
        let colIdx = -1;
        if (tcStr.includes('LLAMADA') || tcStr.includes('TELEFON')) {
          colIdx = 0;
        } else if (tcStr.includes('WHATSAPP') || tcStr.includes('WHASSAPP')) {
          colIdx = 1;
        } else if (tcStr.includes('TEXTO') || tcStr.includes('SMS')) {
          colIdx = 2;
        } else if (tcStr.includes('CORREO') || tcStr.includes('EMAIL')) {
          colIdx = 3;
        } else if (tcStr.includes('VISITA') || tcStr.includes('RESIDENCIAL')) {
          colIdx = 4;
        }

        if (colIdx < 0) return;

        // 4. Mapeo por Fila de Hora
        const hour = gDate.getHours();
        let rowIdx = hour - 8;
        if (hour < 8) rowIdx = 0;
        if (hour > 18) rowIdx = HORAS_JORNADA.length - 1;

        if (rowIdx >= 0 && rowIdx < HORAS_JORNADA.length) {
          grid[rowIdx][colIdx] += 1;
          columnTotals[colIdx] += 1;
          totalActividadesPeriodo += 1;
        }
      });
    });

    return { grid, columnTotals, totalActividadesPeriodo };
  }, [rawTarjetasCobranza, periodoMatriz, fechaMatriz, filtroTipoContacto, mesMatrizNum, anioMatrizStr, periodoLocal, mesEspecificoNum, anioEspecificoStr]);

  // Cálculo memorizado del desglose por Resultado de Gestión (Sin Horarios)
  const matrixResultadosData = React.useMemo(() => {
    const countsMap = new Map<string, number>();
    TODOS_LOS_RESULTADOS.forEach(r => countsMap.set(r.clave, 0));
    let totalResultadosPeriodo = 0;

    const ahora = new Date();
    const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    hace7.setHours(0, 0, 0, 0);

    const hace15 = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    hace15.setHours(0, 0, 0, 0);

    const targetDateObj = parseFechaAObjeto(fechaMatriz);
    const targetDayStr = targetDateObj ? targetDateObj.toDateString() : '';

    if (!rawTarjetasCobranza.length) {
      return { countsMap, totalResultadosPeriodo };
    }

    rawTarjetasCobranza.forEach(t => {
      const data = t.datos_valores || {};
      const gestiones = Array.isArray(data.gestionesCobranza) && data.gestionesCobranza.length > 0
        ? data.gestionesCobranza
        : (data.tipoContacto || data['TIPO DE CONTACTO']
            ? [{
                fecha: data.fechaCobroReconciliacion || t.updated_at || t.created_at,
                tipoContacto: data.tipoContacto || data['TIPO DE CONTACTO'],
                resultado: data.resultadoContacto || data.RESULTADO || data.resultado || '',
              }]
            : []);

      gestiones.forEach((g: any) => {
        if (!g.fecha) return;
        const gDate = parseFechaAObjeto(g.fecha);
        if (!gDate) return;

        // 1. Filtrado por Línea de Tiempo (sincronizado)
        if (periodoMatriz === 'Mes Específico (Selector)' || periodoMatriz.includes('Mes Específico')) {
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
          if (gDate.getMonth() !== ahora.getMonth() || gDate.getFullYear() !== ahora.getFullYear()) return;
        } else if (periodoMatriz === 'Almanaque') {
          if (!targetDayStr || gDate.toDateString() !== targetDayStr) return;
        }

        // 2. Coincidencia de resultado
        const resStr = (g.resultado || '').toString().trim().toUpperCase();
        if (!resStr) return;

        const match = TODOS_LOS_RESULTADOS.find(r => r.clave === resStr || resStr.includes(r.clave));
        if (match) {
          countsMap.set(match.clave, (countsMap.get(match.clave) || 0) + 1);
          totalResultadosPeriodo += 1;
        }
      });
    });

    return { countsMap, totalResultadosPeriodo };
  }, [rawTarjetasCobranza, periodoMatriz, fechaMatriz, mesMatrizNum, anioMatrizStr, periodoLocal, mesEspecificoNum, anioEspecificoStr]);

  // Datos para los diagramas de pastel (100% distribución)
  const pieDataContactos = React.useMemo(() => {
    const colores = ['#7C3AED', '#60A5FA', '#34D399', '#F59E0B', '#EC4899'];
    return TIPOS_CONTACTO_HEADERS.map((label, cIdx) => ({
      label,
      count: matrixData.columnTotals[cIdx] || 0,
      color: colores[cIdx % colores.length],
    }));
  }, [matrixData.columnTotals]);

  const pieDataResultados = React.useMemo(() => {
    const coloresMap: Record<string, string> = {
      'COBRO EFECTIVO': '#22C55E',
      'CONVENIO DE PAGO': '#10B981',
      'ABONO PARCIALMENTE': '#34D399',
      'RECUPERADO': '#06B6D4',
      'NO CONTESTO': '#60A5FA',
      'LUEGO PASA POR OFIC': '#8B5CF6',
      'PIDE AJUSTE DE PLAN': '#A78BFA',
      'PIDE RETIRO': '#EF4444',
      'FUERA DE ZONA': '#F87171',
      'RECHAZO A PAGAR POR DIAS SIN SERVICIO': '#F97316',
      'TIENE FALLA': '#F59E0B',
      'INCONFORMIDAD CON MONTO': '#EC4899',
      'NO RECONOCE DEUDA': '#E11D48',
      'REHUSA ENTREGAR EQUIPO': '#DC2626',
      'PUERTO LIBERADO': '#9333EA',
      'TIENE OTRO SERVICIO': '#64748B',
      'NO DESEA PAGAR': '#B91C1C',
    };

    return TODOS_LOS_RESULTADOS.map(r => ({
      label: r.label,
      count: matrixResultadosData.countsMap.get(r.clave) || 0,
      color: coloresMap[r.clave] || '#8C9BAB',
    }));
  }, [matrixResultadosData.countsMap]);

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

      {(periodoLocal === 'mes_especifico' || periodoLocal === 'comparativa') && (
        <View style={styles.customDateContainer}>
          <Text style={styles.customDateTitle}>
            {periodoLocal === 'comparativa' ? 'Seleccionar Meses para Comparativa Lado a Lado' : 'Seleccionar Mes y Año En Concreto'}
          </Text>
          <View style={styles.customDateRow}>
            <SelectDropdown
              label="Mes Principal"
              value={NOMBRES_MESES_DROPDOWN[mesEspecificoNum]}
              options={NOMBRES_MESES_DROPDOWN}
              onSelect={(selectedMesStr) => {
                const idx = NOMBRES_MESES_DROPDOWN.indexOf(selectedMesStr);
                if (idx !== -1) setMesEspecificoNum(idx);
              }}
              halfWidth
            />
            <SelectDropdown
              label="Año Principal"
              value={anioEspecificoStr}
              options={OPCIONES_ANIO_DROPDOWN}
              onSelect={(selectedAnio) => {
                setAnioEspecificoStr(selectedAnio);
              }}
              halfWidth
            />

            {periodoLocal === 'comparativa' && (
              <>
                <SelectDropdown
                  label="Mes a Comparar"
                  value={NOMBRES_MESES_DROPDOWN[mesCompararNum]}
                  options={NOMBRES_MESES_DROPDOWN}
                  onSelect={(selectedMesStr) => {
                    const idx = NOMBRES_MESES_DROPDOWN.indexOf(selectedMesStr);
                    if (idx !== -1) setMesCompararNum(idx);
                  }}
                  halfWidth
                />
                <SelectDropdown
                  label="Año a Comparar"
                  value={anioCompararStr}
                  options={OPCIONES_ANIO_DROPDOWN}
                  onSelect={(selectedAnio) => {
                    setAnioCompararStr(selectedAnio);
                  }}
                  halfWidth
                />
              </>
            )}
          </View>
        </View>
      )}
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
      {/* CONTENEDOR SOBRIO DE MÉTRICAS EJECUTIVAS Y COMPARATIVA LADO A LADO */}
      <View style={{ flexDirection: isDesktop && periodoLocal === 'comparativa' ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
        {/* TARJETA 1: MES PRINCIPAL */}
        <View style={[styles.soberSummaryCard, periodoLocal === 'comparativa' && { flex: 1, marginBottom: 0 }]}>
          <Text style={styles.soberCardHeaderTitle}>
            Resumen Ejecutivo ({`${NOMBRES_MESES_DROPDOWN[mesEspecificoNum]} ${anioEspecificoStr}`})
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

        {/* TARJETA 2: MES A COMPARAR (EN EL ÁREA MARCADA POR EL USUARIO) */}
        {periodoLocal === 'comparativa' && statsComparativa && (
          <View style={[styles.soberSummaryCard, { flex: 1, marginBottom: 0, borderColor: '#0C66E4' }]}>
            <Text style={[styles.soberCardHeaderTitle, { color: '#579DFF' }]}>
              Resumen Comparativo ({NOMBRES_MESES_DROPDOWN[mesCompararNum]} {anioCompararStr})
            </Text>

            <View style={styles.soberMetricRow}>
              <View style={styles.soberMetricInfo}>
                <Text style={styles.soberMetricLabel}>Cobro Efectivo (Clientes)</Text>
                <Text style={styles.soberMetricSubtext}>Total de clientes cobrados efectivamente</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.soberMetricValue}>{statsComparativa.totalEfectivos}</Text>
                {(() => {
                  const diff = stats.totalEfectivos - statsComparativa.totalEfectivos;
                  const isPositive = diff > 0;
                  const isNegative = diff < 0;
                  return (
                    <View style={[
                      styles.diffBadge,
                      isPositive && styles.diffBadgeSuccess,
                      isNegative && styles.diffBadgeDanger,
                    ]}>
                      <Text style={[styles.diffBadgeTxt, isPositive && { color: '#34D399' }, isNegative && { color: '#F87171' }]}>
                        {isPositive ? `+${diff} VS MES BASE` : `${diff} VS MES BASE`}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            <View style={styles.soberMetricRow}>
              <View style={styles.soberMetricInfo}>
                <Text style={styles.soberMetricLabel}>Acción Negativa (Sin Cobro)</Text>
                <Text style={styles.soberMetricSubtext}>Total de clientes no recuperados</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.soberMetricValue}>{statsComparativa.totalNegativos}</Text>
                {(() => {
                  const diff = stats.totalNegativos - statsComparativa.totalNegativos;
                  return (
                    <View style={styles.diffBadge}>
                      <Text style={styles.diffBadgeTxt}>
                        {diff > 0 ? `+${diff} VS MES BASE` : `${diff} VS MES BASE`}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            <View style={styles.soberMetricRow}>
              <View style={styles.soberMetricInfo}>
                <Text style={styles.soberMetricLabel}>Casos Sin Atender</Text>
                <Text style={styles.soberMetricSubtext}>Permanecieron en carga sin pasar a acción</Text>
              </View>
              <Text style={styles.soberMetricValue}>{statsComparativa.totalSinAtender}</Text>
            </View>

            <View style={styles.soberMetricRow}>
              <View style={styles.soberMetricInfo}>
                <Text style={styles.soberMetricLabel}>% Casos Sin Atender</Text>
                <Text style={styles.soberMetricSubtext}>Porcentaje de casos que no se atendieron</Text>
              </View>
              <Text style={styles.soberMetricValue}>{statsComparativa.tasaSinAtender}%</Text>
            </View>

            <View style={[styles.soberMetricRow, { borderBottomWidth: 0 }]}>
              <View style={styles.soberMetricInfo}>
                <Text style={styles.soberMetricLabel}>Efectividad General</Text>
                <Text style={styles.soberMetricSubtext}>Porcentaje de efectividad del total</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.soberMetricValue}>{statsComparativa.tasaRecuperacion}%</Text>
                {(() => {
                  const diff = stats.tasaRecuperacion - statsComparativa.tasaRecuperacion;
                  const isPositive = diff > 0;
                  const isNegative = diff < 0;
                  return (
                    <View style={[
                      styles.diffBadge,
                      isPositive && styles.diffBadgeSuccess,
                      isNegative && styles.diffBadgeDanger,
                    ]}>
                      <Text style={[styles.diffBadgeTxt, isPositive && { color: '#34D399' }, isNegative && { color: '#F87171' }]}>
                        {isPositive ? `+${diff}% EFECTIVIDAD` : `${diff}% EFECTIVIDAD`}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
        )}
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

      {/* DESGLOSE MATRICIAL POR HORA Y TIPO DE CONTACTO (SISTEMA DE MONITOREO DIARIO / LÍNEA DE TIEMPO) */}
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
                onPress={() => setMostrarPieContactos(prev => !prev)}
                activeOpacity={0.7}
              >
                <PieChart size={14} color="#A78BFA" />
                <Text style={styles.togglePieButtonTxt}>Gráfica</Text>
                {mostrarPieContactos ? (
                  <ChevronUp size={14} color="#A78BFA" />
                ) : (
                  <ChevronDown size={14} color="#A78BFA" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* DIAGRAMA DE PASTEL DESPLEGABLE: DISTRIBUCIÓN POR TIPO DE CONTACTO (100%) */}
        {mostrarPieContactos && (
          <View style={styles.chartSectionWrapper}>
            <Text style={styles.sectionSubtitleHeader}>Porcentaje por Tipo de Contacto (Canales)</Text>
            <GraficoPastelDonut data={pieDataContactos} tamano={150} />
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: '100%' }}>
          <View style={styles.matrixContainer}>
            {/* CABECERA DE LA MATRIZ */}
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

            {/* FILAS DE HORARIOS (EJE VERTICAL DE HORAS) */}
            {HORAS_JORNADA.map((hora, rIdx) => (
              <View
                key={hora}
                style={[
                  styles.matrixBodyRow,
                  rIdx % 2 === 1 && { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                ]}
              >
                {/* CELDA DE LA HORA */}
                <View style={[styles.matrixBodyCell, styles.matrixHourCell]}>
                  <Clock size={12} color="#A78BFA" style={{ marginRight: 4 }} />
                  <Text style={styles.matrixHourTxt}>{hora}</Text>
                </View>

                {/* CELDAS DE LAS 5 OPCIONES DE CONTACTO CON VALORES REALES */}
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

            {/* FILA DE TOTALES AL PIE DE LA MATRIZ */}
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
                    <Text style={[styles.matrixTotalTxt, totalCol > 0 && { color: '#A78BFA' }]}>
                      {totalCol}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* SECCIÓN 2: DESGLOSE DE RESULTADOS DE GESTIÓN (SIN HORARIO) */}
      <View style={[styles.tableCard, { marginTop: 20 }]}>
        <View style={styles.tableTopHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Layers size={22} color="#60A5FA" />
              <Text style={styles.tableTitle}>Desglose por Resultado de Gestión</Text>
            </View>
            <TouchableOpacity
              style={styles.togglePieButton}
              onPress={() => setMostrarPieResultados(prev => !prev)}
              activeOpacity={0.7}
            >
              <PieChart size={14} color="#60A5FA" />
              <Text style={[styles.togglePieButtonTxt, { color: '#60A5FA' }]}>Gráfica</Text>
              {mostrarPieResultados ? (
                <ChevronUp size={14} color="#60A5FA" />
              ) : (
                <ChevronDown size={14} color="#60A5FA" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* DIAGRAMA DE PASTEL DESPLEGABLE: DISTRIBUCIÓN POR RESULTADO DE GESTIÓN (100%) */}
        {mostrarPieResultados && (
          <View style={styles.chartSectionWrapper}>
            <Text style={styles.sectionSubtitleHeader}>Porcentaje por Resultado de Gestión (Resultados)</Text>
            <GraficoPastelDonut data={pieDataResultados} tamano={160} />
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
                  <Text style={[styles.resultadoBadgeTxt, hasCount && { color: '#FFF' }]}>
                    {count}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* FILA DE TOTAL DE RESULTADOS COMBINADOS */}
        <View style={[styles.matrixTotalRow, { marginTop: 14, borderRadius: 8, overflow: 'hidden' }]}>
          <View style={[styles.matrixBodyCell, { flex: 1, backgroundColor: '#1D2125', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#B6C2CF', fontWeight: '900', fontSize: 13 }}>
              TOTAL: {matrixResultadosData.totalResultadosPeriodo}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  btnCompararTop: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnCompararTopActive: {
    backgroundColor: 'rgba(12, 102, 228, 0.15)',
    borderColor: '#0C66E4',
  },
  btnCompararTopTxt: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnCompararTopTxtActive: {
    color: '#579DFF',
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
  soberSummaryCard: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    maxWidth: 580,
  },
  soberCardHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  soberMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  soberMetricInfo: {
    flex: 1,
    paddingRight: 16,
  },
  soberMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  soberMetricSubtext: {
    fontSize: 12,
    color: '#8C9BAB',
    marginTop: 2,
  },
  soberMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  tableTopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  tableFilterContainer: {
    width: 180,
  },
  tableHeaderTitleWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableHeader: {
    marginBottom: 14,
  },
  tableTitle: {
    color: '#B6C2CF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tableSubTitle: {
    color: '#8C9BAB',
    fontSize: 11,
    marginTop: 2,
  },
  matrixContainer: {
    minWidth: 700,
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    overflow: 'hidden',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1D2125',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  matrixHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixHourHeaderCell: {
    flex: 0.8,
    minWidth: 90,
    backgroundColor: '#22272B',
  },
  matrixHeaderTxt: {
    color: '#B6C2CF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  matrixBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  matrixBodyCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixHourCell: {
    flex: 0.8,
    minWidth: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 33, 37, 0.5)',
  },
  matrixHourTxt: {
    color: '#8C9BAB',
    fontSize: 11,
    fontWeight: 'bold',
  },
  matrixCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    minWidth: 28,
    alignItems: 'center',
  },
  matrixCountBadgeActive: {
    backgroundColor: '#7C3AED',
  },
  matrixCountTxt: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matrixCountTxtActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  matrixTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#1D2125',
    borderTopWidth: 2,
    borderTopColor: '#7C3AED',
  },
  matrixTotalTxt: {
    color: '#8C9BAB',
    fontSize: 13,
    fontWeight: '900',
  },
  resultadosGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1D2125',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
    marginTop: 10,
  },
  resultadoItemCard: {
    width: '50%',
    minWidth: 240,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  resultadoItemCardActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  resultadoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 6,
  },
  resultadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultadoItemLabel: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  resultadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    minWidth: 32,
    alignItems: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#16A34A',
  },
  badgeDanger: {
    backgroundColor: '#DC2626',
  },
  resultadoBadgeTxt: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  togglePieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D2125',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  togglePieButtonTxt: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartSectionWrapper: {
    backgroundColor: '#1D2125',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C333A',
    padding: 14,
    marginBottom: 16,
  },
  sectionSubtitleHeader: {
    color: '#B6C2CF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pieContainerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  pieChartCenterWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterTotalNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  pieCenterTotalTxt: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pieLegendContainer: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  pieLegendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pieLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 6,
  },
  pieLegendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  pieLegendLabelTxt: {
    color: '#B6C2CF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  pieLegendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pieLegendCountTxt: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pieLegendPctTxt: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#2C333A',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  diffBadgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  diffBadgeDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  diffBadgeTxt: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
