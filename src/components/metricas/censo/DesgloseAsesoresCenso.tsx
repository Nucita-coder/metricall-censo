import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Search, User, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AsesorCensoStat } from './types';
import { COLORES_CENSO } from './censoConstants';

interface DesgloseAsesoresCensoProps {
  porAsesor: AsesorCensoStat[];
}

export function DesgloseAsesoresCenso({ porAsesor }: DesgloseAsesoresCensoProps) {
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  const busquedaNorm = busqueda.toLowerCase().trim();
  const asesoresFiltrados = porAsesor.filter((a) =>
    a.asesorNombre.toLowerCase().includes(busquedaNorm)
  );

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Clientes Censados por Asesor</Text>
          <Text style={styles.cardSubtitle}>
            Rendimiento individual, prospección y gestión de cada asesor
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{porAsesor.length} Asesores</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchBox}>
        <Search size={16} color="#8C9BAB" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre de asesor..."
          placeholderTextColor="#8C9BAB"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {asesoresFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontraron asesores con actividad registrada.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {asesoresFiltrados.map((item, idx) => {
            const isExpanded = expandido === item.asesorNombre;
            const tasaInteres = item.totalCensados > 0
              ? ((item.interesados / item.totalCensados) * 100).toFixed(1)
              : '0.0';

            return (
              <View key={item.asesorNombre} style={styles.advisorCard}>
                <TouchableOpacity
                  style={styles.advisorHeader}
                  onPress={() => setExpandido(isExpanded ? null : item.asesorNombre)}
                  activeOpacity={0.7}
                >
                  <View style={styles.advisorLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisorName} numberOfLines={1}>
                        {item.asesorNombre}
                      </Text>
                      <Text style={styles.advisorSub}>
                        Efectividad: {tasaInteres}% Interés • {item.gestiones} Gestiones
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pillsRow}>
                    <View style={styles.pillStat}>
                      <Text style={styles.pillValue}>{item.totalCensados}</Text>
                      <Text style={styles.pillLabel}>Censados</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#8C9BAB" />
                    ) : (
                      <ChevronDown size={16} color="#8C9BAB" />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>Desglose de Prospección:</Text>
                    </View>

                    <View style={styles.metricsDetailGrid}>
                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>Interesadas</Text>
                        <Text style={[styles.detailBoxValue, { color: COLORES_CENSO.interesados }]}>
                          {item.interesados}
                        </Text>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>Indecisos</Text>
                        <Text style={[styles.detailBoxValue, { color: COLORES_CENSO.indecisos }]}>
                          {item.indecisos}
                        </Text>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>No Interesados</Text>
                        <Text style={[styles.detailBoxValue, { color: COLORES_CENSO.noInteresados }]}>
                          {item.noInteresados}
                        </Text>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>Gestión Realizada</Text>
                        <Text style={[styles.detailBoxValue, { color: COLORES_CENSO.gestiones }]}>
                          {item.gestiones}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
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
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
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
    borderRadius: 0,
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
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#B6C2CF',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  listContainer: {
    gap: 10,
  },
  advisorCard: {
    backgroundColor: '#22272B',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  advisorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: '#1D2125',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#384148',
  },
  rankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A0B2C6',
  },
  advisorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  advisorSub: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillStat: {
    alignItems: 'center',
    backgroundColor: '#1D2125',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
  },
  pillValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pillLabel: {
    fontSize: 9,
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: '#384148',
    padding: 12,
    backgroundColor: '#1D2125',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  metricsDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBox: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#22272B',
    padding: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#384148',
    alignItems: 'center',
  },
  detailBoxLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    marginBottom: 2,
  },
  detailBoxValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
