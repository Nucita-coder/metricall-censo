import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';

interface ModalAuditoriaProps {
  visible: boolean;
  tarjetaAuditoria: any | null;
  onClose: () => void;
}

export const ModalAuditoria = ({ visible, tarjetaAuditoria, onClose }: ModalAuditoriaProps) => {
  const [filtroAuditoriaUsuario, setFiltroAuditoriaUsuario] = useState('Todos');

  if (!tarjetaAuditoria) return null;

  const auditoriaCompleta = tarjetaAuditoria?.datos_valores?.historial_auditoria || [];
  const usuariosUnicos = Array.from(new Set(auditoriaCompleta.map((a: any) => a.autor).filter(Boolean)));
  const auditoriaFiltrada = filtroAuditoriaUsuario === 'Todos' ? auditoriaCompleta : auditoriaCompleta.filter((a: any) => a.autor === filtroAuditoriaUsuario);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 600, height: '90%', backgroundColor: '#1D2125', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#22272B', borderBottomWidth: 1, borderBottomColor: '#384148' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#B6C2CF' }}>
              HISTORIAL DE CAMBIOS
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={28} color="#B6C2CF" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            {usuariosUnicos.length > 1 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#8C9BAB', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>Filtrar por usuario</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setFiltroAuditoriaUsuario('Todos')}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: filtroAuditoriaUsuario === 'Todos' ? '#0C66E4' : '#1D2125', borderWidth: 1, borderColor: filtroAuditoriaUsuario === 'Todos' ? '#0C66E4' : '#384148', marginRight: 8 }}
                  >
                    <Text style={{ color: filtroAuditoriaUsuario === 'Todos' ? '#FFF' : '#B6C2CF', fontWeight: 'bold', fontSize: 13 }}>Todos los usuarios</Text>
                  </TouchableOpacity>
                  {usuariosUnicos.map((user: any, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      onPress={() => setFiltroAuditoriaUsuario(user)}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: filtroAuditoriaUsuario === user ? '#0C66E4' : '#1D2125', borderWidth: 1, borderColor: filtroAuditoriaUsuario === user ? '#0C66E4' : '#384148', marginRight: 8 }}
                    >
                      <Text style={{ color: filtroAuditoriaUsuario === user ? '#FFF' : '#B6C2CF', fontWeight: 'bold', fontSize: 13 }}>{user as string}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {auditoriaFiltrada.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#8C9BAB', marginTop: 40, fontSize: 16 }}>No hay ediciones registradas para este filtro.</Text>
              ) : (
                <View style={{ paddingLeft: 24, paddingVertical: 12 }}>
                  {auditoriaFiltrada.map((auditoria: any, index: number, arr: any[]) => (
                    <View key={index} style={{ position: 'relative', paddingBottom: index === arr.length - 1 ? 0 : 32 }}>
                      {/* Línea vertical continua */}
                      {index !== arr.length - 1 && (
                        <View style={{ position: 'absolute', left: -20, top: 24, bottom: -8, width: 2, backgroundColor: '#384148' }} />
                      )}
                      {/* Nodo (Círculo) */}
                      <View style={{ position: 'absolute', left: -25, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#0C66E4', borderWidth: 2, borderColor: '#1D2125' }} />
                      
                      <View style={{ backgroundColor: '#22272B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#384148' }}>
                        {/* Cabecera del Nodo */}
                        <Text style={{ fontSize: 13, color: '#8C9BAB', fontWeight: 'bold', marginBottom: 12 }}>
                          {new Date(auditoria.fecha).toLocaleString()} - Editado por: <Text style={{ color: '#B6C2CF' }}>{auditoria.autor}</Text>
                        </Text>
                        
                        {/* Cuerpo de Modificaciones */}
                        <View style={{ gap: 12 }}>
                          {auditoria.modificaciones.map((mod: any, modIdx: number) => (
                            <View key={modIdx} style={{ flexDirection: 'column' }}>
                              <Text style={{ fontSize: 12, fontWeight: '900', color: '#9FADBC', textTransform: 'uppercase', marginBottom: 4 }}>{mod.campo}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#1D2125', padding: 10, borderRadius: 8 }}>
                                <Text style={{ fontSize: 14, color: '#E56910', textDecorationLine: 'line-through', marginRight: 8, flexShrink: 1 }}>
                                  {typeof mod.valor_anterior === 'object' ? JSON.stringify(mod.valor_anterior) : String(mod.valor_anterior || 'Vacío')}
                                </Text>
                                <ArrowRight size={14} color="#8C9BAB" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 14, color: '#22A06B', fontWeight: 'bold', flexShrink: 1 }}>
                                  {typeof mod.valor_nuevo === 'object' ? JSON.stringify(mod.valor_nuevo) : String(mod.valor_nuevo || 'Vacío')}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};
