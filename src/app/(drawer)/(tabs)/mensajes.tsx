import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  UsuarioConversacion,
  MensajeGlobal,
  ElementoAdjunto,
  PerfilUsuario,
  obtenerConversaciones,
  obtenerMensajesChat,
  marcarMensajesLeidos,
} from '../../../services/mensajesService';
import { ConversacionesList } from '../../../components/mensajes/ConversacionesList';
import { ChatRoom } from '../../../components/mensajes/ChatRoom';
import { ModalAdjuntarElemento } from '../../../components/mensajes/ModalAdjuntarElemento';
import { ModalNuevoChat } from '../../../components/mensajes/ModalNuevoChat';

export default function MensajesScreen() {
  const { session, empresaId } = useAuth();
  const currentUserId = session?.user?.id;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [conversaciones, setConversaciones] = useState<UsuarioConversacion[]>([]);
  const [chatActivoUser, setChatActivoUser] = useState<PerfilUsuario | null>(null);

  const [loadingChat, setLoadingChat] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeGlobal[]>([]);
  const [adjuntoSeleccionado, setAdjuntoSeleccionado] = useState<ElementoAdjunto | null>(null);

  const [showNuevoChatModal, setShowNuevoChatModal] = useState(false);
  const [showAdjuntarModal, setShowAdjuntarModal] = useState(false);

  const cargarConversacionesList = useCallback(async () => {
    if (!currentUserId || !empresaId) return;
    try {
      setLoadingConvs(true);
      const res = await obtenerConversaciones(currentUserId, empresaId);
      setConversaciones(res);
    } catch (e: any) {
      console.error('Error cargando conversaciones:', e.message);
    } finally {
      setLoadingConvs(false);
    }
  }, [currentUserId, empresaId]);

  const cargarMensajesDelChat = useCallback(async (otroUserId: string) => {
    if (!currentUserId) return;
    try {
      setLoadingChat(true);
      const data = await obtenerMensajesChat(currentUserId, otroUserId);
      setMensajes(data);
      await marcarMensajesLeidos(currentUserId, otroUserId);
      await cargarConversacionesList();
    } catch (e: any) {
      setMensajes([]);
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId, cargarConversacionesList]);

  useEffect(() => {
    if (empresaId && currentUserId) {
      cargarConversacionesList();
    }
  }, [empresaId, currentUserId, cargarConversacionesList]);

  // Realtime subscription
  useEffect(() => {
    if (!empresaId || !currentUserId) return;

    const channel = supabase
      .channel('messenger_realtime_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soporte_mensajes', filter: `empresa_id=eq.${empresaId}` },
        (payload) => {
          const nuevoMsg = payload.new as MensajeGlobal;
          if (
            chatActivoUser &&
            ((nuevoMsg.emisor_id === currentUserId && nuevoMsg.receptor_id === chatActivoUser.id) ||
              (nuevoMsg.receptor_id === currentUserId && nuevoMsg.emisor_id === chatActivoUser.id))
          ) {
            setMensajes((prev) => (prev.some((m) => m.id === nuevoMsg.id) ? prev : [...prev, nuevoMsg]));
            if (nuevoMsg.receptor_id === currentUserId) {
              marcarMensajesLeidos(currentUserId, chatActivoUser.id);
            }
          }
          cargarConversacionesList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, currentUserId, chatActivoUser, cargarConversacionesList]);

  const handleSelectConversacion = (conv: UsuarioConversacion) => {
    const usuario: PerfilUsuario = {
      id: conv.usuario_id,
      nombre_completo: conv.nombre_completo,
      rol: conv.rol,
    };
    setChatActivoUser(usuario);
    setAdjuntoSeleccionado(null);
    cargarMensajesDelChat(conv.usuario_id);
  };

  const handleSelectNuevoChat = (usuario: PerfilUsuario) => {
    setChatActivoUser(usuario);
    setAdjuntoSeleccionado(null);
    cargarMensajesDelChat(usuario.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.layoutRow}>
        {/* Panel Izquierdo: Lista de Conversaciones */}
        {(isDesktop || !chatActivoUser) && (
          <View style={[styles.sidebar, isDesktop ? { width: 340 } : { flex: 1 }]}>
            <ConversacionesList
              conversaciones={conversaciones}
              chatActivoId={chatActivoUser?.id || null}
              loading={loadingConvs}
              onSelectConversacion={handleSelectConversacion}
              onAbrirNuevoChat={() => setShowNuevoChatModal(true)}
            />
          </View>
        )}

        {/* Panel Derecho: Chat Activo */}
        {(isDesktop || chatActivoUser) && (
          <View style={styles.mainChat}>
            {chatActivoUser && currentUserId && empresaId ? (
              <ChatRoom
                currentUserId={currentUserId}
                empresaId={empresaId}
                chatUsuarioId={chatActivoUser.id}
                chatUsuarioNombre={chatActivoUser.nombre_completo}
                mensajes={mensajes}
                loading={loadingChat}
                onVolver={!isDesktop ? () => setChatActivoUser(null) : undefined}
                onAbrirAdjuntos={() => setShowAdjuntarModal(true)}
                elementoAdjuntoSeleccionado={adjuntoSeleccionado}
                onLimpiarAdjunto={() => setAdjuntoSeleccionado(null)}
                onReloadChat={() => cargarMensajesDelChat(chatActivoUser.id)}
              />
            ) : (
              <View style={styles.noChatSelected}>
                <MessageSquare size={48} color="#384148" />
                <Text style={styles.noChatTitle}>Messenger Global</Text>
                <Text style={styles.noChatSub}>
                  Selecciona una conversación o inicia un nuevo chat para enviar mensajes y mencionar Tableros, Listas y Tarjetas.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Modals centrados compactos */}
      {empresaId && currentUserId && (
        <>
          <ModalNuevoChat
            visible={showNuevoChatModal}
            empresaId={empresaId}
            currentUserId={currentUserId}
            onClose={() => setShowNuevoChatModal(false)}
            onSelectUsuario={handleSelectNuevoChat}
          />

          <ModalAdjuntarElemento
            visible={showAdjuntarModal}
            empresaId={empresaId}
            onClose={() => setShowAdjuntarModal(false)}
            onSelectElemento={(elem) => setAdjuntoSeleccionado(elem)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    height: '100%',
  },
  mainChat: {
    flex: 1,
    height: '100%',
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1D2125',
  },
  noChatTitle: {
    color: '#B6C2CF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noChatSub: {
    color: '#8C9BAB',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 380,
    lineHeight: 20,
  },
});
