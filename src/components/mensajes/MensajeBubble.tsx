import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FolderKanban, ListFilter, FileText, ExternalLink } from 'lucide-react-native';
import { MensajeGlobal } from '../../services/mensajesService';

interface MensajeBubbleProps {
  mensaje: MensajeGlobal;
  esMio: boolean;
  onExpandirImagen: (url: string) => void;
}

export function MensajeBubble({ mensaje, esMio, onExpandirImagen }: MensajeBubbleProps) {
  const router = useRouter();
  const rawMsg = (mensaje.mensaje || '').trim();
  const esImagen = rawMsg.startsWith('[IMG]');
  const imgUrl = esImagen ? rawMsg.replace('[IMG]', '').trim() : null;
  const isValidImage = Boolean(esImagen && imgUrl && imgUrl.startsWith('http'));
  const adjunto = mensaje.adjunto;

  const formatHora = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const handleNavegarAdjunto = () => {
    if (!adjunto) return;
    const tabId = adjunto.tableroId || mensaje.tablero_id;
    const lisId = adjunto.listaId || mensaje.lista_id;
    const tarId = adjunto.id || mensaje.tarjeta_id;

    if (adjunto.tipo === 'tarjeta' && tabId && tarId) {
      router.push(`/tablero/${tabId}?abrirTarjeta=${tarId}&resaltarTarjeta=${tarId}` as any);
    } else if (adjunto.tipo === 'lista' && tabId && lisId) {
      router.push(`/tablero/${tabId}?resaltarLista=${lisId}` as any);
    } else if (tabId) {
      router.push(`/tablero/${tabId}?resaltarTablero=true` as any);
    }
  };

  const renderBadgeAdjunto = () => {
    if (!adjunto) return null;
    let Icono = FolderKanban;
    let badgeColor = '#0C66E4';
    let badgeTexto = 'TABLERO';

    if (adjunto.tipo === 'lista') {
      Icono = ListFilter;
      badgeColor = '#6E5DC6';
      badgeTexto = 'LISTA';
    } else if (adjunto.tipo === 'tarjeta') {
      Icono = FileText;
      badgeColor = '#1F8CD0';
      badgeTexto = 'TARJETA';
    }

    return (
      <TouchableOpacity
        style={styles.cardAdjuntoContainer}
        onPress={handleNavegarAdjunto}
        activeOpacity={0.8}
      >
        <View style={styles.cardAdjuntoHeader}>
          <View style={[styles.badgeTipo, { backgroundColor: badgeColor }]}>
            <Icono size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.badgeTexto}>{badgeTexto}</Text>
          </View>
          <ExternalLink size={14} color="#8C9BAB" />
        </View>

        <Text style={styles.cardAdjuntoTitulo} numberOfLines={2}>
          {adjunto.titulo}
        </Text>

        {adjunto.detalles ? (
          <Text style={styles.cardAdjuntoDetalles} numberOfLines={1}>
            {adjunto.detalles}
          </Text>
        ) : null}

        <View style={styles.btnVerAdjunto}>
          <Text style={styles.btnVerAdjuntoTexto}>Abrir en Operaciones</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleOtro]}>
      {isValidImage && imgUrl ? (
        <TouchableOpacity onPress={() => onExpandirImagen(imgUrl)}>
          <Image source={{ uri: imgUrl }} style={styles.imgThumb} resizeMode="cover" />
        </TouchableOpacity>
      ) : rawMsg && !esImagen ? (
        <Text style={esMio ? styles.textoMio : styles.textoOtro}>{rawMsg}</Text>
      ) : null}

      {renderBadgeAdjunto()}

      <Text style={styles.horaText}>{formatHora(mensaje.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  bubbleMio: {
    alignSelf: 'flex-end',
    backgroundColor: '#0C66E4',
    borderBottomRightRadius: 2,
  },
  bubbleOtro: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C333A',
    borderBottomLeftRadius: 2,
  },
  textoMio: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  textoOtro: {
    color: '#B6C2CF',
    fontSize: 15,
    lineHeight: 20,
  },
  imgThumb: {
    width: 220,
    height: 160,
    borderRadius: 8,
    marginBottom: 4,
  },
  horaText: {
    fontSize: 10,
    color: '#8C9BAB',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  cardAdjuntoContainer: {
    backgroundColor: '#1D2125',
    borderColor: '#384148',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  cardAdjuntoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTexto: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardAdjuntoTitulo: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardAdjuntoDetalles: {
    color: '#8C9BAB',
    fontSize: 12,
    marginBottom: 8,
  },
  btnVerAdjunto: {
    backgroundColor: '#22272B',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    borderColor: '#384148',
    borderWidth: 1,
  },
  btnVerAdjuntoTexto: {
    color: '#579DFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
