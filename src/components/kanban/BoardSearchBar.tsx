import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  TextStyle,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { SelectDropdown } from '../venta/CamposVenta';
import { CriterioBusqueda } from '../../hooks/useKanbanFiltros';

export interface BoardSearchBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  criterioBusqueda: CriterioBusqueda;
  setCriterioBusqueda: (val: CriterioBusqueda) => void;
  isMobileActive?: boolean;
  onCloseMobile?: () => void;
}

const OPCIONES_CRITERIO = ['Todos', 'Teléfono', 'Nombre', 'Cédula', 'N° Abonado'];

const CRITERIO_A_LABEL: Record<CriterioBusqueda, string> = {
  todos: 'Todos',
  telefono: 'Teléfono',
  nombre: 'Nombre',
  cedula: 'Cédula',
  abonado: 'N° Abonado',
};

const LABEL_A_CRITERIO: Record<string, CriterioBusqueda> = {
  'Todos': 'todos',
  'Teléfono': 'telefono',
  'Nombre': 'nombre',
  'Cédula': 'cedula',
  'N° Abonado': 'abonado',
};

const getPlaceholder = (criterio: CriterioBusqueda): string => {
  switch (criterio) {
    case 'telefono':
      return 'Buscar por teléfono...';
    case 'nombre':
      return 'Buscar por nombre...';
    case 'cedula':
      return 'Buscar por cédula...';
    case 'abonado':
      return 'Buscar por n° abonado...';
    default:
      return 'Buscar tarjeta...';
  }
};

export function BoardSearchBar({
  searchQuery,
  setSearchQuery,
  criterioBusqueda,
  setCriterioBusqueda,
  isMobileActive = false,
  onCloseMobile,
}: BoardSearchBarProps) {
  const handleSelectCriterio = (label: string) => {
    const nuevoCriterio = LABEL_A_CRITERIO[label] || 'todos';
    setCriterioBusqueda(nuevoCriterio);
  };

  if (isMobileActive) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileDropdownWrapper}>
          <SelectDropdown
            label=""
            hideLabel
            compact
            options={OPCIONES_CRITERIO}
            value={CRITERIO_A_LABEL[criterioBusqueda]}
            onSelect={handleSelectCriterio}
          />
        </View>
        <View style={styles.mobileInputBox}>
          <Search size={16} color="#8C9BAB" />
          <TextInput
            style={styles.mobileInput}
            placeholder={getPlaceholder(criterioBusqueda)}
            placeholderTextColor="#8C9BAB"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              if (onCloseMobile) onCloseMobile();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#8C9BAB" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopDropdownWrapper}>
        <SelectDropdown
          label=""
          hideLabel
          compact
          options={OPCIONES_CRITERIO}
          value={CRITERIO_A_LABEL[criterioBusqueda]}
          onSelect={handleSelectCriterio}
        />
      </View>
      <View style={styles.desktopInputBox}>
        <Search size={15} color="#8C9BAB" />
        <TextInput
          style={styles.desktopInput}
          placeholder={getPlaceholder(criterioBusqueda)}
          placeholderTextColor="#8C9BAB"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color="#8C9BAB" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  desktopDropdownWrapper: {
    width: 110,
  },
  desktopInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 34,
  },
  desktopInput: {
    color: '#B6C2CF',
    paddingVertical: 0,
    paddingHorizontal: 8,
    minWidth: 190,
    height: '100%',
    outlineStyle: 'none',
    fontSize: 13,
  } as unknown as TextStyle,
  mobileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  mobileDropdownWrapper: {
    width: 105,
  },
  mobileInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
  },
  mobileInput: {
    flex: 1,
    color: '#B6C2CF',
    marginLeft: 6,
    outlineStyle: 'none',
    paddingVertical: 0,
    fontSize: 13,
  } as unknown as TextStyle,
});
