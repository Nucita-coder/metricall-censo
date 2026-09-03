// Tipos estrictos para el módulo de Contactos y Conversaciones de WhatsApp (Developer)

export interface WhatsAppContacto {
  numero_telefono: string;
  nombre: string;
  bloqueado: boolean;
  motivo_bloqueo?: string | null;
  total_mensajes: number;
  ultimo_mensaje?: string | null;
  primer_contacto: string;
  ultimo_contacto: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMensaje {
  id: string;
  tipo: string;
  numero_telefono: string | null;
  mensaje_texto: string | null;
  contenido?: Record<string, unknown>;
  created_at: string;
}

export type FiltroEstadoContacto = 'todos' | 'activos' | 'bloqueados';
export type FiltroTemporalChat = 'todos' | 'semana' | 'mes' | 'dia';
