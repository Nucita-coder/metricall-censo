import { useNotificationContext, NotificacionItem } from '../context/NotificationContext';

export type Notificacion = NotificacionItem;

export function useNotificaciones(_userId?: string | undefined) {
  const context = useNotificationContext();
  return {
    notificaciones: context.notificaciones,
    unreadCount: context.unreadCount,
    unreadChatCount: context.unreadChatCount,
    activeToast: context.activeToast,
    mostrarToast: context.mostrarToast,
    cerrarToast: context.cerrarToast,
    marcarComoLeida: context.marcarComoLeida,
    marcarTodasComoLeidas: context.marcarTodasComoLeidas,
    eliminarNotificacion: context.eliminarNotificacion,
    limpiarLeidas: context.limpiarLeidas,
    navegarDesdeNotificacion: context.navegarDesdeNotificacion,
  };
}

