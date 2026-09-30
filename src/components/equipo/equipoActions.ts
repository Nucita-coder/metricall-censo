import { Alert, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export const confirmAction = (title: string, message: string, onConfirm: () => void): void => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export const rechazarSolicitud = async (id: string): Promise<void> => {
  const { error: rpcErr } = await supabase.rpc('rechazar_solicitud_acceso', { p_solicitud_id: id });
  if (rpcErr) {
    const { error: delErr } = await supabase.from('solicitudes_acceso').delete().eq('id', id);
    if (delErr) throw delErr;
  }
};

export const bloquearSolicitud = async (id: string): Promise<void> => {
  const { error: rpcErr } = await supabase.rpc('bloquear_solicitud_acceso', { p_solicitud_id: id });
  if (rpcErr) {
    const { error: upErr } = await supabase.from('solicitudes_acceso').update({ estado: 'bloqueado' }).eq('id', id);
    if (upErr) throw upErr;
  }
};

export const eliminarMiembro = async (miembroId: string): Promise<void> => {
  const { error: rpcErr } = await supabase.rpc('eliminar_miembro_empresa', { p_miembro_id: miembroId });
  if (rpcErr) throw rpcErr;
};

interface AsignarParams {
  solicitudId: string;
  usuarioId?: string;
  sucursalId: string;
  tableros: string[];
  etiquetas: string[];
}

export const asignarEmpleado = async ({
  solicitudId,
  usuarioId,
  sucursalId,
  tableros,
  etiquetas,
}: AsignarParams): Promise<void> => {
  const { error } = await supabase.rpc('aceptar_empleado_granular', {
    p_solicitud_id: solicitudId,
    p_sucursal_id: sucursalId,
    p_tableros_permitidos: tableros,
  });

  if (error) throw error;

  if (usuarioId) {
    const esLider = etiquetas.some(e => e.toLowerCase() === 'líder' || e.toLowerCase() === 'lider');
    const updatePayload: Record<string, unknown> = { etiquetas };
    if (esLider) {
      updatePayload.permisos_especiales = {
        sucursales_permitidas: [sucursalId],
        tableros_permitidos: tableros,
        tarjetas_visibilidad: 'todas',
        acciones: { crear: true, editar: true, borrar: true },
      };
    }
    await supabase.from('perfiles').update(updatePayload).eq('id', usuarioId);
  }
};
