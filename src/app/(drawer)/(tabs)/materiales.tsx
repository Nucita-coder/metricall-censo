import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Package, History, RotateCcw } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { useMaterialesData } from '../../../hooks/useMaterialesData';
import {
  ActiveMaterialTab,
  CustodiaItem,
  MovimientoItem,
} from '../../../components/almacen/materiales/types';
import { styles } from '../../../components/almacen/materiales/materialesScreenStyles';
import { TabCustodiaActiva } from '../../../components/almacen/materiales/TabCustodiaActiva';
import { TabMaterialesDevueltos } from '../../../components/almacen/materiales/TabMaterialesDevueltos';
import { TabHistorialMovimientos } from '../../../components/almacen/materiales/TabHistorialMovimientos';

export type { CustodiaItem, MovimientoItem };

export default function MaterialesScreen() {
  const { empresaId, nombreCompleto, userRol, isDeveloper, etiquetas = [] } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const isLiderEtiqueta = (etiquetas || []).some(
    (e) => e.toLowerCase() === 'líder' || e.toLowerCase() === 'lider'
  );
  const canSeeAdmin =
    isDeveloper ||
    isLiderEtiqueta ||
    ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(
      rolLower
    );

  if (!canSeeAdmin) {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [activeTab, setActiveTab] = useState<ActiveMaterialTab>('custodia');

  const {
    isLoading,
    refreshing,
    onRefresh,
    custodiaList,
    devueltosList,
    movimientosList,
    handleDevolverMaterial,
  } = useMaterialesData(empresaId, nombreCompleto);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.innerContainer,
          isDesktop && { maxWidth: 1024, alignSelf: 'center', width: '100%' },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIcon}>
              <Package size={24} color="#B6C2CF" />
            </View>
            <View>
              <Text style={styles.title}>Mis Materiales Asignados</Text>
              <Text style={styles.subtitle}>Gestión y control de inventario personal en custodia</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'custodia' && styles.tabItemActive]}
            onPress={() => setActiveTab('custodia')}
          >
            <Package size={16} color={activeTab === 'custodia' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.tabText, activeTab === 'custodia' && styles.tabTextActive]}>
              En Custodia ({custodiaList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'devoluciones' && styles.tabItemActiveDev]}
            onPress={() => setActiveTab('devoluciones')}
          >
            <RotateCcw size={16} color={activeTab === 'devoluciones' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.tabText, activeTab === 'devoluciones' && styles.tabTextActiveDev]}>
              Devueltos ({devueltosList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'historial' && styles.tabItemActiveHis]}
            onPress={() => setActiveTab('historial')}
          >
            <History size={16} color={activeTab === 'historial' ? '#FFFFFF' : '#8C9BAB'} />
            <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActiveHis]}>
              Historial ({movimientosList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#8C9BAB" />
            <Text style={styles.loadingTxt}>Cargando materiales...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8C9BAB" />
            }
          >
            {activeTab === 'custodia' && (
              <TabCustodiaActiva
                custodiaList={custodiaList}
                onDevolverMaterial={handleDevolverMaterial}
              />
            )}
            {activeTab === 'devoluciones' && (
              <TabMaterialesDevueltos devueltosList={devueltosList} />
            )}
            {activeTab === 'historial' && (
              <TabHistorialMovimientos movimientosList={movimientosList} />
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
