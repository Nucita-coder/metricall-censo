import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  X,
  Package,
  Calendar,
  Truck,
  User,
  FileText,
  Hash,
  Paperclip,
  ExternalLink,
} from 'lucide-react-native';
import { DetalleCargaRegistro, FilaDesgloseMaterial } from './types';

interface VistaHistorialFilaProps {
  fila: FilaDesgloseMaterial;
  nombreMaterial: string;
  cargas: DetalleCargaRegistro[];
  onBack: () => void;
  onClose: () => void;
}

export const VistaHistorialFila: React.FC<VistaHistorialFilaProps> = ({
  fila,
  nombreMaterial,
  cargas,
  onBack,
  onClose,
}) => {
  const cargasDelItem = useMemo(() => {
    const codTarget = fila.codigo.trim().toUpperCase();
    const modTarget = fila.modelo.trim().toUpperCase();

    return (cargas || []).filter((c) => {
      const cod = (c.codigoMaterial || '').trim().toUpperCase();
      const mod = (c.modeloMaterial || 'GENERAL').trim().toUpperCase();
      return (cod === codTarget || !cod) && (mod === modTarget || !mod || modTarget === 'GENERAL');
    });
  }, [cargas, fila]);

  const handleOpenAdjunto = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => null);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER CON BOTÓN VOLVER Y CERRAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={16} color="#B6C2CF" />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {nombreMaterial}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color="#B6C2CF" />
        </TouchableOpacity>
      </View>

      {/* SUB-HEADER / RESUMEN DEL ÍTEM SELECCIONADO */}
      <View style={styles.itemSummaryBar}>
        <View style={styles.itemMetaCol}>
          <Text style={styles.itemMetaLabel}>CÓDIGO</Text>
          <Text style={styles.itemMetaVal}>{fila.codigo}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.itemMetaCol}>
          <Text style={styles.itemMetaLabel}>MODELO</Text>
          <Text style={styles.itemMetaValHighlight}>{fila.modelo}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={[styles.itemMetaCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.itemMetaLabel}>STOCK ACTUAL</Text>
          <Text style={styles.itemStockNum}>{fila.cantidad} und.</Text>
        </View>
      </View>

      {/* LISTADO DE CARGAS DEL ÍTEM */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>
          HISTORIAL DE CARGAS Y MOVIMIENTOS ({cargasDelItem.length})
        </Text>

        {cargasDelItem.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={28} color="#6B7280" />
            <Text style={styles.emptyText}>Sin registros de carga asociados a este modelo</Text>
          </View>
        ) : (
          cargasDelItem.map((carga, idx) => (
            <View key={carga.id ? `${carga.id}_${idx}` : `carga_${idx}`} style={styles.cargaCard}>
              {/* CABECERA DE LA CARGA: ORDEN Y BADGE TIPO */}
              <View style={styles.cargaHeader}>
                <View style={styles.ordenPill}>
                  <FileText size={12} color="#8C9BAB" />
                  <Text style={styles.ordenText}>Orden: {carga.nroOrden || 'S/N'}</Text>
                </View>
                <View style={styles.badgeTipo}>
                  <Text style={styles.badgeTipoText}>{carga.tipoCarga || 'CARGA'}</Text>
                </View>
              </View>

              {/* GRID DE DATOS CLAVE */}
              <View style={styles.dataGrid}>
                {/* FILA 1: FECHA Y ORIGEN */}
                <View style={styles.dataRow}>
                  <View style={styles.dataCol}>
                    <View style={styles.metaLabelRow}>
                      <Calendar size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>Fecha</Text>
                    </View>
                    <Text style={styles.metaValue}>{carga.fecha || '—'}</Text>
                  </View>

                  <View style={styles.dataCol}>
                    <View style={styles.metaLabelRow}>
                      <Truck size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>Origen</Text>
                    </View>
                    <Text style={styles.metaValue}>{carga.origen || 'ALMACÉN'}</Text>
                  </View>
                </View>

                {/* FILA 2: RESPONSABLES DE LA CARGA */}
                <View style={styles.dataRow}>
                  <View style={styles.dataCol}>
                    <View style={styles.metaLabelRow}>
                      <User size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>Entregado por</Text>
                    </View>
                    <Text style={styles.metaValue}>{carga.entregadoPor || '—'}</Text>
                  </View>

                  <View style={styles.dataCol}>
                    <View style={styles.metaLabelRow}>
                      <User size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>Recibido / Asignado</Text>
                    </View>
                    <Text style={styles.metaValue}>{carga.recibidoPor || '—'}</Text>
                  </View>
                </View>

                {/* SERIAL SI EXISTE */}
                {carga.serialMaterial ? (
                  <View style={styles.metaSingleRow}>
                    <View style={styles.metaLabelRow}>
                      <Hash size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>Serial</Text>
                    </View>
                    <Text style={styles.metaValueHighlight}>{carga.serialMaterial}</Text>
                  </View>
                ) : null}

                {/* MOTIVO SI EXISTE */}
                {carga.motivo ? (
                  <View style={styles.metaSingleRow}>
                    <Text style={styles.metaLabel}>Motivo</Text>
                    <Text style={styles.metaValue}>{carga.motivo}</Text>
                  </View>
                ) : null}

                {/* CANTIDAD CARGADA EN ESTE MOVIMIENTO */}
                <View style={styles.cantRow}>
                  <Text style={styles.cantLabel}>Cantidad cargada en movimiento:</Text>
                  <Text style={styles.cantValue}>{carga.cantidad} und.</Text>
                </View>

                {/* COMPROBANTES / EVIDENCIAS */}
                {carga.adjuntos && carga.adjuntos.length > 0 && (
                  <View style={styles.adjuntosWrap}>
                    <View style={styles.metaLabelRow}>
                      <Paperclip size={12} color="#8C9BAB" />
                      <Text style={styles.metaLabel}>
                        Comprobantes ({carga.adjuntos.length})
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
                      {carga.adjuntos.map((url, aIdx) => (
                        <TouchableOpacity
                          key={aIdx}
                          style={styles.fotoThumbBox}
                          onPress={() => handleOpenAdjunto(url)}
                        >
                          <Image source={{ uri: url }} style={styles.fotoThumb} />
                          <View style={styles.fotoOverlay}>
                            <ExternalLink size={12} color="#FFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onBack} style={styles.btnVolver} activeOpacity={0.7}>
          <ArrowLeft size={14} color="#B6C2CF" />
          <Text style={styles.btnVolverText}>Volver al listado</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.btnCerrar} activeOpacity={0.7}>
          <Text style={styles.btnCerrarText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#2C333A',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
  },
  backBtnText: { fontSize: 12, fontWeight: '600', color: '#B6C2CF' },
  headerTitleWrap: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: { padding: 4, borderRadius: 6 },
  itemSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  itemMetaCol: { flex: 1 },
  itemMetaLabel: { fontSize: 9, color: '#8C9BAB', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemMetaVal: { fontSize: 12, fontWeight: '600', color: '#B6C2CF', fontVariant: ['tabular-nums'] },
  itemMetaValHighlight: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  itemStockNum: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  metaDivider: { width: 1, height: 20, backgroundColor: '#384148', marginHorizontal: 12 },
  body: { padding: 18 },
  sectionHeading: { fontSize: 11, fontWeight: '700', color: '#8C9BAB', letterSpacing: 0.6, marginBottom: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { color: '#8C9BAB', fontSize: 13, marginTop: 8 },
  cargaCard: { backgroundColor: '#2C333A', borderRadius: 8, borderWidth: 1, borderColor: '#384148', marginBottom: 14, overflow: 'hidden' },
  cargaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#22272B', borderBottomWidth: 1, borderBottomColor: '#384148' },
  ordenPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ordenText: { fontSize: 12, fontWeight: '700', color: '#B6C2CF' },
  badgeTipo: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#22272B', borderWidth: 1, borderColor: '#384148' },
  badgeTipoText: { fontSize: 10, fontWeight: 'bold', color: '#8C9BAB' },
  dataGrid: { padding: 14, gap: 8 },
  dataRow: { flexDirection: 'row', gap: 12 },
  dataCol: { flex: 1 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  metaLabel: { fontSize: 10, color: '#8C9BAB', textTransform: 'uppercase' },
  metaValue: { fontSize: 12, color: '#B6C2CF', fontWeight: '500' },
  metaValueHighlight: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  metaSingleRow: { marginTop: 2 },
  cantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#384148', marginTop: 4 },
  cantLabel: { fontSize: 11, color: '#8C9BAB' },
  cantValue: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  adjuntosWrap: { marginTop: 8 },
  fotosScroll: { marginTop: 6 },
  fotoThumbBox: { width: 64, height: 64, borderRadius: 6, overflow: 'hidden', marginRight: 8, borderWidth: 1, borderColor: '#384148', position: 'relative' },
  fotoThumb: { width: '100%', height: '100%' },
  fotoOverlay: { position: 'absolute', right: 2, bottom: 2, backgroundColor: 'rgba(0,0,0,0.6)', padding: 3, borderRadius: 3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#384148', backgroundColor: '#2C333A' },
  btnVolver: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1D2125', borderRadius: 6, borderWidth: 1, borderColor: '#384148' },
  btnVolverText: { fontSize: 12, fontWeight: '600', color: '#B6C2CF' },
  btnCerrar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1D2125', borderRadius: 6, borderWidth: 1, borderColor: '#384148' },
  btnCerrarText: { fontSize: 12, fontWeight: '600', color: '#B6C2CF' },
});
