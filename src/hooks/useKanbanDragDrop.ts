import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

import { Tarjeta, Lista, TableroInfo } from '../types/kanban';

interface UseKanbanDragDropProps {
  listas: Lista[];
  setListas: React.Dispatch<React.SetStateAction<Lista[]>>;
  tableroInfo: TableroInfo | null;
}

export const useKanbanDragDrop = ({ listas, setListas, tableroInfo }: UseKanbanDragDropProps) => {
  const [tarjetaEnMovimiento, setTarjetaEnMovimiento] = useState<Tarjeta | null>(null);
  const [listaEnMovimiento, setListaEnMovimiento] = useState<Lista | null>(null);

  const handleMove = async (targetListaId: string) => {
    if (!tarjetaEnMovimiento) return;

    const currentLista = listas.find(l => l.id === tarjetaEnMovimiento.lista_id);
    const targetLista = listas.find(l => l.id === targetListaId);

    // Validaciones de Reglas de Negocio
    if (tableroInfo?.tipo === 'instalaciones') {
      Alert.alert('Movimiento Restringido', 'En tableros de Instalaciones, el movimiento de tarjetas es automático según las acciones del detalle.');
      setTarjetaEnMovimiento(null);
      return;
    }

    // Validación de Transiciones Permitidas Relacionales
    if (currentLista && currentLista.transiciones_permitidas && currentLista.transiciones_permitidas.length > 0) {
      if (!currentLista.transiciones_permitidas.includes(targetListaId)) {
        Alert.alert('Transición Inválida', `El flujo configurado no permite mover de "${currentLista.nombre}" a "${targetLista?.nombre}".`);
        setTarjetaEnMovimiento(null);
        return;
      }
    } else if (currentLista && Array.isArray(currentLista.transiciones_permitidas) && currentLista.transiciones_permitidas.length === 0) {
      // Si es un array explícitamente vacío, significa que está "bloqueada" o no tiene salidas
      Alert.alert('Transición Inválida', `La lista "${currentLista.nombre}" no tiene transiciones de salida permitidas.`);
      setTarjetaEnMovimiento(null);
      return;
    }

    if (tarjetaEnMovimiento.datos_valores?.estadoLiberacion === 'bloqueada') {
      Alert.alert('Tarjeta Bloqueada', 'No se puede mover una tarjeta liberada. Debe retomar el proceso desde los detalles de la tarjeta.');
      setTarjetaEnMovimiento(null);
      return;
    }

    if (currentLista?.nombre === 'Por Activar' && targetLista?.nombre === 'Activados') {
      if (tarjetaEnMovimiento.datos_valores?.instalacionConfirmada !== true) {
        Alert.alert('Acción Denegada', 'Debes confirmar la instalación en los detalles de la tarjeta antes de pasarla a Activados.');
        setTarjetaEnMovimiento(null);
        return;
      }
    }

    if (currentLista?.nombre === 'Por Activar' && (targetLista?.orden ?? 0) < (currentLista?.orden ?? 0)) {
      Alert.alert('Acción Denegada', 'Una instalación en fase de activación no puede regresar a etapas anteriores.');
      setTarjetaEnMovimiento(null);
      return;
    }

    if (currentLista?.nombre === 'Factibilidad' && targetLista?.nombre === 'Por Instalar') {
      if (!tarjetaEnMovimiento.datos_valores?.lch_numero || !tarjetaEnMovimiento.datos_valores?.lch_imagen) {
        Alert.alert('Acción Denegada', 'Es obligatorio cargar el Nro de LCH y su imagen antes de asignar la instalación.');
        setTarjetaEnMovimiento(null);
        return;
      }
      if (tarjetaEnMovimiento.datos_valores?.controlCalidad !== 'Aprobado') {
        Alert.alert('Acción Denegada', 'La tarjeta debe estar Aprobada en Control de Calidad para pasar a Instalación.');
        setTarjetaEnMovimiento(null);
        return;
      }
    }

    const previousListas = [...listas];
    const tarjetaId = tarjetaEnMovimiento.id;
    const oldListaId = tarjetaEnMovimiento.lista_id;
    
    setTarjetaEnMovimiento(null);

    try {
      // 1. UI Updates Optimistas
      setListas(prev => {
        let latestCard = { ...tarjetaEnMovimiento };
        for (const list of prev) {
          const cardIndex = list.tarjetas.findIndex(t => t.id === tarjetaId);
          if (cardIndex !== -1) {
            latestCard = { ...list.tarjetas[cardIndex] };
            break;
          }
        }
        
        const updatedCard = { ...latestCard, lista_id: targetListaId };
        
        return prev.map(l => {
          if (l.id === oldListaId) {
            return { ...l, tarjetas: l.tarjetas.filter(t => t.id !== tarjetaId) };
          }
          if (l.id === targetListaId) {
            return { ...l, tarjetas: [updatedCard, ...l.tarjetas] };
          }
          return l;
        });
      });

      // 2. Persistencia en Supabase via RPC seguro
      const { error } = await supabase.rpc('mover_tarjeta_seguro', {
        p_tarjeta_id: tarjetaId,
        p_lista_destino_id: targetListaId
      });
      if (error) throw error;
    } catch (e: any) {
      setListas(previousListas);
      Alert.alert('Error', 'No se pudo mover la tarjeta: ' + e.message);
    }
  };

  const handleSwapLists = async (targetListaId: string) => {
    if (!listaEnMovimiento) return;

    const currentIndex = listas.findIndex(l => l.id === listaEnMovimiento.id);
    const targetIndex = listas.findIndex(l => l.id === targetListaId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const currentLista = listas[currentIndex];
    const targetLista = listas[targetIndex];

    const newOrdenCurrent = targetLista.orden;
    const newOrdenTarget = currentLista.orden;

    const previousListas = [...listas];
    setListaEnMovimiento(null);

    try {
      setListas(prev => {
        const newList = [...prev];
        newList[currentIndex] = { ...currentLista, orden: newOrdenCurrent };
        newList[targetIndex] = { ...targetLista, orden: newOrdenTarget };
        return newList.sort((a, b) => a.orden - b.orden);
      });

      await Promise.all([
        supabase.from('listas').update({ orden: newOrdenCurrent }).eq('id', currentLista.id),
        supabase.from('listas').update({ orden: newOrdenTarget }).eq('id', targetLista.id)
      ]);
    } catch (e: any) {
      setListas(previousListas);
      Alert.alert('Error', 'No se pudieron intercambiar las columnas en la nube.');
    }
  };

  return {
    tarjetaEnMovimiento,
    setTarjetaEnMovimiento,
    listaEnMovimiento,
    setListaEnMovimiento,
    handleMove,
    handleSwapLists
  };
};
