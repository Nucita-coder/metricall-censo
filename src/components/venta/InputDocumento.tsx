import { ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList, Modal, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { styles } from './camposVentaStyles';

export interface InputDocumentoProps {
  label?: string;
  tipoValue?: string;
  onSelectTipo: (tipo: string) => void;
  numeroValue?: string;
  onChangeNumero: (numero: string) => void;
  opcionesTipo?: string[];
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  halfWidth?: boolean;
}

export const InputDocumento = ({
  label = 'Documento de Identidad / RIF',
  tipoValue = 'V',
  onSelectTipo,
  numeroValue = '',
  onChangeNumero,
  opcionesTipo = ['V', 'E', 'J', 'P', 'RIF'],
  placeholder = 'Ej: 12345678',
  isRequired = false,
  disabled = false,
  readOnly = false,
  halfWidth = false,
}: InputDocumentoProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isDisabled = disabled || readOnly;

  return (
    <View
      style={[
        styles.fieldContainer,
        isDesktop && halfWidth ? { width: '48%' } : { width: '100%' },
      ]}
    >
      {Boolean(label) && (
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <View style={[styles.inputDocumentoContainer, isDisabled && styles.btnDisabled]}>
        <TouchableOpacity
          style={styles.prefijoBtn}
          onPress={() => !isDisabled && setModalVisible(true)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <Text style={styles.prefijoText}>{tipoValue || 'V'}</Text>
          <ChevronDown size={14} color={isDisabled ? '#8C9BAB' : '#B6C2CF'} />
        </TouchableOpacity>

        <View style={styles.prefijoDivider} />

        <TextInput
          style={[styles.inputDocumentoText, readOnly && styles.inputReadOnly]}
          value={numeroValue}
          onChangeText={onChangeNumero}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor="#8C9BAB"
          editable={!isDisabled}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Documento</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#B6C2CF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={opcionesTipo}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelectTipo(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tipoValue === item && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
