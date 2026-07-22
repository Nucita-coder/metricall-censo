import React from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, HelpCircle, LogOut, Search, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useGlobalUi } from '../../context/GlobalUiContext';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { supabase } from '../../lib/supabase';

export function GlobalTopBar() {
  const { nombreCompleto, userRol, session } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchQuery, setSearchQuery, triggerCreateModal } = useGlobalUi();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showNotificaciones, setShowNotificaciones] = React.useState(false);
  const { notificaciones, unreadCount, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones(session?.user?.id);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (_) { }
    router.replace('/');
  };

  return (
    <View style={[styles.topBar, isDesktop && styles.topBarDesktop]}>
      <View style={styles.topBarLeft}>
        {!isDesktop && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
            <Image source={require('../../../assets/images/logo-metricall-negative.png')} style={{ width: 44, height: 44, marginLeft: -8 }} resizeMode="contain" />
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          {isDesktop && <Image source={require('../../../assets/images/logo-metricall-negative.png')} style={{ width: 60, height: 40, marginRight: 8 }} resizeMode="contain" />}
          {isDesktop && <Text style={styles.logoText}>Metricall</Text>}
        </View>
      </View>

      <View style={styles.topBarRight}>
        {isDesktop && (
          <View style={styles.searchContainerDesktop}>
            <Search size={16} color="#9FADBC" />
            <TextInput
              style={styles.searchInputDesktop}
              placeholder="Buscar"
              placeholderTextColor="#9FADBC"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#9FADBC" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {userRol !== 'empleado' && (
          <TouchableOpacity style={styles.btnCrear} onPress={() => triggerCreateModal()}>
            <Text style={styles.btnCrearText}>Crear</Text>
          </TouchableOpacity>
        )}

        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotificaciones(true)}>
            <Bell size={20} color="#9FADBC" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isDesktop && (
            <TouchableOpacity style={styles.iconBtn}>
              <HelpCircle size={20} color="#9FADBC" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.avatarBtn}>
          <Text style={styles.avatarText}>{nombreCompleto ? nombreCompleto.charAt(0).toUpperCase() : 'U'}</Text>
        </View>

        <TouchableOpacity 
          style={styles.logoutTopBarBtn} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <ActivityIndicator size="small" color="#F56565" /> : <LogOut size={18} color="#F56565" />}
        </TouchableOpacity>
      </View>

      {/* MODAL DE NOTIFICACIONES */}
      <Modal visible={showNotificaciones} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotificaciones(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.notifContainer, { width: isDesktop ? 400 : '100%', marginTop: isDesktop ? 60 : insets.top + 50, marginRight: isDesktop ? 20 : 0 }]}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notificaciones</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={marcarTodasComoLeidas}>
                  <Text style={styles.markAllRead}>Marcar todas leídas</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={{ padding: 16 }}>
              {notificaciones.length === 0 ? (
                <Text style={styles.emptyNotifText}>No tienes notificaciones recientes.</Text>
              ) : (
                notificaciones.map((notif) => (
                  <TouchableOpacity 
                    key={notif.id} 
                    style={[styles.notifItem, { backgroundColor: notif.leida ? 'transparent' : '#1D2125', borderColor: notif.leida ? 'transparent' : '#0C66E4' }]}
                    onPress={async () => {
                      marcarComoLeida(notif.id);
                      setShowNotificaciones(false);
                      if (notif.tarjeta_id) {
                        try {
                          const { data } = await supabase.from('tarjetas').select('listas (tablero_id)').eq('id', notif.tarjeta_id).single();
                          const listasData = data?.listas as any;
                          const tableroId = Array.isArray(listasData) ? listasData[0]?.tablero_id : listasData?.tablero_id;
                          if (tableroId) {
                            router.push(`/tablero/${tableroId}?abrirTarjeta=${notif.tarjeta_id}`);
                          }
                        } catch (e) {
                          console.error('Error nav', e);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.notifMsg, { fontWeight: notif.leida ? 'normal' : 'bold' }]}>{notif.mensaje}</Text>
                    <Text style={styles.notifTime}>{new Date(notif.created_at).toLocaleString()}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1D2125',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  topBarDesktop: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#9FADBC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 32,
    borderWidth: 1,
    borderColor: '#384148',
    width: 200,
    marginRight: 8,
  },
  searchInputDesktop: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#FFF',
    outlineStyle: 'none',
  } as any,
  btnCrear: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    borderRadius: 4,
    marginRight: 8,
  },
  btnCrearText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutTopBarBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  notifContainer: {
    maxHeight: '80%',
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#1D2125',
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  markAllRead: {
    color: '#0C66E4',
    fontSize: 14,
  },
  emptyNotifText: {
    color: '#8C9BAB',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  notifItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  notifMsg: {
    color: '#B6C2CF',
    fontSize: 14,
  },
  notifTime: {
    color: '#8C9BAB',
    fontSize: 12,
    marginTop: 4,
  },
});
