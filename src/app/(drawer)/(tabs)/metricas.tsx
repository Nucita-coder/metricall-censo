import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Users,
  Lock,
  Wrench,
  ClipboardList,
  Package,
  Receipt,
  Globe,
} from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { ModuloCobranza } from '../../../components/metricas/ModuloCobranza';
import { ModuloAlmacen } from '../../../components/metricas/ModuloAlmacen';
import { ModuloGestionOnline } from '../../../components/metricas/ModuloGestionOnline';
import { ModuloMetricasOperaciones } from '../../../components/metricas/ModuloMetricasOperaciones';
import { styles } from './metricas.styles';

export type SubTabMetricas =
  | 'cobranza'
  | 'gestion_online'
  | 'vendedores'
  | 'censos'
  | 'tecnicos'
  | 'almacen';

export default function MetricasScreen() {
  const { userRol, empresaId, isDeveloper, etiquetas = [] } = useAuth();
  const router = useRouter();

  const [subTab, setSubTab] = useState<SubTabMetricas>('cobranza');
  const [refreshing, setRefreshing] = useState(false);
  const [filtroPeriodo] = useState<'todo' | 'hoy' | '7dias' | 'mes'>('mes');
  const [busquedaTexto] = useState('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Bloqueo para no-admins
  const rolLower = (userRol || '').toLowerCase();
  const isLiderEtiqueta = (etiquetas || []).some(
    (e) => e.toLowerCase() === 'líder' || e.toLowerCase() === 'lider'
  );
  const isAutorizado =
    isDeveloper ||
    isLiderEtiqueta ||
    ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(
      rolLower
    );

  if (!isAutorizado) {
    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedBox}>
          <Lock size={48} color="#E2A3A3" style={{ marginBottom: 16 }} />
          <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
          <Text style={styles.accessDeniedSubtitle}>
            Esta sección de Métricas es exclusiva para la cuenta de Administrador.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(drawer)/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>Volver a Operaciones</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 size={24} color="#A0B2C6" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerTitle}>Métricas de Administración</Text>
            <Text style={styles.headerSubtitle}>
              Cobranza, Ventas, Gestión Online y Operaciones
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A0B2C6"
          />
        }
      >
        {/* SELECTOR DE SUBTAB */}
        <View style={styles.subTabRow}>
          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'cobranza' && styles.subTabButtonActive]}
            onPress={() => setSubTab('cobranza')}
            activeOpacity={0.7}
          >
            <Receipt size={16} color={subTab === 'cobranza' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'cobranza' && styles.subTabTextActive]}>
              Cobranza
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'gestion_online' && styles.subTabButtonActive]}
            onPress={() => setSubTab('gestion_online')}
            activeOpacity={0.7}
          >
            <Globe size={16} color={subTab === 'gestion_online' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'gestion_online' && styles.subTabTextActive]}>
              Gestión Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'vendedores' && styles.subTabButtonActive]}
            onPress={() => setSubTab('vendedores')}
            activeOpacity={0.7}
          >
            <Users size={16} color={subTab === 'vendedores' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'vendedores' && styles.subTabTextActive]}>
              Ventas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'censos' && styles.subTabButtonActive]}
            onPress={() => setSubTab('censos')}
            activeOpacity={0.7}
          >
            <ClipboardList size={16} color={subTab === 'censos' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'censos' && styles.subTabTextActive]}>
              Censos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'tecnicos' && styles.subTabButtonActive]}
            onPress={() => setSubTab('tecnicos')}
            activeOpacity={0.7}
          >
            <Wrench size={16} color={subTab === 'tecnicos' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.subTabText, subTab === 'tecnicos' && styles.subTabTextActive]}>
              Técnicos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, subTab === 'almacen' && styles.subTabButtonActive]}
            onPress={() => setSubTab('almacen')}
            activeOpacity={0.7}
          >
            <Package size={16} color={subTab === 'almacen' ? '#FFFFFF' : '#8C9BAB'} />
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

        {/* MODULOS ACTIVOS DE OPERACIONES (Ventas, Censos, Técnicos) */}
        {(subTab === 'vendedores' || subTab === 'censos' || subTab === 'tecnicos') && empresaId && (
          <ModuloMetricasOperaciones
            empresaId={empresaId}
            subTab={subTab}
            filtroPeriodo={filtroPeriodo}
          />
        )}
      </ScrollView>
    </View>
  );
}
