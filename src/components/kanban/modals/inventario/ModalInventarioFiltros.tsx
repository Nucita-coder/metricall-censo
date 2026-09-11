import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FiltroStock } from './types';
import { SelectDropdown } from '../../../../components/venta/CamposVenta';

interface ModalInventarioFiltrosProps {
  materialesLength: number;
  filtroStock: FiltroStock;
  onSelectFiltroStock: (filtro: FiltroStock) => void;
  filtroMaterial: string;
  onSelectFiltroMaterial: (material: string) => void;
  nombresMateriales: string[];
  filtroModelo: string;
  onSelectFiltroModelo: (modelo: string) => void;
  modelosUnicos: string[];
}

const STOCK_LABEL_TO_KEY: Record<string, FiltroStock> = {
  Todos: 'all',
  '>= 10': 'ok',
  '< 10': 'low',
  '= 0': 'zero',
};

const STOCK_KEY_TO_LABEL: Record<FiltroStock, string> = {
  all: 'Todos',
  ok: '>= 10',
  low: '< 10',
  zero: '= 0',
};

export const ModalInventarioFiltros: React.FC<ModalInventarioFiltrosProps> = ({
  materialesLength: _materialesLength,
  filtroStock,
  onSelectFiltroStock,
  filtroMaterial,
  onSelectFiltroMaterial,
  nombresMateriales,
  filtroModelo,
  onSelectFiltroModelo,
  modelosUnicos,
}) => {
  return (
    <View style={styles.collapsiblePanel}>
      <View style={styles.dropdownsRow}>
        <View style={styles.dropdownCol}>
          <SelectDropdown
            compact={true}
            label="Cantidad"
            value={STOCK_KEY_TO_LABEL[filtroStock] || 'Todos'}
            onSelect={(label) => onSelectFiltroStock(STOCK_LABEL_TO_KEY[label] || 'all')}
            options={['Todos', '>= 10', '< 10', '= 0']}
          />
        </View>

        <View style={styles.dropdownCol}>
          <SelectDropdown
            compact={true}
            label="Material"
            value={filtroMaterial === 'all' ? 'Todos' : filtroMaterial}
            onSelect={(mat) => onSelectFiltroMaterial(mat === 'Todos' ? 'all' : mat)}
            options={['Todos', ...nombresMateriales]}
          />
        </View>

        {modelosUnicos.length > 0 && (
          <View style={styles.dropdownCol}>
            <SelectDropdown
              compact={true}
              label="Modelo"
              value={filtroModelo === 'all' ? 'Todos' : filtroModelo}
              onSelect={(mod) => onSelectFiltroModelo(mod === 'Todos' ? 'all' : mod)}
              options={['Todos', ...modelosUnicos]}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  collapsiblePanel: {
    backgroundColor: '#1D2125',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  dropdownsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dropdownCol: {
    flex: 1,
    minWidth: 180,
  },
});

