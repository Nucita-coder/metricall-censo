import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { AsesorVentasStat } from './types';
import { ItemAsesorVentas } from './ItemAsesorVentas';

interface DesgloseAsesoresVentasProps {
  porAsesor: AsesorVentasStat[];
}

export function DesgloseAsesoresVentas({ porAsesor }: DesgloseAsesoresVentasProps) {
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
          <Text style={styles.cardTitle}>Cantidad de Ventas por Asesor</Text>
          <Text style={styles.cardSubtitle}>
            Rendimiento individual, efectividad técnica de factibilidad e instalaciones
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
          <Text style={styles.emptyText}>No se encontraron asesores registrados</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {asesoresFiltrados.map((item, idx) => (
            <ItemAsesorVentas
              key={item.asesorNombre}
              item={item}
              idx={idx}
              isExpanded={expandido === item.asesorNombre}
              onToggleExpand={() =>
                setExpandido(expandido === item.asesorNombre ? null : item.asesorNombre)
              }
            />
          ))}
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
});
