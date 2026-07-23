import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { X, Send, LifeBuoy, User, MessageSquare, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../services/uploadImage';
import { styles } from './ModalSoporteTecnico.styles';

interface ModalSoporteTecnicoProps {
  visible: boolean;
  onClose: () => void;
}

interface MensajeSoporte {
  id: string;
  empresa_id: string;
  emisor_id: string;
  receptor_id: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

interface UsuarioConversacion {
  usuario_id: string;
  nombre_completo: string;
  ultimo_mensaje: string;
  created_at: string;
  sin_leer: number;
}

export function ModalSoporteTecnico({ visible, onClose }: ModalSoporteTecnicoProps) {
  const { session, empresaId } = useAuth();
  const currentUserId = session?.user?.id;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [loading, setLoading] = useState(true);
  const [soporteId, setSoporteId] = useState<string | null>(null);
  const [soporteNombre, setSoporteNombre] = useState<string>('Soporte Técnico');
  const [isEsSoporte, setIsEsSoporte] = useState<boolean>(false);

  const [mensajes, setMensajes] = useState<MensajeSoporte[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);

  const [conversaciones, setConversaciones] = useState<UsuarioConversacion[]>([]);
  const [chatActivoUserId, setChatActivoUserId] = useState<string | null>(null);
  const [chatActivoNombre, setChatActivoNombre] = useState<string>('');

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && empresaId && currentUserId) {
      inicializarSoporte();
    }
  }, [visible, empresaId, currentUserId]);

  const inicializarSoporte = async () => {
    if (!currentUserId || !empresaId) return;
    try {
      setLoading(true);
      const { data: empData, error: empError } = await supabase
        .from('empresas')
        .select('soporte_tecnico_id')
        .eq('id', empresaId)
        .maybeSingle();

      if (empError) setSoporteId(null);
      const techId = empData?.soporte_tecnico_id;
      setSoporteId(techId || null);

      if (techId) {
        const { data: perfData } = await supabase.from('perfiles').select('nombre_completo').eq('id', techId).single();
        if (perfData) setSoporteNombre(perfData.nombre_completo);

        const esSoporteUser = currentUserId === techId;
        setIsEsSoporte(esSoporteUser);

        if (esSoporteUser) {
          await cargarConversacionesSoporte(techId);
        } else {
          await cargarMensajesChat(currentUserId, techId);
        }
      }
    } catch (e: any) {
      console.error('Error al inicializar soporte:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarConversacionesSoporte = async (techId: string) => {
    try {
      const { data, error } = await supabase
        .from('soporte_mensajes')
        .select('id, emisor_id, receptor_id, mensaje, created_at, leido, perfiles:emisor_id(nombre_completo)')
        .or(`receptor_id.eq.${techId},emisor_id.eq.${techId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapConversaciones = new Map<string, UsuarioConversacion>();
      (data || []).forEach((m: any) => {
        const otroId = m.emisor_id === techId ? m.receptor_id : m.emisor_id;
        const nombreOtro = m.perfiles?.nombre_completo || 'Usuario';
        if (!mapConversaciones.has(otroId)) {
          mapConversaciones.set(otroId, {
            usuario_id: otroId,
            nombre_completo: nombreOtro,
            ultimo_mensaje: m.mensaje,
            created_at: m.created_at,
            sin_leer: !m.leido && m.receptor_id === techId ? 1 : 0,
          });
        }
      });
      setConversaciones(Array.from(mapConversaciones.values()));
    } catch (e: any) {
      console.error('Error al cargar conversaciones:', e.message);
    }
  };

  const formatHora = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
  };

  const cargarMensajesChat = async (user1: string, user2: string) => {
    try {
      const { data, error } = await supabase
        .from('soporte_mensajes')
        .select('*')
        .or(`and(emisor_id.eq.${user1},receptor_id.eq.${user2}),and(emisor_id.eq.${user2},receptor_id.eq.${user1})`)
        .order('created_at', { ascending: true });

      if (error) { setMensajes([]); return; }
      setMensajes(data || []);

      if (data && data.length > 0 && currentUserId) {
        const noLeidosIds = data.filter((m) => m.receptor_id === currentUserId && !m.leido).map((m) => m.id);
        if (noLeidosIds.length > 0) {
          await supabase.from('soporte_mensajes').update({ leido: true }).in('id', noLeidosIds);
        }
      }
    } catch (e: any) {
      setMensajes([]);
    }
  };

  useEffect(() => {
    if (!visible || !empresaId || !currentUserId) return;
    const channel = supabase.channel('soporte_realtime_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'soporte_mensajes', filter: `empresa_id=eq.${empresaId}` }, (payload) => {
        const nuevoMsg = payload.new as MensajeSoporte;
        if (
          (nuevoMsg.emisor_id === currentUserId && nuevoMsg.receptor_id === (chatActivoUserId || soporteId)) ||
          (nuevoMsg.receptor_id === currentUserId && nuevoMsg.emisor_id === (chatActivoUserId || soporteId))
        ) {
          setMensajes((prev) => (prev.some((x) => x.id === nuevoMsg.id) ? prev : [...prev, nuevoMsg]));
        }
        if (isEsSoporte && soporteId) cargarConversacionesSoporte(soporteId);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [visible, empresaId, currentUserId, chatActivoUserId, soporteId, isEsSoporte]);

  const handleEnviarMensaje = async (textoOverride?: string) => {
    const textoAEnviar = textoOverride || nuevoMensaje.trim();
    if (!textoAEnviar || !currentUserId || !empresaId) return;

    const receptorId = isEsSoporte ? chatActivoUserId : soporteId;
    if (!receptorId) return;

    try {
      setSending(true);
      if (!textoOverride) setNuevoMensaje('');

      const { error } = await supabase.from('soporte_mensajes').insert({
        empresa_id: empresaId,
        emisor_id: currentUserId,
        receptor_id: receptorId,
        mensaje: textoAEnviar,
      });

      if (error) throw error;
      await cargarMensajesChat(currentUserId, receptorId);
    } catch (e: any) {
      console.error('Error enviando mensaje:', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleAdjuntarImagen = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setUploadingImage(true);
        const publicUrl = await uploadImageToSupabase(res.assets[0].uri, 'adjuntos', 'soporte');
        if (publicUrl) {
          await handleEnviarMensaje(`[IMG]${publicUrl}`);
        }
      }
    } catch (e: any) {
      console.error('Error seleccionando/subiendo imagen:', e.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isEsSoporte && chatActivoUserId && (
                <TouchableOpacity onPress={() => setChatActivoUserId(null)} style={{ marginRight: 10 }}>
                  <ArrowLeft size={20} color="#B6C2CF" />
                </TouchableOpacity>
              )}
              <LifeBuoy size={22} color="#0C66E4" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.title}>Soporte Técnico</Text>
                <Text style={styles.subtitle}>
                  {isEsSoporte ? (chatActivoUserId ? `Chat con ${chatActivoNombre}` : 'Bandeja de Consultas') : (soporteId ? `Encargado: ${soporteNombre}` : 'Sin encargado asignado')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={22} color="#B6C2CF" /></TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>
          ) : !soporteId ? (
            <View style={styles.centered}>
              <LifeBuoy size={48} color="#384148" />
              <Text style={styles.emptyTitle}>Soporte no disponible</Text>
              <Text style={styles.emptySub}>El Administrador aún no ha asignado un encargado de Soporte Técnico.</Text>
            </View>
          ) : isEsSoporte && !chatActivoUserId ? (
            <ScrollView style={styles.chatBody} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.sectionTitle}>Conversaciones ({conversaciones.length})</Text>
              {conversaciones.length === 0 ? (
                <Text style={styles.emptySub}>No hay mensajes de usuarios registrados.</Text>
              ) : (
                conversaciones.map((conv) => (
                  <TouchableOpacity key={conv.usuario_id} style={styles.convCard} onPress={() => { setChatActivoUserId(conv.usuario_id); setChatActivoNombre(conv.nombre_completo); if (currentUserId) cargarMensajesChat(currentUserId, conv.usuario_id); }}>
                    <View style={styles.avatarCircle}><User size={18} color="#FFF" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.convNombre}>{conv.nombre_completo}</Text>
                      <Text style={styles.convUltimo} numberOfLines={1}>{conv.ultimo_mensaje?.startsWith('[IMG]') ? '📷 Imagen adjunta' : conv.ultimo_mensaje}</Text>
                    </View>
                    <MessageSquare size={18} color="#8C9BAB" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView ref={scrollViewRef} style={styles.chatBody} contentContainerStyle={{ padding: 16, gap: 10 }} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
                {mensajes.length === 0 ? (
                  <Text style={styles.emptySubCenter}>{isEsSoporte ? `Inicia la conversación con ${chatActivoNombre}` : 'Escribe tu duda o consulta técnica.'}</Text>
                ) : (
                  (mensajes || []).filter((m) => m && typeof m === 'object' && m.mensaje).map((m, idx) => {
                    const esMio = m.emisor_id === currentUserId;
                    const itemKey = `${m.id || 'msg'}-${idx}`;
                    const rawMsg = (m.mensaje || '').trim();
                    const esImagen = rawMsg.startsWith('[IMG]');
                    const imgUrl = esImagen ? rawMsg.replace('[IMG]', '').trim() : null;
                    const isValidImage = Boolean(esImagen && imgUrl && imgUrl.startsWith('http'));

                    return (
                      <View key={itemKey} style={[styles.msgBubble, esMio ? styles.msgBubbleMio : styles.msgBubbleOtro]}>
                        {isValidImage && imgUrl ? (
                          <TouchableOpacity onPress={() => setImagenExpandida(imgUrl)}>
                            <Image source={{ uri: imgUrl }} style={styles.msgImgThumb} resizeMode="cover" />
                          </TouchableOpacity>
                        ) : (
                          <Text style={esMio ? styles.msgTextoMio : styles.msgTextoOtro}>{rawMsg}</Text>
                        )}
                        <Text style={styles.msgHora}>{formatHora(m.created_at)}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.inputFooter}>
                <TouchableOpacity style={styles.btnIcon} onPress={handleAdjuntarImagen} disabled={uploadingImage || sending}>
                  {uploadingImage ? <ActivityIndicator size="small" color="#0C66E4" /> : <ImageIcon size={20} color="#8C9BAB" />}
                </TouchableOpacity>

                <TextInput style={styles.textInput} placeholder="Escribe tu mensaje..." placeholderTextColor="#8C9BAB" value={nuevoMensaje} onChangeText={setNuevoMensaje} multiline />

                <TouchableOpacity style={[styles.btnSend, (!nuevoMensaje.trim() || sending) && { opacity: 0.5 }]} onPress={() => handleEnviarMensaje()} disabled={!nuevoMensaje.trim() || sending}>
                  <Send size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Modal de Imagen Expandida */}
        <Modal visible={!!imagenExpandida} transparent animationType="fade" onRequestClose={() => setImagenExpandida(null)}>
          <View style={styles.fullImgOverlay}>
            <TouchableOpacity style={styles.closeFullImg} onPress={() => setImagenExpandida(null)}>
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            {imagenExpandida && (
              <Image source={{ uri: imagenExpandida }} style={styles.fullImg} resizeMode="contain" />
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}


