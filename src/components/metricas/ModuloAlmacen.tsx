import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useModuloAlmacenData } from '../../hooks/useModuloAlmacenData';
import { AlmacenSearchBar } from './almacen/AlmacenSearchBar';
import { SidebarTecnicos } from './almacen/SidebarTecnicos';
import { TablaHistorialTrazabilidad } from './almacen/TablaHistorialTrazabilidad';
import { TablaStockGeneralAlmacen } from './almacen/TablaStockGeneralAlmacen';
import { ModuloAlmacenProps } from './almacen/types';

export * from './almacen/types';

export function ModuloAlmacen({ empresaId }: ModuloAlmacenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const [menuTecnicosExpanded, setMenuTecnicosExpanded] = useState(true);

  const {
    isLoading,
    materialesList,
    asignacionesList,
    tecnicosList,
    tecnicoSeleccionado,
    setTecnicoSeleccionado,
    searchQuery,
    setSearchQuery,
    searchTecnicoQuery,
    setSearchTecnicoQuery,
    filtroTab,
    setFiltroTab,
    listaFiltrada,
    tecnicosFiltrados,
    asignacionesDelTecnico,
  } = useModuloAlmacenData(empresaId);

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#8C9BAB" />
        <Text style={styles.loadingTxt}>Cargando inventario y trazabilidad de tarjetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <AlmacenSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filtroTab={filtroTab}
        onFiltroTabChange={setFiltroTab}
        totalMateriales={materialesList.length}
        totalAlmacen={materialesList.filter((m) => m.unidadesAlmacen > 0).length}
        totalTecnicos={tecnicosList.length}
      />

      {/* VISTA DE ASIGNADOS O STOCK GENERAL */}
      {filtroTab === 'asignado' ? (
        <View style={[styles.asignadosLayoutRow, !isDesktop && styles.asignadosLayoutCol]}>
          <SidebarTecnicos
            isDesktop={isDesktop}
            menuTecnicosExpanded={menuTecnicosExpanded}
            onToggleMenuTecnicos={() => setMenuTecnicosExpanded(!menuTecnicosExpanded)}
            tecnicosList={tecnicosList}
            tecnicosFiltrados={tecnicosFiltrados}
            tecnicoSeleccionado={tecnicoSeleccionado}
            onSelectTecnico={setTecnicoSeleccionado}
            searchTecnicoQuery={searchTecnicoQuery}
            onSearchTecnicoChange={setSearchTecnicoQuery}
            totalAsignaciones={asignacionesList.length}
          />
          <TablaHistorialTrazabilidad
            isDesktop={isDesktop}
            tecnicoSeleccionado={tecnicoSeleccionado}
            asignacionesDelTecnico={asignacionesDelTecnico}
          />
        </View>
      ) : (
        <TablaStockGeneralAlmacen
          isDesktop={isDesktop}
          listaFiltrada={listaFiltrada}
        />
      )}

      <Text style={styles.footNote}>
        {filtroTab === 'asignado'
          ? '* Trazabilidad conectada en tiempo real entre tarjetas de instalación y el inventario del técnico.'
          : '* Vista de inventario desglosada con resumen de totales al pie de tabla.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 24,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingTxt: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
  },
  asignadosLayoutRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  asignadosLayoutCol: {
    flexDirection: 'column',
  },
  footNote: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});
