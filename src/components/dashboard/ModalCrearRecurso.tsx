import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

interface ModalCrearRecursoProps {
  visible: boolean;
  createType: 'sucursal' | 'tablero';
  inputNombre: string;
  setInputNombre: (v: string) => void;
  inputSecundario: string;
  setInputSecundario: (v: string) => void;
  tipoTablero: 'instalaciones' | 'censo';
  setTipoTablero: (v: 'instalaciones' | 'censo') => void;
  isCreating: boolean;
  onConfirmar: () => void;
  onClose: () => void;
}

export function ModalCrearRecurso({
  visible,
  createType,
  inputNombre,
  setInputNombre,
  inputSecundario,
  setInputSecundario,
  tipoTablero,
  setTipoTablero,
  isCreating,
  onConfirmar,
  onClose,
}: ModalCrearRecursoProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, WEB_MODAL_CONTAINER]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{createType === 'sucursal' ? 'Nueva Sucursal' : 'Nuevo Tablero'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Nombre</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={createType === 'sucursal' ? 'Ej. Sucursal Anaco' : 'Ej. Ventas'}
            value={inputNombre}
            onChangeText={setInputNombre}
          />

          <Text style={styles.modalLabel}>
            {createType === 'sucursal' ? 'Ubicación (Opcional)' : 'Descripción (Opcional)'}
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder={createType === 'sucursal' ? 'Ej. Av. Francisco de Miranda' : 'Breve descripción del flujo'}
            value={inputSecundario}
            onChangeText={setInputSecundario}
            maxLength={createType === 'tablero' ? 60 : 100}
          />

          {createType === 'tablero' && (
            <>
              <Text style={styles.modalLabel}>Tipo de Tablero</Text>
              <View style={styles.selectorContainer}>
                <TouchableOpacity
                  style={[styles.selectorBtn, tipoTablero === 'instalaciones' && styles.selectorBtnActive]}
                  onPress={() => setTipoTablero('instalaciones')}
                >
                  <Text style={[styles.selectorBtnText, tipoTablero === 'instalaciones' && styles.selectorBtnTextActive]}>
                    Instalaciones
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorBtn, tipoTablero === 'censo' && styles.selectorBtnActive]}
                  onPress={() => setTipoTablero('censo')}
                >
                  <Text style={[styles.selectorBtnText, tipoTablero === 'censo' && styles.selectorBtnTextActive]}>
                    Censo
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.modalBtnSubmit, isCreating && { opacity: 0.7 }]}
            onPress={onConfirmar}
            disabled={isCreating}
          >
            {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnSubmitText}>Crear</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#2C333A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#384148',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B6C2CF',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C9BAB',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#1D2125',
    borderWidth: 2,
    borderColor: '#384148',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#B6C2CF',
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#384148',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1D2125',
  },
  selectorBtnActive: {
    borderColor: '#0C66E4',
    backgroundColor: '#0C66E4',
  },
  selectorBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  selectorBtnTextActive: {
    color: '#FFF',
  },
  modalBtnSubmit: {
    backgroundColor: '#0C66E4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalBtnSubmitText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
