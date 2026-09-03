import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search, ShieldAlert, User, MessageSquare, RefreshCw } from 'lucide-react-native';
import { FiltroEstadoContacto, WhatsAppContacto } from './types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface WhatsAppContactosListProps {
  contactos: WhatsAppContacto[];
  cargando: boolean;
  onSelectContacto: (contacto: WhatsAppContacto) => void;
  onRefresh: () => void;
  contactoSeleccionadoId?: string | null;
}

export function WhatsAppContactosList({
  contactos,
  cargando,
  onSelectContacto,
  onRefresh,
  contactoSeleccionadoId,
}: WhatsAppContactosListProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoContacto>('todos');

  const contactosFiltrados = contactos.filter((c) => {
    const coincideTexto =
      (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.numero_telefono || '').includes(busqueda);

    if (!coincideTexto) return false;

    if (filtroEstado === 'activos') return !c.bloqueado;
    if (filtroEstado === 'bloqueados') return c.bloqueado;
    return true;
  });

  const formatearFechaRelativa = (isoDate: string) => {
    try {
      const fecha = new Date(isoDate);
      const hoy = new Date();
      const diffDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        return fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDias === 1) {
        return 'Ayer';
      } else if (diffDias < 7) {
        return `${diffDias}d`;
      }
      return fecha.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const renderContactoItem = ({ item }: { item: WhatsAppContacto }) => {
    const isSelected = item.numero_telefono === contactoSeleccionadoId;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => onSelectContacto(item)}
        activeOpacity={0.7}
      >
        <WhatsAppAvatar nombre={item.nombre} telefono={item.numero_telefono} size={44} />

        <View style={styles.itemInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.nombreText} numberOfLines={1}>
              {item.nombre || 'Desconocido'}
            </Text>
            <Text style={styles.horaText}>{formatearFechaRelativa(item.ultimo_contacto)}</Text>
          </View>

          <View style={styles.subInfoRow}>
            <Text style={styles.telefonoText}>+{item.numero_telefono}</Text>
            {item.cedula ? (
              <Text style={styles.cedulaText}>• C.I. {item.cedula}</Text>
            ) : null}
          </View>

          {item.ultimo_mensaje ? (
            <Text style={styles.mensajePreview} numberOfLines={1}>
              {item.ultimo_mensaje}
            </Text>
          ) : null}

          <View style={styles.badgesRow}>
            <View style={[styles.statusBadge, item.bloqueado ? styles.badgeBloqueado : styles.badgeActivo]}>
              <Text style={[styles.statusBadgeText, item.bloqueado ? styles.badgeTextBloqueado : styles.badgeTextActivo]}>
                {item.bloqueado ? 'BLOQUEADO' : 'ACTIVO'}
              </Text>
            </View>

            {item.origen_nombre === 'tarjeta' && (
              <View style={styles.badgeCliente}>
                <Text style={styles.badgeTextCliente}>CLIENTE</Text>
              </View>
            )}

            <View style={styles.counterBadge}>
              <MessageSquare size={10} color="#8C9BAB" />
              <Text style={styles.counterText}>{item.total_mensajes || 1} msgs</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o teléfono..."
          placeholderTextColor="#6B778C"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={16} color="#8C9BAB" />
        </TouchableOpacity>
      </View>

      {/* Pestañas de Estado */}
      <View style={styles.filterTabsRow}>
        {(['todos', 'activos', 'bloqueados'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filtroEstado === tab && styles.filterTabActive]}
            onPress={() => setFiltroEstado(tab)}
          >
            <Text style={[styles.filterTabText, filtroEstado === tab && styles.filterTabTextActive]}>
              {tab === 'todos' ? `Todos (${contactos.length})` : tab === 'activos' ? 'Activos' : 'Bloqueados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0C66E4" />
        </View>
      ) : contactosFiltrados.length === 0 ? (
        <View style={styles.centerContainer}>
          <User size={36} color="#455260" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>No se encontraron contactos</Text>
        </View>
      ) : (
        <FlatList
          data={contactosFiltrados}
          keyExtractor={(item) => item.numero_telefono}
          renderItem={renderContactoItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#384148',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  refreshBtn: {
    padding: 6,
  },
  filterTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
  },
  filterTabActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#8C9BAB',
    fontSize: 14,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C333A',
  },
  itemCardSelected: {
    borderColor: '#0C66E4',
    backgroundColor: '#1C2B41',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cedulaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C9BAB',
  },
  badgeCliente: {
    backgroundColor: 'rgba(87, 157, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTextCliente: {
    color: '#579DFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nombreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 8,
  },
  horaText: {
    fontSize: 11,
    color: '#8C9BAB',
  },
  telefonoText: {
    fontSize: 12,
    color: '#579DFF',
    marginBottom: 4,
  },
  mensajePreview: {
    fontSize: 12,
    color: '#8C9BAB',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActivo: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  badgeBloqueado: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextActivo: {
    color: '#4ADE80',
  },
  badgeTextBloqueado: {
    color: '#EF4444',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D2125',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  counterText: {
    fontSize: 10,
    color: '#8C9BAB',
  },
});
