import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Archive, Calendar, CheckCircle2, ChevronRight, X, XCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';

interface TableroArchivado {
  id: string;
  nombre: string;
  mes_periodo: string;
  created_at: string;
  tipo: string;
}

interface ModalTablerosArchivadosProps {
  visible: boolean;
  onClose: () => void;
  empresaId: string | null;
}

const MESES_NOMBRES: Record<string, string> = {
  '01': 'Enero',   '02': 'Febrero',  '03': 'Marzo',
  '04': 'Abril',   '05': 'Mayo',     '06': 'Junio',
  '07': 'Julio',   '08': 'Agosto',   '09': 'Septiembre',
  '10': 'Octubre', '11': 'Noviembre','12': 'Diciembre',
};

function getNombreMes(mesPeriodo: string | null): string {
  if (!mesPeriodo) return 'Período desconocido';
  const [anio, mes] = mesPeriodo.split('-');
  return `${MESES_NOMBRES[mes] || mes} ${anio}`;
}

export function ModalTablerosArchivados({ visible, onClose, empresaId }: ModalTablerosArchivadosProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tableros, setTableros] = useState<TableroArchivado[]>([]);

  const cargarTablerosArchivados = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tableros')
        .select('id, nombre, mes_periodo, created_at, tipo')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'cobranza')
        .eq('archivado', true)
        .order('mes_periodo', { ascending: false });

      if (error) throw error;
      setTableros(data || []);
    } catch (err) {
      console.error('Error al cargar tableros archivados:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (visible) cargarTablerosArchivados();
  }, [visible, cargarTablerosArchivados]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, flexDirection: 'row', justifyContent: 'flex-end', pointerEvents: 'box-none' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Reanimated.View
        entering={SlideInRight.duration(250)}
        exiting={SlideOutRight.duration(200)}
        style={styles.panel}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Archive size={22} color="#F6AD55" />
            <Text style={styles.headerTitle}>Historial de Cobranza</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#B6C2CF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Tableros cerrados por mes</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#F6AD55" />
              <Text style={styles.loadingText}>Cargando historial...</Text>
            </View>
          ) : tableros.length === 0 ? (
            <View style={styles.emptyBox}>
              <Archive size={40} color="#384148" />
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptySubtext}>
                Aún no has cerrado ningún mes de cobranza. Cuando archives un tablero aparecerá aquí.
              </Text>
            </View>
          ) : (
            tableros.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => {
                  onClose();
                  router.push(`/tablero/${t.id}`);
                }}
              >
                {/* Badge mes */}
                <View style={styles.cardBadge}>
                  <Calendar size={14} color="#F6AD55" />
                  <Text style={styles.cardBadgeText}>
                    {getNombreMes(t.mes_periodo)}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{t.nombre}</Text>
                    <View style={styles.cardStatusRow}>
                      <CheckCircle2 size={13} color="#A78BFA" />
                      <Text style={styles.cardStatusText}>Tablero archivado</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#384148" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 340,
    height: '100%',
    backgroundColor: '#22272B',
    borderLeftWidth: 1,
    borderLeftColor: '#384148',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    color: '#8C9BAB',
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    backgroundColor: '#1D2125',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 24,
  },
  emptyTitle: {
    color: '#B6C2CF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#8C9BAB',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(246, 173, 85, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardBadgeText: {
    color: '#F6AD55',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardName: {
    color: '#B6C2CF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardStatusText: {
    color: '#A78BFA',
    fontSize: 12,
  },
});
