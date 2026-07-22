import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Redirect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { EquipoMemberCard } from '../../../components/equipo/EquipoMemberCard';
import { ModalAsignacionGranular } from '../../../components/equipo/ModalAsignacionGranular';

export default function EquipoScreen() {
  const { userRol } = useAuth();

  if (userRol === 'empleado') {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  const [activeTab, setActiveTab] = useState<'pendientes' | 'activos'>('pendientes');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [activos, setActivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [codigoInvitacion, setCodigoInvitacion] = useState<string | null>(null);

  const [asignarModalVisible, setAsignarModalVisible] = useState(false);
  const [solicitudEnProceso, setSolicitudEnProceso] = useState<any>(null);
  
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [tableros, setTableros] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string | null>(null);
  const [selectedTableros, setSelectedTableros] = useState<string[]>([]);
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const OPCIONES_ETIQUETAS = ["Supervisor", "Técnico", "Asesor"];

  useEffect(() => {
    fetchCodigo();
    fetchData();
  }, [activeTab]);

  const fetchCodigo = async () => {
    try {
      if (codigoInvitacion) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: miPerfil } = await supabase.from('perfiles').select('empresa_id').eq('id', session.user.id).single();
      if (miPerfil?.empresa_id) {
        const { data: empresa } = await supabase.from('empresas').select('codigo_invitacion').eq('id', miPerfil.empresa_id).single();
        if (empresa?.codigo_invitacion) {
          setCodigoInvitacion(empresa.codigo_invitacion);
        }
      }
    } catch (error) {
      console.warn("Error fetching code:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pendientes') {
        const { data: sols, error: solError } = await supabase
          .from('solicitudes_acceso')
          .select('*')
          .eq('estado', 'pendiente');
          
        if (solError) throw solError;

        if (sols && sols.length > 0) {
          const ids = sols.map(s => s.usuario_id);
          const { data: perfiles } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, rol')
            .in('id', ids);

          const enriquecidas = sols.map(sol => ({
            ...sol,
            perfil: perfiles?.find(p => p.id === sol.usuario_id) || { nombre_completo: 'Usuario Desconocido' }
          }));
          setSolicitudes(enriquecidas);
        } else {
          setSolicitudes([]);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: miPerfil } = await supabase.from('perfiles').select('empresa_id').eq('id', session.user.id).single();
          if (miPerfil?.empresa_id) {
            const { data: acts, error: actError } = await supabase
              .from('perfiles')
              .select('id, nombre_completo, rol, sucursal_id, permisos_especiales, etiquetas')
              .eq('empresa_id', miPerfil.empresa_id);
            if (!actError && acts) setActivos(acts);
          }
        }
      }
    } catch (error: any) {
      console.warn("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSucursales = async () => {
    const { data, error } = await supabase.from('sucursales').select('id, nombre');
    if (!error && data) setSucursales(data);
  };

  const loadTableros = async (sucursal_id: string) => {
    const { data, error } = await supabase.from('tableros').select('id, nombre').eq('sucursal_id', sucursal_id);
    if (!error && data) setTableros(data);
  };

  const handleAceptarClick = (solicitud: any) => {
    setSolicitudEnProceso(solicitud);
    setAsignarModalVisible(true);
    setSelectedSucursal(null);
    setSelectedTableros([]);
    setSelectedEtiquetas([]);
    setTableros([]);
    loadSucursales();
  };

  const confirmarAsignacion = async () => {
    if (!selectedSucursal) {
      Alert.alert('Error', 'Debes seleccionar una sucursal.');
      return;
    }

    try {
      setGuardando(true);
      const { error } = await supabase.rpc('aceptar_empleado_granular', {
        p_solicitud_id: solicitudEnProceso.id,
        p_sucursal_id: selectedSucursal,
        p_tableros_permitidos: selectedTableros
      });

      if (error) throw error;

      if (selectedEtiquetas.length > 0) {
        await supabase.from('perfiles').update({ etiquetas: selectedEtiquetas }).eq('id', solicitudEnProceso.usuario_id);
      }

      Alert.alert('¡Aceptado!', 'El empleado ha sido integrado al equipo.');
      setAsignarModalVisible(false);
      fetchData();

    } catch (error: any) {
      Alert.alert('Error al asignar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async (id: string) => {
    Alert.alert('¿Rechazar?', 'La solicitud será eliminada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
        await supabase.from('solicitudes_acceso').delete().eq('id', id);
        fetchData();
      }}
    ]);
  };

  const handleBloquear = async (id: string) => {
    Alert.alert('¿Bloquear?', 'Este usuario no podrá volver a solicitar acceso a tu empresa.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Bloquear', style: 'destructive', onPress: async () => {
        await supabase.from('solicitudes_acceso').update({ estado: 'bloqueado' }).eq('id', id);
        fetchData();
      }}
    ]);
  };

  const toggleTablero = (id: string) => {
    if (selectedTableros.includes(id)) {
      setSelectedTableros(selectedTableros.filter(t => t !== id));
    } else {
      setSelectedTableros([...selectedTableros, id]);
    }
  };

  return (
    <View style={styles.container}>
      {codigoInvitacion && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Código de Invitación de la Empresa:</Text>
          <Text style={styles.codeValue} selectable={true}>{codigoInvitacion}</Text>
        </View>
      )}

      <View style={styles.segmentedControl}>
        <TouchableOpacity 
          style={[styles.segmentTab, activeTab === 'pendientes' && styles.segmentTabActive]}
          onPress={() => setActiveTab('pendientes')}
        >
          <Text style={[styles.segmentTabText, activeTab === 'pendientes' && styles.segmentTabTextActive]}>Solicitudes Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentTab, activeTab === 'activos' && styles.segmentTabActive]}
          onPress={() => setActiveTab('activos')}
        >
          <Text style={[styles.segmentTabText, activeTab === 'activos' && styles.segmentTabTextActive]}>Miembros Activos</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#B6C2CF" /></View>
      ) : activeTab === 'pendientes' ? (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EquipoMemberCard
              type="solicitud"
              item={item}
              onAceptar={handleAceptarClick}
              onRechazar={handleRechazar}
              onBloquear={handleBloquear}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay solicitudes pendientes.</Text>}
        />
      ) : (
        <FlatList
          data={activos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EquipoMemberCard
              type="activo"
              item={item}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay miembros en la empresa.</Text>}
        />
      )}

      <ModalAsignacionGranular
        visible={asignarModalVisible}
        solicitudEnProceso={solicitudEnProceso}
        sucursales={sucursales}
        tableros={tableros}
        selectedSucursal={selectedSucursal}
        setSelectedSucursal={setSelectedSucursal}
        selectedTableros={selectedTableros}
        toggleTablero={toggleTablero}
        selectedEtiquetas={selectedEtiquetas}
        setSelectedEtiquetas={setSelectedEtiquetas}
        opcionesEtiquetas={OPCIONES_ETIQUETAS}
        onLoadTableros={loadTableros}
        onConfirmar={confirmarAsignacion}
        onClose={() => setAsignarModalVisible(false)}
        guardando={guardando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D2125' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  codeContainer: {
    backgroundColor: '#22272B',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    alignItems: 'center',
  },
  codeLabel: { fontSize: 13, color: '#8C9BAB', marginBottom: 4 },
  codeValue: { fontSize: 24, fontWeight: '900', color: '#0C66E4', letterSpacing: 2 },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1D2125',
    padding: 12,
    gap: 8,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
  },
  segmentTabActive: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  segmentTabText: { fontSize: 13, fontWeight: 'bold', color: '#8C9BAB' },
  segmentTabTextActive: { color: '#FFF' },
  listContainer: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#8C9BAB', marginTop: 40, fontSize: 15 },
});
