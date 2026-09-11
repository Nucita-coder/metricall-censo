import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface AuditoriaCamposEnBlancoProps {
  data: Record<string, unknown>;
}

export function AuditoriaCamposEnBlanco({ data }: AuditoriaCamposEnBlancoProps) {
  const camposAChequear = [
    { label: 'Documento de Identidad', val: data.documentoIdentidad || data.nroIdentidad || data.cedula },
    { label: 'Teléfono Móvil', val: data.telefonoMovil || data.telefono },
    { label: 'Teléfono Adicional', val: data.telefonoAdicional },
    { label: 'Correo Electrónico', val: data.correo || data.email },
    { label: 'Sector / Zona', val: data.sector || data.zona || data.calle },
    { label: 'Punto de Referencia', val: data.referencia },
    { label: 'Nro LCH', val: data.lch_numero || data.lchNumero || data.nro_lch },
    { label: 'Evidencia Foto LCH', val: data.lch_imagen },
    { label: 'Técnico Instalador', val: data.tecnicoAsignado || data.asignadoA },
    { label: 'Tipo de Instalación', val: data.tipoInstalacion },
    { label: 'Serial ONU / Equipo', val: data.serialEquipo || data.serial_onu },
    { label: 'MAC del Equipo', val: data.mac_equipo || data.macEquipo },
    { label: 'Caja NAP', val: data.nroNap || data.nap },
    { label: 'Puerto Asignado', val: data.puertoAsignado },
    { label: 'Puertos Disponibles', val: data.puertosDisponibles !== undefined && data.puertosDisponibles !== null && String(data.puertosDisponibles).trim() !== '' ? 'ok' : null },
    { label: 'Potencia NAP', val: data.potenciaNap },
    { label: 'Potencia Casa', val: data.potencia_casa || data.potenciaCasa },
    { label: 'Metros Cable Drop', val: data.cable_drop || data.cableDrop },
    { label: 'Geolocalización NAP', val: (data.geo_nap && typeof (data.geo_nap as { lat?: number }).lat === 'number') ? 'ok' : null },
    { label: 'Geolocalización Casa', val: (data.geo_casa && typeof (data.geo_casa as { lat?: number }).lat === 'number') ? 'ok' : null },
    { label: 'GeoFotos de Instalación', val: Array.isArray(data.geofotos) && data.geofotos.length > 0 ? 'ok' : null },
    { label: 'Activado Por', val: data.activadoPor },
  ];

  const faltantes = camposAChequear.filter(c => !c.val || String(c.val).trim() === '');

  if (faltantes.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AlertCircle size={16} color="#F87171" />
        <Text style={styles.cardTitle}>
          Campos Dejados de Lado / En Blanco ({faltantes.length})
        </Text>
      </View>

      <Text style={styles.subtitle}>
        Los siguientes campos no fueron registrados o se omitieron durante el proceso:
      </Text>

      <View style={styles.chipsContainer}>
        {faltantes.map((f, idx) => (
          <View key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 113, 113, 0.15)',
    paddingBottom: 6,
  },
  cardTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    color: '#F87171',
    fontWeight: '600',
  },
});
