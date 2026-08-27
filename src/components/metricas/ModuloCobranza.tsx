import {
  BarChart3,
  Calendar,
  Clock,
  Layers,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

  const [periodoLocal, setPeriodoLocal] = useState<'todo' | 'hoy' | '7dias' | 'mes' | 'personalizado'>(filtroPeriodo || 'todo');
  const [periodoMatriz, setPeriodoMatriz] = useState<string>('Hoy');
  const [filtroTipoContacto, setFiltroTipoContacto] = useState<string>('Todos los Contactos');
  const [fechaMatriz, setFechaMatriz] = useState<string>(getTodayString());
  const [rawTarjetasCobranza, setRawTarjetasCobranza] = useState<Tarjeta[]>([]);
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
  }, [empresaId, periodoLocal, fechaInicio, fechaFin]);

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
        if (periodoMatriz === 'Hoy') {
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
  }, [rawTarjetasCobranza, periodoMatriz, fechaMatriz, filtroTipoContacto]);

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
        if (periodoMatriz === 'Hoy') {
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
  }, [rawTarjetasCobranza, periodoMatriz, fechaMatriz]);

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
      {/* CONTENEDOR SOBRIO DE MÉTRICAS EJECUTIVAS */}
      <View style={styles.soberSummaryCard}>
        <Text style={styles.soberCardHeaderTitle}>Resumen Ejecutivo de Cobranza</Text>

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
            <View style={{ width: 175 }}>
              <SelectDropdown
                label="Línea de Tiempo"
                value={periodoMatriz === 'Almanaque' ? `Almanaque (${fechaMatriz})` : periodoMatriz}
                options={OPCIONES_PERIODO_MATRIZ}
                onSelect={(selected) => setPeriodoMatriz(selected)}
                placeholder="Período..."
              />
            </View>
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
            <Text style={styles.tableTitle}>Desglose por Hora y Tipo de Contacto</Text>
          </View>
        </View>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={22} color="#60A5FA" />
            <View>
              <Text style={styles.tableTitle}>Desglose por Resultado de Gestión</Text>
            </View>
          </View>
        </View>

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
});
