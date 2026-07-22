import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Tablero {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'instalaciones' | 'censo';
  fondo_url?: string;
  es_favorito?: boolean;
  es_anclado?: boolean;
  orden?: number;
}

export interface Sucursal {
  id: string;
  nombre: string;
  ubicacion: string | null;
  tableros: Tablero[];
}

export function useDashboardData() {
  const { session, empresaId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liderNombre, setLiderNombre] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const fetchDashboardData = useCallback(
    async (isBackground = false) => {
      if (!session || !empresaId) return;

      try {
        if (!isBackground) setIsLoading(true);

        const { data: perfilData, error: perfilError } = await supabase
          .from('perfiles')
          .select('nombre_completo')
          .eq('id', session.user.id)
          .single();

        if (perfilError) throw perfilError;
        setLiderNombre(perfilData.nombre_completo);

        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('nombre')
          .eq('id', empresaId)
          .single();

        if (empresaError) throw empresaError;
        let finalNombre = empresaData.nombre || 'Fibex Telecom';
        if (finalNombre.toLowerCase().includes('administrador') || finalNombre.toLowerCase().includes('empresa')) {
          finalNombre = 'Fibex Telecom';
          await supabase.from('empresas').update({ nombre: 'Fibex Telecom' }).eq('id', empresaId);
        }
        setEmpresaNombre(finalNombre);

        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('id, nombre, ubicacion, tableros(id, nombre, descripcion, fondo_url, es_favorito, es_anclado, orden)')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (sucursalesError) throw sucursalesError;

        if (sucursalesData) {
          sucursalesData.forEach((s: any) => {
            if (s.tableros) {
              s.tableros.sort((a: any, b: any) => {
                if (a.es_favorito && !b.es_favorito) return -1;
                if (!a.es_favorito && b.es_favorito) return 1;
                if (a.es_anclado && !b.es_anclado) return -1;
                if (!a.es_anclado && b.es_anclado) return 1;
                const ordenA = typeof a.orden === 'number' ? a.orden : 0;
                const ordenB = typeof b.orden === 'number' ? b.orden : 0;
                return ordenA - ordenB;
              });
            }
          });
        }

        setSucursales(sucursalesData as unknown as Sucursal[]);
      } catch (error: any) {
        const msg: string = error?.message ?? '';
        const code: string = error?.code ?? '';
        if (
          msg === 'No hay usuario autenticado.' ||
          msg.includes('session missing') ||
          msg.includes('coerce') ||
          code === 'PGRST116'
        ) {
          return;
        }
        Alert.alert('Error cargando datos', msg || 'No se pudo cargar la información');
      } finally {
        setIsLoading(false);
      }
    },
    [session, empresaId]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true).then(() => setRefreshing(false));
  }, [fetchDashboardData]);

  return {
    isLoading,
    refreshing,
    liderNombre,
    empresaNombre,
    sucursales,
    setSucursales,
    fetchDashboardData,
    onRefresh,
  };
}
