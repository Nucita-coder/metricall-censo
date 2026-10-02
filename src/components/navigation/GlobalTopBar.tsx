import { useRouter, Href } from 'expo-router';
import { Bell, HelpCircle, LogOut, MessageSquare, Search, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View, TextStyle } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useGlobalUi } from '../../context/GlobalUiContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';
import { ModalSoporteTecnico } from '../soporte/ModalSoporteTecnico';
import { ModalCentroAyuda } from '../soporte/ModalCentroAyuda';
import { ModalNotificaciones } from '../notificaciones/ModalNotificaciones';

export function GlobalTopBar() {
  const { nombreCompleto, session, avatarUrl } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const router = useRouter();
  const { searchQuery, setSearchQuery, soporteTrigger } = useGlobalUi();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showNotificaciones, setShowNotificaciones] = React.useState(false);
  const [showSoporte, setShowSoporte] = React.useState(false);
  const [showCentroAyuda, setShowCentroAyuda] = React.useState(false);
  const { unreadCount, unreadChatCount } = useNotificationContext();

  React.useEffect(() => {
    if (soporteTrigger > 0) {
      setShowSoporte(true);
    }
  }, [soporteTrigger]);

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
          <TouchableOpacity style={styles.iconBtn} onPress={() => { }}>
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

        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(drawer)/(tabs)/mensajes' as Href)}
            accessibilityLabel="Mensajes"
          >
            <MessageSquare size={20} color="#9FADBC" />
            {unreadChatCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadChatCount > 99 ? '99+' : unreadChatCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowNotificaciones(true)}
            accessibilityLabel="Notificaciones"
          >
            <Bell size={20} color="#9FADBC" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCentroAyuda(true)}>
            <HelpCircle size={20} color="#9FADBC" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarBtn}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{nombreCompleto ? nombreCompleto.charAt(0).toUpperCase() : 'U'}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutTopBarBtn}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <ActivityIndicator size="small" color="#F56565" /> : <LogOut size={18} color="#F56565" />}
        </TouchableOpacity>
      </View>

      {/* MODAL MODULAR DE NOTIFICACIONES */}
      <ModalNotificaciones
        visible={showNotificaciones}
        onClose={() => setShowNotificaciones(false)}
      />

      {/* MODAL DE SOPORTE TÉCNICO Y CENTRO DE AYUDA */}
      <ModalSoporteTecnico visible={showSoporte} onClose={() => setShowSoporte(false)} />
      <ModalCentroAyuda visible={showCentroAyuda} onClose={() => setShowCentroAyuda(false)} />
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
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#2C333A',
    borderColor: '#384148',
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
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
  } as unknown as TextStyle,
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#B6C2CF',
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
});

