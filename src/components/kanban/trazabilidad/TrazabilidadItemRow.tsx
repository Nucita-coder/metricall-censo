import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  PhoneCall,
  UserPlus,
} from 'lucide-react-native';
import { EventoTrazabilidad, TipoEventoTrazabilidad } from '../../../hooks/useTrazabilidadEventos';

const DICCIONARIO_CAMPOS: Record<string, string> = {
  nombreCliente: 'Nombre del Cliente',
  documentoIdentidad: 'Documento de Identidad',
  telefonoMovil: 'Teléfono Móvil',
  direccionResidencia: 'Dirección de Residencia',
  tipoServicio: 'Tipo de Servicio',
  plan: 'Plan Seleccionado',
  estadoLiberacion: 'Estado de Liberación',
  estadoFactibilidad: 'Estado de Factibilidad',
  motivoFactibilidad: 'Resultado de Factibilidad',
  observacionesFactibilidad: 'Observaciones de Factibilidad',
  motivoRetorno: 'Motivo de Devolución',
  ultimoMotivoRetorno: 'Último Motivo de Devolución',
  comentario_instalacion: 'Comentario de Instalación',
  cableCaida: 'Metros de Cable Caída',
  cintaAislante: 'Cinta Aislante',
  conectorAcople: 'Conectores / Acoples',
  materiales: 'Materiales Utilizados',
  latitud: 'Latitud GPS',
  longitud: 'Longitud GPS',
  asignado_a: 'Usuario Asignado',
  tecnico_id: 'Técnico Asignado',
  lista_id: 'Fase / Columna',
};

const traducirCampo = (key: string): string => {
  return DICCIONARIO_CAMPOS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatearValor = (val: any): string => {
  if (val === null || val === undefined || val === '') return 'Vacío';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
};

export const renderIcon = (tipo: TipoEventoTrazabilidad) => {
  switch (tipo) {
    case 'creacion': return <Calendar size={18} color="#B6C2CF" />;
    case 'edicion': return <Edit3 size={18} color="#0C66E4" />;
    case 'gestion': return <PhoneCall size={18} color="#22A06B" />;
    case 'reasignacion': return <UserPlus size={18} color="#E53E3E" />;
    case 'movimiento': return <ArrowRightLeft size={18} color="#8A2BE2" />;
    case 'comentario': return <MessageSquare size={18} color="#F59E0B" />;
    case 'adjunto': return <Paperclip size={18} color="#38BDF8" />;
    case 'fase': return <CheckCircle2 size={18} color="#10B981" />;
    default: return <Calendar size={18} color="#B6C2CF" />;
  }
};

export const renderColor = (tipo: TipoEventoTrazabilidad) => {
  switch (tipo) {
    case 'creacion': return '#384148';
    case 'edicion': return '#0C66E4';
    case 'gestion': return '#22A06B';
    case 'reasignacion': return '#E53E3E';
    case 'movimiento': return '#8A2BE2';
    case 'comentario': return '#F59E0B';
    case 'adjunto': return '#38BDF8';
    case 'fase': return '#10B981';
    default: return '#384148';
  }
};

interface TrazabilidadItemRowProps {
  evento: EventoTrazabilidad;
  isLast: boolean;
}

export function TrazabilidadItemRow({ evento, isLast }: TrazabilidadItemRowProps) {
  return (
    <View style={styles.timelineItem}>
      {!isLast && (
        <View style={[styles.timelineLine, { backgroundColor: renderColor(evento.tipoDeEvento) }]} />
      )}

      <View style={[styles.timelineIconContainer, { borderColor: renderColor(evento.tipoDeEvento) }]}>
        {renderIcon(evento.tipoDeEvento)}
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{evento.titulo}</Text>
          <Text style={styles.eventDate}>
            {evento.fechaRaw ? String(evento.fechaRaw) : evento.fecha.toLocaleString()}
          </Text>
        </View>

        {evento.descripcion ? (
          <Text style={styles.eventDesc}>{evento.descripcion}</Text>
        ) : null}

        <Text style={styles.eventUser}>
          Por: <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>{evento.usuario}</Text>
        </Text>

        {(evento.tipoDeEvento === 'edicion' || evento.tipoDeEvento === 'movimiento' || evento.tipoDeEvento === 'reasignacion') &&
          Array.isArray(evento.detallesExtra) && (
            <View style={styles.diffContainer}>
              {evento.detallesExtra.map((mod: any, mIdx: number) => (
                <View key={mIdx} style={styles.diffRow}>
                  <Text style={styles.diffField}>{traducirCampo(mod.campo)}:</Text>
                  <View style={styles.diffValuesRow}>
                    <Text style={styles.diffOld}>{formatearValor(mod.valor_anterior)}</Text>
                    <ArrowRight size={14} color="#8C9BAB" style={{ marginHorizontal: 6 }} />
                    <Text style={styles.diffNew}>{formatearValor(mod.valor_nuevo)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        {evento.tipoDeEvento === 'gestion' && evento.detallesExtra && (
          <View style={[styles.diffContainer, { backgroundColor: '#1C2B23', borderColor: '#22A06B' }]}>
            <Text style={{ color: '#22A06B', fontWeight: 'bold' }}>
              Etapa: {evento.detallesExtra.etapa || 'Gestión'} | Resultado: {evento.detallesExtra.resultado}
            </Text>
            {evento.detallesExtra.motivoRechazo ? (
              <Text style={{ color: '#F56565', fontStyle: 'italic', marginTop: 4 }}>
                Motivo Rechazo: {evento.detallesExtra.motivoRechazo}
              </Text>
            ) : null}
          </View>
        )}

        {evento.tipoDeEvento === 'adjunto' && evento.detallesExtra?.url && (
          <View style={styles.attachmentContainer}>
            {evento.detallesExtra.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
              <TouchableOpacity onPress={() => Linking.openURL(evento.detallesExtra.url)}>
                <Image source={{ uri: evento.detallesExtra.url }} style={styles.attachmentThumbnail} resizeMode="cover" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.fileLinkBtn} onPress={() => Linking.openURL(evento.detallesExtra.url)}>
                <ImageIcon size={18} color="#38BDF8" />
                <Text style={styles.fileLinkText}>Ver Archivo Adjunto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: -24,
    width: 2,
    opacity: 0.4,
  },
  timelineIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#1D2125',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 12,
  },
  eventDate: {
    fontSize: 12,
    color: '#8C9BAB',
    fontWeight: '500',
  },
  eventDesc: {
    fontSize: 14,
    color: '#B6C2CF',
    marginBottom: 6,
    lineHeight: 20,
  },
  eventUser: {
    fontSize: 13,
    color: '#8C9BAB',
    marginBottom: 8,
  },
  diffContainer: {
    marginTop: 8,
    backgroundColor: '#2C333A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  diffRow: {
    marginBottom: 6,
  },
  diffField: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 2,
  },
  diffValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  diffOld: {
    fontSize: 13,
    color: '#E56910',
    textDecorationLine: 'line-through',
  },
  diffNew: {
    fontSize: 13,
    color: '#22A06B',
    fontWeight: 'bold',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  attachmentThumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  fileLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2C333A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  fileLinkText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
