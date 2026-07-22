import { ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WEB_MODAL_CONTAINER } from '../constants/theme';

interface FormularioCensoProps {
  formData: any;
  handleChange?: (campo: string, valor: any) => void;
  readOnly?: boolean;
}

const InputTexto = ({ label, value, onChangeText, placeholder, keyboardType = 'default', isRequired = false, readOnly = false, multiline = false }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
    <TextInput
      style={[styles.input, readOnly && { backgroundColor: '#1D2125', color: '#8C9BAB' }, multiline && { height: 70, textAlignVertical: 'top' }]}
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

const SelectDropdown = ({ label, value, onSelect, options, placeholder, isRequired = false, disabled = false }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.fieldContainer, disabled && { opacity: 0.5 }]}>
      <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => !disabled && setModalVisible(true)} disabled={disabled}>
        <Text style={{ color: value ? '#B6C2CF' : '#8C9BAB', fontSize: 16 }}>{value || placeholder}</Text>
        <ChevronDown size={20} color="#8C9BAB" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, WEB_MODAL_CONTAINER]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#B6C2CF" /></TouchableOpacity>
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
                  <Text style={[styles.optionText, value === item && styles.optionTextSelected]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function FormularioCenso({ formData, handleChange, readOnly = false }: FormularioCensoProps) {
  const update = (key: string, val: any) => {
    if (readOnly) return;
    if (handleChange) handleChange(key, val);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. DATOS DEL PROSPECTO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>1. DATOS DEL PROSPECTO</Text>

        <InputTexto
          label="Nombre y Apellido"
          value={formData.nombreApellido}
          onChangeText={(v: string) => update('nombreApellido', v)}
          placeholder="Ej: Juan Pérez"
          isRequired
          readOnly={readOnly}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SelectDropdown
              label="Tipo Documento"
              value={formData.tipoDocumento}
              onSelect={(v: string) => update('tipoDocumento', v)}
              options={['V', 'E', 'J', 'P', 'RIF']}
              placeholder="Tipo"
              isRequired
              disabled={readOnly}
            />
          </View>
          <View style={{ flex: 2 }}>
            <InputTexto
              label="Nro. Documento / RIF"
              value={formData.documentoIdentidad}
              onChangeText={(v: string) => update('documentoIdentidad', v)}
              placeholder="Ej: 12345678"
              keyboardType="numeric"
              isRequired
              readOnly={readOnly}
            />
          </View>
        </View>

        <InputTexto
          label="Teléfono Móvil"
          value={formData.telefonoMovil}
          onChangeText={(v: string) => update('telefonoMovil', v)}
          placeholder="Ej: 04141234567"
          keyboardType="phone-pad"
          isRequired
          readOnly={readOnly}
        />

        <InputTexto
          label="Teléfono Adicional"
          value={formData.telefonoAdicional}
          onChangeText={(v: string) => update('telefonoAdicional', v)}
          placeholder="Ej: 02121234567"
          keyboardType="phone-pad"
          readOnly={readOnly}
        />

        <InputTexto
          label="Correo Electrónico"
          value={formData.correo}
          onChangeText={(v: string) => update('correo', v)}
          placeholder="cliente@ejemplo.com"
          keyboardType="email-address"
          readOnly={readOnly}
        />
      </View>

      {/* 2. ENCUESTA DE CENSO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>2. ENCUESTA DE SERVICIO (CENSO)</Text>

        <SelectDropdown
          label="¿Cuenta actualmente con servicio de Internet?"
          value={formData.cuentaConInternet}
          onSelect={(v: string) => update('cuentaConInternet', v)}
          options={['Sí', 'No']}
          placeholder="Seleccione respuesta"
          disabled={readOnly}
        />

        {formData.cuentaConInternet === 'Sí' && (
          <InputTexto
            label="Proveedor Actual"
            value={formData.proveedorActual}
            onChangeText={(v: string) => update('proveedorActual', v)}
            placeholder="Ej: Cantv, NetUno, Inter"
            readOnly={readOnly}
          />
        )}

        <SelectDropdown
          label="¿Estaría dispuesto a cambiar de proveedor?"
          value={formData.dispuestoCambiar}
          onSelect={(v: string) => update('dispuestoCambiar', v)}
          options={['Sí', 'No', 'Es posible']}
          placeholder="Seleccione opción"
          isRequired
          disabled={readOnly}
        />

        <SelectDropdown
          label="Servicio Adicional de Interés"
          value={formData.servicioAdicionalInteres}
          onSelect={(v: string) => update('servicioAdicionalInteres', v)}
          options={['Televisión', 'Cámaras', 'IP Fija', 'Telefonía', 'Ninguno']}
          placeholder="Seleccione interés"
          disabled={readOnly}
        />
      </View>

      {/* 3. DIRECCIÓN DEL CENSO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. DIRECCIÓN DEL CENSO</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <InputTexto
              label="Estado"
              value={formData.estado}
              onChangeText={(v: string) => update('estado', v)}
              placeholder="Estado"
              readOnly={readOnly}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InputTexto
              label="Ciudad / Municipio"
              value={formData.ciudad || formData.ciudadMunicipio}
              onChangeText={(v: string) => {
                update('ciudad', v);
                update('ciudadMunicipio', v);
              }}
              placeholder="Ciudad"
              readOnly={readOnly}
            />
          </View>
        </View>

        <InputTexto
          label="Sector / Urbanización / Zona"
          value={formData.sector || formData.urbanizacion}
          onChangeText={(v: string) => {
            update('sector', v);
            update('urbanizacion', v);
          }}
          placeholder="Sector o Urbanización"
          readOnly={readOnly}
        />

        <InputTexto
          label="Calle / Edificio / Casa"
          value={formData.calle}
          onChangeText={(v: string) => update('calle', v)}
          placeholder="Calle, Edificio o Casa"
          readOnly={readOnly}
        />

        <InputTexto
          label="Punto de Referencia"
          value={formData.referencia}
          onChangeText={(v: string) => update('referencia', v)}
          placeholder="Ej: Frente a la plaza principal"
          multiline
          readOnly={readOnly}
        />

        <InputTexto
          label="Observaciones del Censo"
          value={formData.observacionesCenso}
          onChangeText={(v: string) => update('observacionesCenso', v)}
          placeholder="Comentarios o notas adicionales..."
          multiline
          readOnly={readOnly}
        />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22272B',
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    paddingBottom: 8,
  },
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
    color: '#F56565',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#90CDF4',
  },
});
