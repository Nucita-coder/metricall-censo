import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../services/uploadImage';

export interface SyncJob {
  id: string;
  tarjetaId: string;
  localUri: string;
  payloadGestion: any;
  status: 'pending' | 'syncing' | 'failed';
}

const QUEUE_KEY = '@cola_sincronizacion';

export const useSyncQueue = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const getQueue = async (): Promise<SyncJob[]> => {
    try {
      const q = await AsyncStorage.getItem(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  };

  const saveQueue = async (queue: SyncJob[]) => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setPendingCount(queue.filter(j => j.status === 'pending').length);
  };

  const addJob = async (job: Omit<SyncJob, 'id' | 'status'>) => {
    const queue = await getQueue();
    const newJob: SyncJob = {
      ...job,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      status: 'pending'
    };
    await saveQueue([...queue, newJob]);
  };

  const processQueue = useCallback(async () => {
    if (isSyncing) return;
    const queue = await getQueue();
    const pendingJobs = queue.filter(j => j.status === 'pending');
    
    if (pendingJobs.length === 0) return;

    setIsSyncing(true);

    let updatedQueue = [...queue];

    for (const job of pendingJobs) {
      try {
        job.status = 'syncing';
        
        // 1. Subir imagen pendiente
        const publicUrl = await uploadImageToSupabase(job.localUri, 'adjuntos', 'gestion');
        if (!publicUrl) throw new Error('Error al subir imagen local');

        // 2. Descargar datos frescos de la tarjeta para no sobreescribir mutaciones recientes
        const { data: tarjeta, error: fetchError } = await supabase
          .from('tarjetas')
          .select('datos_valores')
          .eq('id', job.tarjetaId)
          .single();

        if (fetchError || !tarjeta) throw new Error('Tarjeta no encontrada');

        const datos_valores = tarjeta.datos_valores || {};
        const gestiones = datos_valores.gestiones || [];

        // 3. Inyectar gestión actualizada con URL definitiva
        const gestionActualizada = {
          ...job.payloadGestion,
          evidenciaUrl: publicUrl
        };

        const nuevosDatosValores = {
          ...datos_valores,
          gestiones: [...gestiones, gestionActualizada],
        };

        // Aplicar fecha de próxima gestión si corresponde
        if (job.payloadGestion.fecha_gestion_2) {
          nuevosDatosValores.fecha_gestion_2 = job.payloadGestion.fecha_gestion_2;
        }

        // 4. Update en Supabase
        const { error: updateError } = await supabase
          .from('tarjetas')
          .update({ datos_valores: nuevosDatosValores })
          .eq('id', job.tarjetaId);

        if (updateError) throw new Error('Error actualizando tarjeta');

        // 5. Borrar archivo local para liberar caché
        try {
          await FileSystem.deleteAsync(job.localUri);
        } catch (e) {
          console.log('Error borrando archivo local, no crítico', e);
        }

        // 6. Quitar de la cola
        updatedQueue = updatedQueue.filter(q => q.id !== job.id);
        
      } catch (error) {
        console.error('Error sincronizando job', job.id, error);
        // Si falla, se queda en pending para el próximo intento
        const index = updatedQueue.findIndex(q => q.id === job.id);
        if (index >= 0) updatedQueue[index].status = 'pending';
      }
    }

    await saveQueue(updatedQueue);
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    // Listener automático de la red
    const unsubscribe = NetInfo.addEventListener(state => {
      // isInternetReachable puede ser null en emuladores o al inicio, así que validamos isConnected
      if (state.isConnected) {
        processQueue();
      }
    });

    // Conteo inicial
    getQueue().then(q => setPendingCount(q.filter(j => j.status === 'pending').length));

    return () => unsubscribe();
  }, [processQueue]);

  return {
    pendingCount,
    addJob,
    processQueue,
    isSyncing
  };
};
