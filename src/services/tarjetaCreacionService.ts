import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { TarjetaDatosValores, TarjetaMaterialItem } from '../types/kanban';
import { clasificarMovimientoAlmacen, normalizarTextoAlmacen } from './almacenService';

export interface ParametrosPostCreacionTarjeta {
  currentLista: { id: string; tablero_id: string; nombre: string } | null;
  nuevaTarjetaId: string;
  formData: TarjetaDatosValores;
  empresaId?: string | null;
  listaNombre?: string;
  isMaterialesMode: boolean;
  payload: {
    lista_id: string;
    creador_id?: string;
    empresa_id?: string | null;
    datos_valores: TarjetaDatosValores;
  };
}

export async function ejecutarPostCreacionTarjeta({
  currentLista,
  nuevaTarjetaId,
  formData,
  empresaId,
  listaNombre,
  isMaterialesMode,
  payload,
}: ParametrosPostCreacionTarjeta): Promise<void> {
  // 1. Mover Venta inicial a Factibilidad
  if (currentLista && currentLista.nombre === 'Venta' && nuevaTarjetaId) {
    try {
      const { data: listaFactibilidad } = await supabase
        .from('listas')
        .select('id')
        .eq('tablero_id', currentLista.tablero_id)
        .eq('nombre', 'Factibilidad')
        .maybeSingle();

      if (listaFactibilidad) {
        const { error: rpcError } = await supabase.rpc('mover_tarjeta_seguro', {
          p_tarjeta_id: nuevaTarjetaId,
          p_lista_destino_id: listaFactibilidad.id,
        });
        if (rpcError) {
          console.warn('RPC mover_tarjeta_seguro falló, actualizando directamente:', rpcError.message);
          await supabase.from('tarjetas').update({ lista_id: listaFactibilidad.id }).eq('id', nuevaTarjetaId);
        }
      }
    } catch (err) {
      console.error('Error moviendo tarjeta de Venta a Factibilidad:', err);
    }
  }

  // 2. Caché de ciudad
  try {
    const ciudadToCache = (formData.ciudad as string) || (formData.ciudadMunicipio as string);
    if (ciudadToCache) {
      await AsyncStorage.setItem('@ultima_ciudad_registrada', ciudadToCache);
    }
  } catch (e) {
    console.log('Error guardando ciudad en caché', e);
  }

  // 3. Clonado automático de Censo
  if (listaNombre === 'Censo' && formData.dispuestoCambiar && currentLista?.tablero_id) {
    try {
      let targetListName = '';
      if (formData.dispuestoCambiar === 'Sí') targetListName = 'si desea';
      else if (formData.dispuestoCambiar === 'No') targetListName = 'no desea';
      else if (formData.dispuestoCambiar === 'Es posible') targetListName = 'es posible';

      if (targetListName) {
        const { data: targetList } = await supabase
          .from('listas')
          .select('id')
          .eq('tablero_id', currentLista.tablero_id)
          .eq('nombre', targetListName)
          .single();
        if (targetList) {
          const clonePayload = { ...payload, lista_id: targetList.id };
          await supabase.from('tarjetas').insert(clonePayload);
        }
      }
    } catch (err) {
      console.log('Error silenciado al clonar tarjeta de censo:', err);
    }
  }

  // 4. Procesamiento de Materiales y Notificaciones
  if (isMaterialesMode && formData.tipoCarga && currentLista?.tablero_id && nuevaTarjetaId) {
    const movTipo = clasificarMovimientoAlmacen(formData.tipoCarga);
    try {
      const { data: tableroListas } = await supabase
        .from('listas')
        .select('id, nombre')
        .eq('tablero_id', currentLista.tablero_id);

      if (tableroListas && tableroListas.length > 0) {
        const targetList = tableroListas.find((l) => {
          if (!l.nombre || l.id === currentLista.id) return false;
          return clasificarMovimientoAlmacen(l.nombre) === movTipo;
        });

        if (targetList) {
          const { error: rpcError } = await supabase.rpc('mover_tarjeta_seguro', {
            p_tarjeta_id: nuevaTarjetaId,
            p_lista_destino_id: targetList.id,
          });
          if (rpcError) {
            console.warn('mover_tarjeta_seguro falló en almacén, actualizando directamente:', rpcError.message);
            await supabase.from('tarjetas').update({ lista_id: targetList.id }).eq('id', nuevaTarjetaId);
          }
        }
      }
    } catch (err) {
      console.error('Error al mover tarjeta de almacén:', err);
    }

    const esMovimientoPersonal = movTipo === 'MATERIAL_ASIGNADO' || movTipo === 'DEVOLUCION_ASIGNACION';

    if (esMovimientoPersonal && (formData.asignado_a || (formData.asignadoA && String(formData.asignadoA).trim()))) {
      try {
        let assignedUserId = formData.asignado_a;
        if (!assignedUserId) {
          const targetNorm = normalizarTextoAlmacen(String(formData.asignadoA || ''));
          let qPerfiles = supabase.from('perfiles').select('id, nombre_completo');
          if (empresaId) {
            qPerfiles = qPerfiles.eq('empresa_id', empresaId);
          }
          const { data: perfiles, error: perfilError } = await qPerfiles;

          if (perfilError) {
            console.error('Error al buscar perfiles para notificación:', perfilError);
          }

          const matchedProfile = perfiles?.find((p) => {
            const pNorm = normalizarTextoAlmacen(p.nombre_completo || '');
            return (
              pNorm === targetNorm ||
              (pNorm && targetNorm && (pNorm.includes(targetNorm) || targetNorm.includes(pNorm)))
            );
          });

          if (matchedProfile?.id) {
            assignedUserId = matchedProfile.id;
          }
        }

        if (assignedUserId) {
          await supabase
            .from('tarjetas')
            .update({
              datos_valores: { ...formData, asignado_a: assignedUserId },
            })
            .eq('id', nuevaTarjetaId);

          const itemsList =
            Array.isArray(formData.items) && formData.items.length > 0
              ? (formData.items as TarjetaMaterialItem[])
              : [formData as unknown as TarjetaMaterialItem];
          const resumenItems = itemsList
            .map(
              (it) =>
                `${it.cantidadRecibida || '0'} und. de ${(it.nombreMaterial || it.codigoMaterial || 'Material').toUpperCase()}`
            )
            .join(', ');
          const esDevolucion = movTipo === 'DEVOLUCION_ASIGNACION';
          const mensaje = esDevolucion
            ? `Se registró la devolución de ${resumenItems} al almacén correctamente.`
            : `Se te asignó ${resumenItems}. Este material está ahora en tu custodia.`;

          const { error: notifError } = await supabase.from('notificaciones').insert({
            usuario_id: assignedUserId,
            tarjeta_id: nuevaTarjetaId,
            mensaje,
            leida: false,
          });
          if (notifError) {
            console.error('Error al insertar notificación:', notifError);
          }
        }
      } catch (errNotif) {
        console.error('Error notificacion:', errNotif);
      }
    }
  }
}
