import { Platform } from 'react-native';

class LocalNotificationService {
  private isConfigured = false;
  private responseHandler: ((data: Record<string, unknown>) => void) | null = null;

  public async init(): Promise<void> {
    if (this.isConfigured) return;
    this.isConfigured = true;

    // Escucha de mensajes desde el Service Worker de la PWA
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        if (typeof document !== 'undefined' && document.readyState === 'complete') {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
      } catch (_) {}

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

    const finalTitulo = titulo?.trim() || 'Metricall';
    const finalCuerpo = cuerpo?.trim() || 'Nueva notificación en el sistema';

    // 1. Intentar disparar vía ServiceWorker (estándar PWA indispensable en Android/Chrome)
    if ('serviceWorker' in navigator) {
      try {
        let registration: ServiceWorkerRegistration | null = null;
        try {
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
          ]);
        } catch (_) {
          registration = null;
        }

        if (!registration && typeof navigator.serviceWorker.getRegistration === 'function') {
          registration = (await navigator.serviceWorker.getRegistration()) || null;
        }

        if (registration && typeof registration.showNotification === 'function') {
          const options: NotificationOptions & { renotify?: boolean } = {
            body: finalCuerpo,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-96.png',
            tag: `metricall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            renotify: true,
            requireInteraction: true,
            data: data || {},
          };
          await registration.showNotification(finalTitulo, options);
          return;
        }
      } catch (e) {
        console.warn('[PWA Notification] Error en registration.showNotification:', e);
      }
    }

    // 2. Fallback a window.Notification (para Safari / navegadores de escritorio)
    try {
      if (typeof window.Notification === 'function') {
        const webNotif = new window.Notification(finalTitulo, {
          body: finalCuerpo,
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
      }
    } catch (e) {
      console.warn('[PWA Notification] Error en fallback Notification API:', e);
    }
  }
}

export const localNotificationService = new LocalNotificationService();
