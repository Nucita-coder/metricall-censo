import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { InputTexto, SelectDropdown } from './venta/CamposVenta';
import { ESTADOS_VENEZUELA } from './venta/constantes';

interface FormularioCensoProps {
  formData: any;
  handleChange?: (campo: string, valor: any) => void;
  readOnly?: boolean;
}

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
          <SelectDropdown
            label="Proveedor Actual"
            value={formData.proveedorActual}
            onSelect={(v: string) => update('proveedorActual', v)}
            options={[
              'CANTV (Aba / Aba Ultra)',
              'Inter',
              'NetUno',
              'Movistar',
              'Fibex Telecom',
              'Airtek',
              'Thundernet',
              'Simple Fibra',
              'Supercable',
              'VNET',
              'Otro'
            ]}
            placeholder="Seleccione proveedor actual"
            disabled={readOnly}
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
            <SelectDropdown
              label="Estado"
              value={formData.estado}
              onSelect={(v: string) => update('estado', v)}
              options={ESTADOS_VENEZUELA}
              placeholder="Estado"
              disabled={readOnly}
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
});
