import React, { useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface WebhookLog {
  id: string;
  tipo: string;
  numero_telefono: string | null;
  mensaje_texto: string | null;
  contenido: Record<string, unknown>;
  created_at: string;
}

// ─── Colores por tipo de log ──────────────────────────────────────────────────
function getLogColor(tipo: string): string {
  switch (tipo) {
    case 'incoming':      return '#4ADE80';
    case 'outgoing':      return '#60A5FA';
    case 'button':        return '#FBBF24';
    case 'gemini_response': return '#C084FC';
    case 'error':         return '#F87171';
    case 'raw_incoming':  return '#94A3B8';
    case 'sistema':       return '#34D399';
    default:              return '#94A3B8';
  }
}

function getLogIcon(tipo: string): string {
  switch (tipo) {
    case 'incoming':      return '📨';
    case 'outgoing':      return '📤';
    case 'button':        return '🔘';
    case 'gemini_response': return '🤖';
    case 'error':         return '❌';
    case 'raw_incoming':  return '📡';
    case 'sistema':       return '⚙️';
    default:              return '•';
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Panel Principal ──────────────────────────────────────────────────────────
export default function WhatsAppAdminPanel() {
  const { isDeveloper, userRol, isLoading } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const isDevUser = isDeveloper || rolLower === 'developer' || rolLower === 'desarrollador';

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [destinatario, setDestinatario] = useState('584123757313');
  const [mensajePrueba, setMensajePrueba] = useState('Prueba MetricallBot 🤖');
  const [enviando, setEnviando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  // ── Cargar logs iniciales ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDevUser) return;
    cargarLogs();
    const canal = supabase
      .channel('whatsapp_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_webhook_logs' },
        (payload) => {
          setLogs((prev) => [payload.new as WebhookLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [isDevUser]);

  async function cargarLogs() {
    setCargando(true);
    const { data } = await supabase
      .from('whatsapp_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    setLogs(data || []);
    setCargando(false);
  }

  // ── Enviar mensaje de prueba via API Vercel ────────────────────────────────
  async function enviarMensajePrueba() {
    if (!destinatario.trim() || !mensajePrueba.trim()) return;
    setEnviando(true);
    setStatusEnvio(null);

    try {
      const ACCESS_TOKEN = 'EABCWkEzhIB0BSVmIhtsFl1mpzi2NdsgR8zjRioYmxmKZCv9ZBpfJPkgqunFGRdOYH7WVAETMQyQXI9N1tn4jnfahZCZCyga34ld1AZBAla866ybZA4IHaZACFUwZBBR2zzuHSvqpSj5brXnvZCMZC6xZBGRqtiaKJz7dQP7MjHH8Klo0xm8ZACUFPyqf9bV86eICUgZDZD';
      const PHONE_ID = '1327272020463323';

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
        {
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
        }
      );

      const data = await response.json();

      if (data?.messages?.[0]?.id) {
        setStatusEnvio('✅ Enviado: ' + data.messages[0].id.slice(0, 30) + '...');
        await supabase.from('whatsapp_webhook_logs').insert({
          tipo: 'outgoing',
          numero_telefono: destinatario,
          mensaje_texto: mensajePrueba,
          contenido: data,
        });
      } else {
        setStatusEnvio('❌ Error: ' + JSON.stringify(data?.error?.message || data));
      }
    } catch (e: unknown) {
      setStatusEnvio('❌ Error de red: ' + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' }}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  if (!isDevUser) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: '#F87171', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Acceso Restringido</Text>
        <Text style={{ color: '#8C9BAB', fontSize: 14, textAlign: 'center' }}>
          Este módulo está reservado exclusivamente para el desarrollador del sistema.
        </Text>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>🤖 WhatsApp Bot Admin</Text>
          <Text style={s.headerSub}>Consola en tiempo real · MetricallBot</Text>
        </View>

        {/* Panel de envío de prueba */}
        <View style={s.sendPanel}>
          <Text style={s.panelTitle}>📤 Enviar mensaje de prueba</Text>
          <TextInput
            style={s.input}
            value={destinatario}
            onChangeText={setDestinatario}
            placeholder="Número (ej: 584123757313)"
            placeholderTextColor="#4A5568"
            keyboardType="phone-pad"
          />
          <TextInput
            style={[s.input, { marginTop: 8 }]}
            value={mensajePrueba}
            onChangeText={setMensajePrueba}
            placeholder="Mensaje de prueba..."
            placeholderTextColor="#4A5568"
          />
          <TouchableOpacity
            style={[s.sendBtn, enviando && { opacity: 0.6 }]}
            onPress={enviarMensajePrueba}
            disabled={enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.sendBtnText}>Enviar Mensaje ➜</Text>
            }
          </TouchableOpacity>
          {statusEnvio && <Text style={s.statusText}>{statusEnvio}</Text>}
        </View>

        {/* Consola de Logs */}
        <View style={s.consoleHeader}>
          <Text style={s.consoleTitle}>📋 Consola de Eventos en Vivo</Text>
          <TouchableOpacity onPress={cargarLogs}>
            <Text style={s.refreshBtn}>↻ Actualizar</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator style={{ marginTop: 32 }} color="#4ADE80" size="large" />
        ) : (
          <FlatList
            ref={listRef}
            data={logs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={s.emptyText}>No hay eventos aún. Escríbele al bot desde WhatsApp.</Text>
            }
            renderItem={({ item }) => (
              <View style={[s.logCard, { borderLeftColor: getLogColor(item.tipo) }]}>
                <View style={s.logRow}>
                  <Text style={[s.logTipo, { color: getLogColor(item.tipo) }]}>
                    {getLogIcon(item.tipo)} {item.tipo.toUpperCase()}
                  </Text>
                  <Text style={s.logTime}>{formatTime(item.created_at)}</Text>
                </View>
                {item.numero_telefono && (
                  <Text style={s.logPhone}>📱 {item.numero_telefono}</Text>
                )}
                {item.mensaje_texto && (
                  <Text style={s.logMsg}>{item.mensaje_texto}</Text>
                )}
                {item.contenido && Object.keys(item.contenido).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={s.logJson}>
                      {JSON.stringify(item.contenido, null, 2)}
                    </Text>
                  </ScrollView>
                )}
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3' },
  headerSub: { fontSize: 12, color: '#8B949E', marginTop: 2 },
  sendPanel: {
    margin: 12,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  panelTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 10 },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E6EDF3',
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusText: { marginTop: 8, fontSize: 12, color: '#8B949E' },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#161B22',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#21262D',
  },
  consoleTitle: { fontSize: 13, fontWeight: '600', color: '#8B949E' },
  refreshBtn: { fontSize: 13, color: '#58A6FF' },
  logCard: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logTipo: { fontSize: 11, fontWeight: '700' },
  logTime: { fontSize: 11, color: '#8B949E' },
  logPhone: { fontSize: 12, color: '#79C0FF', marginBottom: 2 },
  logMsg: { fontSize: 13, color: '#E6EDF3', marginBottom: 4 },
  logJson: {
    fontSize: 10,
    color: '#8B949E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  emptyText: { textAlign: 'center', color: '#8B949E', marginTop: 40, fontSize: 14 },
});
