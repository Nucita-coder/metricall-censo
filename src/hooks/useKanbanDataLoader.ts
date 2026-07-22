import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Lista, TableroInfo } from '../types/kanban';

interface UseKanbanDataLoaderProps {
  id: string;
  session: any;
  userRol: string | null;
  permisosEspeciales: any;
  empresaId: string | null;
}

export function useKanbanDataLoader({ id, session, userRol, permisosEspeciales, empresaId }: UseKanbanDataLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [tableroInfo, setTableroInfo] = useState<TableroInfo | null>(null);
  const [listas, setListas] = useState<Lista[]>([]);
  const [tablerosDisponibles, setTablerosDisponibles] = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]);

  const fetchKanbanData = useCallback(async () => {
    try {
      if (listas.length === 0) {
        setIsLoading(true);
      }

      const { data: tabData, error: tabError } = await supabase
        .from('tableros')
        .select(`id, nombre, fondo_url, sucursal_id, sucursales(nombre), es_favorito, descripcion, opacidad_listas, tipo`)
        .eq('id', id)
        .single();

      if (tabError) throw tabError;

      const { data: listasData, error: listasError } = await supabase
        .from('listas')
        .select('*, empleado_lista_permisos(*)')
        .eq('tablero_id', id)
        .order('orden', { ascending: true });

      if (listasError) throw listasError;

      const listasActivas = listasData.filter((l: any) => l.estado_archivo !== true).map((l: any) => {
        let permisos = null;
        if (l.empleado_lista_permisos && l.empleado_lista_permisos.length > 0) {
          permisos = l.empleado_lista_permisos.find((p: any) => p.empleado_id === session?.user?.id) || l.empleado_lista_permisos[0];
        }
        delete l.empleado_lista_permisos;
        return { ...l, permisos_relacionales: permisos };
      });
      const listaIds = listasActivas.map((l: any) => l.id);

      const updatedTableroInfo = {
        id: tabData.id,
        nombre: tabData.nombre,
        fondo_url: tabData.fondo_url,
        sucursal_nombre: (tabData.sucursales as any)?.nombre || 'Sucursal',
        es_favorito: tabData.es_favorito || false,
        descripcion: tabData.descripcion || '',
        opacidad_listas: tabData.opacidad_listas ?? 0.85,
        tipo: tabData.tipo || 'instalaciones'
      };

      if (listaIds.length > 0) {
        const { data: tData, error: tError } = await supabase
          .from('tarjetas')
          .select('*, perfiles(nombre_completo)')
          .in('lista_id', listaIds)
          .order('created_at', { ascending: false });

        if (tError) throw tError;
        const tarjetasData = (tData as any[]).filter((t: any) => t.estado_archivo !== true);

        const listasAgrupadas: Lista[] = listasActivas.map((lista: any) => ({
          ...lista,
          tarjetas: tarjetasData.filter(t => t.lista_id === lista.id)
        }));

        setTableroInfo(updatedTableroInfo);
        setListas(listasAgrupadas);
      } else {
        setTableroInfo(updatedTableroInfo);
        setListas([]);
      }

      let tabsQuery = supabase.from('tableros').select('id, nombre, fondo_url');
      if (empresaId) tabsQuery = tabsQuery.eq('empresa_id', empresaId);
      const { data: tabs } = await tabsQuery;
      if (tabs) setTablerosDisponibles(tabs.filter(t => t.id !== id));

      let usersQuery = supabase.from('perfiles').select('id, nombre_completo, rol, etiquetas');
      if (empresaId) usersQuery = usersQuery.eq('empresa_id', empresaId);
      const { data: users } = await usersQuery;
      if (users) setMiembros(users);

    } catch (error: any) {
      if (listas.length === 0) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, session, empresaId]);

  return {
    isLoading,
    setIsLoading,
    tableroInfo,
    setTableroInfo,
    listas,
    setListas,
    tablerosDisponibles,
    miembros,
    fetchKanbanData,
  };
}
