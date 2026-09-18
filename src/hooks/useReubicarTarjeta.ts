import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Lista, Tarjeta } from '../types/kanban';

// Campos operativos acumulados por cada fase del flujo de instalación.
// Cada fase se identifica por un patrón en el nombre de la lista.
const CAMPOS_POR_FASE: Array<{ patron: RegExp; campos: string[] }> = [
  {
    patron: /asignad/i,
    campos: [
      'tecnicoAsignado', 'asignadoA', 'asignado_a', 'tecnico_id',
      'tecnico', 'fechaAsignacion', 'asignadoPor',
    ],
  },
  {
    patron: /proceso|instalac/i,
    campos: [
      'tipoInstalacion', 'serialEquipo', 'macEquipo', 'mac_equipo', 'materiales',
      'puertoAsignado', 'puertosDisponibles', 'nroNap', 'potenciaNap',
      'potencia_casa', 'potenciaCasa', 'cable_drop', 'cableDrop', 'geo_nap', 'geo_casa',
      'geofotos', 'estadoSoporte', 'accionFalla', 'serial_onu', 'puerto',
      'puertos_disponibles', 'nap',
    ],
  },
  {
    patron: /activar|revision|revisar/i,
    campos: [
      'motivoRetorno', 'ultimoMotivoRetorno', 'retornadoPor',
      'estadoActivacion', 'activadoPor', 'fechaActivacion',
    ],
  },
  {
    patron: /libera|complet|finaliz/i,
    campos: [
      'estadoLiberacion', 'fechaLiberacion', 'liberadoPor', 'conclusionFinal',
    ],
  },
];

/**
 * Determina qué campos borrar de datos_valores según las listas que quedan
 * DESPUÉS de la lista destino (por posición/orden en el tablero).
 * Los campos de las listas destino y anteriores se conservan.
 */
function calcularCamposALimpiar(
  listas: Lista[],
  listaDestinoId: string
): string[] {
  const ordenadas = [...listas].sort((a, b) => {
    const posA = a.posicion ?? a.orden;
    const posB = b.posicion ?? b.orden;
    if (typeof posA === 'number' && typeof posB === 'number' && posA !== posB) {
      return posA - posB;
    }
    return listas.indexOf(a) - listas.indexOf(b);
  });
  const idxDestino = ordenadas.findIndex((l) => l.id === listaDestinoId);
  if (idxDestino < 0) return [];

  // Listas que vienen DESPUÉS del destino
  const listasPostDestino = ordenadas.slice(idxDestino + 1);

  const camposALimpiar = new Set<string>();
  listasPostDestino.forEach((lista) => {
    const nombre = lista.nombre || '';
    CAMPOS_POR_FASE.forEach(({ patron, campos }) => {
      if (patron.test(nombre)) {
        campos.forEach((c) => camposALimpiar.add(c));
      }
    });
  });

  // También limpiar los campos de la lista ACTUAL (origen) identificada por
  // el mismo patrón si el destino es anterior — esto cubre el caso de mover
  // de "En Proceso" a "Asignado A": se limpian también los campos de En Proceso.
  // Para eso, incluimos los campos de todas las listas post-destino + la lista origen.
  return Array.from(camposALimpiar);
}

export interface UseReubicarTarjetaResult {
  tarjetaParaReubicar: Tarjeta | null;
  isProcessing: boolean;
  iniciarReubicacion: (tarjeta: Tarjeta) => void;
  cancelarReubicacion: () => void;
  confirmarReubicacion: (listaDestinoId: string) => Promise<void>;
}

export function useReubicarTarjeta(
  listas: Lista[],
  setListas: React.Dispatch<React.SetStateAction<Lista[]>>
): UseReubicarTarjetaResult {
  const [tarjetaParaReubicar, setTarjetaParaReubicar] = useState<Tarjeta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const iniciarReubicacion = (tarjeta: Tarjeta) => {
    setTarjetaParaReubicar(tarjeta);
  };

  const cancelarReubicacion = () => {
    setTarjetaParaReubicar(null);
  };

  const confirmarReubicacion = async (listaDestinoId: string) => {
    if (!tarjetaParaReubicar) return;
    setIsProcessing(true);

    try {
      const camposALimpiar = calcularCamposALimpiar(listas, listaDestinoId);

      // Construir datos_valores limpiados: eliminar los campos operativos post-destino
      const datosActuales = { ...(tarjetaParaReubicar.datos_valores || {}) };
      camposALimpiar.forEach((campo) => {
        delete (datosActuales as Record<string, unknown>)[campo];
      });

      // 1. Actualizar datos_valores en Supabase
      const { error: errData } = await supabase
        .from('tarjetas')
        .update({ datos_valores: datosActuales })
        .eq('id', tarjetaParaReubicar.id);
      if (errData) throw errData;

      // 2. Mover la tarjeta a la lista destino via RPC
      const { error: errMove } = await supabase.rpc('mover_tarjeta_seguro', {
        p_tarjeta_id: tarjetaParaReubicar.id,
        p_lista_destino_id: listaDestinoId,
      });
      if (errMove) throw errMove;

      // 3. Actualizar estado local
      const tarjetaActualizada: Tarjeta = {
        ...tarjetaParaReubicar,
        lista_id: listaDestinoId,
        datos_valores: datosActuales,
      };
      setListas((prev) =>
        prev.map((lista) => {
          if (lista.id === tarjetaParaReubicar.lista_id) {
            return { ...lista, tarjetas: lista.tarjetas.filter((t) => t.id !== tarjetaParaReubicar.id) };
          }
          if (lista.id === listaDestinoId) {
            return { ...lista, tarjetas: [tarjetaActualizada, ...lista.tarjetas] };
          }
          return lista;
        })
      );

      setTarjetaParaReubicar(null);
      Alert.alert('Tarjeta reubicada', 'La tarjeta fue movida y sus datos operativos fueron limpiados correctamente.');
    } catch (e: unknown) {
      Alert.alert('Error', 'No se pudo reubicar la tarjeta: ' + (e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    tarjetaParaReubicar,
    isProcessing,
    iniciarReubicacion,
    cancelarReubicacion,
    confirmarReubicacion,
  };
}
