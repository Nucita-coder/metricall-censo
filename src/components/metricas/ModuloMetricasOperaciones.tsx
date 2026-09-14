import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, ChevronUp, Search, Wrench, Users, ClipboardList } from 'lucide-react-native';
import { useMetricasOperaciones } from '../../hooks/useMetricasOperaciones';

interface ModuloMetricasOperacionesProps {
  empresaId: string;
  subTab: 'vendedores' | 'censos' | 'tecnicos';
  filtroPeriodo: 'todo' | 'hoy' | '7dias' | 'mes';
}

export function ModuloMetricasOperaciones({
  empresaId,
  subTab,
  filtroPeriodo,
}: ModuloMetricasOperacionesProps) {
  const { isLoading, statsVendedores, statsCensadores, statsTecnicos } =
    useMetricasOperaciones(empresaId, filtroPeriodo);

  const [busqueda, setBusqueda] = useState('');
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B6C2CF" />
        <Text style={styles.loadingText}>Cargando métricas de operaciones...</Text>
      </View>
    );
  }

  const busquedaNorm = busqueda.toLowerCase().trim();

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchBox}>
        <Search size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          placeholderTextColor="#8C9BAB"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* SUBTAB: VENDEDORES */}
      {subTab === 'vendedores' && (
        <View>
          <Text style={styles.sectionTitle}>Rendimiento de Ventas por Asesor</Text>
          {statsVendedores
            .filter((v) => v.vendedorNombre.toLowerCase().includes(busquedaNorm))
            .map((v, idx) => {
              const isExpanded = expandidoId === v.vendedorNombre;
              return (
                <View key={v.vendedorNombre} style={styles.card}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setExpandidoId(isExpanded ? null : v.vendedorNombre)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeaderMain}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{v.vendedorNombre}</Text>
                        <Text style={styles.cardSub}>
                          Conversión: {v.tasaConversion}% • Total: {v.totalTarjetas}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statPillsRow}>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillValue}>{v.totalVentas}</Text>
                        <Text style={styles.statPillLabel}>Ventas</Text>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillValue}>{v.totalCensos}</Text>
                        <Text style={styles.statPillLabel}>Censos</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={18} color="#8C9BAB" />
                      ) : (
                        <ChevronDown size={18} color="#8C9BAB" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.cardBody}>
                      <Text style={styles.bodyText}>
                        Total tarjetas gestionadas: {v.totalTarjetas} (LCH: {v.totalLch})
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}

      {/* SUBTAB: CENSOS */}
      {subTab === 'censos' && (
        <View>
          <Text style={styles.sectionTitle}>Personas Censadas por Censador</Text>
          {statsCensadores
            .filter((c) => c.censadorNombre.toLowerCase().includes(busquedaNorm))
            .map((c, idx) => (
              <View key={c.censadorNombre} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderMain}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{c.censadorNombre}</Text>
                      <Text style={styles.cardSub}>Con LCH: {c.conLch}</Text>
                    </View>
                  </View>
                  <View style={styles.statPillsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillValue}>{c.totalCensados}</Text>
                      <Text style={styles.statPillLabel}>Censados</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillValue}>{c.conVenta}</Text>
                      <Text style={styles.statPillLabel}>Con Venta</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* SUBTAB: TÉCNICOS */}
      {subTab === 'tecnicos' && (
        <View>
          <Text style={styles.sectionTitle}>Instalaciones por Técnico</Text>
          {statsTecnicos
            .filter((t) => t.tecnicoNombre.toLowerCase().includes(busquedaNorm))
            .map((t, idx) => (
              <View key={t.tecnicoNombre} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderMain}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{t.tecnicoNombre}</Text>
                      <Text style={styles.cardSub}>
                        Eficiencia: {t.tasaEficiencia}% • Asignadas: {t.totalAsignadas}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statPillsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillValue}>{t.completadas}</Text>
                      <Text style={styles.statPillLabel}>Completas</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillValue}>{t.liberadas}</Text>
                      <Text style={styles.statPillLabel}>Liberadas</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillValue}>{t.enProceso}</Text>
                      <Text style={styles.statPillLabel}>En Proceso</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#B6C2CF',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#B6C2CF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardSub: {
    color: '#8C9BAB',
    fontSize: 12,
    marginTop: 2,
  },
  statPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statPill: {
    alignItems: 'center',
  },
  statPillValue: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  statPillLabel: {
    color: '#8C9BAB',
    fontSize: 10,
  },
  cardBody: {
    backgroundColor: '#1D2125',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  bodyText: {
    color: '#8C9BAB',
    fontSize: 12,
  },
});
