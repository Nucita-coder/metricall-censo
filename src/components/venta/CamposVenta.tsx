import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

export interface InputTextoProps {
  label: string;
  value?: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  isRequired?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
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
}: InputTextoProps) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label} {isRequired && <Text style={styles.required}>*</Text>}
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

export interface DatePickerInputProps {
  label: string;
  value?: string;
  onDateChange: (v: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
}

export const DatePickerInput = ({
  label,
  value,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  isRequired = false,
  disabled = false,
}: DatePickerInputProps) => {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    const parseDateToIso = (val?: string) => {
      if (!val) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const parts = val.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return '';
    };

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.required}>*</Text>}
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
              color: value ? '#B6C2CF' : '#8C9BAB',
              fontSize: '16px',
              cursor: 'pointer',
              colorScheme: 'dark',
            } as any}
          />
          <CalendarIcon size={20} color="#8C9BAB" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {isRequired && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.selectBtn, disabled && styles.btnDisabled]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Text style={{ color: value ? '#B6C2CF' : '#8C9BAB', fontSize: 16 }}>
          {value || placeholder}
        </Text>
        <CalendarIcon size={20} color="#8C9BAB" />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onValueChange={(event: any, selectedDate?: Date) => {
            setShow(false);
            if (selectedDate) {
              const day = String(selectedDate.getDate()).padStart(2, '0');
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const year = selectedDate.getFullYear();
              onDateChange(`${day}/${month}/${year}`);
            }
          }}
          onDismiss={() => setShow(false)}
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
}

export const SelectDropdown = ({
  label,
  value,
  onSelect,
  options,
  placeholder = 'Seleccione...',
  isRequired = false,
  disabled = false,
}: SelectDropdownProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.fieldContainer, disabled && styles.btnDisabled]}>
      <Text style={styles.label}>
        {label} {isRequired && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={{ color: value ? '#B6C2CF' : '#8C9BAB', fontSize: 16 }}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#8C9BAB" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, WEB_MODAL_CONTAINER]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#B6C2CF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item === 'Ninguno' ? '' : item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, value === item && styles.optionTextSelected]}>
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

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B6C2CF',
    marginBottom: 6,
  },
  required: {
    color: '#E53E3E',
  },
  input: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#B6C2CF',
  },
  inputReadOnly: {
    backgroundColor: '#171B21',
    color: '#8C9BAB',
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  selectBtn: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2C333A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  optionText: {
    fontSize: 16,
    color: '#B6C2CF',
    textTransform: 'lowercase',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#90CDF4',
  },
});
