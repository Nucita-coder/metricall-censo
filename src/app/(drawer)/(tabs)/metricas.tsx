import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Search,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Wrench,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Tarjeta } from '../../../types/kanban';

export interface VendedorStats {
  vendedorNombre: string;
  totalVentas: number;
  totalCensos: number;
  totalLch: number;
  totalTarjetas: number;
  tasaConversion: number;
  tarjetas: Tarjeta[];
}

export interface TecnicoStats {
  tecnicoNombre: string;
  totalAsignadas: number;
  completadas: number;
  liberadas: number;
  enProceso: number;
  tasaEficiencia: number;
  tarjetas: Tarjeta[];
}

export default function MetricasScreen() {
  const { userRol, empresaId } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  // Subtab activo: 'vendedores' o 'tecnicos'
  const [subTab, setSubTab] = useState<'vendedores' | 'tecnicos'>('vendedores');

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todo' | 'hoy' | '7dias' | 'mes'>('mes');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  // Estados Vendedores
  const [statsVendedores, setStatsVendedores] = useState<VendedorStats[]>([]);
  const [kpiTotalVentas, setKpiTotalVentas] = useState(0);
  const [kpiTotalCensos, setKpiTotalCensos] = useState(0);
  const [kpiVendedoresActivos, setKpiVendedoresActivos] = useState(0);
  const [kpiTopVendedor, setKpiTopVendedor] = useState<{ nombre: string; ventas: number } | null>(null);

  // Estados Técnicos
  const [statsTecnicos, setStatsTecnicos] = useState<TecnicoStats[]>([]);
  const [kpiInstalacionesTotal, setKpiInstalacionesTotal] = useState(0);
  const [kpiInstalacionesCompletadas, setKpiInstalacionesCompletadas] = useState(0);
  const [kpiInstalacionesLiberadas, setKpiInstalacionesLiberadas] = useState(0);
  const [kpiTopTecnico, setKpiTopTecnico] = useState<{ nombre: string; completadas: number } | null>(null);

  const cargarMetricas = useCallback(async (isBackground = false) => {
    if (!empresaId) return;
    try {
      if (!isBackground) setIsLoading(true);

      // 1. Cargar sucursales de la empresa
      const { data: sucursales, error: errorSuc } = await supabase
        .from('sucursales')
        .select('id')
        .eq('empresa_id', empresaId);

      if (errorSuc) throw errorSuc;
      const sucursalIds = (sucursales || []).map(s => s.id);
      if (sucursalIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Cargar tableros
      const { data: tableros, error: errorTab } = await supabase
        .from('tableros')
        .select('id')
        .in('sucursal_id', sucursalIds);

      if (errorTab) throw errorTab;
      const tableroIds = (tableros || []).map(t => t.id);
      if (tableroIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 3. Cargar listas
      const { data: listas, error: errorList } = await supabase
        .from('listas')
        .select('id, nombre, tablero_id')
        .in('tablero_id', tableroIds);

      if (errorList) throw errorList;
      const listaIds = (listas || []).map(l => l.id);
      if (listaIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 4. Cargar tarjetas
      const { data: tarjetasData, error: errorTar } = await supabase
        .from('tarjetas')
        .select('*')
        .in('lista_id', listaIds);

      if (errorTar) throw errorTar;
      const tarjetas = (tarjetasData || []) as Tarjeta[];

      // 5. Cargar usuarios/perfiles para mapear nombres de técnicos si están asignados por UUID
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, email')
        .eq('empresa_id', empresaId);

      const mapPerfiles = new Map<string, string>();
      (perfilesData || []).forEach(p => {
        if (p.id) mapPerfiles.set(p.id, p.nombre_completo || p.email);
      });

      // 6. Filtrar por periodo
      const ahora = new Date();
      const tarjetasFiltradas = tarjetas.filter(t => {
        if (!t.created_at) return true;
        const fechaTarjeta = new Date(t.created_at);

        if (filtroPeriodo === 'hoy') {
          return fechaTarjeta.toDateString() === ahora.toDateString();
        }
        if (filtroPeriodo === '7dias') {
          const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          return fechaTarjeta >= hace7;
        }
        if (filtroPeriodo === 'mes') {
          return (
            fechaTarjeta.getMonth() === ahora.getMonth() &&
            fechaTarjeta.getFullYear() === ahora.getFullYear()
          );
        }
        return true;
      });

      // ----------------------------------------------------
      // A. METRICAS DE VENDEDORES
      // ----------------------------------------------------
      const mapVendedores = new Map<string, VendedorStats>();
      let globalVentas = 0;
      let globalCensos = 0;

      // ----------------------------------------------------
      // B. METRICAS DE TÉCNICOS / INSTALACIONES
      // ----------------------------------------------------
      const mapTecnicos = new Map<string, TecnicoStats>();
      let globalInstalaciones = 0;
      let globalCompletadas = 0;
      let globalLiberadas = 0;

      tarjetasFiltradas.forEach(t => {
        const data = t.datos_valores || {};
        const listaNombre = listas?.find(l => l.id === t.lista_id)?.nombre || '';
        const cleanLista = listaNombre.toLowerCase();

        // --- VENDEDORES ---
        const vendedorRaw =
          data.vendedor ||
          data.asesorComercial ||
          data.supervisor ||
          'Sin Vendedor Asignado';
        const nombreVendedor = String(vendedorRaw).trim() || 'Sin Vendedor Asignado';

        const gestiones = data.gestiones || [];
        const tieneVentaConcretada = gestiones.some((g: any) => g.resultado === 'Venta concretada');

        const esVenta =
          tieneVentaConcretada ||
          data.controlCalidad === 'Aprobado' ||
          cleanLista.includes('activo') ||
          cleanLista.includes('instalar') ||
          cleanLista.includes('activar');

        const esCenso =
          data.origen === 'censo' ||
          data.fechaCenso ||
          cleanLista.includes('censo') ||
          cleanLista.includes('desea');

        const tieneLch = !!data.lch_numero || !!data.lch_imagen;

        if (esVenta) globalVentas++;
        if (esCenso) globalCensos++;

        if (!mapVendedores.has(nombreVendedor)) {
          mapVendedores.set(nombreVendedor, {
            vendedorNombre: nombreVendedor,
            totalVentas: 0,
            totalCensos: 0,
            totalLch: 0,
            totalTarjetas: 0,
            tasaConversion: 0,
            tarjetas: [],
          });
        }
        const vStat = mapVendedores.get(nombreVendedor)!;
        vStat.totalTarjetas++;
        if (esVenta) vStat.totalVentas++;
        if (esCenso) vStat.totalCensos++;
        if (tieneLch) vStat.totalLch++;
        vStat.tarjetas.push(t);

        // --- TÉCNICOS ---
        let tecnicoRaw =
          data.tecnicoAsignado ||
          data.tecnico ||
          (t.asignado_a ? mapPerfiles.get(t.asignado_a) : null);

        if (tecnicoRaw) {
          const nombreTecnico = String(tecnicoRaw).trim();
          if (nombreTecnico && nombreTecnico !== 'Sin Vendedor Asignado') {
            const esInstalacionCompletada =
              cleanLista.includes('activar') ||
              cleanLista.includes('activo') ||
              data.reporteInstalacion ||
              data.fechaInstalacion ||
              gestiones.some((g: any) => g.resultado === 'Instalado' || g.resultado === 'Completado');

            const esInstalacionLiberada =
              data.motivoLiberacion ||
              data.estadoInstalacion === 'Liberada' ||
              cleanLista.includes('liberad') ||
              cleanLista.includes('rechazad') ||
              cleanLista.includes('no factible') ||
              gestiones.some((g: any) =>
                g.resultado === 'Liberada' ||
                g.resultado === 'Rechazada' ||
                g.resultado === 'No factible'
              );

            globalInstalaciones++;
            if (esInstalacionCompletada) globalCompletadas++;
            if (esInstalacionLiberada) globalLiberadas++;

            if (!mapTecnicos.has(nombreTecnico)) {
              mapTecnicos.set(nombreTecnico, {
                tecnicoNombre: nombreTecnico,
                totalAsignadas: 0,
                completadas: 0,
                liberadas: 0,
                enProceso: 0,
                tasaEficiencia: 0,
                tarjetas: [],
              });
            }

            const tStat = mapTecnicos.get(nombreTecnico)!;
            tStat.totalAsignadas++;
            if (esInstalacionCompletada) {
              tStat.completadas++;
            } else if (esInstalacionLiberada) {
              tStat.liberadas++;
            } else {
              tStat.enProceso++;
            }
            tStat.tarjetas.push(t);
          }
        }
      });

      // Procesar lista Vendedores
      const listaVendedores: VendedorStats[] = Array.from(mapVendedores.values()).map(v => {
        const totalBase = v.totalCensos > 0 ? v.totalCensos : v.totalTarjetas;
        const conversion = totalBase > 0 ? Math.round((v.totalVentas / totalBase) * 100) : 0;
        return { ...v, tasaConversion: conversion };
      });
      listaVendedores.sort((a, b) => b.totalVentas - a.totalVentas || b.totalCensos - a.totalCensos);

      // Procesar lista Técnicos
      const listaTecnicos: TecnicoStats[] = Array.from(mapTecnicos.values()).map(t => {
        const eficiencia = t.totalAsignadas > 0 ? Math.round((t.completadas / t.totalAsignadas) * 100) : 0;
        return { ...t, tasaEficiencia: eficiencia };
      });
      listaTecnicos.sort((a, b) => b.completadas - a.completadas || a.liberadas - b.liberadas);

      // Guardar estados Vendedores
      setStatsVendedores(listaVendedores);
      setKpiTotalVentas(globalVentas);
      setKpiTotalCensos(globalCensos);
      setKpiVendedoresActivos(listaVendedores.filter(v => v.vendedorNombre !== 'Sin Vendedor Asignado').length);
      setKpiTopVendedor(
        listaVendedores.length > 0 && listaVendedores[0].totalVentas > 0
          ? { nombre: listaVendedores[0].vendedorNombre, ventas: listaVendedores[0].totalVentas }
          : null
      );

      // Guardar estados Técnicos
      setStatsTecnicos(listaTecnicos);
      setKpiInstalacionesTotal(globalInstalaciones);
      setKpiInstalacionesCompletadas(globalCompletadas);
      setKpiInstalacionesLiberadas(globalLiberadas);
      setKpiTopTecnico(
        listaTecnicos.length > 0 && listaTecnicos[0].completadas > 0
          ? { nombre: listaTecnicos[0].tecnicoNombre, completadas: listaTecnicos[0].completadas }
          : null
      );
    } catch (e: any) {
      console.error('[MetricasScreen] Error cargando métricas:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, filtroPeriodo]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarMetricas(true);
  };

  // Bloqueo estricto para no-admins
  const isAutorizado = ['admin', 'lider', 'administrador', 'supervisor'].includes((userRol || '').toLowerCase());
  if (!isAutorizado) {
    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedBox}>
          <Lock size={48} color="#E53E3E" style={{ marginBottom: 16 }} />
          <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
          <Text style={styles.accessDeniedSubtitle}>
            Esta sección de Métricas es exclusiva para la cuenta de Administrador.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(drawer)/(tabs)')}>
            <Text style={styles.backBtnText}>Volver a Operaciones</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Filtrado por buscador
  const vendedoresFiltrados = statsVendedores.filter(v =>
    v.vendedorNombre.toLowerCase().includes(busquedaTexto.toLowerCase())
  );

  const tecnicosFiltrados = statsTecnicos.filter(t =>
    t.tecnicoNombre.toLowerCase().includes(busquedaTexto.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BarChart3 size={24} color="#0C66E4" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>Métricas de Administración</Text>
            <Text style={styles.headerSubtitle}>Desempeño comercial de Vendedores e Instalaciones de Técnicos</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={() => cargarMetricas()}>
          <RefreshCw size={18} color="#B6C2CF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0C66E4" />}
      >
        {/* SELECTOR DE SUBTAB (Vendedores vs Técnicos) */}
        <View style={styles.subTabRow}>
          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'vendedores' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('vendedores');
              setExpandidoId(null);
            }}
          >
            <Users size={18} color={subTab === 'vendedores' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'vendedores' && styles.subTabTextActive]}>
              Vendedores y Ventas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'tecnicos' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('tecnicos');
              setExpandidoId(null);
            }}
          >
            <Wrench size={18} color={subTab === 'tecnicos' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'tecnicos' && styles.subTabTextActive]}>
              Técnicos e Instalaciones
            </Text>
          </TouchableOpacity>
        </View>

        {/* FILTROS DE TIEMPO */}
        <View style={styles.filterRow}>
          {(['mes', '7dias', 'hoy', 'todo'] as const).map(periodo => (
            <TouchableOpacity
              key={periodo}
              style={[styles.filterChip, filtroPeriodo === periodo && styles.filterChipActive]}
              onPress={() => setFiltroPeriodo(periodo)}
            >
              <Text style={[styles.filterChipText, filtroPeriodo === periodo && styles.filterChipTextActive]}>
                {periodo === 'mes' && 'Este Mes'}
                {periodo === '7dias' && 'Últimos 7 Días'}
                {periodo === 'hoy' && 'Hoy'}
                {periodo === 'todo' && 'Todo el Tiempo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ============================================================== */}
        {/* MODULO 1: VENDEDORES */}
        {/* ============================================================== */}
        {subTab === 'vendedores' && (
          <>
            {/* CARDS KPIS VENDEDORES */}
            <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
              <View style={[styles.kpiCard, { borderColor: '#0C66E4' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Total Ventas Concretadas</Text>
                  <CheckCircle2 size={20} color="#0C66E4" />
                </View>
                <Text style={[styles.kpiValue, { color: '#579DFF' }]}>{kpiTotalVentas}</Text>
                <Text style={styles.kpiSubtext}>Cierres confirmados en el periodo</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#25D366' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Vendedor Líder (Top 1)</Text>
                  <Award size={20} color="#25D366" />
                </View>
                <Text style={[styles.kpiValue, { color: '#25D366', fontSize: 20 }]} numberOfLines={1}>
                  {kpiTopVendedor ? kpiTopVendedor.nombre : 'N/A'}
                </Text>
                <Text style={styles.kpiSubtext}>
                  {kpiTopVendedor ? `${kpiTopVendedor.ventas} ventas concretadas` : 'Sin ventas registradas'}
                </Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#8A2BE2' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Total Censos Levantados</Text>
                  <TrendingUp size={20} color="#8A2BE2" />
                </View>
                <Text style={[styles.kpiValue, { color: '#B197FC' }]}>{kpiTotalCensos}</Text>
                <Text style={styles.kpiSubtext}>Registros de prospección en campo</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#DD6B20' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Vendedores Activos</Text>
                  <Users size={20} color="#DD6B20" />
                </View>
                <Text style={[styles.kpiValue, { color: '#F6AD55' }]}>{kpiVendedoresActivos}</Text>
                <Text style={styles.kpiSubtext}>Asesores generando actividad</Text>
              </View>
            </View>

            {/* BUSCADOR */}
            <View style={styles.searchBox}>
              <Search size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o correo de vendedor..."
                placeholderTextColor="#8C9BAB"
                value={busquedaTexto}
                onChangeText={setBusquedaTexto}
              />
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0C66E4" />
                <Text style={styles.loadingText}>Calculando métricas comerciales...</Text>
              </View>
            ) : vendedoresFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BarChart3 size={40} color="#8C9BAB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No hay datos de vendedores</Text>
                <Text style={styles.emptySubtitle}>No se encontraron registros de ventas para los filtros seleccionados.</Text>
              </View>
            ) : (
              <View style={styles.vendedoresSection}>
                <Text style={styles.sectionTitle}>Desglose Individual por Vendedor</Text>

                {vendedoresFiltrados.map((v, index) => {
                  const isExpanded = expandidoId === v.vendedorNombre;
                  const maxVentas = statsVendedores[0]?.totalVentas || 1;
                  const porcentajeBarra = Math.min(100, Math.round((v.totalVentas / maxVentas) * 100));

                  return (
                    <View key={v.vendedorNombre} style={styles.vendedorCard}>
                      <TouchableOpacity
                        style={styles.vendedorHeader}
                        onPress={() => setExpandidoId(isExpanded ? null : v.vendedorNombre)}
                      >
                        <View style={styles.vendedorInfoMain}>
                          <View style={styles.rankBadge}>
                            <Text style={styles.rankBadgeText}>#{index + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vendedorNombre}>{v.vendedorNombre}</Text>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressBar, { width: `${porcentajeBarra}%` }]} />
                            </View>
                          </View>
                        </View>

                        <View style={styles.vendedorStatsQuick}>
                          <View style={styles.statPill}>
                            <Text style={styles.statPillNum}>{v.totalVentas}</Text>
                            <Text style={styles.statPillLabel}>Ventas</Text>
                          </View>
                          <View style={styles.statPill}>
                            <Text style={styles.statPillNum}>{v.totalCensos}</Text>
                            <Text style={styles.statPillLabel}>Censos</Text>
                          </View>
                          <View style={styles.statPill}>
                            <Text style={styles.statPillNum}>{v.tasaConversion}%</Text>
                            <Text style={styles.statPillLabel}>Cierre</Text>
                          </View>

                          {isExpanded ? <ChevronUp size={20} color="#B6C2CF" /> : <ChevronDown size={20} color="#B6C2CF" />}
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.vendedorDetailBody}>
                          <View style={styles.detailSummaryRow}>
                            <Text style={styles.detailSummaryItem}>LCHs Procesados: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{v.totalLch}</Text></Text>
                            <Text style={styles.detailSummaryItem}>Total Tarjetas: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{v.totalTarjetas}</Text></Text>
                          </View>

                          <Text style={styles.tarjetasSubTitle}>Clientes y Casos Asignados:</Text>
                          {v.tarjetas.map(t => {
                            const data = t.datos_valores || {};
                            const clienteNombre = data.nombreApellido || data.nombres || 'Cliente Sin Nombre';
                            const servicio = data.tipoServicio || data.tipoProspecto || 'Servicio General';
                            const fecha = t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Sin fecha';

                            return (
                              <View key={t.id} style={styles.tarjetaItemRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.tarjetaClienteNombre}>{clienteNombre}</Text>
                                  <Text style={styles.tarjetaMeta}>{servicio} • {fecha}</Text>
                                </View>

                                <TouchableOpacity
                                  style={styles.verTarjetaBtn}
                                  onPress={() => router.push(`/(drawer)/(tabs)?tarjeta=${t.id}`)}
                                >
                                  <ExternalLink size={14} color="#579DFF" />
                                  <Text style={styles.verTarjetaBtnText}>Ver Caso</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* MODULO 2: TÉCNICOS E INSTALACIONES */}
        {/* ============================================================== */}
        {subTab === 'tecnicos' && (
          <>
            {/* CARDS KPIS TÉCNICOS */}
            <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
              <View style={[styles.kpiCard, { borderColor: '#0C66E4' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Total Instalaciones</Text>
                  <Wrench size={20} color="#0C66E4" />
                </View>
                <Text style={[styles.kpiValue, { color: '#579DFF' }]}>{kpiInstalacionesTotal}</Text>
                <Text style={styles.kpiSubtext}>Casos asignados a equipos técnicos</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#25D366' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Instalaciones Completadas</Text>
                  <CheckCircle2 size={20} color="#25D366" />
                </View>
                <Text style={[styles.kpiValue, { color: '#25D366' }]}>{kpiInstalacionesCompletadas}</Text>
                <Text style={styles.kpiSubtext}>Finalizadas y reportadas con éxito</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#E53E3E' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Liberadas / Devueltas</Text>
                  <XCircle size={20} color="#E53E3E" />
                </View>
                <Text style={[styles.kpiValue, { color: '#FF6B6B' }]}>{kpiInstalacionesLiberadas}</Text>
                <Text style={styles.kpiSubtext}>Casos liberados o no factibles</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: '#8A2BE2' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kpiLabel}>Técnico Más Eficiente</Text>
                  <UserCheck size={20} color="#8A2BE2" />
                </View>
                <Text style={[styles.kpiValue, { color: '#B197FC', fontSize: 20 }]} numberOfLines={1}>
                  {kpiTopTecnico ? kpiTopTecnico.nombre : 'N/A'}
                </Text>
                <Text style={styles.kpiSubtext}>
                  {kpiTopTecnico ? `${kpiTopTecnico.completadas} completadas` : 'Sin instalaciones reportadas'}
                </Text>
              </View>
            </View>

            {/* BUSCADOR TÉCNICOS */}
            <View style={styles.searchBox}>
              <Search size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre de técnico..."
                placeholderTextColor="#8C9BAB"
                value={busquedaTexto}
                onChangeText={setBusquedaTexto}
              />
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0C66E4" />
                <Text style={styles.loadingText}>Calculando rendimiento de instalaciones...</Text>
              </View>
            ) : tecnicosFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Wrench size={40} color="#8C9BAB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No hay datos de técnicos</Text>
                <Text style={styles.emptySubtitle}>No se encontraron instalaciones asignadas para los filtros seleccionados.</Text>
              </View>
            ) : (
              <View style={styles.vendedoresSection}>
                <Text style={styles.sectionTitle}>Desglose Individual por Técnico / Instalador</Text>

                {tecnicosFiltrados.map((t, index) => {
                  const isExpanded = expandidoId === t.tecnicoNombre;
                  const maxCompletadas = statsTecnicos[0]?.completadas || 1;
                  const porcentajeBarra = Math.min(100, Math.round((t.completadas / maxCompletadas) * 100));

                  return (
                    <View key={t.tecnicoNombre} style={styles.vendedorCard}>
                      <TouchableOpacity
                        style={styles.vendedorHeader}
                        onPress={() => setExpandidoId(isExpanded ? null : t.tecnicoNombre)}
                      >
                        <View style={styles.vendedorInfoMain}>
                          <View style={[styles.rankBadge, { borderColor: '#0C66E4' }]}>
                            <Text style={styles.rankBadgeText}>#{index + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vendedorNombre}>{t.tecnicoNombre}</Text>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressBar, { width: `${porcentajeBarra}%`, backgroundColor: '#25D366' }]} />
                            </View>
                          </View>
                        </View>

                        <View style={styles.vendedorStatsQuick}>
                          <View style={styles.statPill}>
                            <Text style={[styles.statPillNum, { color: '#25D366' }]}>{t.completadas}</Text>
                            <Text style={styles.statPillLabel}>Completas</Text>
                          </View>
                          <View style={styles.statPill}>
                            <Text style={[styles.statPillNum, { color: '#FF6B6B' }]}>{t.liberadas}</Text>
                            <Text style={styles.statPillLabel}>Liberadas</Text>
                          </View>
                          <View style={styles.statPill}>
                            <Text style={[styles.statPillNum, { color: '#579DFF' }]}>{t.enProceso}</Text>
                            <Text style={styles.statPillLabel}>En Proceso</Text>
                          </View>
                          <View style={styles.statPill}>
                            <Text style={styles.statPillNum}>{t.tasaEficiencia}%</Text>
                            <Text style={styles.statPillLabel}>Eficiencia</Text>
                          </View>

                          {isExpanded ? <ChevronUp size={20} color="#B6C2CF" /> : <ChevronDown size={20} color="#B6C2CF" />}
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.vendedorDetailBody}>
                          <View style={styles.detailSummaryRow}>
                            <Text style={styles.detailSummaryItem}>Total Asignadas: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t.totalAsignadas}</Text></Text>
                            <Text style={styles.detailSummaryItem}>Tasa de Éxito: <Text style={{ color: '#25D366', fontWeight: 'bold' }}>{t.tasaEficiencia}%</Text></Text>
                          </View>

                          <Text style={styles.tarjetasSubTitle}>Instalaciones y Casos Asignados:</Text>
                          {t.tarjetas.map(tar => {
                            const data = tar.datos_valores || {};
                            const clienteNombre = data.nombreApellido || data.nombres || 'Cliente Sin Nombre';
                            const servicio = data.tipoServicio || data.tipoProspecto || 'Instalación de Fibra';
                            const lch = data.lch_numero ? `LCH: ${data.lch_numero}` : 'Sin LCH';
                            const fecha = tar.created_at ? new Date(tar.created_at).toLocaleDateString() : 'Sin fecha';

                            const esCompletada = data.reporteInstalacion || data.fechaInstalacion;
                            const esLiberada = data.motivoLiberacion || data.estadoInstalacion === 'Liberada';

                            return (
                              <View key={tar.id} style={styles.tarjetaItemRow}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.tarjetaClienteNombre}>{clienteNombre}</Text>
                                    {esCompletada ? (
                                      <View style={{ backgroundColor: '#1C3B2B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ color: '#25D366', fontSize: 9, fontWeight: 'bold' }}>COMPLETADA</Text>
                                      </View>
                                    ) : esLiberada ? (
                                      <View style={{ backgroundColor: '#3B1C1C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ color: '#FF6B6B', fontSize: 9, fontWeight: 'bold' }}>LIBERADA</Text>
                                      </View>
                                    ) : (
                                      <View style={{ backgroundColor: '#1C2B3A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ color: '#579DFF', fontSize: 9, fontWeight: 'bold' }}>EN PROCESO</Text>
                                      </View>
                                    )}
                                  </View>

                                  <Text style={styles.tarjetaMeta}>{servicio} • {lch} • {fecha}</Text>
                                  {data.motivoLiberacion && (
                                    <Text style={{ color: '#FF6B6B', fontSize: 11, marginTop: 2, italic: true }}>
                                      Motivo liberación: {data.motivoLiberacion}
                                    </Text>
                                  )}
                                </View>

                                <TouchableOpacity
                                  style={styles.verTarjetaBtn}
                                  onPress={() => router.push(`/(drawer)/(tabs)?tarjeta=${tar.id}`)}
                                >
                                  <ExternalLink size={14} color="#579DFF" />
                                  <Text style={styles.verTarjetaBtnText}>Ver Caso</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#22272B',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B6C2CF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8C9BAB',
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 8,
    backgroundColor: '#2C333A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  scrollContent: {
    padding: 20,
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
  },
  subTabButtonActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  subTabText: {
    color: '#8C9BAB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
  },
  filterChipActive: {
    backgroundColor: '#1C2B3A',
    borderColor: '#0C66E4',
  },
  filterChipText: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#579DFF',
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
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 6,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#B6C2CF',
    fontSize: 14,
  },
  vendedoresSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 16,
  },
  vendedorCard: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 12,
    overflow: 'hidden',
  },
  vendedorHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendedorInfoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C333A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  rankBadgeText: {
    color: '#0C66E4',
    fontWeight: '900',
    fontSize: 12,
  },
  vendedorNombre: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1D2125',
    borderRadius: 3,
    overflow: 'hidden',
    width: '90%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0C66E4',
    borderRadius: 3,
  },
  vendedorStatsQuick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statPill: {
    alignItems: 'center',
  },
  statPillNum: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  statPillLabel: {
    color: '#8C9BAB',
    fontSize: 10,
  },
  vendedorDetailBody: {
    backgroundColor: '#1D2125',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  detailSummaryRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  detailSummaryItem: {
    color: '#8C9BAB',
    fontSize: 12,
  },
  tarjetasSubTitle: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  tarjetaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22272B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  tarjetaClienteNombre: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tarjetaMeta: {
    color: '#8C9BAB',
    fontSize: 11,
    marginTop: 2,
  },
  verTarjetaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C2B3A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0C66E4',
  },
  verTarjetaBtnText: {
    color: '#579DFF',
    fontSize: 11,
    fontWeight: 'bold',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#8C9BAB',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedBox: {
    backgroundColor: '#22272B',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#384148',
    maxWidth: 400,
  },
  accessDeniedTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  accessDeniedSubtitle: {
    color: '#8C9BAB',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
