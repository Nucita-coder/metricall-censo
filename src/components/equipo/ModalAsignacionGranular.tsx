import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckSquare, Square, X } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

interface ModalAsignacionGranularProps {
  visible: boolean;
  solicitudEnProceso: any;
  sucursales: any[];
  tableros: any[];
  selectedSucursal: string | null;
  setSelectedSucursal: (id: string) => void;
  selectedTableros: string[];
  toggleTablero: (id: string) => void;
  selectedEtiquetas: string[];
  setSelectedEtiquetas: React.Dispatch<React.SetStateAction<string[]>>;
  opcionesEtiquetas: string[];
  onLoadTableros: (sucursalId: string) => void;
  onConfirmar: () => void;
  onClose: () => void;
  guardando: boolean;
}

export function ModalAsignacionGranular({
  visible,
  solicitudEnProceso,
  sucursales,
  tableros,
  selectedSucursal,
  setSelectedSucursal,
  selectedTableros,
  toggleTablero,
  selectedEtiquetas,
  setSelectedEtiquetas,
  opcionesEtiquetas,
  onLoadTableros,
  onConfirmar,
  onClose,
  guardando,
}: ModalAsignacionGranularProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.bottomSheetOverlay}>
        <View style={[styles.bottomSheetContent, WEB_MODAL_CONTAINER]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.modalTitle}>Asignación Granular</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Empleado: {solicitudEnProceso?.perfil?.nombre_completo}</Text>

          <ScrollView style={{ marginTop: 16 }}>
            {/* Sucursal */}
            <Text style={styles.label}>1. Asignar Sucursal</Text>
            <View style={styles.dropdownContainer}>
              {sucursales.length === 0 ? (
                <Text style={{ color: '#8C9BAB', fontSize: 14, paddingVertical: 4 }}>No hay sucursales registradas. Debes crear una sucursal en Gestión u Operaciones.</Text>
              ) : (
                sucursales.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.optionRow, selectedSucursal === s.id && styles.optionRowActive]}
                    onPress={() => {
                      setSelectedSucursal(s.id);
                      onLoadTableros(s.id);
                    }}
                  >
                    <Text style={[styles.optionText, selectedSucursal === s.id && styles.optionTextActive]}>{s.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Tableros */}
            {selectedSucursal && (
              <>
                <Text style={styles.label}>2. Tableros Permitidos (Opcional)</Text>
                <View style={styles.dropdownContainer}>
                  {tableros.length === 0 ? (
                    <Text style={{ color: '#8C9BAB', fontSize: 14 }}>No hay tableros en esta sucursal.</Text>
                  ) : (
                    tableros.map((t) => {
                      const checked = selectedTableros.includes(t.id);
                      return (
                        <TouchableOpacity key={t.id} style={styles.checkRow} onPress={() => toggleTablero(t.id)}>
                          {checked ? <CheckSquare size={20} color="#0C66E4" /> : <Square size={20} color="#8C9BAB" />}
                          <Text style={styles.checkText}>{t.nombre}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </>
            )}

            {/* Etiquetas */}
            <Text style={styles.label}>3. Etiquetas Operativas (Opcional)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {opcionesEtiquetas.map((tag) => {
                const isActive = selectedEtiquetas.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                    onPress={() => {
                      if (isActive) {
                        setSelectedEtiquetas((prev) => prev.filter((t) => t !== tag));
                      } else {
                        setSelectedEtiquetas((prev) => [...prev, tag]);
                      }
                    }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={guardando}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={onConfirmar} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Confirmar e Integrar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#22272B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#384148',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B6C2CF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginTop: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginTop: 16,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: '#1D2125',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  optionRowActive: {
    backgroundColor: '#0C66E4',
  },
  optionText: {
    color: '#B6C2CF',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  checkText: {
    color: '#B6C2CF',
    fontSize: 14,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#1D2125',
  },
  chipBtnActive: {
    backgroundColor: '#B6C2CF',
    borderColor: '#B6C2CF',
  },
  chipText: {
    color: '#8C9BAB',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#1D2125',
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#B6C2CF',
    fontWeight: 'bold',
  },
  btnSave: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0C66E4',
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
