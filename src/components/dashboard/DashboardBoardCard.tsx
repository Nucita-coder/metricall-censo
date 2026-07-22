import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pin, Star } from 'lucide-react-native';
import { Tablero } from '../../hooks/useDashboardData';

interface DashboardBoardCardProps {
  tablero: Tablero;
  isLast: boolean;
  isDesktop: boolean;
  isSwappingMode: boolean;
  boardToSwap: Tablero | null;
  onPress: () => void;
  onLongPress: () => void;
}

export function DashboardBoardCard({
  tablero,
  isLast,
  isDesktop,
  isSwappingMode,
  boardToSwap,
  onPress,
  onLongPress,
}: DashboardBoardCardProps) {
  const isSwapping = isSwappingMode && tablero.id === boardToSwap?.id;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !isLast && !isDesktop && styles.cardDivider,
        isDesktop && {
          width: 250,
          height: 120,
          flexDirection: 'column',
          paddingVertical: 0,
          paddingHorizontal: 0,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: tablero.fondo_url ? '#000' : '#22272B',
          justifyContent: 'space-between',
          elevation: 0,
          borderWidth: 1,
          borderColor: '#384148',
          shadowOpacity: 0,
        },
        isSwapping && { opacity: 0.5, backgroundColor: '#F3F4F6' },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {isDesktop ? (
        <>
          {tablero.fondo_url && <Image source={{ uri: tablero.fondo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
          {tablero.fondo_url && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />}
          <View style={{ padding: 16, flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: tablero.fondo_url ? '#FFF' : '#B6C2CF', fontSize: 16, fontWeight: '900', textTransform: 'none', letterSpacing: 0 },
              ]}
              numberOfLines={2}
            >
              {tablero.nombre}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', padding: 12, justifyContent: 'flex-end', gap: 8 }}>
            {tablero.es_favorito && <Star size={16} color={tablero.fondo_url ? '#FDE047' : '#EAB308'} fill={tablero.fondo_url ? '#FDE047' : '#EAB308'} />}
            {tablero.es_anclado && <Pin size={16} color={tablero.fondo_url ? '#FFF' : '#4B5563'} />}
          </View>
        </>
      ) : (
        <>
          {tablero.fondo_url ? (
            <Image source={{ uri: tablero.fondo_url }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: '#22272B', borderWidth: 1, borderColor: '#384148' }]} />
          )}
          <View style={styles.cardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {tablero.nombre}
              </Text>
              {tablero.es_favorito && <Star size={14} color="#EAB308" fill="#EAB308" style={{ marginLeft: 6, marginBottom: 2 }} />}
              {tablero.es_anclado && <Pin size={14} color="#666" style={{ marginLeft: 4, marginBottom: 2 }} />}
            </View>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {tablero.descripcion || 'Sin descripción'}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  cardDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    marginLeft: 24,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#8C9BAB',
  },
});
