import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class LocalNotificationService {
  private isConfigured = false;

  public async init(): Promise<void> {
    if (this.isConfigured || Platform.OS === 'web') return;
    this.isConfigured = true;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('metricall-notificaciones', {
          name: 'Notificaciones Operativas',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0C66E4',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (err) {
      console.warn('Error al configurar canal de notificaciones:', err);
    }
  }

  public async dispararNotificacion(
    titulo: string,
    cuerpo: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: cuerpo,
          data: data || {},
          sound: true,
        },
        trigger: null, // Disparo inmediato
      });
    } catch (err) {
      console.warn('No se pudo programar la notificación local:', err);
    }
  }
}

export const localNotificationService = new LocalNotificationService();
