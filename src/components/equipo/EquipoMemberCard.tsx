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
}

export function EquipoMemberCard({ type, item, onAceptar, onRechazar, onBloquear, onEliminar }: EquipoMemberCardProps) {
  const avatarUrl = type === 'solicitud' ? item.perfil?.avatar_url : item.avatar_url;
  const mensaje = type === 'solicitud' ? item.perfil?.mensaje : item.mensaje;
  const nombre = type === 'solicitud' ? item.perfil?.nombre_completo : item.nombre_completo;

  if (type === 'solicitud') {
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{nombre?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
          )}
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
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{nombre?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
        )}
        <View style={styles.cardTextContent}>
          <Text style={styles.cardName}>{nombre}</Text>
          <Text style={styles.cardRole}>
            Rol: {item.etiquetas && item.etiquetas.length > 0 ? item.etiquetas.join(', ') : item.rol}
          </Text>
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
