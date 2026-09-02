import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Tablero {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'instalaciones' | 'censo' | 'almacen' | 'cobranza' | 'gestion_online';
  fondo_url?: string;
  es_favorito?: boolean;
  es_anclado?: boolean;
  orden?: number;
  archivado?: boolean;
  mes_periodo?: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  ubicacion: string | null;
  tableros: Tablero[];
}

export function useDashboardData() {
  const { session, empresaId, userRol, isDeveloper } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const canSeeAdmin = isDeveloper || ['admin', 'lider', 'administrador', 'supervisor', 'developer', 'desarrollador'].includes(rolLower);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liderNombre, setLiderNombre] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);
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
          .select('nombre, logo_url')
          .eq('id', empresaId)
          .single();

        if (empresaError) throw empresaError;
        let finalNombre = empresaData.nombre || 'Fibex Telecom';
        if (finalNombre.toLowerCase().includes('administrador') || finalNombre.toLowerCase().includes('empresa')) {
          finalNombre = 'Fibex Telecom';
          await supabase.from('empresas').update({ nombre: 'Fibex Telecom' }).eq('id', empresaId);
        }
        setEmpresaNombre(finalNombre);
        setEmpresaLogo(empresaData.logo_url || null);

        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('id, nombre, ubicacion, tableros(id, nombre, descripcion, tipo, fondo_url, es_favorito, es_anclado, orden, archivado, mes_periodo)')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (sucursalesError) throw sucursalesError;

        if (sucursalesData) {
          (sucursalesData as unknown as Sucursal[]).forEach(s => {
            if (s.tableros) {
              // Filtrar solo tableros activos (no archivados) y restringir tableros de almacen solo a administradores
              s.tableros = s.tableros.filter(t => !t.archivado && (canSeeAdmin || t.tipo !== 'almacen'));
              s.tableros.sort((a, b) => {
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
      } catch (error: unknown) {
        const errObj = error as { message?: string; code?: string } | null;
        const msg: string = errObj?.message ?? '';
        const code: string = errObj?.code ?? '';
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
    empresaLogo,
    sucursales,
    setSucursales,
    fetchDashboardData,
    onRefresh,
  };
}
