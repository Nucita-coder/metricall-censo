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
  FileCheck2,
  MapPin,
  ClipboardList,
  UserCheck,
  Package,
  Receipt,
  CreditCard,
  Globe,
} from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Tarjeta, GestionItem } from '../../../types/kanban';
import { ModuloCobranza } from '../../../components/metricas/ModuloCobranza';
import { ModuloAlmacen } from '../../../components/metricas/ModuloAlmacen';
import { ModuloGestionOnline } from '../../../components/metricas/ModuloGestionOnline';

export interface VendedorStats {
  vendedorNombre: string;
  totalVentas: number;
  totalCensos: number;
  totalLch: number;
  totalTarjetas: number;
  tasaConversion: number;
  tarjetas: Tarjeta[];
}

export interface CensadorStats {
  censadorNombre: string;
  totalCensados: number;
  conLch: number;
  conVenta: number;
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
  const { userRol, empresaId, isDeveloper } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  // Subtab activo: 'cobranza' | 'gestion_online' | 'vendedores' | 'censos' | 'tecnicos' | 'almacen'
  const [subTab, setSubTab] = useState<'cobranza' | 'gestion_online' | 'vendedores' | 'censos' | 'tecnicos' | 'almacen'>('cobranza');

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

  // Estados Personas Censadas
  const [statsCensadores, setStatsCensadores] = useState<CensadorStats[]>([]);
  const [kpiTotalPersonasCensadas, setKpiTotalPersonasCensadas] = useState(0);
  const [kpiTopCensador, setKpiTopCensador] = useState<{ nombre: string; total: number } | null>(null);
  const [kpiPersonasConLch, setKpiPersonasConLch] = useState(0);
  const [kpiTasaConversionCenso, setKpiTasaConversionCenso] = useState(0);

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

      // A. METRICAS DE VENDEDORES
      const mapVendedores = new Map<string, VendedorStats>();
      let globalVentas = 0;
      let globalCensos = 0;

      // B. METRICAS DE PERSONAS CENSADAS
      const mapCensadores = new Map<string, CensadorStats>();
      let globalPersonasCensadas = 0;
      let globalPersonasConLch = 0;
      let globalPersonasConVenta = 0;

      // C. METRICAS DE TÉCNICOS / INSTALACIONES
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

        const gestiones = (data.gestiones || []) as GestionItem[];
        const tieneVentaConcretada = gestiones.some((g: GestionItem) => g.resultado === 'Venta concretada');

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

        // --- PERSONAS CENSADAS ---
        // Se considera persona censada si la tarjeta tiene origen censo, fecha censo o esta en etapa de censo/prospección
        const esPersonaCensada = esCenso || data.nombreApellido || data.cedula || data.direccion;
        if (esPersonaCensada) {
          const censadorRaw = data.vendedor || data.asesorComercial || data.censador || 'Sin Censador Asignado';
          const nombreCensador = String(censadorRaw).trim() || 'Sin Censador Asignado';

          globalPersonasCensadas++;
          if (tieneLch) globalPersonasConLch++;
          if (esVenta) globalPersonasConVenta++;

          if (!mapCensadores.has(nombreCensador)) {
            mapCensadores.set(nombreCensador, {
              censadorNombre: nombreCensador,
              totalCensados: 0,
              conLch: 0,
              conVenta: 0,
              tarjetas: [],
            });
          }

          const cStat = mapCensadores.get(nombreCensador)!;
          cStat.totalCensados++;
          if (tieneLch) cStat.conLch++;
          if (esVenta) cStat.conVenta++;
          cStat.tarjetas.push(t);
        }

        // --- TÉCNICOS ---
        let tecnicoRaw =
          data.tecnicoAsignado ||
          data.tecnico ||
          (t.asignado_a ? mapPerfiles.get(t.asignado_a as string) : null);

        if (tecnicoRaw) {
          const nombreTecnico = String(tecnicoRaw).trim();
          if (nombreTecnico && nombreTecnico !== 'Sin Vendedor Asignado') {
            const esInstalacionCompletada =
              cleanLista.includes('activar') ||
              cleanLista.includes('activo') ||
              data.reporteInstalacion ||
              data.fechaInstalacion ||
              gestiones.some((g: GestionItem) => g.resultado === 'Instalado' || g.resultado === 'Completado');

            const esInstalacionLiberada =
              data.motivoLiberacion ||
              data.estadoInstalacion === 'Liberada' ||
              cleanLista.includes('liberad') ||
              cleanLista.includes('rechazad') ||
              cleanLista.includes('no factible') ||
              gestiones.some((g: GestionItem) =>
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

      // Procesar lista Censadores
      const listaCensadores: CensadorStats[] = Array.from(mapCensadores.values());
      listaCensadores.sort((a, b) => b.totalCensados - a.totalCensados);

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

      // Guardar estados Personas Censadas
      setStatsCensadores(listaCensadores);
      setKpiTotalPersonasCensadas(globalPersonasCensadas);
      setKpiPersonasConLch(globalPersonasConLch);
      const conversionCenso = globalPersonasCensadas > 0 ? Math.round((globalPersonasConVenta / globalPersonasCensadas) * 100) : 0;
      setKpiTasaConversionCenso(conversionCenso);
      setKpiTopCensador(
        listaCensadores.length > 0 && listaCensadores[0].totalCensados > 0
          ? { nombre: listaCensadores[0].censadorNombre, total: listaCensadores[0].totalCensados }
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
    } catch (e: unknown) {
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
  const rolLower = (userRol || '').toLowerCase();
  const isAutorizado = isDeveloper || ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(rolLower);
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

  const censadoresFiltrados = statsCensadores.filter(c =>
    c.censadorNombre.toLowerCase().includes(busquedaTexto.toLowerCase())
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
            <Text style={styles.headerSubtitle}>Vendedores, Personas Censadas e Instalaciones de Técnicos</Text>
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
        {/* SELECTOR DE SUBTAB (Módulos activos de la plataforma) */}
        <View style={styles.subTabRow}>
          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'vendedores' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('vendedores');
              setExpandidoId(null);
            }}
          >
            <Users size={16} color={subTab === 'vendedores' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'vendedores' && styles.subTabTextActive]}>
              Ventas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'censos' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('censos');
              setExpandidoId(null);
            }}
          >
            <ClipboardList size={16} color={subTab === 'censos' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'censos' && styles.subTabTextActive]}>
              Personas Censadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'tecnicos' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('tecnicos');
              setExpandidoId(null);
            }}
          >
            <Wrench size={16} color={subTab === 'tecnicos' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'tecnicos' && styles.subTabTextActive]}>
              Técnicos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'cobranza' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('cobranza');
              setExpandidoId(null);
            }}
          >
            <Receipt size={16} color={subTab === 'cobranza' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'cobranza' && styles.subTabTextActive]}>
              Cobranza y Recupero
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'gestion_online' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('gestion_online');
              setExpandidoId(null);
            }}
          >
            <Globe size={16} color={subTab === 'gestion_online' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'gestion_online' && styles.subTabTextActive]}>
              Gestión Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'almacen' && styles.subTabButtonActive]}
            onPress={() => {
              setSubTab('almacen');
              setExpandidoId(null);
            }}
          >
            <Package size={16} color={subTab === 'almacen' ? '#FFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'almacen' && styles.subTabTextActive]}>
              Almacén
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODULO ACTIVO: COBRANZA Y RECUPERO */}
        {subTab === 'cobranza' && empresaId && (
          <ModuloCobranza
            empresaId={empresaId}
            filtroPeriodo={filtroPeriodo}
            busquedaTexto={busquedaTexto}
          />
        )}

        {/* MODULO ACTIVO: GESTIÓN ONLINE */}
        {subTab === 'gestion_online' && empresaId && (
          <ModuloGestionOnline
            empresaId={empresaId}
            filtroPeriodo={filtroPeriodo}
            busquedaTexto={busquedaTexto}
          />
        )}

        {/* MODULO ACTIVO: ALMACÉN */}
        {subTab === 'almacen' && empresaId && (
          <ModuloAlmacen empresaId={empresaId} />
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subTabButton: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    fontSize: 13,
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
  almacenPlaceholderCard: {
    backgroundColor: '#22272B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  almacenPlaceholderTitle: {
    color: '#B6C2CF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  almacenPlaceholderSub: {
    color: '#8C9BAB',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
  },
});
