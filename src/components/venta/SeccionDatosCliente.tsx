import { MapPin, Navigation } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DatePickerInput, InputTexto, SelectDropdown } from './CamposVenta';
import { ESTADOS_VENEZUELA, OPCIONES_TIPO_DOC } from './constantes';

interface Props {
  formData: any;
  update: (key: string, val: any) => void;
  isLocating?: boolean;
  onCaptarGPS?: () => void;
  onMapaManual?: () => void;
  readOnly?: boolean;
}

export const SeccionDatosCliente = ({
  formData,
  update,
  isLocating,
  onCaptarGPS,
  onMapaManual,
  readOnly = false,
}: Props) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>

      <InputTexto
        label="Nombre y Apellido"
        value={formData.nombreApellido}
        onChangeText={(v: string) => update('nombreApellido', v)}
        placeholder="Ej. Juan Pérez"
        isRequired
        readOnly={readOnly}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SelectDropdown
            label="Tipo Doc."
            value={formData.tipoDocumento}
            onSelect={(v: string) => update('tipoDocumento', v)}
            options={OPCIONES_TIPO_DOC}
            placeholder="Tipo"
            isRequired
            disabled={readOnly}
          />
        </View>
        <View style={{ flex: 2 }}>
          <InputTexto
            label="Nro. Identidad"
            value={formData.documentoIdentidad || formData.nroIdentidad}
            onChangeText={(v: string) => {
              update('documentoIdentidad', v);
              update('nroIdentidad', v);
            }}
            placeholder="Ej. 12345678"
            keyboardType="numeric"
            isRequired
            readOnly={readOnly}
          />
        </View>
      </View>

      <DatePickerInput
        label="Fecha de Nacimiento"
        value={formData.fechaNacimiento}
        onDateChange={(v: string) => update('fechaNacimiento', v)}
        placeholder="Seleccionar fecha"
        disabled={readOnly}
      />

      <InputTexto
        label="Teléfono Móvil"
        value={formData.telefonoMovil}
        onChangeText={(v: string) => update('telefonoMovil', v)}
        placeholder="Ej. 04141234567"
        keyboardType="phone-pad"
        readOnly={readOnly}
      />

      <InputTexto
        label="Teléfono Adicional"
        value={formData.telefonoAdicional}
        onChangeText={(v: string) => update('telefonoAdicional', v)}
        placeholder="Ej. 04241234567"
        keyboardType="phone-pad"
        readOnly={readOnly}
      />

      <InputTexto
        label="Teléfono Residencial"
        value={formData.telefonoResidencial}
        onChangeText={(v: string) => update('telefonoResidencial', v)}
        placeholder="Ej. 02121234567"
        keyboardType="phone-pad"
        readOnly={readOnly}
      />

      <InputTexto
        label="Correo Electrónico"
        value={formData.correo}
        onChangeText={(v: string) => update('correo', v)}
        placeholder="ejemplo@correo.com"
        keyboardType="email-address"
        readOnly={readOnly}
      />

      {/* SUBSECCIÓN DIRECCIÓN DE INSTALACIÓN */}
      <Text style={styles.subSectionTitleHeading}>Dirección de Instalación</Text>

      <SelectDropdown
        label="Estado"
        value={formData.estado}
        onSelect={(v: string) => update('estado', v)}
        options={ESTADOS_VENEZUELA}
        placeholder="Seleccione un estado"
        disabled={readOnly}
      />

      <InputTexto
        label="Ciudad / Municipio"
        value={formData.ciudad || formData.ciudadMunicipio}
        onChangeText={(v: string) => {
          update('ciudad', v);
          update('ciudadMunicipio', v);
        }}
        placeholder="Anaco"
        readOnly={readOnly}
      />

      <InputTexto
        label="Zona / Cuadrante"
        value={formData.zona || formData.zonaCuadrante}
        onChangeText={(v: string) => {
          update('zona', v);
          update('zonaCuadrante', v);
        }}
        placeholder="Zona o Cuadrante"
        readOnly={readOnly}
      />

      <InputTexto
        label="Sector"
        value={formData.sector}
        onChangeText={(v: string) => update('sector', v)}
        placeholder="Sector"
        readOnly={readOnly}
      />

      <InputTexto
        label="Calle / Manzana / Vereda"
        value={formData.calle || formData.calleManzanaVereda}
        onChangeText={(v: string) => {
          update('calle', v);
          update('calleManzanaVereda', v);
        }}
        placeholder="Calle, Manzana o Vereda"
        readOnly={readOnly}
      />

      <InputTexto
        label="Urbanización / Barrio"
        value={formData.urbanizacion || formData.urbanizacionBarrio}
        onChangeText={(v: string) => {
          update('urbanizacion', v);
          update('urbanizacionBarrio', v);
        }}
        placeholder="Urbanización o Barrio"
        readOnly={readOnly}
      />

      <InputTexto
        label="Piso / Nivel"
        value={formData.piso || formData.pisoNivel}
        onChangeText={(v: string) => {
          update('piso', v);
          update('pisoNivel', v);
        }}
        placeholder="Piso o Nivel"
        readOnly={readOnly}
      />

      <InputTexto
        label="Edificio / Casa"
        value={formData.edificio || formData.edificioCasa}
        onChangeText={(v: string) => {
          update('edificio', v);
          update('edificioCasa', v);
        }}
        placeholder="Edificio o Casa"
        readOnly={readOnly}
      />

      <InputTexto
        label="Punto de Referencia"
        value={formData.referencia || formData.puntoReferencia}
        onChangeText={(v: string) => {
          update('referencia', v);
          update('puntoReferencia', v);
        }}
        placeholder="Punto de referencia..."
        multiline
        readOnly={readOnly}
      />

      {/* GPS BUTTONS */}
      {!readOnly && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {onCaptarGPS && (
              <TouchableOpacity style={styles.gpsBtn} onPress={onCaptarGPS} disabled={isLocating}>
                {isLocating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Navigation size={16} color="#FFF" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.gpsBtnText}>{isLocating ? 'Obteniendo...' : 'Captar GPS'}</Text>
              </TouchableOpacity>
            )}
            {onMapaManual && (
              <TouchableOpacity style={styles.mapBtn} onPress={onMapaManual}>
                <MapPin size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.gpsBtnText}>Mapa Manual</Text>
              </TouchableOpacity>
            )}
          </View>
          {formData.latitud && formData.longitud && (
            <Text style={styles.gpsTextSuccess}>
              ✓ GPS Capturado: {Number(formData.latitud).toFixed(6)}, {Number(formData.longitud).toFixed(6)}
            </Text>
          )}
        </View>
      )}

      <InputTexto
        label="Dirección Fiscal (Opcional)"
        value={formData.direccionFiscal}
        onChangeText={(v: string) => update('direccionFiscal', v)}
        placeholder="Igual a la de instalación..."
        multiline
        readOnly={readOnly}
      />
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
  subSectionTitleHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B6C2CF',
    marginTop: 12,
    marginBottom: 16,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  gpsBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gpsTextSuccess: {
    color: '#48BB78',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
