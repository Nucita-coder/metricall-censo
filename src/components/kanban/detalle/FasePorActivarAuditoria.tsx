import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Wifi, MapPin } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { AuditoriaMaterialesGrid } from './AuditoriaMaterialesGrid';

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
  const geoNap = data.geo_nap as { lat?: number; lng?: number } | undefined;
  const geoCasa = data.geo_casa as { lat?: number; lng?: number } | undefined;

  const handleOpenMap = (lat?: number, lng?: number) => {
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  };

  const tipoInstalacion = (data.tipoInstalacion as string) || '';
  const potenciaCasaVal = data.potencia_casa || data.potenciaCasa;
  const cableDropVal = data.cable_drop || data.cableDrop;

  return (
    <View>
      {/* Resumen de Datos Técnicos y Ópticos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Wifi size={16} color="#579DFF" />
          <Text style={styles.cardTitle}>Datos Técnicos Reportados</Text>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>TIPO DE INSTALACIÓN</Text>
            <Text style={[styles.gridVal, tipoInstalacion ? { color: '#579DFF', fontWeight: 'bold' } : styles.valEmpty]}>
              {tipoInstalacion ? tipoInstalacion.toUpperCase() : 'Sin registrar'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>TÉCNICO RESPONSABLE</Text>
            <Text style={styles.gridVal}>
              {(data.tecnicoAsignado as string) || (data.asignadoA as string) || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>SERIAL EQUIPO</Text>
            <Text style={styles.gridVal}>
              {(data.serialEquipo as string) || (data.serial_onu as string) || 'Sin registrar'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>MAC EQUIPO</Text>
            <Text style={styles.gridVal}>
              {(data.mac_equipo as string) || (data.macEquipo as string) || 'Sin registrar'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>NRO DE NAP</Text>
            <Text style={styles.gridVal}>{(data.nroNap as string) || (data.nap as string) || 'N/A'}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>POTENCIA NAP</Text>
            <Text style={styles.gridVal}>{data.potenciaNap ? `${data.potenciaNap} dBm` : 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>POTENCIA CASA</Text>
            <Text style={[styles.gridVal, potenciaCasaVal ? { color: '#4ADE80', fontWeight: 'bold' } : null]}>
              {potenciaCasaVal ? `${potenciaCasaVal} dBm` : 'N/A'}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>CABLE DROP</Text>
            <Text style={styles.gridVal}>
              {cableDropVal ? `${cableDropVal} m` : 'Sin registrar'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>PUERTO ASIGNADO</Text>
            <Text style={styles.gridVal}>{(data.puertoAsignado as string) || 'N/A'}</Text>
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

      {/* Desglose Completo de Materiales (14 Insumos) */}
      <AuditoriaMaterialesGrid
        materiales={data.materiales as Record<string, string | number | undefined>}
        cablePreconectorizadoFallback={(data.cable_preconectorizado || data.cablePreconectorizado) as string}
      />

      {/* Geolocalización Satelital (Geo NAP y Geo Casa) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MapPin size={16} color="#579DFF" />
          <Text style={styles.cardTitle}>Geolocalización (Geo NAP y Casa)</Text>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>GEO NAP</Text>
            {geoNap && typeof geoNap.lat === 'number' && typeof geoNap.lng === 'number' ? (
              <TouchableOpacity
                onPress={() => handleOpenMap(geoNap.lat, geoNap.lng)}
                style={styles.mapBtn}
              >
                <MapPin size={13} color="#579DFF" />
                <Text style={styles.mapBtnText}>
                  {geoNap.lat.toFixed(5)}, {geoNap.lng.toFixed(5)}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.valEmpty}>Sin registrar</Text>
            )}
          </View>

          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>GEO CASA</Text>
            {geoCasa && typeof geoCasa.lat === 'number' && typeof geoCasa.lng === 'number' ? (
              <TouchableOpacity
                onPress={() => handleOpenMap(geoCasa.lat, geoCasa.lng)}
                style={[styles.mapBtn, styles.mapBtnPurple]}
              >
                <MapPin size={13} color="#A855F7" />
                <Text style={[styles.mapBtnText, { color: '#C084FC' }]}>
                  {geoCasa.lat.toFixed(5)}, {geoCasa.lng.toFixed(5)}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.valEmpty}>Sin registrar</Text>
            )}
          </View>
        </View>
      </View>

      {/* Selector de Evidencias para Reporte */}
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
    color: '#DCDFE4',
  },
  valEmpty: {
    fontSize: 12,
    color: '#8C9BAB',
    fontStyle: 'italic',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(87, 157, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#579DFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  mapBtnPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: '#A855F7',
  },
  mapBtnText: {
    fontSize: 11,
    color: '#579DFF',
    fontWeight: 'bold',
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
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#384148',
  },
  fotoThumbSelected: {
    borderColor: '#0C66E4',
  },
  fotoLabel: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#0C66E4',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
