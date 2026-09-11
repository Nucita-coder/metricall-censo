import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  TextStyle,
} from 'react-native';
import { X, Package, Search, ChevronRight } from 'lucide-react-native';
import { MaterialStockItem, FilaDesgloseMaterial } from './types';
import { VistaHistorialFila } from './VistaHistorialFila';

interface ModalDetalleCargaMaterialProps {
  visible: boolean;
  onClose: () => void;
  material: MaterialStockItem | null;
}

export const ModalDetalleCargaMaterial: React.FC<ModalDetalleCargaMaterialProps> = ({
  visible,
  onClose,
  material,
}) => {
  if (!material) return null;

  const filasDesglose = useMemo<FilaDesgloseMaterial[]>(() => {
    if (!material) return [];

    const agrupado: Record<string, FilaDesgloseMaterial> = {};
    const cargas = material.cargas || [];

    if (cargas.length > 0) {
      cargas.forEach((c) => {
        const cod = (c.codigoMaterial || material.codigoMaterial || '—').trim().toUpperCase();
        const mod = (c.modeloMaterial || material.modeloMaterial || 'GENERAL').trim().toUpperCase();
        const key = `${cod}___${mod}`;

        const cant = parseFloat(String(c.cantidad || '0')) || 0;
        const tipo = (c.tipoCarga || '').toUpperCase().trim();

        let delta = cant;
        const isDevCentral = tipo.includes('DEVOLUCIÓN A ALMACÉN CENTRAL') || tipo.includes('DEVOLUCION A ALMACEN CENTRAL');
        const isDevAsig = !isDevCentral && (tipo.includes('DEVOLUCIÓN') || tipo.includes('DEVOLUCION'));
        if (tipo === 'MATERIAL ASIGNADO' || isDevCentral) {
          delta = -cant;
        } else if (isDevAsig) {
          delta = cant;
        }

        if (!agrupado[key]) {
          agrupado[key] = {
            codigo: cod,
            modelo: mod,
            cantidad: 0,
          };
        }
        agrupado[key].cantidad += delta;
      });
    }

    const lista = Object.values(agrupado);

    if (lista.length === 0) {
      return [
        {
          codigo: (material.codigoMaterial || '—').toUpperCase(),
          modelo: (material.modeloMaterial || 'GENERAL').toUpperCase(),
          cantidad: material.stockTotal || 0,
        },
      ];
    }

    return lista.sort(
      (a, b) => a.modelo.localeCompare(b.modelo) || a.codigo.localeCompare(b.codigo)
    );
  }, [material]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFila, setSelectedFila] = useState<FilaDesgloseMaterial | null>(null);

  const filasFiltradas = useMemo(() => {
    if (!searchQuery.trim()) return filasDesglose;
    const q = searchQuery.toLowerCase().trim();
    return filasDesglose.filter(
      (f) => f.codigo.toLowerCase().includes(q) || f.modelo.toLowerCase().includes(q)
    );
  }, [filasDesglose, searchQuery]);

  const totalCantidad = useMemo(() => {
    return filasFiltradas.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [filasFiltradas]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (selectedFila) setSelectedFila(null);
        else onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {selectedFila ? (
            <VistaHistorialFila
              fila={selectedFila}
              nombreMaterial={material.nombreMaterial}
              cargas={material.cargas || []}
              onBack={() => setSelectedFila(null)}
              onClose={() => {
                setSelectedFila(null);
                onClose();
              }}
            />
          ) : (
            <>
              {/* ENCABEZADO: NOMBRE DEL MATERIAL, BUSCADOR Y BOTÓN CERRAR */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {material.nombreMaterial}
                  </Text>
                  <View style={styles.searchBox}>
                    <Search size={13} color="#8C9BAB" />
                    <TextInput
                      style={styles.searchInput as TextStyle}
                      placeholder="Buscar código o modelo..."
                      placeholderTextColor="#8C9BAB"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={13} color="#8C9BAB" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color="#B6C2CF" />
                </TouchableOpacity>
              </View>

              {/* CUERPO: TABLA CÓDIGO | MODELO | CANTIDAD */}
              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.tableContainer}>
                  {/* CABECERA DE LA TABLA */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, styles.colCodigo]}>Código</Text>
                    <Text style={[styles.thText, styles.colModelo]}>Modelo</Text>
                    <Text style={[styles.thText, styles.colCantidad]}>Cantidad</Text>
                    <View style={{ width: 14, marginLeft: 6 }} />
                  </View>

                  {/* FILAS DE LA TABLA */}
                  {filasFiltradas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Package size={24} color="#6B7280" />
                      <Text style={styles.emptyText}>
                        {searchQuery.trim()
                          ? `Sin coincidencias para "${searchQuery.trim()}"`
                          : 'Sin existencias registradas'}
                      </Text>
                    </View>
                  ) : (
                    filasFiltradas.map((fila, idx) => (
                      <TouchableOpacity
                        key={`${fila.codigo}_${fila.modelo}_${idx}`}
                        style={[
                          styles.tableRow,
                          idx % 2 === 1 && styles.tableRowAlt,
                          idx === filasFiltradas.length - 1 && styles.tableRowLast,
                        ]}
                        onPress={() => setSelectedFila(fila)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cellCodigo, styles.colCodigo]} numberOfLines={1}>
                          {fila.codigo}
                        </Text>
                        <Text style={[styles.cellModelo, styles.colModelo]} numberOfLines={1}>
                          {fila.modelo}
                        </Text>
                        <View style={[styles.cellCantidadWrap, styles.colCantidad]}>
                          <Text style={styles.cellCantidadNum}>{fila.cantidad}</Text>
                          <Text style={styles.cellCantidadUnd}>und.</Text>
                        </View>
                        <ChevronRight size={14} color="#8C9BAB" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    ))
                  )}

                  {/* FILA DE TOTALES */}
                  {filasFiltradas.length > 0 && (
                    <View style={styles.tableFooterRow}>
                      <Text style={[styles.totalLabel, styles.colCodigo]}>TOTAL</Text>
                      <View style={styles.colModelo} />
                      <View style={[styles.cellCantidadWrap, styles.colCantidad]}>
                        <Text style={styles.totalNum}>{totalCantidad}</Text>
                        <Text style={styles.totalUnd}>und.</Text>
                      </View>
                      <View style={{ width: 14, marginLeft: 6 }} />
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* PIE DE MODAL: BOTÓN CERRAR */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.btnCerrar} activeOpacity={0.7}>
                  <Text style={styles.btnCerrarText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#2C333A',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchBox: {
    flex: 1,
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 8,
    height: 30,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: '#B6C2CF',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  closeBtn: { padding: 4, borderRadius: 6 },
  body: { padding: 18 },
  tableContainer: {
    backgroundColor: '#2C333A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#2C333A',
  },
  tableRowAlt: { backgroundColor: '#252B31' },
  tableRowLast: { borderBottomWidth: 0 },
  colCodigo: { flex: 1, paddingRight: 8 },
  colModelo: { flex: 1.3, paddingRight: 8 },
  colCantidad: { width: 90, alignItems: 'flex-end' },
  cellCodigo: { fontSize: 12, fontWeight: '600', color: '#B6C2CF', fontVariant: ['tabular-nums'] },
  cellModelo: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  cellCantidadWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 },
  cellCantidadNum: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  cellCantidadUnd: { fontSize: 10, color: '#8C9BAB', fontWeight: '500' },
  tableFooterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D2125', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#384148' },
  totalLabel: { fontSize: 11, fontWeight: '700', color: '#8C9BAB', letterSpacing: 0.5 },
  totalNum: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  totalUnd: { fontSize: 10, color: '#8C9BAB', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 12, color: '#8C9BAB' },
  footer: { paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#384148', backgroundColor: '#2C333A', alignItems: 'flex-end' },
  btnCerrar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1D2125', borderRadius: 6, borderWidth: 1, borderColor: '#384148' },
  btnCerrarText: { fontSize: 12, fontWeight: '600', color: '#B6C2CF' },
});
