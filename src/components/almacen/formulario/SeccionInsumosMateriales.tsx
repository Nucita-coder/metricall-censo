import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { MaterialRowItem, StockInfo, StockItemDisponible } from './types';
import { FilaItemMaterial } from './FilaItemMaterial';

interface SeccionInsumosMaterialesProps {
  items: MaterialRowItem[];
  readOnly?: boolean;
  isDevolucionMode: boolean;
  isDevolucionCentralMode: boolean;
  isDevolucionAsignacionMode: boolean;
  isAsignadoMode: boolean;
  stockDisponibles: StockItemDisponible[];
  stockCustodiaMiembro: StockItemDisponible[];
  stockInfoMap: Record<number, StockInfo>;
  handleRemoveItem: (index: number) => void;
  handleAddItem: () => void;
  updateMultipleItemFields: (index: number, fields: Partial<MaterialRowItem>) => void;
  updateItemField: (index: number, field: keyof MaterialRowItem, val: unknown) => void;
  handleCodigoChangeForItem: (index: number, codigo: string) => void;
  onOpenModalPrecargados: (index: number) => void;
  setStockInfoMap: React.Dispatch<React.SetStateAction<Record<number, StockInfo>>>;
}

export const SeccionInsumosMateriales: React.FC<SeccionInsumosMaterialesProps> = ({
  items,
  readOnly = false,
  isDevolucionMode,
  isDevolucionCentralMode,
  isDevolucionAsignacionMode,
  isAsignadoMode,
  stockDisponibles,
  stockCustodiaMiembro,
  stockInfoMap,
  handleRemoveItem,
  handleAddItem,
  updateMultipleItemFields,
  updateItemField,
  handleCodigoChangeForItem,
  onOpenModalPrecargados,
  setStockInfoMap,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {isDevolucionCentralMode
          ? '2. MATERIALES A DEVOLVER A ALMACÉN CENTRAL'
          : isDevolucionAsignacionMode
            ? '2. MATERIALES EN TU PODER A DEVOLVER'
            : isAsignadoMode
              ? '2. MATERIALES A ASIGNAR (DESDE ALMACÉN)'
              : '2. MATERIALES RECIBIDOS'}{' '}
        ({items.length})
      </Text>

      {isDevolucionAsignacionMode &&
        !readOnly &&
        stockCustodiaMiembro.length === 0 && (
          <View style={styles.noStockAlert}>
            <Text style={styles.noStockTitle}>Sin Materiales en Tu Poder</Text>
            <Text style={styles.noStockDesc}>
              Actualmente no posees materiales en custodia para devolver.
            </Text>
          </View>
        )}

      {(isAsignadoMode || isDevolucionCentralMode) &&
        !readOnly &&
        stockDisponibles.length === 0 && (
          <View style={styles.noStockAlert}>
            <Text style={styles.noStockTitle}>Sin Stock Disponible en Almacén</Text>
            <Text style={styles.noStockDesc}>
              No hay materiales en el almacén local para procesar esta operación.
            </Text>
          </View>
        )}

      {items.map((item, idx) => (
        <FilaItemMaterial
          key={idx}
          idx={idx}
          item={item}
          itemsLength={items.length}
          readOnly={readOnly}
          isDevolucionMode={isDevolucionMode}
          isDevolucionCentralMode={isDevolucionCentralMode}
          isDevolucionAsignacionMode={isDevolucionAsignacionMode}
          isAsignadoMode={isAsignadoMode}
          stockDisponibles={stockDisponibles}
          stockCustodiaMiembro={stockCustodiaMiembro}
          info={stockInfoMap[idx]}
          handleRemoveItem={handleRemoveItem}
          updateMultipleItemFields={updateMultipleItemFields}
          updateItemField={updateItemField}
          handleCodigoChangeForItem={handleCodigoChangeForItem}
          onOpenModalPrecargados={onOpenModalPrecargados}
          setStockInfoMap={setStockInfoMap}
        />
      ))}

      {!readOnly && (
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
          <Plus size={16} color="#B6C2CF" />
          <Text style={styles.addItemBtnText}>Añadir otro material</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noStockAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noStockTitle: { fontSize: 13, fontWeight: 'bold', color: '#F87171' },
  noStockDesc: { fontSize: 12, color: '#D1D5DB', marginTop: 4 },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 8,
  },
  addItemBtnText: { color: '#B6C2CF', fontWeight: 'bold', fontSize: 13 },
});
