import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { User, ChevronUp, ChevronDown, Search, X, ChevronRight } from 'lucide-react-native';
import { TecnicoResumen } from './types';

interface SidebarTecnicosProps {
  isDesktop: boolean;
  menuTecnicosExpanded: boolean;
  onToggleMenuTecnicos: () => void;
  tecnicosList: TecnicoResumen[];
  tecnicosFiltrados: TecnicoResumen[];
  tecnicoSeleccionado: string | null;
  onSelectTecnico: (nombre: string) => void;
  searchTecnicoQuery: string;
  onSearchTecnicoChange: (q: string) => void;
  totalAsignaciones: number;
}

export const SidebarTecnicos: React.FC<SidebarTecnicosProps> = ({
  isDesktop,
  menuTecnicosExpanded,
  onToggleMenuTecnicos,
  tecnicosList,
  tecnicosFiltrados,
  tecnicoSeleccionado,
  onSelectTecnico,
  searchTecnicoQuery,
  onSearchTecnicoChange,
  totalAsignaciones,
}) => {
  return (
    <View style={[styles.sidebarTecnicos, !isDesktop && styles.sidebarTecnicosMobile]}>
      <TouchableOpacity
        style={styles.sidebarHeader}
        activeOpacity={0.7}
        onPress={onToggleMenuTecnicos}
      >
        <View style={styles.sidebarHeaderLeft}>
          <User size={15} color="#F3F4F6" />
          <Text style={styles.sidebarTitle}>TÉCNICOS Y CUSTODIOS ({tecnicosList.length})</Text>
        </View>
        {!isDesktop && (
          <View style={styles.toggleIcon}>
            {menuTecnicosExpanded ? (
              <ChevronUp size={16} color="#8C9BAB" />
            ) : (
              <ChevronDown size={16} color="#8C9BAB" />
            )}
          </View>
        )}
      </TouchableOpacity>

      {(isDesktop || menuTecnicosExpanded) && (
        <View style={styles.sidebarBody}>
          {/* BUSCADOR DE TÉCNICO */}
          <View style={styles.searchTecnicoBox}>
            <Search size={14} color="#6B7280" />
            <TextInput
              style={styles.searchTecnicoInput}
              placeholder="Filtrar técnico..."
              placeholderTextColor="#6B7280"
              value={searchTecnicoQuery}
              onChangeText={onSearchTecnicoChange}
            />
            {searchTecnicoQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchTecnicoChange('')}>
                <X size={12} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* BOTÓN "TODOS LOS TÉCNICOS" */}
          <TouchableOpacity
            style={[
              styles.tecnicoMenuItem,
              tecnicoSeleccionado === 'TODOS' && styles.tecnicoMenuItemActive,
            ]}
            onPress={() => onSelectTecnico('TODOS')}
          >
            <Text
              style={[
                styles.tecnicoMenuName,
                tecnicoSeleccionado === 'TODOS' && styles.tecnicoMenuNameActive,
              ]}
            >
              TODOS LOS TÉCNICOS
            </Text>
            <Text style={styles.tecnicoMenuBadge}>{totalAsignaciones}</Text>
          </TouchableOpacity>

          {/* LISTA DE TÉCNICOS */}
          <ScrollView style={styles.tecnicosScrollList} nestedScrollEnabled>
            {tecnicosFiltrados.length === 0 ? (
              <Text style={styles.emptyTecnicosTxt}>Sin resultados de técnicos</Text>
            ) : (
              tecnicosFiltrados.map((tec) => {
                const isSelected = tecnicoSeleccionado === tec.nombre;
                return (
                  <TouchableOpacity
                    key={tec.nombre}
                    style={[
                      styles.tecnicoMenuItem,
                      isSelected && styles.tecnicoMenuItemActive,
                    ]}
                    onPress={() => onSelectTecnico(tec.nombre)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tecnicoMenuName,
                          isSelected && styles.tecnicoMenuNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {tec.nombre}
                      </Text>
                      <Text style={styles.tecnicoMenuSub}>
                        Custodia activa: {tec.totalUnidadesAsignadas} und.
                      </Text>
                    </View>
                    <View style={styles.tecnicoBadgeBox}>
                      <ChevronRight size={14} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarTecnicos: {
    width: 260,
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    overflow: 'hidden',
  },
  sidebarTecnicosMobile: {
    width: '100%',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191D21',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  toggleIcon: {
    padding: 2,
  },
  sidebarBody: {
    padding: 10,
    gap: 8,
  },
  searchTecnicoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#343A40',
    paddingHorizontal: 8,
    height: 34,
  },
  searchTecnicoInput: {
    flex: 1,
    fontSize: 11,
    color: '#F3F4F6',
    marginLeft: 6,
  },
  tecnicosScrollList: {
    maxHeight: 380,
  },
  emptyTecnicosTxt: {
    fontSize: 11,
    color: '#8C9BAB',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  tecnicoMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tecnicoMenuItemActive: {
    backgroundColor: '#2C333A',
    borderColor: '#5C6873',
  },
  tecnicoMenuName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  tecnicoMenuNameActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tecnicoMenuSub: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 2,
  },
  tecnicoBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tecnicoMenuBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
});
