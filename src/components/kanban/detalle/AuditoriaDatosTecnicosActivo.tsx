import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Wifi } from 'lucide-react-native';

interface AuditoriaDatosTecnicosActivoProps {
  data: Record<string, unknown>;
}

export function AuditoriaDatosTecnicosActivo({ data }: AuditoriaDatosTecnicosActivoProps) {
  const tipoInstalacion = (data.tipoInstalacion as string) || '';
  const potenciaCasaVal = (data.potencia_casa || data.potenciaCasa) as string | number | undefined;
  const cableDropVal = (data.cable_drop || data.cableDrop) as string | number | undefined;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Wifi size={16} color="#579DFF" />
        <Text style={styles.cardTitle}>Parámetros Técnicos de Instalación</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>TIPO DE INSTALACIÓN</Text>
          <Text style={[styles.gridVal, tipoInstalacion ? { color: '#579DFF', fontWeight: 'bold' } : styles.valEmpty]}>
            {tipoInstalacion ? tipoInstalacion.toUpperCase() : 'Sin registrar'}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>SERIAL EQUIPO / ONU</Text>
          <Text style={[styles.gridVal, { color: '#FFF', fontWeight: 'bold' }]}>
            {(data.serialEquipo || data.serial_onu || 'Sin registrar') as string}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>MAC EQUIPO</Text>
          <Text style={styles.gridVal}>
            {(data.mac_equipo || data.macEquipo || 'Sin registrar') as string}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>CAJA NAP / PUERTO</Text>
          <Text style={styles.gridVal}>
            NAP: {(data.nroNap || data.nap || 'N/A') as string} | Pto: {(data.puertoAsignado || 'N/A') as string}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>POTENCIA NAP</Text>
          <Text style={styles.gridVal}>{data.potenciaNap ? `${data.potenciaNap} dBm` : 'N/A'}</Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>POTENCIA CASA</Text>
          <Text style={[styles.gridVal, potenciaCasaVal ? { color: '#4ADE80', fontWeight: 'bold' } : null]}>
            {potenciaCasaVal ? `${potenciaCasaVal} dBm` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>METROS CABLE DROP</Text>
          <Text style={styles.gridVal}>
            {cableDropVal ? `${cableDropVal} m` : 'Sin registrar'}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>PUERTOS DISPONIBLES</Text>
          <Text style={styles.gridVal}>
            {data.puertosDisponibles !== undefined && data.puertosDisponibles !== null && String(data.puertosDisponibles) !== ''
              ? String(data.puertosDisponibles)
              : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
    padding: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 6,
  },
  cardTitle: {
    color: '#579DFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 12,
    color: '#B6C2CF',
  },
  valEmpty: {
    color: '#626F86',
    fontStyle: 'italic',
    fontSize: 11,
  },
});
