import React from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { Copy, Pencil, Trash2 } from 'lucide-react-native';
import { Tarjeta, Lista } from '../../types/kanban';

interface BoardActionButtonsProps {
  tarjetaEnMovimiento: Tarjeta | null;
  listas: Lista[];
  userRol: string | null;
  onEdit: () => void;
  onDuplicar: () => void;
  onDelete: () => void;
}

export function BoardActionButtons({
  tarjetaEnMovimiento,
  listas,
  userRol,
  onEdit,
  onDuplicar,
  onDelete,
}: BoardActionButtonsProps) {
  if (!tarjetaEnMovimiento) return null;

  const listaOrigen = listas.find((l) => l.id === tarjetaEnMovimiento.lista_id);
  const puedeEditar = userRol === 'lider' || listaOrigen?.permisos_relacionales?.puede_editar === true;
  const puedeBorrar = userRol !== 'empleado' || listaOrigen?.permisos_relacionales?.puede_borrar === true;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 16,
        bottom: 100,
        gap: 16,
        zIndex: 100,
        alignItems: 'center',
      }}
    >
      {puedeEditar && (
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onEdit}
        >
          <Pencil size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          width: 50,
          height: 50,
          borderRadius: 25,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onDuplicar}
      >
        <Copy size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {puedeBorrar && (
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onDelete}
        >
          <Trash2 size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
