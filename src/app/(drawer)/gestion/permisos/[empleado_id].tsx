import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ChevronLeft, Save } from 'lucide-react-native';
import { PermisosJerarquiaTree, Sucursal, Lista, PermisoListaRelacional } from '../../../../components/gestion/permisos/PermisosJerarquiaTree';
import { PermisosAccionesVisibilidad } from '../../../../components/gestion/permisos/PermisosAccionesVisibilidad';

interface Permisos {
  sucursales_permitidas: string[];
  tableros_permitidos: string[];
  tarjetas_visibilidad: 'todas' | 'propias';
  acciones: {
    crear: boolean;
    editar: boolean;
    borrar: boolean;
  };
}

const DEFAULT_PERMISOS: Permisos = {
  sucursales_permitidas: [],
  tableros_permitidos: [],
  tarjetas_visibilidad: 'propias',
  acciones: { crear: false, editar: false, borrar: false }
};

export default function EditPermisosScreen() {
  const { empleado_id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [empleadoNombre, setEmpleadoNombre] = useState('');
  
  const OPCIONES_ETIQUETAS = ["Supervisor", "Técnico", "Asesor"];
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  
  const [jerarquia, setJerarquia] = useState<Sucursal[]>([]);
  const [permisos, setPermisos] = useState<Permisos>(DEFAULT_PERMISOS);
  const [permisosListas, setPermisosListas] = useState<Record<string, PermisoListaRelacional>>({});

  useEffect(() => {
    fetchData();
  }, [empleado_id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre_completo, permisos_especiales, empresa_id, etiquetas')
        .eq('id', empleado_id)
        .single();

      if (perfilError) throw perfilError;
      setEmpleadoNombre(perfilData.nombre_completo);
      setEtiquetas(perfilData.etiquetas || []);
      
      const p = perfilData.permisos_especiales || {};
      setPermisos({
        sucursales_permitidas: p.sucursales_permitidas || [],
        tableros_permitidos: p.tableros_permitidos || [],
        tarjetas_visibilidad: p.tarjetas_visibilidad || 'propias',
        acciones: {
          crear: p.acciones?.crear || false,
          editar: p.acciones?.editar || false,
          borrar: p.acciones?.borrar || false,
        }
      });

      const { data: elpData, error: elpError } = await supabase
        .from('empleado_lista_permisos')
        .select('*')
        .eq('empleado_id', empleado_id);
      
      if (elpError) throw elpError;
      
      const elpMap: Record<string, PermisoListaRelacional> = {};
      elpData.forEach((row: any) => {
         elpMap[row.lista_id] = {
           lista_id: row.lista_id,
           puede_ver: row.puede_ver,
           puede_crear: row.puede_crear,
           puede_editar: row.puede_editar,
           puede_borrar: row.puede_borrar
         };
      });
      setPermisosListas(elpMap);

      const { data: sucursalesData, error: sucursalesError } = await supabase
        .from('sucursales')
        .select('id, nombre, tableros(id, nombre, listas(id, nombre))')
        .eq('empresa_id', perfilData.empresa_id);

      if (sucursalesError) throw sucursalesError;
      setJerarquia(sucursalesData as unknown as Sucursal[]);

    } catch (e: any) {
      Alert.alert('Error', e.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('perfiles')
        .update({ permisos_especiales: permisos, etiquetas: etiquetas })
        .eq('id', empleado_id)
        .select('id');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar: sin permisos de escritura sobre este perfil.');
      }

      const bulkUpsert = Object.values(permisosListas).map(p => ({
        empleado_id: empleado_id as string,
        lista_id: p.lista_id,
        puede_ver: p.puede_ver,
        puede_crear: p.puede_crear,
        puede_editar: p.puede_editar,
        puede_borrar: p.puede_borrar
      }));

      if (bulkUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('empleado_lista_permisos')
          .upsert(bulkUpsert, { onConflict: 'empleado_id,lista_id' });
        
        if (upsertError) throw upsertError;
      }
      
      Alert.alert('Éxito', 'Permisos actualizados correctamente');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(drawer)/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSucursal = (sucId: string) => {
    setPermisos(prev => {
      const isSelected = prev.sucursales_permitidas.includes(sucId);
      const newSucursales = isSelected 
        ? prev.sucursales_permitidas.filter(id => id !== sucId)
        : [...prev.sucursales_permitidas, sucId];
      
      return { ...prev, sucursales_permitidas: newSucursales };
    });
  };

  const toggleTablero = (tabId: string, listas: Lista[]) => {
    setPermisos(prev => {
      const isSelected = prev.tableros_permitidos.includes(tabId);
      let newTableros = [...prev.tableros_permitidos];
      if (isSelected) {
        newTableros = newTableros.filter(id => id !== tabId);
      } else {
        newTableros.push(tabId);
      }
      return { ...prev, tableros_permitidos: newTableros };
    });

    setPermisosListas(prev => {
      const isSelected = permisos.tableros_permitidos.includes(tabId);
      const next = { ...prev };
      listas.forEach(l => {
        next[l.id] = {
          lista_id: l.id,
          puede_ver: !isSelected,
          puede_crear: !isSelected,
          puede_editar: !isSelected,
          puede_borrar: false
        };
      });
      return next;
    });
  };

  const toggleListaPermission = (listaId: string, field: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_borrar') => {
    setPermisosListas(prev => {
      const current = prev[listaId] || { lista_id: listaId, puede_ver: false, puede_crear: false, puede_editar: false, puede_borrar: false };
      const next = { ...current, [field]: !current[field] };
      if (field === 'puede_ver' && !next.puede_ver) {
        next.puede_crear = false;
        next.puede_editar = false;
        next.puede_borrar = false;
      }
      if (field !== 'puede_ver' && next[field]) {
        next.puede_ver = true;
      }
      return { ...prev, [listaId]: next };
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B6C2CF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(drawer)/(tabs)')} style={styles.backBtn}>
          <ChevronLeft size={24} color="#B6C2CF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permisos</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? <ActivityIndicator size="small" color="#1D2125" /> : <Save size={20} color="#1D2125" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.employeeName}>{empleadoNombre}</Text>
        <Text style={styles.sectionDesc}>Configura el nivel de acceso granular para este empleado.</Text>

        <PermisosAccionesVisibilidad
          permisos={permisos}
          setPermisos={setPermisos}
          etiquetas={etiquetas}
          setEtiquetas={setEtiquetas}
          opcionesEtiquetas={OPCIONES_ETIQUETAS}
        />

        <PermisosJerarquiaTree
          jerarquia={jerarquia}
          sucursalesPermitidas={permisos.sucursales_permitidas}
          tablerosPermitidos={permisos.tableros_permitidos}
          permisosListas={permisosListas}
          onToggleSucursal={toggleSucursal}
          onToggleTablero={toggleTablero}
          onToggleListaPermission={toggleListaPermission}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2125' },
  container: { flex: 1, backgroundColor: '#1D2125' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2C333A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#384148'
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#B6C2CF' },
  saveBtn: {
    backgroundColor: '#B6C2CF',
    padding: 10,
    borderRadius: 8,
    width: 44,
    alignItems: 'center'
  },
  content: { padding: 20 },
  employeeName: { fontSize: 24, fontWeight: '900', color: '#B6C2CF' },
  sectionDesc: { fontSize: 14, color: '#8C9BAB', marginTop: 4, marginBottom: 24 },
});
