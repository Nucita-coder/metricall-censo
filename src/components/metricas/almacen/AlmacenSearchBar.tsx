import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { FiltroAlmacenTab } from './types';
import { SelectDropdown } from '../../venta/CamposVenta';

interface AlmacenSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filtroTab: FiltroAlmacenTab;
  onFiltroTabChange: (tab: FiltroAlmacenTab) => void;
  totalMateriales: number;
  totalAlmacen: number;
  totalTecnicos: number;
}

export const AlmacenSearchBar: React.FC<AlmacenSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filtroTab,
  onFiltroTabChange,
  totalMateriales,
  totalAlmacen,
  totalTecnicos,
}) => {
  const getTabFromLabel = (label: string): FiltroAlmacenTab => {
    if (label.startsWith('En Almacén')) return 'almacen';
    if (label.startsWith('Asignados')) return 'asignado';
    return 'todos';
  };

  const getLabelFromTab = (tab: FiltroAlmacenTab): string => {
    if (tab === 'almacen') return `En Almacén (${totalAlmacen})`;
    if (tab === 'asignado') return `Asignados (${totalTecnicos} técnicos)`;
    return `Todos (${totalMateriales})`;
  };

  const tabOptions = [
    `Todos (${totalMateriales})`,
    `En Almacén (${totalAlmacen})`,
    `Asignados (${totalTecnicos} técnicos)`,
  ];

  return (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchBox}>
        <Search size={16} color="#8C9BAB" />
        <TextInput
          style={styles.searchInput}
          placeholder={
            filtroTab === 'asignado'
              ? 'Buscar por técnico, material, código, orden o cliente...'
              : 'Buscar por código, material o modelo...'
          }
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <X size={16} color="#8C9BAB" />
          </TouchableOpacity>
        )}
      </View>

      <SelectDropdown
        label="Ubicación y Estado de Stock"
        value={getLabelFromTab(filtroTab)}
        onSelect={(label) => onFiltroTabChange(getTabFromLabel(label))}
        options={tabOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 13,
    marginLeft: 8,
  },
});
