export type TipoNotificacion = 'asignacion' | 'mensaje' | 'almacen' | 'cobranza' | 'sistema' | 'general';

export interface NotificacionItem {
  id: string;
  usuario_id: string;
  tarjeta_id: string | null;
  mensaje: string;
  leida: boolean;
  created_at: string;
  tipo?: TipoNotificacion;
  origen_usuario_id?: string | null;
}

export interface InAppToastData {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  tarjetaId?: string | null;
  tableroId?: string | null;
  chatUserId?: string | null;
  onPressAction?: () => void;
}

export interface NotificationContextType {
  notificaciones: NotificacionItem[];
  unreadCount: number;
  unreadChatCount: number;
  activeToast: InAppToastData | null;
  cerrarToast: () => void;
  mostrarToast: (toast: Omit<InAppToastData, 'id'>) => void;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  limpiarLeidas: () => Promise<void>;
  navegarDesdeNotificacion: (item: Partial<InAppToastData> & { tarjeta_id?: string | null }) => Promise<void>;
  solicitarPermisosWeb: () => Promise<boolean>;
  webPermisosActivos: boolean;
  refreshNotificaciones: () => Promise<void>;
}

export function deducirTipoNotificacion(mensaje: string): TipoNotificacion {
  const m = mensaje.toLowerCase();
  if (m.includes('mensaje') || m.includes('chat') || m.includes('soporte')) return 'mensaje';
  if (m.includes('material') || m.includes('custodia') || m.includes('almacén') || m.includes('almacen')) return 'almacen';
  if (m.includes('pago') || m.includes('factura') || m.includes('cobranza') || m.includes('recupero')) return 'cobranza';
  if (m.includes('asign') || m.includes('tarjeta')) return 'asignacion';
  if (m.includes('sector') || m.includes('solicitud') || m.includes('aprobada') || m.includes('rechazada')) return 'sistema';
  return 'general';
}

export function extraerTituloYDetalle(mensaje: string, tipo: TipoNotificacion): { titulo: string; detalle: string } {
  if (tipo === 'asignacion') {
    if (mensaje.startsWith('Asignación en ')) {
      const parts = mensaje.split(': ');
      if (parts.length > 1) {
        return {
          titulo: parts[0].replace('Asignación en ', '').trim(),
          detalle: parts.slice(1).join(': ').trim(),
        };
      }
    }
    return { titulo: 'Asignación de Tarjeta', detalle: mensaje };
  }

  if (tipo === 'mensaje') {
    if (mensaje.startsWith('Nuevo mensaje de ') || mensaje.startsWith('Mensaje de ')) {
      const clean = mensaje.replace('Nuevo mensaje de ', '').replace('Mensaje de ', '');
      const parts = clean.split(': ');
      if (parts.length > 1) {
        return {
          titulo: parts[0].trim(),
          detalle: parts.slice(1).join(': ').trim(),
        };
      }
    }
    return { titulo: 'Mensaje de Soporte', detalle: mensaje };
  }

  if (tipo === 'almacen') {
    return { titulo: 'Materiales y Almacén', detalle: mensaje };
  }

  if (tipo === 'cobranza') {
    return { titulo: 'Gestión de Cobranza', detalle: mensaje };
  }

  if (tipo === 'sistema') {
    return { titulo: 'Aviso del Sistema', detalle: mensaje };
  }

  return { titulo: 'Metricall', detalle: mensaje };
}
