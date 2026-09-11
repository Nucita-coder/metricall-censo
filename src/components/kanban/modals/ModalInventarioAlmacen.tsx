import React, { useState, useMemo } from 'react';
import { Modal, View, useWindowDimensions } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useModalInventarioData } from '../../../hooks/useModalInventarioData';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';
import {
  MaterialStockItem,
  ActiveInventarioTab,
  FiltroStock,
} from './inventario/types';
import { ModalInventarioHeader } from './inventario/ModalInventarioHeader';
import { ModalInventarioFiltros } from './inventario/ModalInventarioFiltros';
import { TablaStockDisponible } from './inventario/TablaStockDisponible';
import { modalInventarioStyles as s } from './inventario/modalInventarioStyles';
import { TablaStockAsignado } from './TablaStockAsignado';
import { TablaStockGeneral } from './TablaStockGeneral';
import { TablaHistorialCargas } from './TablaHistorialCargas';

export type { MaterialStockItem };

interface ModalInventarioAlmacenProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalInventarioAlmacen({ visible, onClose }: ModalInventarioAlmacenProps) {
  const { empresaId } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [activeTab, setActiveTab] = useState<ActiveInventarioTab>('disponible');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('all');
  const [filtroMaterial, setFiltroMaterial] = useState<string>('all');
  const [filtroModelo, setFiltroModelo] = useState<string>('all');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  const {
    materiales,
    isLoading,
    fetchStock,
    nombresMaterialesUnicos,
    modelosUnicos,
    maxStock,
  } = useModalInventarioData(visible, empresaId);

  const filtered = useMemo(() => {
    return materiales
      .filter((m) => {
        const q = searchQuery.toLowerCase();
        if (
          !m.codigoMaterial.toLowerCase().includes(q) &&
          !m.nombreMaterial.toLowerCase().includes(q) &&
          !m.modeloMaterial.toLowerCase().includes(q)
        )
          return false;
        if (filtroStock === 'ok') return m.stockTotal >= 10;
        if (filtroStock === 'low') return m.stockTotal > 0 && m.stockTotal < 10;
        if (filtroStock === 'zero') return m.stockTotal <= 0;
        if (filtroMaterial !== 'all' && m.nombreMaterial !== filtroMaterial) return false;
        if (filtroModelo !== 'all' && m.modeloMaterial !== filtroModelo) return false;
        return true;
      })
      .sort((a, b) => a.nombreMaterial.localeCompare(b.nombreMaterial));
  }, [materiales, searchQuery, filtroStock, filtroMaterial, filtroModelo]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.modal, WEB_MODAL_CONTAINER, isDesktop && { maxWidth: 960 }]}>
          <ModalInventarioHeader
            onRefresh={fetchStock}
            onClose={onClose}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filtrosExpanded={filtrosExpanded}
            onToggleFiltros={() => setFiltrosExpanded(!filtrosExpanded)}
            hasActiveFilters={
              filtroStock !== 'all' ||
              filtroMaterial !== 'all' ||
              filtroModelo !== 'all'
            }
          />

          {filtrosExpanded && (
            <ModalInventarioFiltros
              materialesLength={materiales.length}
              filtroStock={filtroStock}
              onSelectFiltroStock={setFiltroStock}
              filtroMaterial={filtroMaterial}
              onSelectFiltroMaterial={setFiltroMaterial}
              nombresMateriales={nombresMaterialesUnicos}
              filtroModelo={filtroModelo}
              onSelectFiltroModelo={setFiltroModelo}
              modelosUnicos={modelosUnicos}
            />
          )}

          {activeTab === 'asignado' ? (
            <TablaStockAsignado empresaId={empresaId} searchQuery={searchQuery} />
          ) : activeTab === 'historial' ? (
            <TablaHistorialCargas empresaId={empresaId} searchQuery={searchQuery} />
          ) : activeTab === 'general' ? (
            <TablaStockGeneral empresaId={empresaId} searchQuery={searchQuery} />
          ) : (
            <TablaStockDisponible
              filtered={filtered}
              isLoading={isLoading}
              maxStock={maxStock}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
