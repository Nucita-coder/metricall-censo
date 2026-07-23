import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { User, MessageSquare, Plus } from 'lucide-react-native';
import { UsuarioConversacion } from '../../services/mensajesService';

interface ConversacionesListProps {
  conversaciones: UsuarioConversacion[];
  chatActivoId: string | null;
  loading: boolean;
  onSelectConversacion: (conv: UsuarioConversacion) => void;
  onAbrirNuevoChat: () => void;
}

export function ConversacionesList({
  conversaciones,
  chatActivoId,
  loading,
  onSelectConversacion,
  onAbrirNuevoChat,
}: ConversacionesListProps) {
  const formatHora = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const formatPreview = (conv: UsuarioConversacion) => {
    if (conv.adjunto) {
      return `📌 ${conv.adjunto.tipo.toUpperCase()}: ${conv.adjunto.titulo}`;
    }
    if (conv.ultimo_mensaje?.startsWith('[IMG]')) {
      return '📷 Imagen adjunta';
    }
    return conv.ultimo_mensaje || 'Inicia la conversación';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Messenger</Text>
          <Text style={styles.subtitle}>Conversaciones ({conversaciones.length})</Text>
        </View>
        <TouchableOpacity style={styles.btnNuevoChat} onPress={onAbrirNuevoChat}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.btnNuevoChatTexto}>Nuevo Chat</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0C66E4" />
        </View>
      ) : conversaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={36} color="#384148" />
          <Text style={styles.emptyTitle}>Sin conversaciones</Text>
          <Text style={styles.emptySub}>Inicia un chat con cualquier miembro de tu equipo.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: 12 }}>
          {conversaciones.map((conv) => {
            const isSelected = chatActivoId === conv.usuario_id;
            return (
              <TouchableOpacity
                key={conv.usuario_id}
                style={[styles.convCard, isSelected && styles.convCardSelected]}
                onPress={() => onSelectConversacion(conv)}
              >
                <View style={styles.avatarCircle}>
                  <User size={18} color="#FFF" />
                </View>

                <View style={styles.convContent}>
                  <View style={styles.convNameRow}>
                    <Text style={styles.convNombre} numberOfLines={1}>
                      {conv.nombre_completo}
                    </Text>
                    <Text style={styles.convHora}>{formatHora(conv.created_at)}</Text>
                  </View>

                  <View style={styles.convPreviewRow}>
                    <Text
                      style={[styles.convPreview, conv.sin_leer > 0 && styles.convPreviewUnread]}
                      numberOfLines={1}
                    >
                      {formatPreview(conv)}
                    </Text>

                    {conv.sin_leer > 0 && (
                      <View style={styles.badgeUnread}>
                        <Text style={styles.badgeUnreadTexto}>
                          {conv.sin_leer > 99 ? '99+' : conv.sin_leer}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
    borderRightWidth: 1,
    borderRightColor: '#2C333A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    backgroundColor: '#22272B',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  subtitle: {
    fontSize: 12,
    color: '#8C9BAB',
    marginTop: 2,
  },
  btnNuevoChat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C66E4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  btnNuevoChatTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySub: {
    color: '#8C9BAB',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#22272B',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  convCardSelected: {
    borderColor: '#0C66E4',
    backgroundColor: '#2C333A',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convContent: {
    flex: 1,
    marginLeft: 12,
  },
  convNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convNombre: {
    color: '#B6C2CF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  convHora: {
    color: '#8C9BAB',
    fontSize: 11,
  },
  convPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  convPreview: {
    color: '#8C9BAB',
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  convPreviewUnread: {
    color: '#FFF',
    fontWeight: '600',
  },
  badgeUnread: {
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeUnreadTexto: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
