import { Platform } from 'react-native';

class LocalNotificationService {
  private isConfigured = false;
  private responseHandler: ((data: Record<string, unknown>) => void) | null = null;

  public async init(): Promise<void> {
    if (this.isConfigured) return;
    this.isConfigured = true;

    // Escucha de mensajes desde el Service Worker de la PWA
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PWA_NOTIFICATION_CLICK' && event.data.data) {
          if (this.responseHandler) {
            this.responseHandler(event.data.data as Record<string, unknown>);
          }
        }
      });
    }
  }

  public setResponseHandler(handler: (data: Record<string, unknown>) => void): void {
    this.responseHandler = handler;
  }

  public async requestWebPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error solicitando permisos de notificación PWA:', e);
      return false;
    }
  }

  public isWebPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return window.Notification.permission === 'granted';
  }

  public updateAppBadge(count: number): void {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as unknown as { setAppBadge: (c: number) => Promise<void> }).setAppBadge(count).catch(() => {});
        } else {
          (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
        }
      } catch (_) {}
    }
  }

  public async dispararNotificacion(
    titulo: string,
    cuerpo: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;

    // 1. Intentar disparar vía ServiceWorker (estándar PWA con soporte en segundo plano)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(titulo, {
            body: cuerpo,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: data || {},
          });
          return;
        }
      } catch (_) {
        // Fallback a Notification API estándar de navegador
      }
    }

    // 2. Fallback a window.Notification
    try {
      const webNotif = new window.Notification(titulo, {
        body: cuerpo,
        icon: '/icons/icon-192.png',
        data: data || {},
      });
      webNotif.onclick = () => {
        window.focus();
        if (this.responseHandler && data) {
          this.responseHandler(data);
        }
        webNotif.close();
      };
    } catch (e) {
      console.warn('Error al disparar notificación web:', e);
    }
  }
}

export const localNotificationService = new LocalNotificationService();
