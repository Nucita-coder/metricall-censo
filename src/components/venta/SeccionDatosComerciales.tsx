import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DatePickerInput, InputTexto, SelectDropdown } from './CamposVenta';
import {
  OPCIONES_HOGAR_CINEFILOS,
  OPCIONES_HOGAR_CONECTADOS,
  OPCIONES_HOGAR_FAMILIAR,
  OPCIONES_HOGAR_GAMER,
  OPCIONES_INSTALACION,
  OPCIONES_PYMES_PLAN,
  OPCIONES_TIPO_SERVICIO,
} from './constantes';

interface Props {
  formData: any;
  update: (key: string, val: any) => void;
  readOnly?: boolean;
}

export const SeccionDatosComerciales = ({ formData, update, readOnly = false }: Props) => {
  const hayPlanHogarSeleccionado = Boolean(
    formData.phConectados || formData.phGamer || formData.phCinefilos || formData.phFamiliar
  );
  const hayPlanPymesSeleccionado = Boolean(
    formData.ppEmprendedores || formData.ppComercios || formData.ppOficinas || formData.ppNegocios
  );

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>DATOS COMERCIALES</Text>
      <DatePickerInput
        label="Fecha de Venta"
        value={formData.fechaVenta}
        onDateChange={(v: string) => update('fechaVenta', v)}
        placeholder="DD/MM/YYYY"
        disabled={readOnly}
      />
      <InputTexto
        label="Vendedor"
        value={formData.vendedor}
        onChangeText={(v: string) => update('vendedor', v)}
        placeholder="Nombre del vendedor"
        readOnly={readOnly}
      />
      <SelectDropdown
        label="Tipo de Servicio"
        value={formData.tipoServicio}
        onSelect={(v: string) => {
          update('tipoServicio', v);
          update('phInstalacion', ''); update('phConectados', ''); update('phGamer', ''); update('phCinefilos', ''); update('phFamiliar', '');
          update('ppInstalacion', ''); update('ppEmprendedores', ''); update('ppComercios', ''); update('ppOficinas', ''); update('ppNegocios', '');
        }}
        options={OPCIONES_TIPO_SERVICIO}
        placeholder="Seleccione servicio"
        isRequired
        disabled={readOnly}
      />

      {/* PLANES HOGAR */}
      {formData.tipoServicio === 'hogar' && (
        <View style={styles.subCard}>
          <Text style={styles.subSectionTitle}>Planes Hogar</Text>
          <SelectDropdown label="Tipo de Instalación" value={formData.phInstalacion} onSelect={(v: string) => update('phInstalacion', v)} options={OPCIONES_INSTALACION} placeholder="Seleccione" disabled={readOnly} />
          <SelectDropdown label="Conectados" value={formData.phConectados} onSelect={(v: string) => update('phConectados', v)} options={OPCIONES_HOGAR_CONECTADOS} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phConectados)} />
          <SelectDropdown label="Gamer" value={formData.phGamer} onSelect={(v: string) => update('phGamer', v)} options={OPCIONES_HOGAR_GAMER} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phGamer)} />
          <SelectDropdown label="Cinéfilos" value={formData.phCinefilos} onSelect={(v: string) => update('phCinefilos', v)} options={OPCIONES_HOGAR_CINEFILOS} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phCinefilos)} />
          <SelectDropdown label="Familiar" value={formData.phFamiliar} onSelect={(v: string) => update('phFamiliar', v)} options={OPCIONES_HOGAR_FAMILIAR} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phFamiliar)} />
        </View>
      )}

      {/* PLANES PYMES */}
      {formData.tipoServicio === 'pymes' && (
        <View style={styles.subCard}>
          <Text style={styles.subSectionTitle}>Planes PYMES</Text>
          <SelectDropdown label="Tipo de Instalación" value={formData.ppInstalacion} onSelect={(v: string) => update('ppInstalacion', v)} options={OPCIONES_INSTALACION} placeholder="Seleccione" disabled={readOnly} />
          <SelectDropdown label="Emprendedores" value={formData.ppEmprendedores} onSelect={(v: string) => update('ppEmprendedores', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppEmprendedores)} />
          <SelectDropdown label="Comercios" value={formData.ppComercios} onSelect={(v: string) => update('ppComercios', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppComercios)} />
          <SelectDropdown label="Oficinas" value={formData.ppOficinas} onSelect={(v: string) => update('ppOficinas', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppOficinas)} />
          <SelectDropdown label="Negocios" value={formData.ppNegocios} onSelect={(v: string) => update('ppNegocios', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppNegocios)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 17,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B6C2CF',
    marginBottom: 12,
  },
});
