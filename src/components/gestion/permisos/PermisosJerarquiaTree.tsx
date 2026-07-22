import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';

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

export interface PermisoListaRelacional {
  lista_id: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_borrar: boolean;
}

interface PermisosJerarquiaTreeProps {
  jerarquia: Sucursal[];
  sucursalesPermitidas: string[];
  tablerosPermitidos: string[];
  permisosListas: Record<string, PermisoListaRelacional>;
  onToggleSucursal: (sucId: string) => void;
  onToggleTablero: (tabId: string, listas: Lista[]) => void;
  onToggleListaPermission: (listaId: string, field: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_borrar') => void;
}

export function PermisosJerarquiaTree({
  jerarquia,
  sucursalesPermitidas,
  tablerosPermitidos,
  permisosListas,
  onToggleSucursal,
  onToggleTablero,
  onToggleListaPermission,
}: PermisosJerarquiaTreeProps) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Acceso a Áreas</Text>

      {jerarquia.map((sucursal) => {
        const isSucursalChecked = sucursalesPermitidas.includes(sucursal.id);
        return (
          <View key={sucursal.id} style={styles.hierarchyCard}>
            <TouchableOpacity style={styles.checkRow} onPress={() => onToggleSucursal(sucursal.id)}>
              {isSucursalChecked ? <CheckSquare size={20} color="#0C66E4" /> : <Square size={20} color="#8C9BAB" />}
              <Text style={styles.sucursalText}>🏢 {sucursal.nombre}</Text>
            </TouchableOpacity>

            {isSucursalChecked &&
              sucursal.tableros &&
              sucursal.tableros.map((tablero) => {
                const isTableroChecked = tablerosPermitidos.includes(tablero.id);
                return (
                  <View key={tablero.id} style={styles.tableroContainer}>
                    <TouchableOpacity style={styles.checkRow} onPress={() => onToggleTablero(tablero.id, tablero.listas || [])}>
                      {isTableroChecked ? <CheckSquare size={20} color="#0C66E4" /> : <Square size={20} color="#8C9BAB" />}
                      <Text style={styles.tableroText}>📁 {tablero.nombre}</Text>
                    </TouchableOpacity>

                    {isTableroChecked && tablero.listas && (
                      <View style={styles.listasContainer}>
                        {tablero.listas.map((lista) => {
                          const lPerm = permisosListas[lista.id] || { puede_ver: false, puede_crear: false, puede_editar: false, puede_borrar: false };
                          return (
                            <View key={lista.id} style={{ marginBottom: 16 }}>
                              <View style={styles.checkRow}>
                                <Text style={[styles.listaText, { fontWeight: 'bold', color: '#B6C2CF' }]}>{lista.nombre}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4, marginLeft: 24 }}>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onToggleListaPermission(lista.id, 'puede_ver')}>
                                  {lPerm.puede_ver ? <CheckSquare size={16} color="#0C66E4" /> : <Square size={16} color="#8C9BAB" />}
                                  <Text style={{ fontSize: 13, color: lPerm.puede_ver ? '#B6C2CF' : '#8C9BAB' }}>Ver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onToggleListaPermission(lista.id, 'puede_crear')}>
                                  {lPerm.puede_crear ? <CheckSquare size={16} color="#0C66E4" /> : <Square size={16} color="#8C9BAB" />}
                                  <Text style={{ fontSize: 13, color: lPerm.puede_crear ? '#B6C2CF' : '#8C9BAB' }}>Crear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onToggleListaPermission(lista.id, 'puede_editar')}>
                                  {lPerm.puede_editar ? <CheckSquare size={16} color="#0C66E4" /> : <Square size={16} color="#8C9BAB" />}
                                  <Text style={{ fontSize: 13, color: lPerm.puede_editar ? '#B6C2CF' : '#8C9BAB' }}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onToggleListaPermission(lista.id, 'puede_borrar')}>
                                  {lPerm.puede_borrar ? <CheckSquare size={16} color="#0C66E4" /> : <Square size={16} color="#8C9BAB" />}
                                  <Text style={{ fontSize: 13, color: lPerm.puede_borrar ? '#B6C2CF' : '#8C9BAB' }}>Borrar</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    backgroundColor: '#22272B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#B6C2CF', marginBottom: 16 },
  hierarchyCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#2C333A',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  sucursalText: { fontSize: 16, fontWeight: 'bold', color: '#B6C2CF' },
  tableroContainer: {
    marginLeft: 24,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#384148',
    paddingLeft: 16,
  },
  tableroText: { fontSize: 15, fontWeight: '600', color: '#B6C2CF' },
  listasContainer: {
    marginLeft: 24,
    marginTop: 4,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#384148',
  },
  listaText: { fontSize: 14, color: '#8C9BAB' },
});
