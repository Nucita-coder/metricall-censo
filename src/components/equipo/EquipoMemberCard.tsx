import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Check, Settings, ShieldAlert, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';

interface EquipoMemberCardProps {
  type: 'solicitud' | 'activo';
  item: any;
  onAceptar?: (item: any) => void;
  onRechazar?: (id: string) => void;
  onBloquear?: (id: string) => void;
  onEliminar?: (id: string, nombre?: string) => void;
  onViewAvatar?: (data: { avatarUrl?: string | null; nombre?: string | null; rol?: string | null; mensaje?: string | null }) => void;
}

export function EquipoMemberCard({ type, item, onAceptar, onRechazar, onBloquear, onEliminar, onViewAvatar }: EquipoMemberCardProps) {
  const avatarUrl = type === 'solicitud' ? item.perfil?.avatar_url : item.avatar_url;
  const mensaje = type === 'solicitud' ? item.perfil?.mensaje : item.mensaje;
  const nombre = type === 'solicitud' ? item.perfil?.nombre_completo : item.nombre_completo;
  const rolText = type === 'solicitud' 
    ? (item.perfil?.rol || 'Solicitante')
    : (item.etiquetas && item.etiquetas.length > 0 ? item.etiquetas.join(', ') : item.rol);

  const isDeveloperUser = item.id === 'ab95cfb2-dc2e-41f0-b8f6-52f2a2ccbb47' || item.rol === 'developer';
  const etiquetasStr = item.etiquetas && item.etiquetas.length > 0 ? item.etiquetas.join(', ') : null;
  const effectiveRolText = isDeveloperUser 
    ? (etiquetasStr ? `DEVELOPER • ${etiquetasStr}` : 'DEVELOPER')
    : rolText;

  const handleAvatarPress = () => {
    if (onViewAvatar) {
      onViewAvatar({ avatarUrl, nombre, rol: effectiveRolText, mensaje });
    }
  };

  const renderAvatar = () => (
    <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} disabled={!onViewAvatar}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{nombre?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (type === 'solicitud') {
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          {renderAvatar()}
          <View style={styles.cardTextContent}>
            <Text style={styles.cardName}>{nombre}</Text>
            <Text style={styles.cardDate}>Solicitado el: {new Date(item.created_at).toLocaleDateString()}</Text>
            {mensaje ? (
              <Text style={styles.cardMensaje} numberOfLines={2}>
                "{mensaje}"
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          {onBloquear && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnBloquear]} onPress={() => onBloquear(item.id)}>
              <ShieldAlert size={18} color="#FFF" />
            </TouchableOpacity>
          )}
          {onRechazar && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnRechazar]} onPress={() => onRechazar(item.id)}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          )}
          {onAceptar && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnAceptar]} onPress={() => onAceptar(item)}>
              <Check size={20} color="#FFF" />
              <Text style={styles.btnAceptarText}>Aceptar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        {renderAvatar()}
        <View style={styles.cardTextContent}>
          <Text style={styles.cardName}>{nombre}</Text>
          {isDeveloperUser ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              <View style={styles.devBadgeCard}>
                <Text style={styles.devBadgeCardText}>DEVELOPER</Text>
              </View>
              {etiquetasStr && (
                <Text style={styles.cardRole}>{etiquetasStr}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.cardRole}>
              Rol: {rolText}
            </Text>
          )}
          {mensaje ? (
            <Text style={styles.cardMensaje} numberOfLines={2}>
              "{mensaje}"
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {item.rol === 'empleado' && (
            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push(`/(drawer)/gestion/permisos/${item.id}` as any)}>
              <Settings size={22} color="#666" />
            </TouchableOpacity>
          )}
          {item.rol !== 'lider' && onEliminar && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnRechazar, { paddingHorizontal: 10, paddingVertical: 8 }]} onPress={() => onEliminar(item.id, nombre)}>
              <Trash2 size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#0C66E4',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardTextContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  cardDate: {
    fontSize: 12,
    color: '#8C9BAB',
    marginTop: 2,
  },
  cardRole: {
    fontSize: 13,
    color: '#8C9BAB',
    marginTop: 2,
  },
  devBadgeCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  devBadgeCardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  cardMensaje: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#90CDF4',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnBloquear: {
    backgroundColor: '#9B2C2C',
  },
  btnRechazar: {
    backgroundColor: '#E53E3E',
  },
  btnAceptar: {
    backgroundColor: '#22A06B',
  },
  btnAceptarText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  settingsBtn: {
    padding: 8,
  },
});
