import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { MapPin, Package, Search } from 'lucide-react-native';
import { ZonaVentasStat, PlanVentasStat } from './types';
import { COLORES_VENTAS } from './ventasConstants';

interface DesgloseZonasPlanesVentasProps {
  porZona: ZonaVentasStat[];
  porPlan: PlanVentasStat[];
  isDesktop: boolean;
}

export function DesgloseZonasPlanesVentas({
  porZona,
  porPlan,
  isDesktop,
}: DesgloseZonasPlanesVentasProps) {
  const [busquedaZona, setBusquedaZona] = useState('');
  const [busquedaPlan, setBusquedaPlan] = useState('');

  const zonasFiltradas = porZona.filter((z) =>
    z.zonaNombre.toLowerCase().includes(busquedaZona.toLowerCase().trim())
  );

  const planesFiltrados = porPlan.filter((p) =>
    p.planNombre.toLowerCase().includes(busquedaPlan.toLowerCase().trim())
  );

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* SECCIÓN 1: VENTAS POR ZONAS */}
      <View style={[styles.section, isDesktop && styles.sectionBorderRight]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <MapPin size={16} color="#A0B2C6" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Ventas por Zonas</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{porZona.length} Zonas</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Distribución geográfica por sector o cuadrante
        </Text>

        {/* Buscador de Zonas */}
        <View style={styles.searchBox}>
          <Search size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar zona o sector..."
            placeholderTextColor="#8C9BAB"
            value={busquedaZona}
            onChangeText={setBusquedaZona}
          />
        </View>

        {zonasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron registros de zonas</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {zonasFiltradas.slice(0, 8).map((item, idx) => (
              <View key={item.zonaNombre} style={styles.rowItem}>
                <View style={styles.rowHeader}>
                  <View style={styles.labelGroup}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <Text style={styles.itemLabel} numberOfLines={1}>
                      {item.zonaNombre}
                    </Text>
                  </View>
                  <View style={styles.valueGroup}>
                    <Text style={styles.itemCount}>{item.totalVentas}</Text>
                    <Text style={styles.itemPercent}>({item.porcentaje.toFixed(1)}%)</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(item.porcentaje, 100)}%`,
                        backgroundColor: '#5C7C99',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* SECCIÓN 2: VENTAS POR PLANES */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Package size={16} color="#A0B2C6" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Ventas por Planes</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{porPlan.length} Planes</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Planes y paquetes más contratados por los clientes
        </Text>

        {/* Buscador de Planes */}
        <View style={styles.searchBox}>
          <Search size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar plan contratado..."
            placeholderTextColor="#8C9BAB"
            value={busquedaPlan}
            onChangeText={setBusquedaPlan}
          />
        </View>

        {planesFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron planes registrados</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {planesFiltrados.slice(0, 8).map((item) => (
              <View key={item.planNombre} style={styles.rowItem}>
                <View style={styles.rowHeader}>
                  <View style={styles.labelGroup}>
                    <View style={styles.tipoPill}>
                      <Text style={styles.tipoPillText}>{item.tipoServicio}</Text>
                    </View>
                    <Text style={styles.itemLabel} numberOfLines={1}>
                      {item.planNombre}
                    </Text>
                  </View>
                  <View style={styles.valueGroup}>
                    <Text style={styles.itemCount}>{item.totalVentas}</Text>
                    <Text style={styles.itemPercent}>({item.porcentaje.toFixed(1)}%)</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(item.porcentaje, 100)}%`,
                        backgroundColor:
                          item.tipoServicio === 'Hogar'
                            ? COLORES_VENTAS.hogar
                            : COLORES_VENTAS.pymes,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  containerDesktop: {
    flexDirection: 'row',
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#384148',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#B6C2CF',
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  rowItem: {
    marginBottom: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: '#1D2125',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  rankText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A0B2C6',
  },
  tipoPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    marginRight: 8,
  },
  tipoPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
    flex: 1,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemPercent: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#1D2125',
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 0,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});
