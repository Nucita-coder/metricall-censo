import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { User } from 'lucide-react-native';

interface AuditoriaDatosClienteVentaProps {
  data: Record<string, unknown>;
}

export function AuditoriaDatosClienteVenta({ data }: AuditoriaDatosClienteVentaProps) {
  const direccionCompleta = [data.ciudad, data.sector || data.zona, data.calle, data.edificio, data.referencia]
    .filter(Boolean)
    .join(', ');

  const planInfo = [
    data.tipoServicio ? String(data.tipoServicio).toUpperCase() : null,
    data.plan_hogar || data.plan_pymes || data.tipoPlan || null,
  ].filter(Boolean).join(' - ');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <User size={16} color="#579DFF" />
        <Text style={styles.cardTitle}>Datos del Cliente y Venta</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>NOMBRE Y APELLIDO</Text>
          <Text style={[styles.gridVal, { fontWeight: 'bold', color: '#FFF' }]}>
            {(data.nombreApellido || data.nombre || data.cliente || 'Sin registrar') as string}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>DOCUMENTO DE IDENTIDAD</Text>
          <Text style={styles.gridVal}>
            {(data.documentoIdentidad || data.nroIdentidad || data.cedula || 'Sin registrar') as string}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>TELÉFONO MÓVIL</Text>
          <Text style={styles.gridVal}>
            {(data.telefonoMovil || data.telefono || 'Sin registrar') as string}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>TELÉFONO ADICIONAL</Text>
          <Text style={[styles.gridVal, !data.telefonoAdicional && styles.valEmpty]}>
            {(data.telefonoAdicional || 'Sin registrar') as string}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>PLAN / SERVICIO CONTRATADO</Text>
          <Text style={[styles.gridVal, { color: '#579DFF', fontWeight: 'bold' }]}>
            {planInfo || 'Sin registrar'}
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>ASESOR / VENDEDOR</Text>
          <Text style={styles.gridVal}>
            {(data.vendedor || data.asesorComercial || 'Sin registrar') as string}
          </Text>
        </View>
      </View>

      <View style={styles.rowFull}>
        <Text style={styles.gridLabel}>DIRECCIÓN DE INSTALACIÓN</Text>
        <Text style={[styles.gridVal, !direccionCompleta && styles.valEmpty]}>
          {direccionCompleta || 'Sin registrar'}
        </Text>
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
  rowFull: {
    marginTop: 2,
    marginBottom: 4,
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
    color: '#DCDFE4',
  },
  valEmpty: {
    color: '#8C9BAB',
    fontStyle: 'italic',
  },
});
