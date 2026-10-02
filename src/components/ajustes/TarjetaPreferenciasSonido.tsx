import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import { Volume2, Bell, Vibrate, Play, Globe } from 'lucide-react-native';
import { useSoundPreferences } from '../../context/SoundPreferencesContext';
import { useNotificationContext } from '../../context/NotificationContext';
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

  const { mostrarToast, solicitarPermisosWeb, webPermisosActivos } = useNotificationContext();

  const handleTestNotification = () => {
    soundService.playNotification('notification');
    mostrarToast({
      titulo: 'Notificación de Prueba',
      mensaje: 'El sistema de notificaciones activas y presentes está configurado y operativo.',
      tipo: 'asignacion',
    });
  };

  const handleTestGestureSound = () => {
    soundService.playGesture('drop_success');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Volume2 size={20} color="#B6C2CF" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Sonido, Háptica y Notificaciones</Text>
          <Text style={styles.cardSubtitle}>
            Configura la presencia visual, retroalimentación acústica y táctil en el sistema
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Opción 1: Sonidos de Notificaciones */}
      <View style={styles.optionRow}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIconBadge}>
            <Bell size={16} color="#B6C2CF" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Sonidos y Alertas en Pantalla</Text>
            <Text style={styles.optionDesc}>
              Avisos flotantes y acústicos para asignaciones, chat y eventos operativos
            </Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
            activeOpacity={0.7}
            accessibilityLabel="Probar notificación y sonido"
          >
            <Play size={12} color="#B6C2CF" />
          </TouchableOpacity>
          <Switch
            value={sonidosNotificaciones}
            onValueChange={setSonidosNotificaciones}
            trackColor={{ false: '#1D2125', true: '#384148' }}
            thumbColor={sonidosNotificaciones ? '#FFFFFF' : '#8C9BAB'}
          />
        </View>
      </View>

      <View style={styles.itemDivider} />

      {/* Opción 2: Sonidos de Gestos */}
      <View style={styles.optionRow}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIconBadge}>
            <Volume2 size={16} color="#B6C2CF" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Sonidos de Gestos y Toques</Text>
            <Text style={styles.optionDesc}>
              Efectos sutiles al pulsar, arrastrar y mover tarjetas en el tablero
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
            <Play size={12} color="#B6C2CF" />
          </TouchableOpacity>
          <Switch
            value={sonidosGestos}
            onValueChange={setSonidosGestos}
            trackColor={{ false: '#1D2125', true: '#384148' }}
            thumbColor={sonidosGestos ? '#FFFFFF' : '#8C9BAB'}
          />
        </View>
      </View>

      {/* Opción 3: Notificaciones de Escritorio en Web */}
      {Platform.OS === 'web' && (
        <>
          <View style={styles.itemDivider} />
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconBadge}>
                <Globe size={16} color="#B6C2CF" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Notificaciones del Navegador</Text>
                <Text style={styles.optionDesc}>
                  {webPermisosActivos
                    ? 'Permisos activos para recibir avisos de escritorio en segundo plano'
                    : 'Permite que el navegador te avise incluso si la pestaña está minimizada'}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRight}>
              <TouchableOpacity
                style={[styles.webPermBtn, webPermisosActivos && styles.webPermBtnActive]}
                onPress={solicitarPermisosWeb}
                disabled={webPermisosActivos}
                accessibilityLabel="Activar notificaciones de escritorio"
              >
                <Text style={[styles.webPermBtnText, webPermisosActivos && styles.webPermBtnTextActive]}>
                  {webPermisosActivos ? 'ACTIVADO' : 'ACTIVAR'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Opción 4: Vibración Háptica (relevante en móviles) */}
      {Platform.OS !== 'web' && (
        <>
          <View style={styles.itemDivider} />
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconBadge}>
                <Vibrate size={16} color="#B6C2CF" />
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
                trackColor={{ false: '#1D2125', true: '#384148' }}
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  divider: {
    height: 1,
    backgroundColor: '#384148',
    marginVertical: 14,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#2C333A',
    marginVertical: 10,
    marginLeft: 36,
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
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
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
  webPermBtn: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  webPermBtnActive: {
    backgroundColor: '#2C333A',
    borderColor: '#384148',
  },
  webPermBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  webPermBtnTextActive: {
    color: '#8C9BAB',
  },
});

