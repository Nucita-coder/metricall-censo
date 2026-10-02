import React, { useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react-native';
import { useNotificationContext, NotificacionItem } from '../../context/NotificationContext';
import { SelectDropdown } from '../venta/CamposVenta';
import { NotificationCardItem } from './NotificationCardItem';
import { styles } from './modalNotificacionesStyles';

interface ModalNotificacionesProps {
  visible: boolean;
  onClose: () => void;
}

const OPCIONES_FILTRO = [
  'TODAS',
  'NO LEÍDAS',
  'ASIGNACIONES',
  'MENSAJES',
  'ALMACÉN',
  'COBRANZA',
];

export function ModalNotificaciones({ visible, onClose }: ModalNotificacionesProps) {
  const {
    notificaciones,
    unreadCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarLeidas,
    navegarDesdeNotificacion,
    solicitarPermisosWeb,
    webPermisosActivos,
  } = useNotificationContext();

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [filtro, setFiltro] = useState<string>('TODAS');

  const notificacionesFiltradas = useMemo(() => {
    return notificaciones.filter((item) => {
      if (filtro === 'NO LEÍDAS') return !item.leida;
      if (filtro === 'ASIGNACIONES') return item.tipo === 'asignacion';
      if (filtro === 'MENSAJES') return item.tipo === 'mensaje';
      if (filtro === 'ALMACÉN') return item.tipo === 'almacen';
      if (filtro === 'COBRANZA') return item.tipo === 'cobranza';
      return true;
    });
  }, [notificaciones, filtro]);

  const handleItemPress = async (item: NotificacionItem) => {
    if (!item.leida) {
      await marcarComoLeida(item.id);
    }
    onClose();
    await navegarDesdeNotificacion(item);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.modalContainer,
            {
              width: isDesktop ? 430 : '95%',
              marginTop: isDesktop ? 55 : insets.top + 45,
              marginRight: isDesktop ? 20 : '2.5%',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={18} color="#B6C2CF" />
              <Text style={styles.headerTitle}>NOTIFICACIONES</Text>
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Cerrar modal">
              <X size={18} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* Banner de Permisos Web/PWA si no están concedidos */}
          {!webPermisosActivos && Platform.OS === 'web' && (
            <View style={styles.permissionBanner}>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>Alertas en tu teléfono</Text>
                <Text style={styles.permissionSubtitle}>
                  Actívalas para recibir avisos de asignaciones al instante.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={async () => {
                  await solicitarPermisosWeb();
                }}
              >
                <Text style={styles.permissionBtnText}>ACTIVAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Barra de Filtro y Acciones Rápidas */}
          <View style={styles.filterRow}>
            <View style={styles.filterDropdownWrapper}>
              <SelectDropdown
                label="Filtro"
                hideLabel
                compact
                options={OPCIONES_FILTRO}
                value={filtro}
                onSelect={(val) => setFiltro(val)}
              />
            </View>

            <View style={styles.actionBtnsGroup}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={marcarTodasComoLeidas}
                  accessibilityLabel="Marcar todas como leídas"
                >
                  <CheckCheck size={14} color="#B6C2CF" />
                  <Text style={styles.actionPillText}>LEER TODO</Text>
                </TouchableOpacity>
              )}
              {notificaciones.some((n) => n.leida) && (
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={limpiarLeidas}
                  accessibilityLabel="Limpiar notificaciones leídas"
                >
                  <Trash2 size={13} color="#8C9BAB" />
                  <Text style={styles.actionPillTextMuted}>LIMPIAR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Lista de Notificaciones */}
          <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
            {notificacionesFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bell size={32} color="#384148" />
                <Text style={styles.emptyText}>No hay notificaciones en este filtro.</Text>
              </View>
            ) : (
              notificacionesFiltradas.map((item) => (
                <NotificationCardItem
                  key={item.id}
                  item={item}
                  onPress={handleItemPress}
                  onMarcarLeida={marcarComoLeida}
                  onEliminar={eliminarNotificacion}
                />
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
