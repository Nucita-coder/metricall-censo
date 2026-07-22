import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Tarjeta, Lista } from '../types/kanban';

export const useTarjetaDetalle = (session: any, userRol: string | null, setListas: React.Dispatch<React.SetStateAction<Lista[]>>) => {
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState<Tarjeta | null>(null);
  const [tarjetaAuditoria, setTarjetaAuditoria] = useState<Tarjeta | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !tarjetaSeleccionada) return;

    const comentarioObj = {
      autor: session?.user?.email || userRol || 'Usuario',
      fecha: new Date().toLocaleString(),
      texto: nuevoComentario.trim()
    };

    const comentariosExistentes = tarjetaSeleccionada.datos_valores?.comentarios || [];
    const nuevosComentarios = [...comentariosExistentes, comentarioObj];
    const nuevosDatosValores = { ...tarjetaSeleccionada.datos_valores, comentarios: nuevosComentarios };

    setTarjetaSeleccionada({ ...tarjetaSeleccionada, datos_valores: nuevosDatosValores });
    setNuevoComentario('');

    const { error } = await supabase
      .from('tarjetas')
      .update({ datos_valores: nuevosDatosValores })
      .eq('id', tarjetaSeleccionada.id);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el comentario');
    } else {
      setListas(prev => prev.map(lista => ({
        ...lista,
        tarjetas: lista.tarjetas.map(t => t.id === tarjetaSeleccionada.id ? { ...t, datos_valores: nuevosDatosValores } : t)
      })));
    }
  };

  return {
    tarjetaSeleccionada,
    setTarjetaSeleccionada,
    tarjetaAuditoria,
    setTarjetaAuditoria,
    nuevoComentario,
    setNuevoComentario,
    handleEnviarComentario
  };
};
