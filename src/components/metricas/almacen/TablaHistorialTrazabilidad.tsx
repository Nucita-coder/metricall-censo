import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  History,
  UserCheck,
  CheckCircle2,
  Package,
  Calendar,
  MapPin,
  RotateCcw,
} from 'lucide-react-native';
import { AsignacionDetallada } from './types';

interface TablaHistorialTrazabilidadProps {
  isDesktop: boolean;
  tecnicoSeleccionado: string | null;
  asignacionesDelTecnico: AsignacionDetallada[];
}

export const TablaHistorialTrazabilidad: React.FC<TablaHistorialTrazabilidadProps> = ({
  isDesktop,
  tecnicoSeleccionado,
  asignacionesDelTecnico,
}) => {
  const totalBalanceNeto = Math.max(
    0,
    asignacionesDelTecnico.reduce(
      (s, i) => s + (i.tipoMovimiento === 'ASIGNACION' ? i.cantidad : -i.cantidad),
      0
    )
  );

  return (
    <View style={[styles.tableCard, { flex: 1 }]}>
      {/* ENCABEZADO DE SECCIÓN DEL TÉCNICO SELECCIONADO */}
      <View style={styles.tecnicoSectionBanner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <History size={16} color="#E5E7EB" />
          <Text style={styles.tecnicoBannerTitle}>
            HISTORIAL Y TRAZABILIDAD —{' '}
            {tecnicoSeleccionado === 'TODOS' || !tecnicoSeleccionado
              ? 'TODOS LOS TÉCNICOS'
              : tecnicoSeleccionado}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: isDesktop ? '100%' : 880 }}>
          {/* ENCABEZADO DE TABLA HISTORIAL */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, styles.colEstado]}>ESTADO / TIPO</Text>
            <Text style={[styles.colHeader, styles.colCod]}>CÓDIGO</Text>
            <Text style={[styles.colHeader, styles.colMat]}>MATERIAL Y MODELO</Text>
            <Text style={[styles.colHeader, styles.colNum]}>CANTIDAD</Text>
            <Text style={[styles.colHeader, styles.colFecha]}>FECHA</Text>
            <Text style={[styles.colHeader, styles.colOrden]}>DESTINO / TARJETA INSTALACIÓN</Text>
          </View>

          {/* FILAS DE HISTORIAL DE ASIGNACIÓN Y CONSUMO */}
          {asignacionesDelTecnico.length === 0 ? (
            <View style={styles.emptyTableRow}>
              <UserCheck size={32} color="#4B5563" />
              <Text style={styles.emptyTableTxt}>
                No hay historial de materiales asignados o consumidos para este técnico
              </Text>
            </View>
          ) : (
            asignacionesDelTecnico.map((item, index) => {
              const isAlt = index % 2 === 1;
              const isConsumo = item.tipoMovimiento === 'INSTALACION_CONSUMO';
              const isDevolucion = item.tipoMovimiento === 'DEVOLUCION';

              return (
                <View key={item.id} style={[styles.tableDataRow, isAlt && styles.tableDataRowAlt]}>
                  {/* ESTADO / TIPO */}
                  <View style={[styles.colEstado, styles.cellEstadoBox]}>
                    {isConsumo ? (
                      <View style={styles.badgeConsumido}>
                        <CheckCircle2 size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeConsumidoTxt}>INSTALADO</Text>
                      </View>
                    ) : isDevolucion ? (
                      <View style={styles.badgeConsumido}>
                        <RotateCcw size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeConsumidoTxt}>DEVUELTO</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeAsignado}>
                        <Package size={11} color="#D1D5DB" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeAsignadoTxt}>CUSTODIA</Text>
                      </View>
                    )}
                  </View>

                  {/* CÓDIGO */}
                  <Text style={[styles.colCod, styles.cellCod]}>{item.codigoMaterial}</Text>

                  {/* MATERIAL Y MODELO */}
                  <View style={styles.colMat}>
                    <Text style={styles.cellMat} numberOfLines={1}>
                      {item.nombreMaterial}
                    </Text>
                    <Text style={styles.cellSubModel} numberOfLines={1}>
                      Modelo: {item.modeloMaterial}
                      {item.serialMaterial ? ` · Serial: ${item.serialMaterial}` : ''}
                    </Text>
                  </View>

                  {/* CANTIDAD */}
                  <Text
                    style={[
                      styles.colNum,
                      styles.cellNumBold,
                      (isConsumo || isDevolucion) && styles.cellNumConsumo,
                    ]}
                  >
                    {isConsumo || isDevolucion ? `-${item.cantidad}` : `+${item.cantidad}`} und.
                  </Text>

                  {/* FECHA */}
                  <View style={[styles.colFecha, styles.cellFechaBox]}>
                    <Calendar size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                    <Text style={styles.cellFechaTxt}>{item.fechaAsignacion}</Text>
                  </View>

                  {/* DESTINO / TARJETA INSTALACIÓN */}
                  <View style={styles.colOrden}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isConsumo && <MapPin size={11} color="#9CA3AF" style={{ marginRight: 4 }} />}
                      <Text style={styles.cellOrdenTxt} numberOfLines={1}>
                        {item.nroOrden}
                      </Text>
                    </View>
                    <Text style={styles.cellEntregadoTxt} numberOfLines={1}>
                      {isConsumo
                        ? `Cliente: ${item.tarjetaDestino}`
                        : isDevolucion
                          ? `Devuelto a: ${item.entregadoPor}`
                          : `Despachado por: ${item.entregadoPor}`}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* PIE DE TABLA - BALANCE NETO DE CUSTODIA ACTIVA */}
          <View style={styles.tableFooterRow}>
            <Text style={[styles.colEstado, styles.cellFootLabel]}>CUSTODIA ACTIVA</Text>
            <Text style={[styles.colCod, styles.cellFootNum, { textAlign: 'left' }]}>
              {totalBalanceNeto.toLocaleString()} und.
            </Text>
            <Text style={styles.colMat} />
            <Text style={styles.colNum} />
            <Text style={styles.colFecha} />
            <Text style={styles.colOrden} />
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
  tecnicoSectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
  },
  tecnicoBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
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
  colEstado: {
    width: 110,
  },
  colCod: {
    width: 100,
  },
  colMat: {
    flex: 2,
    minWidth: 180,
  },
  colFecha: {
    width: 110,
  },
  colNum: {
    width: 95,
    textAlign: 'right',
  },
  colOrden: {
    flex: 1.5,
    minWidth: 160,
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
  cellEstadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeAsignado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C333A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeAsignadoTxt: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  badgeConsumido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#343A40',
  },
  badgeConsumidoTxt: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
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
  cellSubModel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cellFechaBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellFechaTxt: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cellNumBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'right',
  },
  cellNumConsumo: {
    color: '#9CA3AF',
  },
  cellOrdenTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  cellEntregadoTxt: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 1,
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
  cellFootNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
});
