import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import { SectorCensoStat } from './types';
import { COLORES_CENSO } from './censoConstants';

interface DesgloseSectoresCensoProps {
  porSector: SectorCensoStat[];
}

export function DesgloseSectoresCenso({ porSector }: DesgloseSectoresCensoProps) {
  const [busqueda, setBusqueda] = useState('');
  const busquedaNorm = busqueda.toLowerCase().trim();

  const sectoresFiltrados = porSector.filter((s) =>
    s.sectorNombre.toLowerCase().includes(busquedaNorm)
  );

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Clientes Censados por Sector</Text>
          <Text style={styles.cardSubtitle}>
            Distribución geográfica de las viviendas y comercios censados
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{porSector.length} Sectores</Text>
        </View>
      </View>

      {/* Buscador de sectores si hay más de 4 */}
      {porSector.length > 4 && (
        <View style={styles.searchBox}>
          <Search size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar sector o zona..."
            placeholderTextColor="#8C9BAB"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
      )}

      {sectoresFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay sectores registrados en este período.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {sectoresFiltrados.map((item, idx) => {
            const colorBar =
              COLORES_CENSO.paletaSectores[idx % COLORES_CENSO.paletaSectores.length];

            return (
              <View key={item.sectorNombre} style={styles.sectorRow}>
                <View style={styles.sectorTopRow}>
                  <View style={styles.sectorNameContainer}>
                    <MapPin size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                    <Text style={styles.sectorName} numberOfLines={1}>
                      {item.sectorNombre}
                    </Text>
                  </View>
                  <View style={styles.sectorMetrics}>
                    <Text style={styles.sectorCount}>{item.totalCensados}</Text>
                    <Text style={styles.sectorPct}>({item.porcentaje.toFixed(1)}%)</Text>
                  </View>
                </View>

                {/* Barra de progreso sutil */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.max(2, item.porcentaje))}%`,
                        backgroundColor: colorBar,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 20,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
  },
  totalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
  },
  totalBadgeText: {
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
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 34,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#B6C2CF',
    fontSize: 12,
    paddingVertical: 0,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  listContainer: {
    gap: 12,
  },
  sectorRow: {
    gap: 4,
  },
  sectorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sectorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  sectorMetrics: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sectorCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectorPct: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1D2125',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
