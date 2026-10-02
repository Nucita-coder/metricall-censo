import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink, X, Bell, MessageSquare, Package, CreditCard, Info } from 'lucide-react-native';
import { useNotificationContext, TipoNotificacion } from '../../context/NotificationContext';

function getBadgeLabel(tipo: TipoNotificacion): string {
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
      return 'NOTIFICACIÓN';
  }
}

function getIconForTipo(tipo: TipoNotificacion) {
  switch (tipo) {
    case 'mensaje':
      return <MessageSquare size={16} color="#B6C2CF" />;
    case 'almacen':
      return <Package size={16} color="#B6C2CF" />;
    case 'cobranza':
      return <CreditCard size={16} color="#B6C2CF" />;
    case 'sistema':
      return <Info size={16} color="#B6C2CF" />;
    default:
      return <Bell size={16} color="#B6C2CF" />;
  }
}

export function InAppNotificationToast() {
  const { activeToast, cerrarToast, navegarDesdeNotificacion } = useNotificationContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          tension: 65,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [activeToast, translateY, opacity]);

  if (!activeToast) return null;

  const handleAction = () => {
    if (activeToast.onPressAction) {
      activeToast.onPressAction();
      cerrarToast();
    } else {
      navegarDesdeNotificacion(activeToast);
    }
  };

  const topOffset = Platform.OS === 'web' ? 16 : insets.top + 8;

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: topOffset,
          width: isDesktop ? 440 : '92%',
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.toastContainer}
        activeOpacity={0.92}
        onPress={handleAction}
        accessibilityRole="button"
        accessibilityLabel={`Notificación: ${activeToast.titulo}. ${activeToast.mensaje}`}
      >
        <View style={styles.iconContainer}>
          {getIconForTipo(activeToast.tipo)}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{getBadgeLabel(activeToast.tipo)}</Text>
            </View>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {activeToast.titulo}
            </Text>
          </View>
          <Text style={styles.toastMessage} numberOfLines={2}>
            {activeToast.mensaje}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAction}
            accessibilityLabel="Ver detalle"
          >
            <Text style={styles.actionBtnText}>VER</Text>
            <ExternalLink size={12} color="#B6C2CF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={cerrarToast}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Cerrar notificación"
          >
            <X size={15} color="#8C9BAB" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999999,
  },
  toastContainer: {
    backgroundColor: '#2C333A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#384148',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  toastMessage: {
    fontSize: 12,
    color: '#B6C2CF',
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  closeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
