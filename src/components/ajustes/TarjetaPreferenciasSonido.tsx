import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import { Volume2, Bell, Vibrate, Play } from 'lucide-react-native';
import { useSoundPreferences } from '../../context/SoundPreferencesContext';
import { soundService } from '../../services/soundService';

export const TarjetaPreferenciasSonido: React.FC = () => {
  const {
    sonidosGestos,
    sonidosNotificaciones,
    vibracionHaptica,
    setSonidosGestos,
    setSonidosNotificaciones,
    setVibracionHaptica,
  } = useSoundPreferences();

  const handleTestNotificationSound = () => {
    soundService.play('notification');
  };

  const handleTestGestureSound = () => {
    soundService.play('drop_success');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Volume2 size={20} color="#579DFF" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Sonido y Respuesta Háptica</Text>
          <Text style={styles.cardSubtitle}>
            Configura la retroalimentación acústica y táctil en gestos y notificaciones
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Opción 1: Sonidos de Notificaciones */}
      <View style={styles.optionRow}>
        <View style={styles.optionLeft}>
          <View style={[styles.optionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Bell size={16} color="#38BDF8" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Sonidos de Notificaciones</Text>
            <Text style={styles.optionDesc}>
              Alertas para nuevas asignaciones, chat y eventos operativos
            </Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotificationSound}
            activeOpacity={0.7}
            accessibilityLabel="Probar sonido de notificación"
          >
            <Play size={12} color="#8C9BAB" />
          </TouchableOpacity>
          <Switch
            value={sonidosNotificaciones}
            onValueChange={setSonidosNotificaciones}
            trackColor={{ false: '#2C333A', true: '#0C66E4' }}
            thumbColor={sonidosNotificaciones ? '#FFFFFF' : '#8C9BAB'}
          />
        </View>
      </View>

      <View style={styles.itemDivider} />

      {/* Opción 2: Sonidos de Gestos */}
      <View style={styles.optionRow}>
        <View style={styles.optionLeft}>
          <View style={[styles.optionIconBadge, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
            <Volume2 size={16} color="#4ADE80" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Sonidos de Gestos y Toques</Text>
            <Text style={styles.optionDesc}>
              Efectos sutiles al pulsar, arrastrar y soltar tarjetas en el Kanban
            </Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestGestureSound}
            activeOpacity={0.7}
            accessibilityLabel="Probar sonido de gesto"
          >
            <Play size={12} color="#8C9BAB" />
          </TouchableOpacity>
          <Switch
            value={sonidosGestos}
            onValueChange={setSonidosGestos}
            trackColor={{ false: '#2C333A', true: '#0C66E4' }}
            thumbColor={sonidosGestos ? '#FFFFFF' : '#8C9BAB'}
          />
        </View>
      </View>

      {/* Opción 3: Vibración Háptica (relevante en móviles) */}
      {Platform.OS !== 'web' && (
        <>
          <View style={styles.itemDivider} />
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconBadge, { backgroundColor: 'rgba(192, 132, 252, 0.15)' }]}>
                <Vibrate size={16} color="#C084FC" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Respuesta Háptica (Vibración)</Text>
                <Text style={styles.optionDesc}>
                  Micro-vibración física táctil al pulsar y manipular elementos
                </Text>
              </View>
            </View>

            <View style={styles.actionsRight}>
              <Switch
                value={vibracionHaptica}
                onValueChange={setVibracionHaptica}
                trackColor={{ false: '#2C333A', true: '#0C66E4' }}
                thumbColor={vibracionHaptica ? '#FFFFFF' : '#8C9BAB'}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C333A',
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(87, 157, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8C9BAB',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C333A',
    marginVertical: 16,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#2C333A',
    marginVertical: 12,
    marginLeft: 40,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B6C2CF',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
