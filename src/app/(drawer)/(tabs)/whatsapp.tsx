import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Terminal, Users } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { WhatsAppContacto, WhatsAppMensaje } from '../../../components/whatsapp/types';
import { WhatsAppContactosList } from '../../../components/whatsapp/WhatsAppContactosList';
import { WhatsAppConversacionViewer } from '../../../components/whatsapp/WhatsAppConversacionViewer';
import { WhatsAppLogsViewer } from '../../../components/whatsapp/WhatsAppLogsViewer';

export default function WhatsAppAdminPanel() {
  const { isDeveloper, userRol } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const isDevUser = isDeveloper || rolLower === 'developer' || rolLower === 'desarrollador';

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [activeTab, setActiveTab] = useState<'contactos' | 'logs'>('contactos');

  // Estado de Contactos
  const [contactos, setContactos] = useState<WhatsAppContacto[]>([]);
  const [cargandoContactos, setCargandoContactos] = useState(true);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<WhatsAppContacto | null>(null);

  // Estado de Mensajes del Contacto
  const [mensajesContacto, setMensajesContacto] = useState<WhatsAppMensaje[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [procesandoBloqueo, setProcesandoBloqueo] = useState(false);

  // Estado de Logs en vivo
  const [logs, setLogs] = useState<WhatsAppMensaje[]>([]);
  const [cargandoLogs, setCargandoLogs] = useState(true);

  // Cargar contactos
  const cargarContactos = async () => {
    try {
      setCargandoContactos(true);
      const { data, error } = await supabase
        .from('whatsapp_contactos')
        .select('*')
        .order('ultimo_contacto', { ascending: false });

      if (error) {
        console.warn('Error al cargar contactos de WhatsApp:', error.message);
      } else {
        setContactos((data as unknown as WhatsAppContacto[]) || []);
      }
    } catch (err: unknown) {
      console.warn('Excepción al cargar contactos:', err);
    } finally {
      setCargandoContactos(false);
    }
  };

  // Cargar mensajes del contacto seleccionado
  const cargarMensajesContacto = async (telefono: string) => {
    try {
      setCargandoMensajes(true);
      const cleanPhone = telefono.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('whatsapp_webhook_logs')
        .select('id, tipo, numero_telefono, mensaje_texto, contenido, created_at')
        .eq('numero_telefono', cleanPhone)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.warn('Error al cargar mensajes del contacto:', error.message);
      } else {
        setMensajesContacto((data as unknown as WhatsAppMensaje[]) || []);
      }
    } catch (err: unknown) {
      console.warn('Excepción al cargar mensajes:', err);
    } finally {
      setCargandoMensajes(false);
    }
  };

  // Cargar logs crudos de la consola
  const cargarLogs = async () => {
    try {
      setCargandoLogs(true);
      const { data } = await supabase
        .from('whatsapp_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(80);
      setLogs((data as unknown as WhatsAppMensaje[]) || []);
    } finally {
      setCargandoLogs(false);
    }
  };

  // Al seleccionar un contacto
  const handleSelectContacto = (contacto: WhatsAppContacto) => {
    setContactoSeleccionado(contacto);
    cargarMensajesContacto(contacto.numero_telefono);
  };

  // Bloquear o desbloquear contacto
  const handleToggleBloqueo = async (nuevoEstado: boolean) => {
    if (!contactoSeleccionado) return;
    try {
      setProcesandoBloqueo(true);
      const phone = contactoSeleccionado.numero_telefono;

      const { error } = await supabase
        .from('whatsapp_contactos')
        .update({ bloqueado: nuevoEstado })
        .eq('numero_telefono', phone);

      if (error) throw error;

      // Actualizar estado local
      const updatedContacto = { ...contactoSeleccionado, bloqueado: nuevoEstado };
      setContactoSeleccionado(updatedContacto);
      setContactos((prev) => prev.map((c) => (c.numero_telefono === phone ? updatedContacto : c)));

      // Registrar log de moderación
      await supabase.from('whatsapp_webhook_logs').insert({
        tipo: nuevoEstado ? 'blocked' : 'sistema',
        numero_telefono: phone,
        mensaje_texto: `Usuario ${contactoSeleccionado.nombre} ${nuevoEstado ? 'BLOQUEADO' : 'DESBLOQUEADO'} por Developer`,
        contenido: { accion: nuevoEstado ? 'bloqueo' : 'desbloqueo', moderador: 'developer' },
      });

      Alert.alert(
        nuevoEstado ? 'Usuario Bloqueado' : 'Usuario Desbloqueado',
        `El usuario ${contactoSeleccionado.nombre} ha sido ${nuevoEstado ? 'bloqueado. El bot ignorará sus mensajes.' : 'desbloqueado con normalidad.'}`
      );
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo cambiar el estado de bloqueo.');
    } finally {
      setProcesandoBloqueo(false);
    }
  };

  // Subscripciones Realtime
  useEffect(() => {
    if (!isDevUser) return;
    cargarContactos();
    cargarLogs();

    const canalContactos = supabase
      .channel('whatsapp_contactos_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_contactos' }, () => {
        cargarContactos();
      })
      .subscribe();

    const canalLogs = supabase
      .channel('whatsapp_logs_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_webhook_logs' }, (payload) => {
        const newLog = payload.new as WhatsAppMensaje;
        setLogs((prev) => [newLog, ...prev].slice(0, 100));

        // Si el log pertenece al contacto seleccionado, actualizar su chat
        if (contactoSeleccionado && newLog.numero_telefono === contactoSeleccionado.numero_telefono) {
          setMensajesContacto((prev) => [...prev, newLog]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalContactos);
      supabase.removeChannel(canalLogs);
    };
  }, [isDevUser, contactoSeleccionado?.numero_telefono]);

  if (!isDevUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.deniedText}>Acceso exclusivo para rol Developer.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Selector de Pestaña Principal */}
      <View style={styles.topTabsBar}>
        <TouchableOpacity
          style={[styles.topTab, activeTab === 'contactos' && styles.topTabActive]}
          onPress={() => setActiveTab('contactos')}
        >
          <Users size={16} color={activeTab === 'contactos' ? '#FFF' : '#8C9BAB'} />
          <Text style={[styles.topTabText, activeTab === 'contactos' && styles.topTabTextActive]}>
            Contactos & Chats ({contactos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTab, activeTab === 'logs' && styles.topTabActive]}
          onPress={() => setActiveTab('logs')}
        >
          <Terminal size={16} color={activeTab === 'logs' ? '#FFF' : '#8C9BAB'} />
          <Text style={[styles.topTabText, activeTab === 'logs' && styles.topTabTextActive]}>
            Logs del Webhook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según pestaña */}
      {activeTab === 'logs' ? (
        <WhatsAppLogsViewer logs={logs} cargando={cargandoLogs} />
      ) : isDesktop ? (
        /* Vista de Escritorio: Split View */
        <View style={styles.desktopContainer}>
          <View style={styles.leftPane}>
            <WhatsAppContactosList
              contactos={contactos}
              cargando={cargandoContactos}
              onSelectContacto={handleSelectContacto}
              onRefresh={cargarContactos}
              contactoSeleccionadoId={contactoSeleccionado?.numero_telefono}
            />
          </View>

          <View style={styles.rightPane}>
            {contactoSeleccionado ? (
              <WhatsAppConversacionViewer
                contacto={contactoSeleccionado}
                mensajes={mensajesContacto}
                cargandoMensajes={cargandoMensajes}
                onToggleBloqueo={handleToggleBloqueo}
                procesandoBloqueo={procesandoBloqueo}
              />
            ) : (
              <View style={styles.centerContainer}>
                <MessageSquare size={48} color="#2C333A" style={{ marginBottom: 12 }} />
                <Text style={styles.selectPromptTitle}>Selecciona un contacto</Text>
                <Text style={styles.selectPromptDesc}>Elige un cliente de la lista para ver su conversación, historial y moderación.</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Vista Móvil: Pantalla completa según selección */
        contactoSeleccionado ? (
          <WhatsAppConversacionViewer
            contacto={contactoSeleccionado}
            mensajes={mensajesContacto}
            cargandoMensajes={cargandoMensajes}
            onBack={() => setContactoSeleccionado(null)}
            onToggleBloqueo={handleToggleBloqueo}
            procesandoBloqueo={procesandoBloqueo}
          />
        ) : (
          <WhatsAppContactosList
            contactos={contactos}
            cargando={cargandoContactos}
            onSelectContacto={handleSelectContacto}
            onRefresh={cargarContactos}
            contactoSeleccionadoId={null}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  topTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#22272B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    gap: 12,
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
  },
  topTabActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  topTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  topTabTextActive: {
    color: '#FFF',
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    width: 380,
    borderRightWidth: 1,
    borderRightColor: '#2C333A',
  },
  rightPane: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deniedText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectPromptTitle: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectPromptDesc: {
    color: '#8C9BAB',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
  },
});
