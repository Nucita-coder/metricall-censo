import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

export type SoundType =
  | 'tap'
  | 'drag_start'
  | 'drop_success'
  | 'tab_switch'
  | 'notification'
  | 'new_message'
  | 'action_success'
  | 'action_error';

export type SoundCategory = 'gesture' | 'notification' | 'action';

interface SoundConfig {
  source: number | string;
  category: SoundCategory;
  haptic?: () => Promise<void>;
}

// Mapeo estricto de assets locales
const SOUND_SOURCES: Record<SoundType, SoundConfig> = {
  tap: {
    source: require('../../assets/sounds/tap.mp3'),
    category: 'gesture',
    haptic: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
  },
  drag_start: {
    source: require('../../assets/sounds/drag_start.mp3'),
    category: 'gesture',
    haptic: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
  },
  drop_success: {
    source: require('../../assets/sounds/drop_success.mp3'),
    category: 'gesture',
    haptic: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
  },
  tab_switch: {
    source: require('../../assets/sounds/tab_switch.mp3'),
    category: 'gesture',
    haptic: async () => {
      await Haptics.selectionAsync().catch(() => {});
    },
  },
  notification: {
    source: require('../../assets/sounds/notification.mp3'),
    category: 'notification',
    haptic: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
  },
  new_message: {
    source: require('../../assets/sounds/new_message.mp3'),
    category: 'notification',
    haptic: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
  },
  action_success: {
    source: require('../../assets/sounds/action_success.mp3'),
    category: 'action',
    haptic: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
  },
  action_error: {
    source: require('../../assets/sounds/action_error.mp3'),
    category: 'action',
    haptic: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  },
};

class SoundService {
  private players: Partial<Record<SoundType, AudioPlayer>> = {};
  private webAudioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};
  private gesturesEnabled = true;
  private notificationsEnabled = true;
  private hapticsEnabled = true;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    // La creación de reproductores es 100% lazy (en demanda) en play()
    // para evitar saturar el hilo de medios nativo durante el arranque.
  }

  public setPreferences(prefs: {
    gestures?: boolean;
    notifications?: boolean;
    haptics?: boolean;
  }) {
    if (prefs.gestures !== undefined) this.gesturesEnabled = prefs.gestures;
    if (prefs.notifications !== undefined) this.notificationsEnabled = prefs.notifications;
    if (prefs.haptics !== undefined) this.hapticsEnabled = prefs.haptics;
  }

  public async play(type: SoundType): Promise<void> {
    const config = SOUND_SOURCES[type];
    if (!config) return;

    // Verificar si el sonido está habilitado según su categoría
    const isSoundAllowed =
      (config.category === 'gesture' && this.gesturesEnabled) ||
      ((config.category === 'notification' || config.category === 'action') && this.notificationsEnabled);

    // Disparar háptica si está permitida (incluso si el sonido está silenciado)
    if (this.hapticsEnabled && config.haptic && Platform.OS !== 'web') {
      config.haptic().catch(() => {});
    }

    if (!isSoundAllowed) return;

    // Reproducción en Web
    if (Platform.OS === 'web') {
      try {
        let audio = this.webAudioCache[type];
        if (!audio) {
          const src = typeof config.source === 'string' ? config.source : (config.source as { default?: string }).default || String(config.source);
          audio = new Audio(src);
          this.webAudioCache[type] = audio;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // Silenciar errores de autoplay en navegadores
      }
      return;
    }

    // Reproducción en Nativo (Android / iOS)
    try {
      let player = this.players[type];
      if (!player) {
        player = createAudioPlayer(config.source);
        this.players[type] = player;
      }
      player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // Manejar de forma silenciosa para no interrumpir el hilo principal
    }
  }

  public playGesture(type: 'tap' | 'drag_start' | 'drop_success' | 'tab_switch') {
    this.play(type).catch(() => {});
  }

  public playNotification(type: 'notification' | 'new_message' | 'action_success' | 'action_error') {
    this.play(type).catch(() => {});
  }
}

export const soundService = new SoundService();
