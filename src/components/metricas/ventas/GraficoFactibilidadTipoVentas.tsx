import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Layers } from 'lucide-react-native';
import { FactibilidadVentasStat, TipoServicioVentasStat } from './types';

interface GraficoFactibilidadTipoVentasProps {
  porFactibilidad: FactibilidadVentasStat[];
  porTipo: TipoServicioVentasStat[];
  isDesktop: boolean;
}

export function GraficoFactibilidadTipoVentas({
  porFactibilidad,
  porTipo,
  isDesktop,
}: GraficoFactibilidadTipoVentasProps) {
  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* SECCIÓN 1: VENTAS POR FACTIBILIDAD */}
      <View style={[styles.section, isDesktop && styles.sectionBorderRight]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <ShieldCheck size={16} color="#A0B2C6" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Ventas por Factibilidad</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Estado de viabilidad técnica y verificación de LCH
        </Text>

        <View style={styles.list}>
          {porFactibilidad.map((item) => (
            <View key={item.clave} style={styles.rowItem}>
              <View style={styles.rowHeader}>
                <View style={styles.labelGroup}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.itemLabel}>{item.estado}</Text>
                </View>
                <View style={styles.valueGroup}>
                  <Text style={styles.itemCount}>{item.cantidad}</Text>
                  <Text style={styles.itemPercent}>({item.porcentaje.toFixed(1)}%)</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(item.porcentaje, 100)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* SECCIÓN 2: VENTAS POR TIPO DE SERVICIO */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Layers size={16} color="#A0B2C6" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Ventas por Tipo de Servicio</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Distribución de contratación por segmento de cliente
        </Text>

        {porTipo.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sin ventas registradas en el período</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {porTipo.map((item) => (
              <View key={item.tipoServicio} style={styles.rowItem}>
                <View style={styles.rowHeader}>
                  <View style={styles.labelGroup}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.itemLabel}>{item.tipoServicio}</Text>
                  </View>
                  <View style={styles.valueGroup}>
                    <Text style={styles.itemCount}>{item.totalVentas}</Text>
                    <Text style={styles.itemPercent}>({item.porcentaje.toFixed(1)}%)</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(item.porcentaje, 100)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  containerDesktop: {
    flexDirection: 'row',
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#384148',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  rowItem: {
    marginBottom: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemPercent: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1D2125',
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 0,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});
