import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Lista, TableroInfo, Tarjeta } from '../types/kanban';
import { fetchTodasLasTarjetas } from '../services/tarjetasService';

// Forma mínima de un tablero disponible (selector de destino en ModalGestionLista)
export interface TableroDisponible {
  id: string;
  nombre: string;
  fondo_url?: string | null;
}

interface UseKanbanTableroConfigParams {
  tableroInfo: TableroInfo | null;
  setTableroInfo: (info: TableroInfo | null) => void;
  listas: Lista[];
  id: string;
  fetchKanbanData: () => void;
}

export const useKanbanTableroConfig = ({
  tableroInfo,
  setTableroInfo,
  listas,
  id,
  fetchKanbanData,
}: UseKanbanTableroConfigParams) => {
  const [tempDesc, setTempDesc] = useState('');
  const [modalArchivadasVisible, setModalArchivadasVisible] = useState(false);
  const [tarjetasArchivadas, setTarjetasArchivadas] = useState<Tarjeta[]>([]);
  const [listasArchivadas, setListasArchivadas] = useState<Lista[]>([]);

  /** Alterna el estado de favorito del tablero y persiste en DB */
  const toggleFavorite = async (): Promise<void> => {
    if (!tableroInfo) return;
    const newFav = !tableroInfo.es_favorito;
    setTableroInfo({ ...tableroInfo, es_favorito: newFav });
    await supabase.from('tableros').update({ es_favorito: newFav }).eq('id', tableroInfo.id);
  };

  /** Guarda la descripción editada del tablero */
  const saveDescripcion = async (): Promise<void> => {
    if (!tableroInfo) return;
    await supabase.from('tableros').update({ descripcion: tempDesc }).eq('id', tableroInfo.id);
    setTableroInfo({ ...tableroInfo, descripcion: tempDesc });
  };

  /** Actualiza la opacidad de las listas en el estado local (preview en tiempo real) */
  const handleOpacityChange = (val: number): void => {
    if (tableroInfo) setTableroInfo({ ...tableroInfo, opacidad_listas: val });
  };

  /** Persiste la opacidad de las listas en DB */
  const saveOpacityConfig = async (val: number): Promise<void> => {
    await supabase.from('tableros').update({ opacidad_listas: val }).eq('id', id);
  };

  /**
   * Carga tarjetas y listas archivadas del tablero desde Supabase
   * y abre el modal de elementos archivados.
   */
  const fetchArchivedCards = async (): Promise<void> => {
    const dataCards = await fetchTodasLasTarjetas({
      listaIds: listas.map(l => l.id),
      estadoArchivo: true,
      select: '*, perfiles(nombre_completo)',
    });
    setTarjetasArchivadas((dataCards || []) as Tarjeta[]);

    const { data: dataLists } = await supabase
      .from('listas')
      .select('*')
      .eq('tablero_id', id)
      .eq('estado_archivo', true);
    setListasArchivadas((dataLists || []) as Lista[]);

    setModalArchivadasVisible(true);
  };

  /** Restaura una tarjeta archivada y refresca el tablero */
  const handleRestoreCard = async (cardId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('tarjetas').update({ estado_archivo: false }).eq('id', cardId);
      if (error) throw error;
      setTarjetasArchivadas(prev => prev.filter(t => t.id !== cardId));
      fetchKanbanData();
    } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
  };

  /** Restaura una lista archivada y refresca el tablero */
  const handleRestoreList = async (listaId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('listas').update({ estado_archivo: false }).eq('id', listaId);
      if (error) throw error;
      setListasArchivadas(prev => prev.filter(l => l.id !== listaId));
      fetchKanbanData();
      if (Platform.OS === 'web') alert('¡Lista desarchivada y restaurada en el tablero!');
      else Alert.alert('Éxito', '¡Lista desarchivada y restaurada en el tablero!');
    } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
  };

  return {
    tempDesc,
    setTempDesc,
    modalArchivadasVisible,
    setModalArchivadasVisible,
    tarjetasArchivadas,
    listasArchivadas,
    toggleFavorite,
    saveDescripcion,
    handleOpacityChange,
    saveOpacityConfig,
    fetchArchivedCards,
    handleRestoreCard,
    handleRestoreList,
  };
};
