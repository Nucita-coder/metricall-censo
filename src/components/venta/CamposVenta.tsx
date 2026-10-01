import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList, Modal, Platform, StyleProp, StyleSheet, Text,
  TextInput, TouchableOpacity, View, ViewStyle, useWindowDimensions,
} from 'react-native';
import { styles } from './camposVentaStyles';

export interface InputTextoProps {
  label: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  isRequired?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  halfWidth?: boolean;
  fullWidth?: boolean;
}

export const InputTexto = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  isRequired = false,
  readOnly = false,
  multiline = false,
  halfWidth = false,
}: InputTextoProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View
      style={[
        styles.fieldContainer,
        isDesktop && halfWidth ? { width: '48%' } : { width: '100%' },
      ]}
    >
      <Text style={styles.label}>
        {label}{isRequired && <Text style={styles.required}>{'\u00A0'}*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          readOnly && styles.inputReadOnly,
          multiline && styles.inputMultiline,
        ]}
        value={value || ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#8C9BAB"
        editable={!readOnly}
        multiline={multiline}
      />
    </View>
  );
};

export interface DatePickerInputProps {
  label: string;
  value?: string;
  onDateChange: (v: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  halfWidth?: boolean;
  fullWidth?: boolean;
}

export const DatePickerInput = ({
  label,
  value,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  isRequired = false,
  disabled = false,
  halfWidth = false,
}: DatePickerInputProps) => {
  const [show, setShow] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.fieldContainer,
    disabled && styles.btnDisabled,
    isDesktop && halfWidth ? { width: '48%' } : { width: '100%' },
  ];

  if (Platform.OS === 'web') {
    const parseDateToIso = (val?: string) => {
      if (!val) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const parts = val.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return '';
    };

    return (
      <View style={containerStyle}>
        <Text style={styles.label}>
          {label}{isRequired && <Text style={styles.required}>{'\u00A0'}*</Text>}
        </Text>
        <View style={[styles.selectBtn, disabled && styles.btnDisabled]}>
          <input
            type="date"
            value={parseDateToIso(value)}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onDateChange('');
                return;
              }
              const [y, m, d] = val.split('-');
              onDateChange(`${d}/${m}/${y}`);
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: value ? (disabled ? '#8C9BAB' : '#B6C2CF') : '#8C9BAB',
              fontSize: 16,
              cursor: 'pointer',
              colorScheme: 'dark',
            } as React.CSSProperties}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>
        {label}{isRequired && <Text style={styles.required}>{'\u00A0'}*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.selectBtn, disabled && styles.btnDisabled]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Text style={{ color: value ? (disabled ? '#8C9BAB' : '#B6C2CF') : '#8C9BAB', fontSize: 16 }}>
          {value || placeholder}
        </Text>
        <CalendarIcon size={20} color={disabled ? '#8C9BAB' : '#B6C2CF'} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShow(false);
            if (event.type !== 'dismissed' && selectedDate) {
              const day = String(selectedDate.getDate()).padStart(2, '0');
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const year = selectedDate.getFullYear();
              onDateChange(`${day}/${month}/${year}`);
            }
          }}
        />
      )}
    </View>
  );
};

export interface SelectDropdownProps {
  label: string;
  value?: string;
  onSelect: (v: string) => void;
  options: string[];
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  halfWidth?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
  searchable?: boolean;
}

export const SelectDropdown = ({
  label,
  value,
  onSelect,
  options,
  placeholder = 'Seleccione...',
  isRequired = false,
  disabled = false,
  halfWidth = false,
  compact = false,
  hideLabel = false,
  searchable,
}: SelectDropdownProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const esBuscable = searchable !== undefined ? searchable : options.length > 8;

  const opcionesFiltradas = React.useMemo(() => {
    if (!esBuscable || !busqueda.trim()) return options;
    const cleanTerm = busqueda
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return options.filter((item) =>
      item
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(cleanTerm)
    );
  }, [options, busqueda, esBuscable]);

  const handleOpen = () => {
    if (disabled) return;
    setBusqueda('');
    setModalVisible(true);
  };

  const handleClose = () => {
    setBusqueda('');
    setModalVisible(false);
  };

  return (
    <View
      style={[
        styles.fieldContainer,
        compact && styles.fieldContainerCompact,
        disabled && styles.btnDisabled,
        isDesktop && halfWidth ? { width: '48%' } : { width: '100%' },
      ]}
    >
      {!hideLabel && Boolean(label) && (
        <Text style={[styles.label, compact && styles.labelCompact]}>
          {label}{isRequired && <Text style={styles.required}>{'\u00A0'}*</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.selectBtn, compact && styles.selectBtnCompact]}
        onPress={handleOpen}
        disabled={disabled}
      >
        <Text style={{ color: value ? (disabled ? '#8C9BAB' : '#B6C2CF') : '#8C9BAB', fontSize: compact ? 13 : 16 }}>
          {value || placeholder}
        </Text>
        <ChevronDown size={compact ? 16 : 20} color={disabled ? '#8C9BAB' : '#B6C2CF'} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Seleccionar opción'}</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={20} color="#B6C2CF" />
              </TouchableOpacity>
            </View>

            {esBuscable && (
              <View style={styles.modalSearchBox}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Buscar opción..."
                  placeholderTextColor="#8C9BAB"
                  value={busqueda}
                  onChangeText={setBusqueda}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={opcionesFiltradas}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyOptionsText}>No se encontraron resultados</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item === 'Ninguno' ? '' : item);
                    handleClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      (value === item || (Boolean(value) && value?.toUpperCase() === item.toUpperCase())) &&
                        styles.optionTextSelected,
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

export { InputDocumento, InputDocumentoProps } from './InputDocumento';
