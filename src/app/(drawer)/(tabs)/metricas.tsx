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

export default function MetricasScreen() {
  const { userRol, empresaId } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todo' | 'hoy' | '7dias' | 'mes'>('mes');
  const [busquedaVendedor, setBusquedaVendedor] = useState('');
  const [vendedorExpandido, setVendedorExpandido] = useState<string | null>(null);

  const [statsVendedores, setStatsVendedores] = useState<VendedorStats[]>([]);
  const [kpiTotalVentas, setKpiTotalVentas] = useState(0);
  const [kpiTotalCensos, setKpiTotalCensos] = useState(0);
  const [kpiVendedoresActivos, setKpiVendedoresActivos] = useState(0);
  const [kpiTopVendedor, setKpiTopVendedor] = useState<{ nombre: string; ventas: number } | null>(null);

  const cargarMetricas = useCallback(async (isBackground = false) => {
    if (!empresaId) return;
    try {
      if (!isBackground) setIsLoading(true);

      // 1. Cargar todas las sucursales de la empresa
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

      // 2. Cargar todos los tableros de estas sucursales
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

      // 3. Cargar listas de estos tableros
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

      // 5. Filtrar por periodo
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
        return true; // 'todo'
      });

      // 6. Agrupar estadisticas por vendedor
      const mapVendedores = new Map<string, VendedorStats>();

      let globalVentas = 0;
      let globalCensos = 0;

      tarjetasFiltradas.forEach(t => {
        const data = t.datos_valores || {};
        const vendedorRaw =
          data.vendedor ||
          data.asesorComercial ||
          data.supervisor ||
          'Sin Vendedor Asignado';

        const nombreVendedor = String(vendedorRaw).trim() || 'Sin Vendedor Asignado';

        // Determinar si es una venta concretada
        const gestiones = data.gestiones || [];
        const tieneVentaConcretada = gestiones.some((g: any) => g.resultado === 'Venta concretada');

        const listaNombre = listas?.find(l => l.id === t.lista_id)?.nombre || '';
        const cleanLista = listaNombre.toLowerCase();

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
      });

      const listaVendedores: VendedorStats[] = Array.from(mapVendedores.values()).map(v => {
        const totalBase = v.totalCensos > 0 ? v.totalCensos : v.totalTarjetas;
        const conversion = totalBase > 0 ? Math.round((v.totalVentas / totalBase) * 100) : 0;
        return {
          ...v,
          tasaConversion: conversion,
        };
      });

      // Ordenar por total de ventas descendente
      listaVendedores.sort((a, b) => b.totalVentas - a.totalVentas || b.totalCensos - a.totalCensos);

      setStatsVendedores(listaVendedores);
      setKpiTotalVentas(globalVentas);
      setKpiTotalCensos(globalCensos);
      setKpiVendedoresActivos(listaVendedores.filter(v => v.vendedorNombre !== 'Sin Vendedor Asignado').length);

      if (listaVendedores.length > 0 && listaVendedores[0].totalVentas > 0) {
        setKpiTopVendedor({
          nombre: listaVendedores[0].vendedorNombre,
          ventas: listaVendedores[0].totalVentas,
        });
      } else {
        setKpiTopVendedor(null);
      }
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
            Esta sección de Métricas y Rendimiento Comercial es exclusiva para la cuenta de Administrador.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(drawer)/(tabs)')}>
            <Text style={styles.backBtnText}>Volver a Operaciones</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Filtrado local por buscador
  const vendedoresFiltrados = statsVendedores.filter(v =>
    v.vendedorNombre.toLowerCase().includes(busquedaVendedor.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BarChart3 size={24} color="#0C66E4" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>Métricas de Ventas por Vendedor</Text>
            <Text style={styles.headerSubtitle}>Control ejecutivo de desempeño comercial y censos</Text>
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

        {/* CARDS KPIS PRINCIPALES */}
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
              <Text style={styles.kpiLabel}>Vendedor Lider (Top 1)</Text>
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

        {/* BUSCADOR DE VENDEDOR */}
        <View style={styles.searchBox}>
          <Search size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o correo de vendedor..."
            placeholderTextColor="#8C9BAB"
            value={busquedaVendedor}
            onChangeText={setBusquedaVendedor}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0C66E4" />
            <Text style={styles.loadingText}>Calculando métricas de ventas...</Text>
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
              const isExpanded = vendedorExpandido === v.vendedorNombre;
              const maxVentas = statsVendedores[0]?.totalVentas || 1;
              const porcentajeBarra = Math.min(100, Math.round((v.totalVentas / maxVentas) * 100));

              return (
                <View key={v.vendedorNombre} style={styles.vendedorCard}>
                  <TouchableOpacity
                    style={styles.vendedorHeader}
                    onPress={() => setVendedorExpandido(isExpanded ? null : v.vendedorNombre)}
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

                  {/* VISTA EXPANDIDA CON DETALLES DE TARJETAS */}
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
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  filterChipText: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
