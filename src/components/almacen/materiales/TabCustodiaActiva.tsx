import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';
import { CustodiaItem } from './types';

interface TabCustodiaActivaProps {
  custodiaList: CustodiaItem[];
}

export const TabCustodiaActiva: React.FC<TabCustodiaActivaProps> = ({
  custodiaList,
}) => {
  if (custodiaList.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Package size={40} color="#4B5563" />
        <Text style={styles.emptyTxt}>No tienes materiales en custodia actualmente.</Text>
      </View>
    );
  }

  return (
    <View>
      {custodiaList.map((item) => (
        <View key={item.codigo} style={styles.itemCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemCod}>{item.codigo}</Text>
            <Text style={styles.itemName}>{item.nombre}</Text>
            <Text style={styles.itemSub}>
              Modelo: {item.modelo}
              {item.serial ? ` · Serial: ${item.serial}` : ''}
            </Text>
          </View>
          <View style={styles.rightBox}>
            <View style={styles.qtyBadgeActive}>
              <Text style={styles.qtyTextActive}>{item.cantidad} und.</Text>
            </View>
          </View>
        </View>
      ))}
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#384148',
  },
  itemCod: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  itemSub: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 2,
  },
  rightBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  qtyBadgeActive: {
    backgroundColor: '#2C333A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
  },
  qtyTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
