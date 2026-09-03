import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, Terminal } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { WhatsAppMensaje } from './types';

interface WhatsAppLogsViewerProps {
  logs: WhatsAppMensaje[];
  cargando: boolean;
}

function getLogColor(tipo: string): string {
  switch (tipo) {
    case 'incoming':        return '#4ADE80';
    case 'outgoing':        return '#60A5FA';
    case 'button':          return '#FBBF24';
    case 'gemini_response': return '#C084FC';
    case 'blocked':         return '#EF4444';
    case 'error':           return '#F87171';
    case 'raw_incoming':    return '#94A3B8';
    case 'sistema':         return '#34D399';
    default:                return '#94A3B8';
  }
}

function getLogIcon(tipo: string): string {
  switch (tipo) {
    case 'incoming':        return '📨';
    case 'outgoing':        return '📤';
    case 'button':          return '🔘';
    case 'gemini_response': return '🤖';
    case 'blocked':         return '🚫';
    case 'error':           return '❌';
    case 'raw_incoming':    return '📡';
    case 'sistema':         return '⚙️';
    default:                return '•';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function WhatsAppLogsViewer({ logs, cargando }: WhatsAppLogsViewerProps) {
  const [destinatario, setDestinatario] = useState('584123757313');
  const [mensajePrueba, setMensajePrueba] = useState('Prueba MetricallBot 🤖');
  const [enviando, setEnviando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  async function enviarMensajePrueba() {
    if (!destinatario.trim() || !mensajePrueba.trim()) return;
    setEnviando(true);
    setStatusEnvio(null);

    try {
      const ACCESS_TOKEN =
        'EABCWkEzhIB0BSVmIhtsFl1mpzi2NdsgR8zjRioYmxmKZCv9ZBpfJPkgqunFGRdOYH7WVAETMQyQXI9N1tn4jnfahZCZCyga34ld1AZBAla866ybZA4IHaZACFUwZBBR2zzuHSvqpSj5brXnvZCMZC6xZBGRqtiaKJz7dQP7MjHH8Klo0xm8ZACUFPyqf9bV86eICUgZDZD';
      const PHONE_ID = '1327272020463323';

      const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: destinatario.replace(/\D/g, ''),
          type: 'text',
          text: { body: mensajePrueba },
        }),
      });

      const data = (await response.json()) as { messages?: { id: string }[]; error?: { message: string } };

      if (data?.messages?.[0]?.id) {
        setStatusEnvio('Enviado con éxito: ' + data.messages[0].id.slice(0, 20) + '...');
        await supabase.from('whatsapp_webhook_logs').insert({
          tipo: 'outgoing',
          numero_telefono: destinatario,
          mensaje_texto: mensajePrueba,
          contenido: data,
        });
      } else {
        setStatusEnvio('Error: ' + (data?.error?.message || 'Fallo desconocido'));
      }
    } catch (e: unknown) {
      setStatusEnvio('Error de red: ' + ((e as Error)?.message || String(e)));
    } finally {
      setEnviando(false);
    }
  }

  const renderItem = ({ item }: { item: WhatsAppMensaje }) => {
    const color = getLogColor(item.tipo);
    const icon = getLogIcon(item.tipo);

    return (
      <View style={[styles.logRow, { borderLeftColor: color }]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logTipo, { color }]}>
            {icon} {item.tipo.toUpperCase()}
          </Text>
          {item.numero_telefono && <Text style={styles.logTelefono}>+{item.numero_telefono}</Text>}
          <Text style={styles.logHora}>{formatTime(item.created_at)}</Text>
        </View>

        {item.mensaje_texto ? (
          <Text style={styles.logMensaje} numberOfLines={3}>
            {item.mensaje_texto}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      {/* Test Sender */}
      <View style={styles.senderContainer}>
        <Text style={styles.senderTitle}>Simulador de Envío Directo (Cloud API)</Text>
        <View style={styles.senderInputsRow}>
          <TextInput
            style={styles.inputPhone}
            placeholder="58412..."
            placeholderTextColor="#6B778C"
            value={destinatario}
            onChangeText={setDestinatario}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.inputText}
            placeholder="Mensaje..."
            placeholderTextColor="#6B778C"
            value={mensajePrueba}
            onChangeText={setMensajePrueba}
          />
          <TouchableOpacity
            style={[styles.btnSend, enviando && { opacity: 0.6 }]}
            onPress={enviarMensajePrueba}
            disabled={enviando}
          >
            {enviando ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={16} color="#FFF" />}
          </TouchableOpacity>
        </View>
        {statusEnvio && <Text style={styles.statusEnvio}>{statusEnvio}</Text>}
      </View>

      {/* Logs List */}
      <View style={styles.terminalHeader}>
        <Terminal size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
        <Text style={styles.terminalTitle}>Eventos Recibidos en Vivo</Text>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0C66E4" />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Sin eventos de webhook registrados aún.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  senderContainer: {
    backgroundColor: '#22272B',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  senderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  senderInputsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputPhone: {
    width: 120,
    backgroundColor: '#1D2125',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#384148',
  },
  inputText: {
    flex: 1,
    backgroundColor: '#1D2125',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#384148',
  },
  btnSend: {
    backgroundColor: '#0C66E4',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusEnvio: {
    fontSize: 11,
    color: '#4ADE80',
    marginTop: 6,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1D2125',
    borderBottomWidth: 1,
    borderBottomColor: '#282E33',
  },
  terminalTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#8C9BAB',
    fontSize: 13,
  },
  logRow: {
    backgroundColor: '#22272B',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logTipo: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  logTelefono: {
    fontSize: 11,
    color: '#579DFF',
    flex: 1,
  },
  logHora: {
    fontSize: 10,
    color: '#8C9BAB',
  },
  logMensaje: {
    fontSize: 12,
    color: '#DCDFE4',
    lineHeight: 16,
  },
});
