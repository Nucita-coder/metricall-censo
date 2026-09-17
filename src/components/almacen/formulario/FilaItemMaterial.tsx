import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { InputTexto, SelectDropdown } from '../../venta/CamposVenta';
import { MaterialRowItem, StockInfo, StockItemDisponible, INSUMOS_PRECARGADOS } from './types';

interface FilaItemMaterialProps {
  idx: number;
  item: MaterialRowItem;
  itemsLength: number;
  readOnly?: boolean;
  isDevolucionMode: boolean;
  isDevolucionCentralMode: boolean;
  isDevolucionAsignacionMode: boolean;
  isAsignadoMode: boolean;
  stockDisponibles: StockItemDisponible[];
  stockCustodiaMiembro: StockItemDisponible[];
  info?: StockInfo;
  handleRemoveItem: (index: number) => void;
  updateMultipleItemFields: (index: number, fields: Partial<MaterialRowItem>) => void;
  updateItemField: (index: number, field: keyof MaterialRowItem, val: unknown) => void;
  handleCodigoChangeForItem: (index: number, codigo: string) => void;
  onOpenModalPrecargados: (index: number) => void;
  setStockInfoMap: React.Dispatch<React.SetStateAction<Record<number, StockInfo>>>;
}

export const FilaItemMaterial: React.FC<FilaItemMaterialProps> = ({
  idx,
  item,
  itemsLength,
  readOnly = false,
  isDevolucionMode,
  isDevolucionCentralMode,
  isDevolucionAsignacionMode,
  isAsignadoMode,
  stockDisponibles,
  stockCustodiaMiembro,
  info,
  handleRemoveItem,
  updateMultipleItemFields,
  updateItemField,
  handleCodigoChangeForItem,
  onOpenModalPrecargados,
  setStockInfoMap,
}) => {
  const isCustodiaMode = !readOnly && isDevolucionAsignacionMode;
  const isAlmacenStockMode = !readOnly && (isAsignadoMode || isDevolucionCentralMode);

  const handleSelectFromList = (sel: string, list: StockItemDisponible[]) => {
    const found = list.find((s) => sel.startsWith(s.codigo));
    if (found) {
      updateMultipleItemFields(idx, {
        codigoMaterial: found.codigo,
        nombreMaterial: found.nombre,
        modeloMaterial: found.modelo,
      });
      setStockInfoMap((prev) => ({
        ...prev,
        [idx]: {
          stockExistente: found.stock,
          esNuevoCodigo: false,
          isSearching: false,
        },
      }));
    }
  };

  return (
    <View style={styles.itemBox}>
      <View style={styles.itemBoxHeader}>
        <Text style={styles.itemBoxTitle}>ÍTEM #{idx + 1}</Text>
        {!readOnly && itemsLength > 1 && (
          <TouchableOpacity
            onPress={() => handleRemoveItem(idx)}
            style={styles.removeBtn}
          >
            <Trash2 size={16} color="#F87171" />
            <Text style={styles.removeBtnText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MODO DEVOLUCIÓN DE ASIGNACIÓN (MATERIAL EN CUSTODIA) */}
      {isCustodiaMode && (
        <SelectDropdown
          label="Seleccionar Material en tu Poder"
          value={
            item.codigoMaterial
              ? `${item.codigoMaterial} - ${item.nombreMaterial}`
              : ''
          }
          onSelect={(sel: string) => handleSelectFromList(sel, stockCustodiaMiembro)}
          options={stockCustodiaMiembro.map(
            (s) => `${s.codigo} - ${s.nombre} (${s.stock} und. en custodia)`
          )}
          placeholder={
            stockCustodiaMiembro.length > 0
              ? 'Seleccionar material en tu poder...'
              : 'No posees materiales en custodia'
          }
          isRequired
          disabled={stockCustodiaMiembro.length === 0}
        />
      )}

      {/* MODO ASIGNADO O DEVOLUCIÓN A ALMACÉN CENTRAL */}
      {isAlmacenStockMode && (
        <SelectDropdown
          label={
            isDevolucionCentralMode
              ? 'Seleccionar Material de Almacén a Devolver'
              : 'Seleccionar Material de Almacén'
          }
          value={
            item.codigoMaterial
              ? `${item.codigoMaterial} - ${item.nombreMaterial}`
              : ''
          }
          onSelect={(sel: string) => handleSelectFromList(sel, stockDisponibles)}
          options={stockDisponibles.map(
            (s) => `${s.codigo} - ${s.nombre} (Stock: ${s.stock} und.)`
          )}
          placeholder={
            stockDisponibles.length > 0
              ? 'Buscar / Seleccionar material...'
              : 'No hay stock disponible en almacén'
          }
          isRequired
          disabled={stockDisponibles.length === 0}
        />
      )}

      {/* CÓDIGO Y MODELO PARA MODOS BASADOS EN SELECCIÓN DE STOCK */}
      {(isCustodiaMode || isAlmacenStockMode) && Boolean(item.codigoMaterial) && (
        <View style={styles.row}>
          <View style={styles.flex1}>
            <InputTexto
              label="Código Material"
              value={item.codigoMaterial}
              isRequired
              readOnly
            />
          </View>
          <View style={styles.flex1}>
            <InputTexto
              label="Modelo Material"
              value={item.modeloMaterial}
              onChangeText={(v) => updateItemField(idx, 'modeloMaterial', v)}
              placeholder="Ej. G657A2"
              readOnly={readOnly}
            />
          </View>
        </View>
      )}

      {/* MODO NORMAL (RECIBO DE MATERIAL) O SOLO LECTURA */}
      {(readOnly || (!isDevolucionMode && !isAsignadoMode)) && (
        <>
          <SelectDropdown
            label="Nombre de Material (Catálogo Oficial)"
            value={item.nombreMaterial}
            onSelect={(selectedNombre: string) => {
              const found = INSUMOS_PRECARGADOS.find(
                (i) => i.nombre.toUpperCase() === selectedNombre.toUpperCase()
              );
              if (found) {
                updateMultipleItemFields(idx, {
                  nombreMaterial: found.nombre,
                  codigoMaterial: found.codigo,
                  modeloMaterial: found.modelo,
                });
                handleCodigoChangeForItem(idx, found.codigo);
              } else {
                updateItemField(idx, 'nombreMaterial', selectedNombre.toUpperCase());
              }
            }}
            options={INSUMOS_PRECARGADOS.map((i) => i.nombre)}
            placeholder="Seleccionar material del catálogo oficial..."
            isRequired
            disabled={readOnly}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <InputTexto
                label="Código Material"
                value={item.codigoMaterial}
                onChangeText={(v) => handleCodigoChangeForItem(idx, v)}
                placeholder="Ej. MAT-0982"
                isRequired
                readOnly={readOnly}
              />
            </View>
            <View style={styles.flex1}>
              <InputTexto
                label="Modelo Material"
                value={item.modeloMaterial}
                onChangeText={(v) => updateItemField(idx, 'modeloMaterial', v)}
                placeholder="Ej. G657A2"
                readOnly={readOnly}
              />
            </View>
          </View>
        </>
      )}

      {info?.isSearching && (
        <Text style={styles.helperText}>Buscando stock e información...</Text>
      )}

      {!info?.isSearching &&
        info?.stockExistente !== null &&
        info?.stockExistente !== undefined && (
          <View style={styles.stockBadgeExistente}>
            <Text style={styles.stockBadgeText}>
              {isDevolucionCentralMode
                ? 'Stock disponible en almacén local: '
                : isDevolucionAsignacionMode
                  ? 'En tu poder / custodia: '
                  : isAsignadoMode
                    ? 'Stock disponible en almacén: '
                    : 'Stock actual en almacén: '}
              <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                {info.stockExistente} und.
              </Text>
            </Text>
          </View>
        )}

      {!info?.isSearching &&
        info?.esNuevoCodigo === true &&
        !isAsignadoMode &&
        !isDevolucionMode && (
          <View style={styles.stockBadgeNuevo}>
            <Text style={styles.stockBadgeTextNuevo}>
              Código nuevo. Se registrará este nuevo material.
            </Text>
          </View>
        )}

      <View style={styles.row}>
        <View style={styles.flex1}>
          <InputTexto
            label={
              isDevolucionMode
                ? 'Cantidad a Devolver'
                : isAsignadoMode
                  ? 'Cantidad a Asignar'
                  : 'Cantidad Recibida'
            }
            value={item.cantidadRecibida ? String(item.cantidadRecibida) : ''}
            onChangeText={(v) => updateItemField(idx, 'cantidadRecibida', v)}
            placeholder="Ej. 50"
            keyboardType="numeric"
            isRequired
            readOnly={readOnly}
          />
          {(isAsignadoMode || isDevolucionMode) &&
            info?.stockExistente !== null &&
            info?.stockExistente !== undefined &&
            parseFloat(String(item.cantidadRecibida || '0')) > info.stockExistente && (
              <Text style={styles.excedeErrorText}>
                {`Excede las ${info.stockExistente} und. ${
                  isDevolucionCentralMode
                    ? 'disponibles en almacén local'
                    : isDevolucionAsignacionMode
                      ? 'en tu poder'
                      : 'disponibles en almacén'
                }`}
              </Text>
            )}
        </View>
        <View style={styles.flex1}>
          <InputTexto
            label="Serial Material (Opcional)"
            value={item.serialMaterial}
            onChangeText={(v) => updateItemField(idx, 'serialMaterial', v)}
            placeholder="Ej. SN-8839201"
            readOnly={readOnly}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemBox: {
    backgroundColor: '#1D2125',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#384148',
  },
  itemBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  itemBoxTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeBtnText: { fontSize: 12, color: '#F87171', fontWeight: 'bold' },
  helperText: { color: '#8C9BAB', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  stockBadgeExistente: {
    backgroundColor: '#2C333A',
    borderLeftWidth: 3,
    borderLeftColor: '#384148',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  stockBadgeText: { fontSize: 11, color: '#B6C2CF' },
  stockBadgeNuevo: {
    backgroundColor: '#2C333A',
    borderLeftWidth: 3,
    borderLeftColor: '#384148',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  stockBadgeTextNuevo: { fontSize: 11, color: '#B6C2CF', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  excedeErrorText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 3,
    lineHeight: 13,
  },
});
