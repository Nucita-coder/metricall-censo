import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Bell, Check, Trash2, MessageSquare, Package, CreditCard, Info } from 'lucide-react-native';
import { NotificacionItem, TipoNotificacion, extraerTituloYDetalle } from '../../context/NotificationContext';
import { styles } from './modalNotificacionesStyles';

interface NotificationCardItemProps {
  item: NotificacionItem;
  onPress: (item: NotificacionItem) => void;
  onMarcarLeida: (id: string) => void;
  onEliminar: (id: string) => void;
}

function getBadgeText(tipo?: TipoNotificacion): string {
  switch (tipo) {
    case 'asignacion':
      return 'ASIGNACIÓN';
    case 'mensaje':
      return 'MENSAJE';
    case 'almacen':
      return 'ALMACÉN';
    case 'cobranza':
      return 'COBRANZA';
    case 'sistema':
      return 'SISTEMA';
    default:
      return 'GENERAL';
  }
}

function getIcon(tipo?: TipoNotificacion) {
  switch (tipo) {
    case 'mensaje':
      return <MessageSquare size={14} color="#8C9BAB" />;
    case 'almacen':
      return <Package size={14} color="#8C9BAB" />;
    case 'cobranza':
      return <CreditCard size={14} color="#8C9BAB" />;
    case 'sistema':
      return <Info size={14} color="#8C9BAB" />;
    default:
      return <Bell size={14} color="#8C9BAB" />;
  }
}

function formatearFecha(isoString: string): string {
  try {
    const date = new Date(isoString);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} d`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return '';
  }
}

export function NotificationCardItem({
  item,
  onPress,
  onMarcarLeida,
  onEliminar,
}: NotificationCardItemProps) {
  const { titulo, detalle } = extraerTituloYDetalle(item.mensaje, item.tipo || 'general');

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        {
          backgroundColor: item.leida ? '#1D2125' : '#22272B',
          borderColor: item.leida ? '#2C333A' : '#384148',
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemTypeRow}>
          {getIcon(item.tipo)}
          <View style={styles.itemBadge}>
            <Text style={styles.itemBadgeText}>{getBadgeText(item.tipo)}</Text>
          </View>
          {!item.leida && <View style={styles.unreadIndicatorDot} />}
        </View>
        <Text style={styles.itemDate}>{formatearFecha(item.created_at)}</Text>
      </View>

      {titulo ? (
        <Text
          style={[
            styles.itemTitle,
            { color: item.leida ? '#B6C2CF' : '#FFFFFF' },
          ]}
          numberOfLines={1}
        >
          {titulo}
        </Text>
      ) : null}

      <Text
        style={[
          styles.itemMessage,
          { color: item.leida ? '#8C9BAB' : '#B6C2CF', fontWeight: item.leida ? 'normal' : '500' },
        ]}
        numberOfLines={3}
      >
        {detalle}
      </Text>

      <View style={styles.itemFooter}>
        {!item.leida ? (
          <TouchableOpacity
            style={styles.miniBtn}
            onPress={() => onMarcarLeida(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Check size={12} color="#8C9BAB" />
            <Text style={styles.miniBtnText}>Leída</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <TouchableOpacity
          style={styles.miniBtn}
          onPress={() => onEliminar(item.id)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Trash2 size={12} color="#8C9BAB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
