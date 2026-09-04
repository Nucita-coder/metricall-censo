import { Dispatch, SetStateAction } from 'react';

export interface MensajeSoporte {
  id: string;
  empresa_id: string;
  emisor_id: string;
  receptor_id: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

export interface UsuarioConversacion {
  usuario_id: string;
  nombre_completo: string;
  ultimo_mensaje: string;
  created_at: string;
  sin_leer: number;
}

export interface ModalSoporteTecnicoProps {
  visible: boolean;
  onClose: () => void;
}

export type TabSoporte = 'ia' | 'humano';

export interface ChatSoporteIaProps {
  mensajes: import('../../../services/soporteIaService').MensajeIa[];
  setMensajes: Dispatch<SetStateAction<import('../../../services/soporteIaService').MensajeIa[]>>;
}
