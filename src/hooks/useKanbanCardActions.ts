import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Lista, Tarjeta, TarjetaDatosValores } from '../types/kanban';

// ─── Tipos de los grupos de parámetros ─────────────────────────────────────

interface CardActionsState {
  listas: Lista[];
  tarjetaSeleccionada: Tarjeta | null;
  tarjetaEnMovimiento: Tarjeta | null;
}

interface CardActionsSetters {
  setListas: React.Dispatch<React.SetStateAction<Lista[]>>;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  setTarjetaEnMovimiento: (t: Tarjeta | null) => void;
}

interface CardActionsAuth {
  session?: Session | null;
  nombreCompleto: string | null;
  userRol: string | null;
}

export interface UseKanbanCardActionsParams {
  state: CardActionsState;
  setters: CardActionsSetters;
  auth: CardActionsAuth;
  tableroId: string;
}

// Entrada del historial de auditoría generada al guardar cambios en datos_valores
interface AuditoriaModificacion {
  campo: string;
  valor_anterior: unknown;
  valor_nuevo: unknown;
}

interface AuditoriaEntrada {
  id: string;
  autor: string;
  fecha: string;
  tipo: 'edicion';
  modificaciones: AuditoriaModificacion[];
}

// Resultado parcial de la RPC archivar_tablero_cobranza
interface ArchivarTableroResult {
  nombre_archivado?: string;
  nuevo_nombre?: string;
}

export const useKanbanCardActions = ({ state, setters, auth, tableroId }: UseKanbanCardActionsParams) => {
  const { listas, tarjetaSeleccionada, tarjetaEnMovimiento } = state;
  const { setListas, setTarjetaSeleccionada, setTarjetaEnMovimiento } = setters;
  const { session, nombreCompleto, userRol } = auth;

  /**
   * Ref que mantiene la referencia más reciente de tarjetaSeleccionada para evitar
   * stale closures en onUpdateTarjetaSeleccionada.
   */
  const tarjetaSeleccionadaRef = useRef<Tarjeta | null>(tarjetaSeleccionada);
  useEffect(() => { tarjetaSeleccionadaRef.current = tarjetaSeleccionada; }, [tarjetaSeleccionada]);

  /** Soft-archiva una tarjeta y la elimina del estado local */
  const handleArchiveCard = async (tarjeta: Tarjeta): Promise<void> => {
    try {
      const { error } = await supabase.from('tarjetas').update({ estado_archivo: true }).eq('id', tarjeta.id);
      if (error) throw error;
      setListas(prev => prev.map(l =>
        l.id === tarjeta.lista_id ? { ...l, tarjetas: l.tarjetas.filter(t => t.id !== tarjeta.id) } : l
      ));
    } catch (e: unknown) { Alert.alert('Error', 'No se pudo archivar: ' + (e as Error).message); }
  };

  /**
   * Mueve una tarjeta a otra lista via RPC `mover_tarjeta_seguro`.
   * Aplica optimistic update con rollback automático ante error.
   */
  const autoMoverTarjeta = async (tarjetaActual: Tarjeta, listaDestinoId: string): Promise<void> => {
    const targetLista = listas.find(l => l.id === listaDestinoId);
    const puedeVerDestino = userRol !== 'empleado' || targetLista?.permisos_relacionales?.puede_ver !== false;
    const previousListas = [...listas];
    try {
      setListas(prev => prev.map(lista => {
        if (lista.id === tarjetaActual.lista_id) return { ...lista, tarjetas: lista.tarjetas.filter(t => t.id !== tarjetaActual.id) };
        if (puedeVerDestino && lista.id === targetLista?.id) return { ...lista, tarjetas: [{ ...tarjetaActual, lista_id: targetLista!.id }, ...lista.tarjetas] };
        return lista;
      }));
      setTarjetaSeleccionada(null);
      const { error } = await supabase.rpc('mover_tarjeta_seguro', { p_tarjeta_id: tarjetaActual.id, p_lista_destino_id: listaDestinoId });
      if (error) throw error;
    } catch (error: unknown) {
      setListas(previousListas);
      Alert.alert('Error', 'La tarjeta no pudo moverse: ' + (error as Error)?.message);
      throw error;
    }
  };

  /** Elimina permanentemente la tarjeta en movimiento con confirmación previa */
  const handleDeleteCard = (): void => {
    if (!tarjetaEnMovimiento) return;
    Alert.alert('Eliminar Tarjeta', '¿Eliminar tarjeta de forma permanente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            const tarjetaId = tarjetaEnMovimiento.id;
            setTarjetaEnMovimiento(null);
            setListas(prev => prev.map(lista => ({ ...lista, tarjetas: lista.tarjetas.filter(t => t.id !== tarjetaId) })));
            await supabase.from('tarjetas').delete().eq('id', tarjetaId);
          } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
        },
      },
    ]);
  };

  /** Duplica la tarjeta en movimiento (copia de datos_valores sin id ni timestamps) */
  const handleDuplicarTarjeta = async (): Promise<void> => {
    if (!tarjetaEnMovimiento) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, created_at: _ca, perfiles: _pf, listas: _ls, ...tarjetaData } = tarjetaEnMovimiento as Tarjeta & Record<string, unknown>;
      const nuevosDatosValores: TarjetaDatosValores = { ...(tarjetaData.datos_valores as TarjetaDatosValores) };
      if (nuevosDatosValores.nombre) nuevosDatosValores.nombre = `Copia - ${nuevosDatosValores.nombre}`;
      const { data, error } = await supabase.from('tarjetas').insert({ ...tarjetaData, datos_valores: nuevosDatosValores }).select().single();
      if (error) throw error;
      setListas(prev => prev.map(lista => lista.id === data.lista_id ? { ...lista, tarjetas: [...lista.tarjetas, data as Tarjeta] } : lista));
      setTarjetaEnMovimiento(null);
    } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
  };

  /**
   * Actualiza datos_valores de una tarjeta y genera automáticamente una entrada
   * de auditoría en historial_auditoria comparando campo por campo.
   * Usa ref para evitar stale closure sobre tarjetaSeleccionada.
   */
  const onUpdateTarjetaSeleccionada = async (
    nuevosDatos: TarjetaDatosValores,
    targetCard?: Tarjeta | null,
  ): Promise<void> => {
    const cardToUpdate = targetCard ?? tarjetaSeleccionadaRef.current;
    if (!cardToUpdate) return;
    try {
      const oldValues: TarjetaDatosValores = cardToUpdate.datos_valores || {};
      const modificaciones: AuditoriaModificacion[] = [];

      (Object.keys(nuevosDatos) as Array<keyof TarjetaDatosValores>).forEach(key => {
        if (key === 'historial_auditoria') return;
        const valAnterior = oldValues[key];
        const valNuevo = nuevosDatos[key];
        if (JSON.stringify(valAnterior) !== JSON.stringify(valNuevo)) {
          modificaciones.push({
            campo: key as string,
            valor_anterior: valAnterior !== undefined && valAnterior !== null && valAnterior !== '' ? valAnterior : 'Vacío',
            valor_nuevo: valNuevo !== undefined && valNuevo !== null && valNuevo !== '' ? valNuevo : 'Vacío',
          });
        }
      });

      const historialAnterior = Array.isArray(oldValues.historial_auditoria) ? [...(oldValues.historial_auditoria as AuditoriaEntrada[])] : [];
      if (modificaciones.length > 0) {
        historialAnterior.push({
          id: Date.now().toString(),
          autor: nombreCompleto || session?.user?.email || 'Usuario Registrado',
          fecha: new Date().toISOString(),
          tipo: 'edicion',
          modificaciones,
        });
      }

      const updatedDatosValores: TarjetaDatosValores = {
        ...oldValues,
        ...nuevosDatos,
        historial_auditoria: historialAnterior,
      };

      await supabase.from('tarjetas').update({ datos_valores: updatedDatosValores }).eq('id', cardToUpdate.id);
      setListas(prev => prev.map(lista => ({
        ...lista,
        tarjetas: lista.tarjetas.map(t => t.id === cardToUpdate.id ? { ...t, datos_valores: updatedDatosValores } : t),
      })));
      if (tarjetaSeleccionadaRef.current?.id === cardToUpdate.id) {
        setTarjetaSeleccionada({ ...tarjetaSeleccionadaRef.current, datos_valores: updatedDatosValores });
      }
    } catch (e: unknown) { Alert.alert('Error', (e as Error).message); }
  };

  /**
   * Ejecuta la RPC `archivar_tablero_cobranza` para cerrar el período mensual.
   * Redirige al dashboard tras el cierre exitoso.
   */
  const handleArchivarTablero = (tableroNombre: string): void => {
    const confirmar = () => {
      supabase.rpc('archivar_tablero_cobranza', { p_tablero_id: tableroId })
        .then(({ data, error }) => {
          if (error) { Alert.alert('Error', 'No se pudo archivar el tablero: ' + error.message); return; }
          const result = data as ArchivarTableroResult;
          if (Platform.OS === 'web') {
            alert(`Tablero archivado como "${result?.nombre_archivado}"\n\nSe creó automáticamente el tablero: "${result?.nuevo_nombre}"`);
          } else {
            Alert.alert(
              '¡Mes Cerrado!',
              `Tablero archivado como:\n"${result?.nombre_archivado}"\n\nNuevo tablero creado:\n"${result?.nuevo_nombre}"`,
              [{ text: 'Ir al Dashboard', onPress: () => router.replace('/') }]
            );
          }
          if (Platform.OS === 'web') router.replace('/');
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Cerrar el período del tablero "${tableroNombre}"?\n\nEsta acción archivará el tablero actual y creará automáticamente el tablero del mes siguiente.`)) confirmar();
    } else {
      Alert.alert(
        'Cerrar Mes',
        `¿Archivar el tablero "${tableroNombre}"?\n\nSe creará automáticamente el tablero del mes siguiente.`,
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar Mes', style: 'destructive', onPress: confirmar }]
      );
    }
  };

  /**
   * Elimina permanentemente una tarjeta específica con confirmación previa.
   * Usada desde el menú contextual (clic derecho) para líderes y desarrolladores.
   */
  const handleDeleteCardDirecta = (tarjeta: Tarjeta): void => {
    const ejecutarBorrado = async (): Promise<void> => {
      try {
        setListas(prev => prev.map(lista => ({
          ...lista,
          tarjetas: lista.tarjetas.filter(t => t.id !== tarjeta.id),
        })));
        if (tarjetaSeleccionadaRef.current?.id === tarjeta.id) {
          setTarjetaSeleccionada(null);
        }
        if (tarjetaEnMovimiento?.id === tarjeta.id) {
          setTarjetaEnMovimiento(null);
        }
        const { error } = await supabase.from('tarjetas').delete().eq('id', tarjeta.id);
        if (error) throw error;
      } catch (e: unknown) {
        Alert.alert('Error al eliminar', (e as Error).message);
      }
    };

    const mensaje = '¿Estás seguro de que deseas eliminar permanentemente esta tarjeta? Esta acción no se puede deshacer.';
    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) void ejecutarBorrado();
    } else {
      Alert.alert('Eliminar Tarjeta', mensaje, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void ejecutarBorrado() },
      ]);
    }
  };

  return {
    handleArchiveCard,
    autoMoverTarjeta,
    handleDeleteCard,
    handleDeleteCardDirecta,
    handleDuplicarTarjeta,
    onUpdateTarjetaSeleccionada,
    handleArchivarTablero,
  };
};
