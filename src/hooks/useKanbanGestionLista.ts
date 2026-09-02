import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Lista, TableroInfo, TableroDisponible } from '../types/kanban';

// Payload tipado para actualización parcial de lista (solo los campos que pueden cambiar)
type ListaUpdatePayload = Partial<Pick<Lista, 'nombre' | 'color_fondo'>>;

interface UseKanbanGestionListaParams {
  setListas: React.Dispatch<React.SetStateAction<Lista[]>>;
  fetchKanbanData: () => void;
  tablerosDisponibles: TableroDisponible[];
}

export const useKanbanGestionLista = ({
  setListas,
  fetchKanbanData,
  tablerosDisponibles,
}: UseKanbanGestionListaParams) => {
  const [modalListaVisible, setModalListaVisible] = useState(false);
  const [listaActivaGestion, setListaActivaGestion] = useState<Lista | null>(null);
  const [gestionMenuPos, setGestionMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [gestionMenuAction, setGestionMenuAction] = useState<'main' | 'rename' | 'color' | 'move'>('main');
  const [editListaNombre, setEditListaNombre] = useState('');
  const [editListaColor, setEditListaColor] = useState('');
  const [selectedTableroId, setSelectedTableroId] = useState('');

  /** Abre el modal de gestión de lista, posicionado opcionalmente cerca del elemento pulsado */
  const openGestionLista = (lista: Lista, x?: number, y?: number): void => {
    setListaActivaGestion(lista);
    setEditListaNombre(lista.nombre);
    setEditListaColor(lista.color_fondo || '#22272B');
    setGestionMenuAction('main');
    setGestionMenuPos(x !== undefined && y !== undefined ? { x, y } : null);
    setModalListaVisible(true);
  };

  /** Persiste el renombrado o cambio de color de la lista activa */
  const handleActualizarLista = async (): Promise<void> => {
    if (!listaActivaGestion) return;
    try {
      const payload: ListaUpdatePayload = {};
      if (gestionMenuAction === 'rename') payload.nombre = editListaNombre;
      if (gestionMenuAction === 'color') payload.color_fondo = editListaColor;

      const { error } = await supabase.from('listas').update(payload).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.map(l => l.id === listaActivaGestion.id ? { ...l, ...payload } : l));
      setModalListaVisible(false);
      Alert.alert('¡Éxito!', 'Lista actualizada correctamente.');
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo actualizar la lista.');
    }
  };

  /** Archiva la lista activa (soft-delete) */
  const handleArchivarLista = async (): Promise<void> => {
    if (!listaActivaGestion) return;
    try {
      const { error } = await supabase.from('listas').update({ estado_archivo: true }).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.filter(l => l.id !== listaActivaGestion.id));
      setModalListaVisible(false);
      Alert.alert('Éxito', 'Lista archivada correctamente.');
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo archivar la lista.');
    }
  };

  /** Mueve la lista activa a otro tablero */
  const handleMoverListaTablero = async (): Promise<void> => {
    if (!listaActivaGestion || !selectedTableroId) return;
    try {
      const { error } = await supabase.from('listas').update({ tablero_id: selectedTableroId }).eq('id', listaActivaGestion.id);
      if (error) throw error;

      setListas(prev => prev.filter(l => l.id !== listaActivaGestion.id));
      setModalListaVisible(false);
      Alert.alert('Éxito', 'Lista movida al tablero seleccionado.');
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message || 'No se pudo mover la lista.');
    }
  };

  return {
    modalListaVisible,
    setModalListaVisible,
    listaActivaGestion,
    gestionMenuPos,
    gestionMenuAction,
    setGestionMenuAction,
    editListaNombre,
    setEditListaNombre,
    editListaColor,
    setEditListaColor,
    selectedTableroId,
    setSelectedTableroId,
    openGestionLista,
    handleActualizarLista,
    handleArchivarLista,
    handleMoverListaTablero,
  };
};
