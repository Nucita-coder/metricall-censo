import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MapPin, X, Check, Trash2, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { styles } from './ModalGestionSectores.styles';

export interface SolicitudSectorItem {
  id: string;
  nombre_sector: string;
  estado: string;
  usuario_id: string;
  tarjeta_id: string | null;
  created_at: string;
  usuarioNombre?: string;
}

interface ModalGestionSectoresProps {
  visible: boolean;
  onClose: () => void;
  onSectorAprobado?: () => void;
}

export function ModalGestionSectores({
  visible,
  onClose,
  onSectorAprobado,
}: ModalGestionSectoresProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { empresaId } = useAuth();

  const [solicitudes, setSolicitudes] = useState<SolicitudSectorItem[]>([]);
  const [sectoresAprobados, setSectoresAprobados] = useState<{ id: string; nombre: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'pendientes' | 'aprobados'>('pendientes');

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);

      // 1. Cargar solicitudes pendientes
      const { data: sols, error: errSols } = await supabase
        .from('solicitudes_sectores')
        .select('id, nombre_sector, estado, usuario_id, tarjeta_id, created_at')
        .eq('empresa_id', empresaId)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (errSols) throw errSols;

      if (sols && sols.length > 0) {
        const userIds = Array.from(new Set(sols.map((s) => s.usuario_id).filter(Boolean)));
        const { data: perfiles } = await supabase
          .from('perfiles')
          .select('id, nombre_completo')
          .in('id', userIds);

        const mapaPerfiles = new Map<string, string>();
        (perfiles || []).forEach((p) => {
          if (p.id && p.nombre_completo) mapaPerfiles.set(p.id, p.nombre_completo);
        });

        const enriquecidas: SolicitudSectorItem[] = sols.map((s) => ({
          ...s,
          usuarioNombre: mapaPerfiles.get(s.usuario_id) || 'Asesor',
        }));
        setSolicitudes(enriquecidas);
      } else {
        setSolicitudes([]);
      }

      // 2. Cargar sectores ya aprobados
      const { data: aprobados, error: errApr } = await supabase
        .from('sectores_empresa')
        .select('id, nombre, created_at')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true });

      if (!errApr && aprobados) {
        setSectoresAprobados(aprobados);
      }
    } catch (e: unknown) {
      console.warn('Error al cargar solicitudes de sectores:', e);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (visible) {
      cargarDatos();
    }
  }, [visible, cargarDatos]);

  const handleAprobar = async (item: SolicitudSectorItem) => {
    try {
      setProcesandoId(item.id);
      const { error } = await supabase.rpc('aprobar_sector_censo', {
        p_solicitud_id: item.id,
      });

      if (error) throw error;

      const msg = `El sector "${item.nombre_sector}" ha sido aprobado y ahora es elegible para todos los asesores.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Sector Aprobado', msg);

      await cargarDatos();
      if (onSectorAprobado) onSectorAprobado();
    } catch (err: unknown) {
      const errStr = (err as Error)?.message || 'No se pudo aprobar el sector.';
      if (Platform.OS === 'web') window.alert('Error: ' + errStr);
      else Alert.alert('Error', errStr);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (item: SolicitudSectorItem) => {
    try {
      setProcesandoId(item.id);
      const { error } = await supabase.rpc('rechazar_sector_censo', {
        p_solicitud_id: item.id,
      });

      if (error) throw error;

      await cargarDatos();
    } catch (err: unknown) {
      const errStr = (err as Error)?.message || 'No se pudo rechazar la solicitud.';
      if (Platform.OS === 'web') window.alert('Error: ' + errStr);
      else Alert.alert('Error', errStr);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isDesktop && { maxWidth: 540 }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} color="#B6C2CF" />
              <Text style={styles.headerTitle}>Solicitudes de Nuevos Sectores</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <X size={20} color="#8C9BAB" />
            </TouchableOpacity>
          </View>

          {/* TABS DE SELECCIÓN */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tabActiva === 'pendientes' && styles.tabBtnActive]}
              onPress={() => setTabActiva('pendientes')}
            >
              <Text style={[styles.tabTxt, tabActiva === 'pendientes' && styles.tabTxtActive]}>
                Pendientes ({solicitudes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tabActiva === 'aprobados' && styles.tabBtnActive]}
              onPress={() => setTabActiva('aprobados')}
            >
              <Text style={[styles.tabTxt, tabActiva === 'aprobados' && styles.tabTxtActive]}>
                Aprobados ({sectoresAprobados.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTENIDO */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#B6C2CF" />
                <Text style={styles.loadingTxt}>Cargando...</Text>
              </View>
            ) : tabActiva === 'pendientes' ? (
              solicitudes.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Clock size={32} color="#8C9BAB" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
                  <Text style={styles.emptySub}>
                    Cuando un asesor seleccione "Otro" en censo, el nuevo sector aparecerá aquí para tu aprobación.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {solicitudes.map((s) => (
                    <View key={s.id} style={styles.solicitudCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sectorNombre}>{s.nombre_sector}</Text>
                        <Text style={styles.sectorMeta}>
                          Solicitado por: {s.usuarioNombre} • {new Date(s.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.btnAprobar}
                          onPress={() => handleAprobar(s)}
                          disabled={procesandoId === s.id}
                        >
                          {procesandoId === s.id ? (
                            <ActivityIndicator size="small" color="#1D2125" />
                          ) : (
                            <>
                              <Check size={14} color="#1D2125" style={{ marginRight: 4 }} />
                              <Text style={styles.btnAprobarTxt}>Aprobar</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnRechazar}
                          onPress={() => handleRechazar(s)}
                          disabled={procesandoId === s.id}
                        >
                          <Trash2 size={14} color="#8C9BAB" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : sectoresAprobados.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Aún no hay sectores aprobados</Text>
                <Text style={styles.emptySub}>
                  Los sectores solicitados en censo que apruebes se listarán aquí.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {sectoresAprobados.map((item) => (
                  <View key={item.id} style={styles.aprobadoCard}>
                    <View style={styles.aprobadoDot} />
                    <Text style={styles.aprobadoNombre}>{item.nombre}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCerrar} onPress={onClose}>
              <Text style={styles.btnCerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
