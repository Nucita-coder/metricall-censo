import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Download, FileText } from 'lucide-react-native';
import { FacturaSaeItem } from './types';

interface FacturaCardItemProps {
  item: FacturaSaeItem;
  estaDescargando: boolean;
  onDescargar: (item: FacturaSaeItem) => void;
}

export function FacturaCardItem({ item, estaDescargando, onDescargar }: FacturaCardItemProps) {
  return (
    <View style={styles.cardFactura}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <FileText size={16} color="#B6C2CF" />
          <Text style={styles.facturaNumero}>FACTURA NRO {item.nroFactura}</Text>
        </View>
        <View style={styles.badgePildora}>
          <Text style={styles.badgeText}>{item.tipo.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.rowDato}>
          <Text style={styles.labelDato}>Fecha Emisión:</Text>
          <Text style={styles.valorDato}>{item.fechaEmision || 'N/D'}</Text>
        </View>

        <View style={styles.rowDato}>
          <Text style={styles.labelDato}>Concepto:</Text>
          <Text style={styles.valorDato}>{item.concepto || 'SERVICIO DE INTERNET'}</Text>
        </View>

        <View style={styles.rowDato}>
          <Text style={styles.labelDato}>Monto:</Text>
          <Text style={styles.valorMonto}>${item.monto} USD</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.botonDescargar}
        onPress={() => onDescargar(item)}
        disabled={estaDescargando}
      >
        {estaDescargando ? (
          <ActivityIndicator size="small" color="#1D2125" />
        ) : (
          <>
            <Download size={15} color="#1D2125" />
            <Text style={styles.botonDescargarText}>DESCARGAR PDF (OFICIAL CON SELLO)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardFactura: {
    backgroundColor: '#2C333A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  facturaNumero: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgePildora: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(140, 155, 171, 0.15)',
    borderWidth: 1,
    borderColor: '#384148',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
  },
  rowDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelDato: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  valorDato: {
    fontSize: 12,
    color: '#B6C2CF',
  },
  valorMonto: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  botonDescargar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#A0B2C6',
    paddingVertical: 10,
    borderRadius: 6,
  },
  botonDescargarText: {
    color: '#1D2125',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});
