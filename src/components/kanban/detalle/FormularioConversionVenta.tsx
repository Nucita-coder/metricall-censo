import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, ChevronDown, Save, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';

const InputTexto = ({ label, value, onChangeText, placeholder, keyboardType = 'default', isRequired = false, readOnly = false, multiline = false, fullWidth = false }: any) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  return (
    <View style={[styles.fieldContainer, isDesktop && !fullWidth && { width: '48%' }, isDesktop && fullWidth && { width: '100%' }]}>
      <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, readOnly && { backgroundColor: '#1D2125', color: '#8C9BAB' }]}
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#8C9BAB"
        editable={!readOnly}
      />
    </View>
  );
};

const DatePickerInput = ({ label, value, onDateChange, placeholder, isRequired = false, disabled = false, fullWidth = false }: any) => {
  const [show, setShow] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  if (Platform.OS === 'web') {
    const parseDateToIso = (val: string) => {
      if (!val) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const parts = val.split('/');
      return parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : '';
    };

    return (
      <View style={[styles.fieldContainer, disabled && { opacity: 0.8 }, isDesktop && !fullWidth && { width: '48%' }, isDesktop && fullWidth && { width: '100%' }]}>
        <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
        <View style={[styles.selectBtn, { paddingVertical: 8, paddingHorizontal: 12 }, disabled && { backgroundColor: '#1D2125' }]}>
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
              fontSize: '16px',
              cursor: 'pointer',
              colorScheme: 'dark',
            } as any}
          />
          <CalendarIcon size={20} color={disabled ? "#8C9BAB" : "#B6C2CF"} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fieldContainer, disabled && { opacity: 0.8 }, isDesktop && !fullWidth && { width: '48%' }, isDesktop && fullWidth && { width: '100%' }]}>
      <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
      <TouchableOpacity style={[styles.selectBtn, disabled && { backgroundColor: '#1D2125' }]} onPress={() => !disabled && setShow(true)} disabled={disabled}>
        <Text style={{ color: value ? (disabled ? '#8C9BAB' : '#B6C2CF') : '#8C9BAB', fontSize: 16 }}>{value || placeholder}</Text>
        <CalendarIcon size={20} color={disabled ? "#8C9BAB" : "#B6C2CF"} />
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
          onDismiss={() => {
            setShow(false);
          }}
        />
      )}
    </View>
  );
};

const SelectDropdown = ({ label, value, onSelect, options, placeholder, isRequired = false, disabled = false, fullWidth = false }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={[styles.fieldContainer, disabled && { opacity: 0.8 }, isDesktop && !fullWidth && { width: '48%' }, isDesktop && fullWidth && { width: '100%' }]}>
      <Text style={styles.label}>{label} {isRequired && <Text style={styles.required}>*</Text>}</Text>
      <TouchableOpacity style={[styles.selectBtn, disabled && { backgroundColor: '#1D2125' }]} onPress={() => !disabled && setModalVisible(true)} disabled={disabled}>
        <Text style={{ color: value ? (disabled ? '#8C9BAB' : '#B6C2CF') : '#8C9BAB', fontSize: 16 }}>{value || placeholder}</Text>
        <ChevronDown size={20} color={disabled ? "#8C9BAB" : "#B6C2CF"} />
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

export const FormularioConversionVenta = ({ onConfirm, onCancel, isSubmitting }: any) => {
  const { session, userRol } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [formData, setFormData] = useState({
    fechaVenta: new Date().toLocaleDateString('es-ES'),
    vendedor: session?.user?.email || userRol || 'Vendedor',
    tipoServicio: '',
    fechaNacimiento: '',
    direccionFiscal: '',
    phInstalacion: '', phConectados: '', phGamer: '', phCinefilos: '', phFamiliar: '',
    ppInstalacion: '', ppEmprendedores: '', ppComercios: '', ppOficinas: '', ppNegocios: '',
    equipoAdicional: '',
    nroAbonado: '',
  });

  const updateForm = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const hayPlanHogarSeleccionado = Boolean(formData.phConectados || formData.phGamer || formData.phCinefilos || formData.phFamiliar);
  const hayPlanPymesSeleccionado = Boolean(formData.ppEmprendedores || formData.ppComercios || formData.ppOficinas || formData.ppNegocios);

  const handleConfirm = () => {
    if (!formData.tipoServicio) {
      alert('Debes seleccionar el tipo de servicio.');
      return;
    }
    if (formData.tipoServicio === 'hogar' && !hayPlanHogarSeleccionado && !formData.phInstalacion) {
      alert('Debes seleccionar al menos un plan o tipo de instalación para hogar.');
      return;
    }
    if (formData.tipoServicio === 'pymes' && !hayPlanPymesSeleccionado && !formData.ppInstalacion) {
      alert('Debes seleccionar al menos un plan o tipo de instalación para pymes.');
      return;
    }

    onConfirm(formData);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#22272B' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completar Datos de Venta</Text>
        <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
          <X size={28} color="#B6C2CF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={[styles.sectionCard, isDesktop && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          <InputTexto label="Fecha de Venta" value={formData.fechaVenta} readOnly />
          <InputTexto label="Vendedor" value={formData.vendedor} readOnly />

          <SelectDropdown
            label="Tipo de Servicio"
            value={formData.tipoServicio}
            onSelect={(v: string) => {
              updateForm('tipoServicio', v);
              updateForm('phInstalacion', ''); updateForm('phConectados', ''); updateForm('phGamer', ''); updateForm('phCinefilos', ''); updateForm('phFamiliar', '');
              updateForm('ppInstalacion', ''); updateForm('ppEmprendedores', ''); updateForm('ppComercios', ''); updateForm('ppOficinas', ''); updateForm('ppNegocios', '');
            }}
            options={['hogar', 'pymes', 'dedicado', 'isp']}
            placeholder="Seleccione servicio"
            isRequired
            fullWidth={!['pymes', 'dedicado', 'isp'].includes(formData.tipoServicio)}
          />
          {['pymes', 'dedicado', 'isp'].includes(formData.tipoServicio) && (
            <InputTexto label="Dirección Fiscal" value={formData.direccionFiscal} onChangeText={(v: string) => updateForm('direccionFiscal', v)} placeholder="Ej. Av. Francisco de Miranda..." />
          )}

          <DatePickerInput label="Fecha de Nacimiento" value={formData.fechaNacimiento} onDateChange={(v: string) => updateForm('fechaNacimiento', v)} placeholder="Seleccione fecha" />
        </View>

        {formData.tipoServicio === 'hogar' && (
          <View style={[styles.sectionCard, isDesktop && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            <Text style={styles.sectionTitle}>Planes Hogar</Text>
            <SelectDropdown label="Tipo de Instalación" value={formData.phInstalacion} onSelect={(v: string) => updateForm('phInstalacion', v)} options={['sin wifi', 'con wifi']} placeholder="Seleccione" />
            <SelectDropdown label="Conectados" value={formData.phConectados} onSelect={(v: string) => updateForm('phConectados', v)} options={['Ninguno', 'basico', 'medio', 'full', 'xfull']} placeholder="Seleccione" disabled={hayPlanHogarSeleccionado && !formData.phConectados} />
            <SelectDropdown label="Gamer" value={formData.phGamer} onSelect={(v: string) => updateForm('phGamer', v)} options={['Ninguno', 'medio', 'full', 'xfull']} placeholder="Seleccione" disabled={hayPlanHogarSeleccionado && !formData.phGamer} />
            <SelectDropdown label="Cinéfilos" value={formData.phCinefilos} onSelect={(v: string) => updateForm('phCinefilos', v)} options={['Ninguno', 'basico', 'medio', 'full']} placeholder="Seleccione" disabled={hayPlanHogarSeleccionado && !formData.phCinefilos} />
            <SelectDropdown label="Familiar" value={formData.phFamiliar} onSelect={(v: string) => updateForm('phFamiliar', v)} options={['Ninguno', 'basico', 'medio', 'full']} placeholder="Seleccione" disabled={hayPlanHogarSeleccionado && !formData.phFamiliar} />
          </View>
        )}

        {formData.tipoServicio === 'pymes' && (
          <View style={[styles.sectionCard, isDesktop && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            <Text style={styles.sectionTitle}>Planes PYMES</Text>
            <SelectDropdown label="Tipo de Instalación" value={formData.ppInstalacion} onSelect={(v: string) => updateForm('ppInstalacion', v)} options={['sin wifi', 'con wifi']} placeholder="Seleccione" />
            <SelectDropdown label="Emprendedores" value={formData.ppEmprendedores} onSelect={(v: string) => updateForm('ppEmprendedores', v)} options={['Ninguno', 'Conectado', 'Seguro', 'Protegido']} placeholder="Seleccione" disabled={hayPlanPymesSeleccionado && !formData.ppEmprendedores} />
            <SelectDropdown label="Comercios" value={formData.ppComercios} onSelect={(v: string) => updateForm('ppComercios', v)} options={['Ninguno', 'Conectado', 'Seguro', 'Protegido']} placeholder="Seleccione" disabled={hayPlanPymesSeleccionado && !formData.ppComercios} />
            <SelectDropdown label="Oficinas" value={formData.ppOficinas} onSelect={(v: string) => updateForm('ppOficinas', v)} options={['Ninguno', 'Conectado', 'Seguro', 'Protegido']} placeholder="Seleccione" disabled={hayPlanPymesSeleccionado && !formData.ppOficinas} />
            <SelectDropdown label="Negocios" value={formData.ppNegocios} onSelect={(v: string) => updateForm('ppNegocios', v)} options={['Ninguno', 'Conectado', 'Seguro', 'Protegido']} placeholder="Seleccione" disabled={hayPlanPymesSeleccionado && !formData.ppNegocios} />
          </View>
        )}

        <View style={[styles.sectionCard, isDesktop && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          <Text style={styles.sectionTitle}>Adicionales</Text>
          <InputTexto label="Solicitud Equipo Adicional" value={formData.equipoAdicional} onChangeText={(v: string) => updateForm('equipoAdicional', v)} placeholder="Ej. Router extra" />
          <InputTexto label="Nro. de Abonado" value={formData.nroAbonado} onChangeText={(v: string) => updateForm('nroAbonado', v)} placeholder="Si aplica" keyboardType="numeric" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator size="small" color="#FFF" /> : <Save size={20} color="#FFF" />}
          <Text style={styles.saveBtnText}>{isSubmitting ? "Convirtiendo..." : "Confirmar y Enviar a Factibilidad"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148'
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#B6C2CF' },
  sectionCard: {
    backgroundColor: '#2C333A', borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#384148',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }
    }),
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#B6C2CF', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#384148', paddingBottom: 8, width: '100%' },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#B6C2CF', marginBottom: 6 },
  required: { color: '#F56565' },
  input: { backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#B6C2CF' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  selectBtn: { backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2C333A', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#384148' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#B6C2CF' },
  optionItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#384148' },
  optionText: { fontSize: 16, color: '#B6C2CF', textTransform: 'capitalize' },
  optionTextSelected: { fontWeight: 'bold', color: '#0C66E4' },
  footer: { backgroundColor: '#2C333A', padding: 16, borderTopWidth: 1, borderTopColor: '#384148', paddingBottom: 30 },
  saveBtn: { backgroundColor: '#0C66E4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12 },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 18, marginLeft: 8 }
});
