import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WhatsAppMensaje } from './types';

interface WhatsAppChatBubbleProps {
  item: WhatsAppMensaje;
  contactoNombre: string;
}

export function WhatsAppChatBubble({ item, contactoNombre }: WhatsAppChatBubbleProps) {
  const esIncoming = item.tipo === 'incoming';
  const esBoton = item.tipo === 'button';

  const hora = new Date(item.created_at).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fecha = new Date(item.created_at).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
  });

  if (esBoton) {
    return (
      <View style={styles.bubbleCenterContainer}>
        <View style={styles.bubbleButtonPill}>
          <Text style={styles.bubbleButtonText}>🔘 {item.mensaje_texto}</Text>
          <Text style={styles.bubbleMetaText}>{hora}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, esIncoming ? styles.bubbleRowLeft : styles.bubbleRowRight]}>
      <View style={[styles.bubble, esIncoming ? styles.bubbleIncoming : styles.bubbleOutgoing]}>
        <Text style={styles.bubbleSenderLabel}>
          {esIncoming ? (contactoNombre || 'Cliente') : 'Metricall Bot'}
        </Text>

        <Text style={styles.bubbleText}>{item.mensaje_texto || '(Sin texto)'}</Text>

        <View style={styles.bubbleFooter}>
          <Text style={styles.bubbleFechaText}>{fecha}</Text>
          <Text style={styles.bubbleHoraText}>{hora}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 12,
  },
  bubbleIncoming: {
    backgroundColor: '#22272B',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  bubbleOutgoing: {
    backgroundColor: '#1C3860',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: '#0C66E4',
  },
  bubbleSenderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#579DFF',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bubbleFechaText: {
    fontSize: 10,
    color: '#8C9BAB',
  },
  bubbleHoraText: {
    fontSize: 10,
    color: '#8C9BAB',
  },
  bubbleCenterContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  bubbleButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2616',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  bubbleButtonText: {
    fontSize: 12,
    color: '#FCD34D',
    fontWeight: '500',
  },
  bubbleMetaText: {
    fontSize: 10,
    color: '#D97706',
  },
});
