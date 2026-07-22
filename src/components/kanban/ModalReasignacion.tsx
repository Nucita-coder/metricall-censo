import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

interface ModalReasignacionProps {
  visible: boolean;
  onClose: () => void;
  onReasignar: (nuevoAsesorId: string) => Promise<void>;
  empresaId: string | undefined;
}

export const ModalReasignacion = ({ visible, onClose, onReasignar, empresaId }: ModalReasignacionProps) => {
  const [asesores, setAsesores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAsesor, setSelectedAsesor] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchAsesores();
    }
  }, [visible, empresaId]);

  const fetchAsesores = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('perfiles').select('id, nombre_completo, rol, etiquetas');
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filtramos en el cliente para abarcar varias posibilidades (rol o etiqueta)
      const filtrados = (data || []).filter((u: any) => {
        const hasRolAsesor = u.rol === 'asesor';
        const hasEtiquetaVentas = Array.isArray(u.etiquetas) && u.etiquetas.some((e: string) => 
          e.toLowerCase() === 'asesor' || e.toLowerCase() === 'ventas' || e.toLowerCase() === 'vendedor' || e.toLowerCase() === 'venta'
        );
        return hasRolAsesor || hasEtiquetaVentas;
      });

      setAsesores(filtrados);
    } catch (e) {
      console.error('Error fetching asesores', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAsesor) return;
    setIsSaving(true);
    try {
      await onReasignar(selectedAsesor);
      onClose();
    } catch (e) {
      console.error('Error en reasignación', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Reasignar Caso</Text>
          <Text style={styles.subtitle}>Selecciona el nuevo asesor de ventas. Se le enviará una notificación automáticamente.</Text>
          
          {isLoading ? (
            <ActivityIndicator color="#0C66E4" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView style={styles.listContainer}>
              {asesores.length === 0 ? (
                <Text style={styles.emptyText}>No se encontraron asesores registrados.</Text>
              ) : (
                asesores.map((asesor) => (
                  <TouchableOpacity
                    key={asesor.id}
                    style={[
                      styles.asesorItem,
                      selectedAsesor === asesor.id && styles.asesorItemSelected
                    ]}
                    onPress={() => setSelectedAsesor(asesor.id)}
                    disabled={isSaving}
                  >
                    <Text style={[
                      styles.asesorText,
                      selectedAsesor === asesor.id && styles.asesorTextSelected
                    ]}>
                      {asesor.nombre_completo}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={isSaving}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnConfirm, (!selectedAsesor || isSaving) && styles.btnDisabled]} 
              onPress={handleConfirm}
              disabled={!selectedAsesor || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.btnConfirmText}>Confirmar Reasignación</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#384148'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 12,
    color: '#8C9BAB',
    marginBottom: 20
  },
  listContainer: {
    maxHeight: 250,
    marginBottom: 20
  },
  emptyText: {
    color: '#F56565',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20
  },
  asesorItem: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 8
  },
  asesorItemSelected: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4'
  },
  asesorText: {
    color: '#B6C2CF',
    fontWeight: '500'
  },
  asesorTextSelected: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  btnCancelText: {
    color: '#8C9BAB',
    fontWeight: 'bold'
  },
  btnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#0C66E4',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160
  },
  btnDisabled: {
    backgroundColor: '#384148',
  },
  btnConfirmText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});
