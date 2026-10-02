import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { soundService } from '../services/soundService';
import { localNotificationService } from '../services/localNotificationService';
import {
  NotificationContextType,
  NotificacionItem,
  InAppToastData,
  TipoNotificacion,
  deducirTipoNotificacion,
  extraerTituloYDetalle,
} from './notificationTypes';

export * from './notificationTypes';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, empresaId } = useAuth();
  const userId = session?.user?.id;
  const router = useRouter();

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<InAppToastData | null>(null);
  const [webPermisosActivos, setWebPermisosActivos] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cerrarToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setActiveToast(null);
  }, []);

  const mostrarToast = useCallback((toast: Omit<InAppToastData, 'id'>) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const nuevoToast: InAppToastData = {
      ...toast,
      id: Math.random().toString(36).substring(2, 9),
    };
    setActiveToast(nuevoToast);
    toastTimeoutRef.current = setTimeout(() => setActiveToast(null), 4500);
  }, []);

  const fetchNotificaciones = useCallback(async () => {
    if (!userId) {
      setNotificaciones([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      const mapeadas: NotificacionItem[] = (data as NotificacionItem[]).map((n) => ({
        ...n,
        tipo: n.tipo || deducirTipoNotificacion(n.mensaje),
      }));
      setNotificaciones(mapeadas);
      setUnreadCount(mapeadas.filter((n) => !n.leida).length);
    }
  }, [userId]);

  const fetchUnreadChatCount = useCallback(async () => {
    if (!userId || !empresaId) {
      setUnreadChatCount(0);
      return;
    }

    const { count, error } = await supabase
      .from('soporte_mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('receptor_id', userId)
      .eq('empresa_id', empresaId)
      .eq('leido', false);

    if (!error && typeof count === 'number') {
      setUnreadChatCount(count);
    }
  }, [userId, empresaId]);

  const refreshNotificaciones = useCallback(async () => {
    await Promise.all([fetchNotificaciones(), fetchUnreadChatCount()]);
  }, [fetchNotificaciones, fetchUnreadChatCount]);

  useEffect(() => {
    refreshNotificaciones();
    setWebPermisosActivos(localNotificationService.isWebPermissionGranted());
  }, [refreshNotificaciones]);

  // Actualizar App Badge en el icono de la PWA (escritorio y móvil)
  useEffect(() => {
    localNotificationService.updateAppBadge(unreadCount + unreadChatCount);
  }, [unreadCount, unreadChatCount]);

  const navegarDesdeNotificacion = useCallback(
    async (item: Partial<InAppToastData> & { tarjeta_id?: string | null }) => {
      cerrarToast();
      const targetCardId = item.tarjetaId || item.tarjeta_id;

      if (item.chatUserId || item.tipo === 'mensaje') {
        router.push('/(drawer)/(tabs)/mensajes' as Href);
        return;
      }

      if (targetCardId) {
        try {
          const { data } = await supabase.from('tarjetas').select('listas (tablero_id)').eq('id', targetCardId).single();
          const listasData = data?.listas as { tablero_id?: string } | Array<{ tablero_id?: string }> | null;
          const tableroId = Array.isArray(listasData) ? listasData[0]?.tablero_id : listasData?.tablero_id;
          if (tableroId) {
            router.push(`/tablero/${tableroId}?abrirTarjeta=${targetCardId}` as Href);
            return;
          }
        } catch (e) {
          console.warn('Error navegando a tarjeta:', e);
        }
      }

      if (item.tableroId) router.push(`/tablero/${item.tableroId}` as Href);
    },
    [cerrarToast, router]
  );

  useEffect(() => {
    localNotificationService.setResponseHandler((data) => {
      navegarDesdeNotificacion({
        tarjetaId: (data.tarjetaId as string) || (data.tarjeta_id as string) || null,
        tableroId: (data.tableroId as string) || null,
        chatUserId: (data.chatUserId as string) || null,
        tipo: (data.tipo as TipoNotificacion) || 'general',
      });
    });
  }, [navegarDesdeNotificacion]);

  // Realtime: Notificaciones operativas
  useEffect(() => {
    if (!userId) return;

    const channelName = `global_notif_${userId}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const raw = payload.new as NotificacionItem;
            const nueva: NotificacionItem = {
              ...raw,
              tipo: raw.tipo || deducirTipoNotificacion(raw.mensaje),
            };

            setNotificaciones((prev) => [nueva, ...prev.filter((n) => n.id !== nueva.id)].slice(0, 30));
            setUnreadCount((prev) => prev + 1);

            soundService.playNotification('notification');
            const parsed = extraerTituloYDetalle(nueva.mensaje, nueva.tipo || 'asignacion');
            mostrarToast({
              titulo: parsed.titulo,
              mensaje: parsed.detalle,
              tipo: nueva.tipo || 'asignacion',
              tarjetaId: nueva.tarjeta_id,
            });

            localNotificationService.dispararNotificacion(parsed.titulo, parsed.detalle, {
              notificacionId: nueva.id,
              tarjetaId: nueva.tarjeta_id,
              tipo: nueva.tipo,
            });
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as NotificacionItem;
            setNotificaciones((prev) => {
              const next = prev.map((n) => (n.id === raw.id ? { ...n, ...raw } : n));
              setUnreadCount(next.filter((n) => !n.leida).length);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) {
              setNotificaciones((prev) => {
                const next = prev.filter((n) => n.id !== oldId);
                setUnreadCount(next.filter((n) => !n.leida).length);
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, mostrarToast]);

  // Realtime: Mensajes de soporte/chat
  useEffect(() => {
    if (!userId || !empresaId) return;

    const chatChannelName = `global_chat_notif_${userId}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(chatChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soporte_mensajes', filter: `receptor_id=eq.${userId}` },
        async (payload) => {
          const nuevoMsg = payload.new as {
            id: string;
            emisor_id: string;
            mensaje: string;
            tarjeta_id?: string | null;
          };

          setUnreadChatCount((prev) => prev + 1);
          soundService.playNotification('new_message');

          let remitente = 'Compañero de equipo';
          try {
            const { data: emisor } = await supabase
              .from('perfiles')
              .select('nombre_completo')
              .eq('id', nuevoMsg.emisor_id)
              .single();
            if (emisor?.nombre_completo) remitente = emisor.nombre_completo;
          } catch (_) {}

          mostrarToast({
            titulo: remitente,
            mensaje: nuevoMsg.mensaje.startsWith('[IMG]') ? 'Envió una imagen adjunta' : nuevoMsg.mensaje,
            tipo: 'mensaje',
            chatUserId: nuevoMsg.emisor_id,
            tarjetaId: nuevoMsg.tarjeta_id,
          });

          localNotificationService.dispararNotificacion(remitente, nuevoMsg.mensaje, {
            chatUserId: nuevoMsg.emisor_id,
            tarjetaId: nuevoMsg.tarjeta_id,
            tipo: 'mensaje',
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'soporte_mensajes', filter: `receptor_id=eq.${userId}` },
        () => fetchUnreadChatCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, empresaId, mostrarToast, fetchUnreadChatCount]);

  const marcarComoLeida = async (id: string) => {
    const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    if (!error) {
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (!userId) return;
    const unreadIds = notificaciones.filter((n) => !n.leida).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from('notificaciones').update({ leida: true }).in('id', unreadIds);
    if (!error) {
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    const { error } = await supabase.from('notificaciones').delete().eq('id', id);
    if (!error) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => notificaciones.filter((n) => !n.leida && n.id !== id).length);
    }
  };

  const limpiarLeidas = async () => {
    if (!userId) return;
    const readIds = notificaciones.filter((n) => n.leida).map((n) => n.id);
    if (readIds.length === 0) return;
    const { error } = await supabase.from('notificaciones').delete().in('id', readIds);
    if (!error) setNotificaciones((prev) => prev.filter((n) => !n.leida));
  };

  const solicitarPermisosWeb = async (): Promise<boolean> => {
    const res = await localNotificationService.requestWebPermission();
    setWebPermisosActivos(res);
    return res;
  };

  const contextValue = useMemo(
    () => ({
      notificaciones,
      unreadCount,
      unreadChatCount,
      activeToast,
      cerrarToast,
      mostrarToast,
      marcarComoLeida,
      marcarTodasComoLeidas,
      eliminarNotificacion,
      limpiarLeidas,
      navegarDesdeNotificacion,
      solicitarPermisosWeb,
      webPermisosActivos,
      refreshNotificaciones,
    }),
    [
      notificaciones,
      unreadCount,
      unreadChatCount,
      activeToast,
      cerrarToast,
      mostrarToast,
      navegarDesdeNotificacion,
      webPermisosActivos,
      refreshNotificaciones,
    ]
  );

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext debe ser usado dentro de un NotificationProvider');
  }
  return context;
};
