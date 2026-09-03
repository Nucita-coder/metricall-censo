import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Wifi } from 'lucide-react-native';

interface FasePorActivarAuditoriaProps {
  data: Record<string, unknown>;
  lch?: string;
  geofotos: string[];
  adjuntos: string[];
  fotosSeleccionadas: Record<string, boolean>;
  onToggleFoto: (url: string) => void;
  isSaving: boolean;
}

export function FasePorActivarAuditoria({
  data,
  lch,
  geofotos,
  adjuntos,
  fotosSeleccionadas,
  onToggleFoto,
  isSaving,
}: FasePorActivarAuditoriaProps) {
  return (
    <View>
      {/* Resumen de Datos Técnicos */}
      <View style={styles.resumenCard}>
        <View style={styles.resumenCardHeader}>
          <Wifi size={16} color="#579DFF" />
          <Text style={styles.resumenCardTitle}>Datos Técnicos Reportados</Text>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>SERIAL EQUIPO</Text>
            <Text style={styles.gridVal}>{(data.serialEquipo as string) || 'No registrado'}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>MAC EQUIPO</Text>
            <Text style={styles.gridVal}>
              {(data.mac_equipo as string) || (data.macEquipo as string) || 'No registrada'}
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
            <Text style={[styles.gridVal, { color: '#4ADE80', fontWeight: 'bold' }]}>
              {data.potencia_casa || data.potenciaCasa
                ? `${data.potencia_casa || data.potenciaCasa} dBm`
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>CAJA NAP / PUERTO</Text>
            <Text style={styles.gridVal}>
              NAP: {(data.nroNap as string) || 'N/A'} | Pto: {(data.puertoAsignado as string) || 'N/A'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>TÉCNICO RESPONSABLE</Text>
            <Text style={styles.gridVal}>
              {(data.tecnicoAsignado as string) || (data.asignadoA as string) || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Selector de Evidencias */}
      {(geofotos.length > 0 || adjuntos.length > 0 || lch) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.labelInput}>Evidencias para el reporte:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {lch && (
              <TouchableOpacity
                style={[styles.fotoItem, { opacity: fotosSeleccionadas[lch] ? 1 : 0.4 }]}
                onPress={() => !isSaving && onToggleFoto(lch)}
                disabled={isSaving}
              >
                <Image
                  source={{ uri: lch }}
                  style={[styles.fotoThumb, fotosSeleccionadas[lch] && styles.fotoThumbSelected]}
                />
                <Text style={styles.fotoLabel}>LCH</Text>
                {fotosSeleccionadas[lch] && (
                  <View style={styles.checkBadge}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {geofotos.map((url, idx) => (
              <TouchableOpacity
                key={`geo-${idx}`}
                style={[styles.fotoItem, { opacity: fotosSeleccionadas[url] ? 1 : 0.4 }]}
                onPress={() => !isSaving && onToggleFoto(url)}
                disabled={isSaving}
              >
                <Image
                  source={{ uri: url }}
                  style={[styles.fotoThumb, fotosSeleccionadas[url] && styles.fotoThumbSelected]}
                />
                <Text style={styles.fotoLabel}>Geo {idx + 1}</Text>
                {fotosSeleccionadas[url] && (
                  <View style={styles.checkBadge}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {adjuntos.map((url, idx) => (
              <TouchableOpacity
                key={`adj-${idx}`}
                style={[styles.fotoItem, { opacity: fotosSeleccionadas[url] ? 1 : 0.4 }]}
                onPress={() => !isSaving && onToggleFoto(url)}
                disabled={isSaving}
              >
                <Image
                  source={{ uri: url }}
                  style={[styles.fotoThumb, fotosSeleccionadas[url] && styles.fotoThumbSelected]}
                />
                <Text style={styles.fotoLabel}>Adj. {idx + 1}</Text>
                {fotosSeleccionadas[url] && (
                  <View style={styles.checkBadge}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resumenCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
    padding: 12,
    marginBottom: 16,
  },
  resumenCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    paddingBottom: 6,
  },
  resumenCardTitle: {
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
  },
  gridVal: {
    fontSize: 12,
    color: '#DCDFE4',
  },
  labelInput: {
    fontSize: 11,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fotoItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  fotoThumb: {
    width: 76,
    height: 76,
    borderRadius: 8,
  },
  fotoThumbSelected: {
    borderWidth: 2,
    borderColor: '#48BB78',
  },
  fotoLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#48BB78',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
