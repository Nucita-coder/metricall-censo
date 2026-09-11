import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextStyle,
  Modal,
} from 'react-native';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Check,
} from 'lucide-react-native';
import { ActiveInventarioTab } from './types';

const TAB_LABELS: Record<ActiveInventarioTab, string> = {
  disponible: 'Stock Disponible',
  asignado: 'Stock Asignado',
  historial: 'Historial Cargas',
  general: 'Stock General',
};

const VISTA_OPTIONS: { key: ActiveInventarioTab; label: string }[] = [
  { key: 'disponible', label: 'Stock Disponible' },
  { key: 'asignado', label: 'Stock Asignado' },
  { key: 'historial', label: 'Historial Cargas' },
  { key: 'general', label: 'Stock General' },
];

interface ModalInventarioHeaderProps {
  onRefresh?: () => void;
  onClose: () => void;
  activeTab: ActiveInventarioTab;
  onSelectTab: (tab: ActiveInventarioTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filtrosExpanded: boolean;
  onToggleFiltros: () => void;
  hasActiveFilters: boolean;
}

export const ModalInventarioHeader: React.FC<ModalInventarioHeaderProps> = ({
  onClose,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  filtrosExpanded,
  onToggleFiltros,
  hasActiveFilters,
}) => {
  const [vistaMenuVisible, setVistaMenuVisible] = useState(false);

  return (
    <View>
      {/* HEADER SUPERIOR */}
      <View style={styles.hdr}>
        <View>
          <Text style={styles.hdrTitle}>Inventario y Control de Stock</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <X size={20} color="#B6C2CF" />
        </TouchableOpacity>
      </View>

      {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={14} color="#8C9BAB" />
          <TextInput
            style={styles.searchInput as TextStyle}
            placeholder="Buscar código, material, modelo..."
            placeholderTextColor="#8C9BAB"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <X size={14} color="#8C9BAB" />
            </TouchableOpacity>
          )}
        </View>

        {/* SELECTOR DE VISTA */}
        <TouchableOpacity
          style={styles.filterToggleBtn}
          onPress={() => setVistaMenuVisible(true)}
        >
          <Layers size={14} color="#8C9BAB" />
          <Text style={styles.filterToggleTxt}>
            {TAB_LABELS[activeTab] || 'Stock Disponible'}
          </Text>
          <ChevronDown size={14} color="#8C9BAB" />
        </TouchableOpacity>

        {/* TOGGLE FILTROS */}
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            (filtrosExpanded || hasActiveFilters) && styles.filterToggleBtnActive,
          ]}
          onPress={onToggleFiltros}
        >
          <SlidersHorizontal size={14} color={filtrosExpanded ? '#B6C2CF' : '#8C9BAB'} />
          <Text
            style={[
              styles.filterToggleTxt,
              filtrosExpanded && { color: '#B6C2CF', fontWeight: 'bold' },
            ]}
          >
            Filtros {hasActiveFilters ? '(Activos)' : ''}
          </Text>
          <ChevronDown
            size={14}
            color={filtrosExpanded ? '#B6C2CF' : '#8C9BAB'}
            style={{ transform: [{ rotate: filtrosExpanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* MODAL SELECTOR DE VISTA */}
      <Modal
        visible={vistaMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVistaMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setVistaMenuVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vista de Inventario</Text>
              <TouchableOpacity
                onPress={() => setVistaMenuVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#B6C2CF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {VISTA_OPTIONS.map((opt) => {
                const isSelected = activeTab === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      onSelectTab(opt.key);
                      setVistaMenuVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected && styles.modalOptionTxtSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <Check size={16} color="#B6C2CF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  hdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#2C333A',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  hdrTitle: { fontSize: 17, fontWeight: '700', color: '#B6C2CF', letterSpacing: -0.3 },
  iconBtn: { padding: 4, borderRadius: 6 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#22272B',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 10,
    height: 34,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#B6C2CF',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D2125',
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    height: 34,
  },
  filterToggleBtnActive: {
    borderColor: '#384148',
    backgroundColor: '#2C333A',
  },
  filterToggleTxt: { fontSize: 12, color: '#8C9BAB', fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#2C333A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#384148',
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B6C2CF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 4,
  },
  modalList: {
    paddingVertical: 6,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  modalOptionSelected: {
    backgroundColor: '#22272B',
  },
  modalOptionTxt: {
    fontSize: 13,
    color: '#B6C2CF',
  },
  modalOptionTxtSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
