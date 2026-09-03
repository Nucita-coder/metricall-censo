import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Calendar, Clock, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { FiltroTemporalChat, WhatsAppContacto, WhatsAppMensaje } from './types';
import { WhatsAppChatBubble } from './WhatsAppChatBubble';

interface WhatsAppConversacionViewerProps {
  contacto: WhatsAppContacto;
  mensajes: WhatsAppMensaje[];
  cargandoMensajes: boolean;
  onBack?: () => void;
  onToggleBloqueo: (bloqueado: boolean) => Promise<void>;
  procesandoBloqueo: boolean;
}

export function WhatsAppConversacionViewer({
  contacto,
  mensajes,
  cargandoMensajes,
  onBack,
  onToggleBloqueo,
  procesandoBloqueo,
}: WhatsAppConversacionViewerProps) {
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporalChat>('todos');

  const mensajesFiltrados = mensajes.filter((m) => {
    if (filtroTemporal === 'todos') return true;
    try {
      const fechaMsg = new Date(m.created_at);
      const ahora = new Date();

      if (filtroTemporal === 'semana') {
        const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        return fechaMsg >= hace7Dias;
      }
      if (filtroTemporal === 'mes') {
        const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        return fechaMsg >= hace30Dias;
      }
      if (filtroTemporal === 'dia') {
        return (
          fechaMsg.getDate() === ahora.getDate() &&
          fechaMsg.getMonth() === ahora.getMonth() &&
          fechaMsg.getFullYear() === ahora.getFullYear()
        );
      }
    } catch {
      return true;
    }
    return true;
  });

  const handleConfirmarBloqueo = () => {
    const nuevoEstado = !contacto.bloqueado;
    const accion = nuevoEstado ? 'Bloquear' : 'Desbloquear';
    const desc = nuevoEstado
      ? `¿Estás seguro de bloquear a ${contacto.nombre}? El bot no responderá a sus mensajes ni creará tarjetas en el tablero.`
      : `¿Deseas desbloquear a ${contacto.nombre}? Volverá a interactuar con normalidad.`;

    if (Platform.OS === 'web') {
      if (window.confirm(`${accion} Contacto:\n\n${desc}`)) {
        onToggleBloqueo(nuevoEstado);
      }
    } else {
      Alert.alert(accion + ' Contacto', desc, [
        { text: 'Cancelar', style: 'cancel' },
        { text: accion, style: nuevoEstado ? 'destructive' : 'default', onPress: () => onToggleBloqueo(nuevoEstado) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header del Contacto */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={20} color="#B6C2CF" />
          </TouchableOpacity>
        )}

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(contacto.nombre || 'U').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.nombreHeader} numberOfLines={1}>
            {contacto.nombre || 'Desconocido'}
          </Text>
          <Text style={styles.telefonoHeader}>+{contacto.numero_telefono}</Text>
        </View>

        {/* Botón de Moderación */}
        <TouchableOpacity
          style={[styles.moderationBtn, contacto.bloqueado ? styles.btnDesbloquear : styles.btnBloquear]}
          onPress={handleConfirmarBloqueo}
          disabled={procesandoBloqueo}
        >
          {procesandoBloqueo ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : contacto.bloqueado ? (
            <>
              <ShieldCheck size={16} color="#FFF" />
              <Text style={styles.moderationBtnText}>Desbloquear</Text>
            </>
          ) : (
            <>
              <ShieldAlert size={16} color="#FFF" />
              <Text style={styles.moderationBtnText}>Bloquear</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de Filtros Temporales */}
      <View style={styles.filtersBar}>
        <Calendar size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
        <TouchableOpacity
          style={[styles.timeChip, filtroTemporal === 'todos' && styles.timeChipActive]}
          onPress={() => setFiltroTemporal('todos')}
        >
          <Text style={[styles.timeChipText, filtroTemporal === 'todos' && styles.timeChipTextActive]}>Todo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeChip, filtroTemporal === 'semana' && styles.timeChipActive]}
          onPress={() => setFiltroTemporal('semana')}
        >
          <Text style={[styles.timeChipText, filtroTemporal === 'semana' && styles.timeChipTextActive]}>7 Días</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeChip, filtroTemporal === 'mes' && styles.timeChipActive]}
          onPress={() => setFiltroTemporal('mes')}
        >
          <Text style={[styles.timeChipText, filtroTemporal === 'mes' && styles.timeChipTextActive]}>Este Mes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeChip, filtroTemporal === 'dia' && styles.timeChipActive]}
          onPress={() => setFiltroTemporal('dia')}
        >
          <Text style={[styles.timeChipText, filtroTemporal === 'dia' && styles.timeChipTextActive]}>Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Mensajes */}
      {cargandoMensajes ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0C66E4" />
        </View>
      ) : mensajesFiltrados.length === 0 ? (
        <View style={styles.centerContainer}>
          <Clock size={36} color="#455260" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>No hay mensajes en este período de tiempo.</Text>
        </View>
      ) : (
        <FlatList
          data={mensajesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WhatsAppChatBubble item={item} contactoNombre={contacto.nombre} />
          )}
          contentContainerStyle={styles.chatListContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161A1D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#22272B',
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  backBtn: {
    paddingRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C333A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#384148',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#579DFF',
  },
  headerInfo: {
    flex: 1,
  },
  nombreHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  telefonoHeader: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  moderationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnBloquear: {
    backgroundColor: '#DC2626',
  },
  btnDesbloquear: {
    backgroundColor: '#16A34A',
  },
  moderationBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1D2125',
    borderBottomWidth: 1,
    borderBottomColor: '#282E33',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
  },
  timeChipActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  timeChipTextActive: {
    color: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#8C9BAB',
    fontSize: 14,
    textAlign: 'center',
  },
  chatListContent: {
    padding: 16,
    gap: 10,
  },
});
