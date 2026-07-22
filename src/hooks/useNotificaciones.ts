import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Notificacion {
  id: string;
  usuario_id: string;
  tarjeta_id: string | null;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export function useNotificaciones(userId: string | undefined) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificaciones = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notificaciones:', error);
      return;
    }

    if (data) {
      setNotificaciones(data);
      setUnreadCount(data.filter(n => !n.leida).length);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `notificaciones_${userId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nueva = payload.new as Notificacion;
            setNotificaciones(prev => [nueva, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const actualizada = payload.new as Notificacion;
            setNotificaciones(prev => {
              const next = prev.map(n => (n.id === actualizada.id ? actualizada : n));
              setUnreadCount(next.filter(n => !n.leida).length);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const marcarComoLeida = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);

    if (error) {
      console.error('Error al marcar notificacion como leida:', error);
      return;
    }

    setNotificaciones(prev => prev.map(n => (n.id === id ? { ...n, leida: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const marcarTodasComoLeidas = async () => {
    if (!userId) return;

    const unreadIds = notificaciones.filter(n => !n.leida).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error al marcar todas las notificaciones como leidas:', error);
      return;
    }

    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);
  };

  return {
    notificaciones,
    unreadCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
  };
}
