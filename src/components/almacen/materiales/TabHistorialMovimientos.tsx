import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { History, FileText, Calendar, Tag } from 'lucide-react-native';
import { MovimientoItem } from './types';

interface TabHistorialMovimientosProps {
  movimientosList: MovimientoItem[];
}

export const TabHistorialMovimientos: React.FC<TabHistorialMovimientosProps> = ({
  movimientosList,
}) => {
  if (movimientosList.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <History size={40} color="#4B5563" />
        <Text style={styles.emptyTxt}>
          No hay historial de movimientos de asignación/devolución.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {movimientosList.map((mov) => {
        const isDev = mov.tipoCarga === 'DEVOLUCION';
        return (
          <View
            key={mov.cardId}
            style={styles.movCard}
          >
            <View style={styles.movHdr}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color="#8C9BAB" />
                <Text style={styles.movOrden}>
                  Orden: {mov.nroOrden}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color="#8C9BAB" />
                <Text style={styles.movFecha}>{mov.fecha}</Text>
              </View>
            </View>

            <View style={styles.motivoBadge}>
              <Tag size={12} color="#8C9BAB" />
              <Text style={styles.motivoTxt}>
                {isDev ? 'DEVOLUCIÓN: ' : 'ASIGNACIÓN: '}
                {mov.motivo}
              </Text>
            </View>

            <View style={styles.movItemsBox}>
              {mov.items.map((sub, idx) => (
                <View key={idx} style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subCod}>
                      {sub.codigoMaterial}
                    </Text>
                    <Text style={styles.subName}>{sub.nombreMaterial}</Text>
                    <Text style={styles.subModel}>
                      Modelo: {sub.modeloMaterial}
                      {sub.serialMaterial ? ` · Serial: ${sub.serialMaterial}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.subQty}>
                    {isDev ? '-' : '+'}
                    {sub.cantidad} und.
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.movFooter}>
              <Text style={styles.movFooterTxt}>
                {isDev ? 'Entregado a almacén por: ' : 'Entregado por: '}
                <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>
                  {mov.entregadoPor}
                </Text>
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyBox: {
    backgroundColor: '#22272B',
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#384148',
    borderStyle: 'dashed',
  },
  emptyTxt: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  movCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  movHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  movOrden: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  movFecha: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  motivoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2C333A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#384148',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  motivoTxt: {
    fontSize: 11,
    color: '#8C9BAB',
    fontWeight: '600',
  },
  movItemsBox: {
    backgroundColor: '#1D2125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 10,
    gap: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 6,
  },
  subCod: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  subName: {
    fontSize: 12,
    color: '#B6C2CF',
    marginTop: 1,
  },
  subModel: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 1,
  },
  subQty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  movFooter: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  movFooterTxt: {
    fontSize: 11,
    color: '#8C9BAB',
  },
});
