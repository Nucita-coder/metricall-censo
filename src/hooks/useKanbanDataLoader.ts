import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchTodasLasTarjetas } from '../services/tarjetasService';
import { Lista, TableroInfo, PermisosRelacionales, TableroDisponible } from '../types/kanban';
import { PermisosEspeciales } from '../context/AuthContext';

export interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  rol?: string;
  etiquetas?: string[];
  avatar_url?: string | null;
  [key: string]: unknown;
}

interface RawEmpleadoPermiso {
  empleado_id?: string;
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_mover?: boolean;
  puede_eliminar?: boolean;
  [key: string]: unknown;
}

interface RawListaRow {
  id: string;
  tablero_id?: string;
  empresa_id?: string;
  nombre: string;
  slug?: string;
  orden?: number;
  posicion?: number;
  color_fondo?: string;
  estado_archivo?: boolean;
  transiciones_permitidas?: string[];
  empleado_lista_permisos?: RawEmpleadoPermiso[];
  [key: string]: unknown;
}

interface UseKanbanDataLoaderProps {
  id: string;
  session?: Session | null;
  userRol: string | null;
  permisosEspeciales: PermisosEspeciales;
  empresaId: string | null;
}

export function useKanbanDataLoader({ id, session, userRol, permisosEspeciales, empresaId }: UseKanbanDataLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [tableroInfo, setTableroInfo] = useState<TableroInfo | null>(null);
  const [listas, setListas] = useState<Lista[]>([]);
  const [tablerosDisponibles, setTablerosDisponibles] = useState<TableroDisponible[]>([]);
  const [miembros, setMiembros] = useState<PerfilUsuario[]>([]);

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

      const rawListas = (listasData || []) as unknown as RawListaRow[];
      const listasActivas = rawListas
        .filter(l => l.estado_archivo !== true)
        .map(l => {
          let permisos: PermisosRelacionales | null = null;
          if (l.empleado_lista_permisos && l.empleado_lista_permisos.length > 0) {
            permisos = l.empleado_lista_permisos.find(p => p.empleado_id === session?.user?.id) || l.empleado_lista_permisos[0];
          }
          const { empleado_lista_permisos: _, ...resto } = l;
          return { ...resto, tarjetas: [], permisos_relacionales: permisos || undefined } as Lista;
        });

      const listaIds = listasActivas.map(l => l.id);

      const sucursalesData = tabData.sucursales as { nombre?: string } | Array<{ nombre?: string }> | null;
      const sucursalNombre = Array.isArray(sucursalesData) ? sucursalesData[0]?.nombre : sucursalesData?.nombre;

      const updatedTableroInfo: TableroInfo = {
        id: tabData.id,
        nombre: tabData.nombre,
        fondo_url: tabData.fondo_url,
        sucursal_nombre: sucursalNombre || 'Sucursal',
        es_favorito: tabData.es_favorito || false,
        descripcion: tabData.descripcion || '',
        opacidad_listas: tabData.opacidad_listas ?? 0.85,
        tipo: tabData.tipo || 'instalaciones'
      };

      if (listaIds.length > 0) {
        const tData = await fetchTodasLasTarjetas({
          listaIds,
          estadoArchivo: false,
          select: '*, perfiles(nombre_completo)',
          orderBy: 'created_at',
          ascending: false,
        });

        const tarjetasData = tData || [];

        const listasAgrupadas: Lista[] = listasActivas.map(lista => ({
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
      if (tabs) setTablerosDisponibles((tabs as TableroDisponible[]).filter(t => t.id !== id));

      let usersQuery = supabase.from('perfiles').select('id, nombre_completo, rol, etiquetas, avatar_url');
      if (empresaId) usersQuery = usersQuery.eq('empresa_id', empresaId);
      const { data: users } = await usersQuery;
      if (users) setMiembros(users as PerfilUsuario[]);

    } catch (error: unknown) {
      if (listas.length === 0) {
        Alert.alert('Error', (error as Error).message || String(error));
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
