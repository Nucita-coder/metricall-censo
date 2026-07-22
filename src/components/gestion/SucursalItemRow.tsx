import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react-native';

export interface Lista {
  id: string;
  nombre: string;
}

export interface Tablero {
  id: string;
  nombre: string;
  listas: Lista[];
}

export interface Sucursal {
  id: string;
  nombre: string;
  tableros: Tablero[];
}

interface SucursalItemRowProps {
  sucursal: Sucursal;
  isSucExpanded: boolean;
  expandedTableros: { [id: string]: boolean };
  onToggleSucursal: (id: string) => void;
  onToggleTablero: (id: string) => void;
  onConfirmarBorrado: (id: string, nombre: string, type: 'sucursales' | 'tableros') => void;
}

export function SucursalItemRow({
  sucursal,
  isSucExpanded,
  expandedTableros,
  onToggleSucursal,
  onToggleTablero,
  onConfirmarBorrado,
}: SucursalItemRowProps) {
  return (
    <View style={styles.sucursalContainer}>
      <View style={styles.itemHeader}>
        <TouchableOpacity style={styles.itemToggle} onPress={() => onToggleSucursal(sucursal.id)}>
          {isSucExpanded ? <ChevronDown color="#B6C2CF" size={20} /> : <ChevronRight color="#B6C2CF" size={20} />}
          <Text style={styles.itemTitle}>{sucursal.nombre}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onConfirmarBorrado(sucursal.id, sucursal.nombre, 'sucursales')}>
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      {isSucExpanded && (
        <View style={styles.nestedContainer}>
          {(!sucursal.tableros || sucursal.tableros.length === 0) && (
            <Text style={styles.emptyNestedText}>Sin tableros</Text>
          )}
          {sucursal.tableros?.map((tablero) => {
            const isTabExpanded = expandedTableros[tablero.id];
            return (
              <View key={tablero.id} style={styles.tableroContainer}>
                <View style={styles.itemHeader}>
                  <TouchableOpacity style={styles.itemToggle} onPress={() => onToggleTablero(tablero.id)}>
                    {isTabExpanded ? <ChevronDown color="#444" size={18} /> : <ChevronRight color="#444" size={18} />}
                    <Text style={styles.itemTitleTablero}>{tablero.nombre}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onConfirmarBorrado(tablero.id, tablero.nombre, 'tableros')}>
                    <Trash2 color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>

                {isTabExpanded && (
                  <View style={styles.nestedContainer}>
                    {(!tablero.listas || tablero.listas.length === 0) && (
                      <Text style={styles.emptyNestedText}>Sin listas</Text>
                    )}
                    {tablero.listas?.map((lista) => (
                      <View key={lista.id} style={styles.listaContainer}>
                        <Text style={styles.itemTitleLista}>• {lista.nombre}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sucursalContainer: {
    marginBottom: 16,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#2C333A',
  },
  itemToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginLeft: 8,
  },
  nestedContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#22272B',
  },
  emptyNestedText: {
    fontSize: 14,
    color: '#8C9BAB',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  tableroContainer: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#384148',
    paddingLeft: 8,
  },
  itemTitleTablero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginLeft: 8,
  },
  listaContainer: {
    paddingVertical: 4,
    paddingLeft: 24,
  },
  itemTitleLista: {
    fontSize: 14,
    color: '#8C9BAB',
  },
});
