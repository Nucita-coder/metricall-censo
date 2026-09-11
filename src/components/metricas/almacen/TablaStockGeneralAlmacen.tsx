import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Package, Calendar } from 'lucide-react-native';
import { SKUDetailItem } from './types';

interface TablaStockGeneralAlmacenProps {
  isDesktop: boolean;
  listaFiltrada: SKUDetailItem[];
}

export const TablaStockGeneralAlmacen: React.FC<TablaStockGeneralAlmacenProps> = ({
  isDesktop,
  listaFiltrada,
}) => {
  const totalAlmacen = listaFiltrada.reduce(
    (s, i) => s + Math.max(0, i.unidadesAlmacen),
    0
  );
  const totalAsignadas = listaFiltrada.reduce(
    (s, i) => s + Math.max(0, i.unidadesAsignadas),
    0
  );
  const totalTotales = listaFiltrada.reduce(
    (s, i) => s + Math.max(0, i.unidadesTotales),
    0
  );

  return (
    <View style={styles.tableCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: isDesktop ? '100%' : 780 }}>
          {/* ENCABEZADO DE TABLA GENERAL SOBRIO */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, styles.colCod]}>CÓDIGO</Text>
            <Text style={[styles.colHeader, styles.colMat]}>MATERIAL</Text>
            <Text style={[styles.colHeader, styles.colMod]}>MODELO</Text>
            <Text style={[styles.colHeader, styles.colFecha]}>FECHA ENTRADA</Text>
            <Text style={[styles.colHeader, styles.colNum]}>EN ALMACÉN</Text>
            <Text style={[styles.colHeader, styles.colNum]}>ASIGNADAS</Text>
            <Text style={[styles.colHeader, styles.colNum]}>TOTAL</Text>
          </View>

          {/* FILAS DE TABLA GENERAL */}
          {listaFiltrada.length === 0 ? (
            <View style={styles.emptyTableRow}>
              <Package size={32} color="#4B5563" />
              <Text style={styles.emptyTableTxt}>Sin resultados para los filtros aplicados</Text>
            </View>
          ) : (
            listaFiltrada.map((item, index) => {
              const isAlt = index % 2 === 1;
              return (
                <View
                  key={`${item.nombreMaterial}_${index}`}
                  style={[styles.tableDataRow, isAlt && styles.tableDataRowAlt]}
                >
                  <Text style={[styles.colCod, styles.cellCod]}>{item.codigoMaterial}</Text>
                  <Text style={[styles.colMat, styles.cellMat]} numberOfLines={1}>
                    {item.nombreMaterial}
                  </Text>
                  <Text style={[styles.colMod, styles.cellMod]} numberOfLines={1}>
                    {item.modeloMaterial}
                  </Text>
                  <View style={[styles.colFecha, styles.cellFechaBox]}>
                    <Calendar size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                    <Text style={styles.cellFechaTxt}>{item.fechaEntrada}</Text>
                  </View>
                  <Text style={[styles.colNum, styles.cellNum]}>
                    {item.unidadesAlmacen.toLocaleString()}
                  </Text>
                  <Text style={[styles.colNum, styles.cellNum]}>
                    {item.unidadesAsignadas.toLocaleString()}
                  </Text>
                  <Text style={[styles.colNum, styles.cellTotalNum]}>
                    {item.unidadesTotales.toLocaleString()}
                  </Text>
                </View>
              );
            })
          )}

          {/* PIE DE TABLA - TOTALES */}
          <View style={styles.tableFooterRow}>
            <Text style={[styles.colCod, styles.cellFootLabel]}>TOTALES</Text>
            <Text style={[styles.colMat, styles.cellFootSub]}>
              {listaFiltrada.length} materiales mostrados
            </Text>
            <Text style={styles.colMod} />
            <Text style={styles.colFecha} />
            <Text style={[styles.colNum, styles.cellFootNum]}>
              {totalAlmacen.toLocaleString()}
            </Text>
            <Text style={[styles.colNum, styles.cellFootNum]}>
              {totalAsignadas.toLocaleString()}
            </Text>
            <Text style={[styles.colNum, styles.cellFootNum]}>
              {totalTotales.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
    alignItems: 'center',
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8C9BAB',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  colCod: {
    width: 100,
  },
  colMat: {
    flex: 2,
    minWidth: 180,
  },
  colMod: {
    flex: 1.2,
    minWidth: 130,
  },
  colFecha: {
    width: 110,
  },
  colNum: {
    width: 95,
    textAlign: 'right',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3036',
    alignItems: 'center',
  },
  tableDataRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.012)',
  },
  cellCod: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  cellMat: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
    paddingRight: 8,
  },
  cellMod: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingRight: 8,
  },
  cellFechaBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellFechaTxt: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cellNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
    textAlign: 'right',
  },
  cellTotalNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  emptyTableRow: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTableTxt: {
    color: '#8C9BAB',
    fontSize: 13,
  },
  tableFooterRow: {
    flexDirection: 'row',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#343A40',
    alignItems: 'center',
  },
  cellFootLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  cellFootSub: {
    fontSize: 11,
    color: '#8C9BAB',
    fontStyle: 'italic',
  },
  cellFootNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
});
