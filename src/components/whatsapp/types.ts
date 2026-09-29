// Tipos estrictos para el módulo de Contactos y Conversaciones de WhatsApp (Developer)

export interface WhatsAppContacto {
  numero_telefono: string;
  nombre: string;
  cedula?: string | null;
  origen_nombre?: string;
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

export interface FacturaSaeItem {
  nroFactura: string;
  tipo: string;
  fechaEmision: string;
  monto: string;
  concepto: string;
  idPago: string;
  archivoFormatoFactura: string;
  franquicia?: string;
}

export interface ConsultaFacturasSaeResponse {
  success: boolean;
  cedula?: string;
  cliente?: string;
  nroContrato?: string;
  totalFacturas?: number;
  facturas?: FacturaSaeItem[];
  error?: string;
}

export interface DiagnosticoOltCliente {
  nombreCompleto: string;
  nombre?: string;
  apellido?: string;
  cedula: string;
  telefono?: string;
}

export interface DiagnosticoOltContrato {
  idContrato?: string;
  nroContrato: string;
  estatus: string;
  esSuspendido: boolean;
  saldoPendiente: string;
  plan: string;
  sector: string;
  ciudad?: string;
}

export interface DiagnosticoOltEquipo {
  id_es: string;
  codigo_es: string;
  modelo: string;
  marca: string;
  id_tse?: string;
  sistema: string;
}

export interface DiagnosticoOltSmartOlt {
  status: string;
  potencia: string;
  nivel: string;
  esOnline: boolean;
  esDegradada: boolean;
  catv?: string;
}

export interface DiagnosticoOltResponse {
  success: boolean;
  encontrado: boolean;
  cliente?: DiagnosticoOltCliente;
  contrato?: DiagnosticoOltContrato;
  equipo?: DiagnosticoOltEquipo | null;
  diagnostico?: DiagnosticoOltSmartOlt | null;
  error?: string;
}

