import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Paperclip,
  X,
  User,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToSupabase } from '../../services/uploadImage';
import { MensajeGlobal, ElementoAdjunto, enviarMensaje } from '../../services/mensajesService';
import { MensajeBubble } from './MensajeBubble';

interface ChatRoomProps {
  currentUserId: string;
  empresaId: string;
  chatUsuarioId: string;
  chatUsuarioNombre: string;
  mensajes: MensajeGlobal[];
  loading: boolean;
  onVolver?: () => void;
  onAbrirAdjuntos: () => void;
  elementoAdjuntoSeleccionado: ElementoAdjunto | null;
  onLimpiarAdjunto: () => void;
  onReloadChat: () => void;
}

export function ChatRoom({
  currentUserId,
  empresaId,
  chatUsuarioId,
  chatUsuarioNombre,
  mensajes,
  loading,
  onVolver,
  onAbrirAdjuntos,
  elementoAdjuntoSeleccionado,
  onLimpiarAdjunto,
  onReloadChat,
}: ChatRoomProps) {
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [mensajes]);

  const handleEnviar = async () => {
    const textoFinal = nuevoTexto.trim();
    if (!textoFinal && !elementoAdjuntoSeleccionado) return;

    try {
      setSending(true);
      setNuevoTexto('');
      const adjunto = elementoAdjuntoSeleccionado || undefined;
      onLimpiarAdjunto();

      const ok = await enviarMensaje(
        empresaId,
        currentUserId,
        chatUsuarioId,
        textoFinal || `📌 Adjunto: ${adjunto?.titulo}`,
        adjunto
      );

      if (ok) {
        onReloadChat();
      }
    } catch (e: any) {
      console.error('Error al enviar en ChatRoom:', e.message);
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
        setUploadingImg(true);
        const url = await uploadImageToSupabase(res.assets[0].uri, 'adjuntos', 'soporte');
        if (url) {
          await enviarMensaje(empresaId, currentUserId, chatUsuarioId, `[IMG]${url}`);
          onReloadChat();
        }
      }
    } catch (e: any) {
      console.error('Error al subir imagen:', e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera Chat */}
      <View style={styles.header}>
        {onVolver && (
          <TouchableOpacity onPress={onVolver} style={{ marginRight: 10 }}>
            <ArrowLeft size={20} color="#B6C2CF" />
          </TouchableOpacity>
        )}
        <View style={styles.avatarCircle}>
          <User size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatNombre}>{chatUsuarioNombre}</Text>
          <Text style={styles.chatEstado}>Mensajería en tiempo real</Text>
        </View>
      </View>

      {/* Feed de Mensajes */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0C66E4" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatBody}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {mensajes.length === 0 ? (
            <Text style={styles.emptyText}>
              Inicia la conversación con {chatUsuarioNombre}. Puedes adjuntar Tableros, Listas y Tarjetas.
            </Text>
          ) : (
            mensajes.map((m, idx) => (
              <MensajeBubble
                key={m.id || `msg-${idx}`}
                mensaje={m}
                esMio={m.emisor_id === currentUserId}
                onExpandirImagen={setImagenExpandida}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Indicador de Elemento Adjunto Seleccionado en Composer */}
      {elementoAdjuntoSeleccionado && (
        <View style={styles.previewAdjuntoBar}>
          <View style={styles.badgeAdjunto}>
            <Text style={styles.badgeAdjuntoTexto}>
              📌 {elementoAdjuntoSeleccionado.tipo.toUpperCase()}: {elementoAdjuntoSeleccionado.titulo}
            </Text>
          </View>
          <TouchableOpacity onPress={onLimpiarAdjunto}>
            <X size={16} color="#B6C2CF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Footer / Input Composer */}
      <View style={styles.inputFooter}>
        <TouchableOpacity
          style={styles.btnIcon}
          onPress={handleAdjuntarImagen}
          disabled={uploadingImg || sending}
        >
          {uploadingImg ? (
            <ActivityIndicator size="small" color="#0C66E4" />
          ) : (
            <ImageIcon size={20} color="#8C9BAB" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnIcon}
          onPress={onAbrirAdjuntos}
          disabled={sending}
        >
          <Paperclip size={20} color="#579DFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Escribe un mensaje o menciona un elemento..."
          placeholderTextColor="#8C9BAB"
          value={nuevoTexto}
          onChangeText={setNuevoTexto}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.btnSend,
            (!nuevoTexto.trim() && !elementoAdjuntoSeleccionado || sending) && { opacity: 0.5 },
          ]}
          onPress={handleEnviar}
          disabled={(!nuevoTexto.trim() && !elementoAdjuntoSeleccionado) || sending}
        >
          <Send size={18} color="#FFF" />
        </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    backgroundColor: '#22272B',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatNombre: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatEstado: {
    color: '#8C9BAB',
    fontSize: 11,
  },
  chatBody: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8C9BAB',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  previewAdjuntoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C333A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  badgeAdjunto: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAdjuntoTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
    backgroundColor: '#22272B',
    gap: 8,
  },
  btnIcon: {
    padding: 8,
    borderRadius: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    color: '#B6C2CF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
  },
  btnSend: {
    backgroundColor: '#0C66E4',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullImg: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullImg: {
    width: '90%',
    height: '80%',
  },
});
