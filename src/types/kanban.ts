export interface ComentarioItem {
  autor: string;
  fecha: string;
  texto: string;
}

export interface GestionItem {
  id?: string;
  fecha?: string;
  tipo?: string;
  resultado?: string;
  observaciones?: string;
  usuario?: string;
  etapa?: string;
  causa?: string;
  [key: string]: unknown;
}

export interface TarjetaMaterialItem {
  codigoMaterial?: string;
  nombreMaterial?: string;
  modeloMaterial?: string;
  serialMaterial?: string;
  cantidadRecibida?: string | number;
  cantidad?: string | number;
  [key: string]: unknown;
}

export interface GeoPunto {
  fotoUrl?: string;
  latitud?: number | null;
  longitud?: number | null;
  lat?: number | string | null;
  lng?: number | string | null;
  [key: string]: unknown;
}

export interface TarjetaDatosValores {
  // Datos de cliente / contacto
  nombre?: string;
  nombreApellido?: string;
  cliente?: string;
  ['NOMBRE Y APELLIDO']?: string;
  tipoDocumento?: string;
  documento?: string;
  documentoIdentidad?: string;
  nroIdentidad?: string;
  ['DOC IDENTIDAD']?: string;
  cedula?: string;
  rif?: string;
  fechaNacimiento?: string;
  telefono?: string;
  telefonoMovil?: string;
  nroTelefonoMovil?: string;
  ['TELEFONO']?: string;
  telefonoAdicional?: string;
  telefonoResidencial?: string;
  correo?: string;
  email?: string;
  ['CORREO']?: string;

  // Ubicación y dirección
  estado?: string;
  ciudad?: string;
  ciudadMunicipio?: string;
  zona?: string;
  zonaCuadrante?: string;
  sector?: string;
  calle?: string;
  calleManzanaVereda?: string;
  urbanizacion?: string;
  urbanizacionBarrio?: string;
  piso?: string;
  pisoNivel?: string;
  edificio?: string;
  edificioCasa?: string;
  referencia?: string;
  puntoReferencia?: string;
  latitud?: number | null;
  longitud?: number | null;
  direccionFiscal?: string;

  // Venta y suscripción
  fechaVenta?: string;
  vendedor?: string;
  tipoServicio?: string;
  ['TIPO']?: string;
  nroAbonado?: string;
  ['NRO SUSCRIPTOR']?: string;
  saldo?: string | number;
  ['SALDO']?: string | number;
  plan?: string;
  planSuscripcion?: string;
  ['PLAN SUSCRIPCION']?: string;
  estatusSuscriptor?: string;
  ['ESTATUS']?: string;
  observacionFacturacion?: string;
  ['FACTURACION']?: string;

  // Planes y paquetes
  phInstalacion?: string;
  phConectados?: string;
  phGamer?: string;
  phCinefilos?: string;
  phFamiliar?: string;
  ppInstalacion?: string;
  ppEmprendedores?: string;
  ppComercios?: string;
  ppOficinas?: string;
  ppNegocios?: string;
  equipoAdicional?: string;

  // Censo
  fechaCenso?: string;
  cuentaConInternet?: string;
  proveedorActual?: string;
  dispuestoCambiar?: string;
  observacionesCenso?: string;
  texto_libre?: string;
  origen?: string;

  // Cobranza y gestión
  tipoContacto?: string;
  ['TIPO DE CONTACTO']?: string;
  resultadoContacto?: string;
  resultado?: string;
  RESULTADO?: string;
  ['RESULTADO']?: string;
  estadoCobranza?: string;
  estado_cobranza?: string;
  estadoSoporte?: string;
  accionFalla?: string;
  estadoGestion?: string;
  fechaCobroReconciliacion?: string;
  observacionesGestion?: string;
  montoCobrado?: string | number;
  moneda?: string;
  tasaBcv?: string | number;

  // Materiales y almacén
  tipoCarga?: string;
  codigoMaterial?: string;
  nombreMaterial?: string;
  modeloMaterial?: string;
  serialMaterial?: string;
  fechaRecibido?: string;
  cantidadRecibida?: string | number;
  cantidad?: string | number;
  nroOrdenEntrega?: string;
  asignadoA?: string;
  recibidoPor?: string;
  entregadoPor?: string;
  motivoAsignacion?: string;
  items?: TarjetaMaterialItem[];
  materiales?: Record<string, string>;

  // Factibilidad, instalación y soporte
  fechaFactibilidad?: string;
  nodo?: string;
  cajaNap?: string;
  puertoNap?: string;
  potencia?: string;
  tecnicoAsignado?: string;
  tecnico?: string;
  fechaInstalacion?: string;
  es_reasignada?: boolean;
  tipoInstalacion?: string;
  lch_numero?: string;
  nombres?: string;
  serial_onu?: string;
  serialEquipo?: string;
  mac_equipo?: string;
  macEquipo?: string;
  cable_preconectorizado?: string;
  nap?: string;
  nroNap?: string;
  potenciaNap?: string;
  potencia_casa?: string;
  potenciaCasa?: string;
  cable_drop?: string;
  cableDrop?: string;
  puerto?: string;
  puertoAsignado?: string;
  puertos_disponibles?: string;
  puertosDisponibles?: string;
  motivoFactibilidad?: string;
  observaciones?: string;
  motivoRetorno?: string;
  ultimoMotivoRetorno?: string;
  comentario_instalacion?: string;

  // Adjuntos, comentarios y auditoría
  adjuntos?: string[];
  geofotos?: string[];
  lch_imagen?: string;
  geo_nap?: GeoPunto;
  geo_casa?: GeoPunto;
  geo_censo?: GeoPunto;
  gestiones?: GestionItem[];
  gestionesCobranza?: GestionItem[];
  comentarios?: ComentarioItem[];
  historial_auditoria?: unknown[];

  nombreCliente?: string;
  asesorComercial?: string;
  plan_hogar?: string;
  plan_pymes?: string;
  motivoLiberacion?: string;
  tipoFalla?: string;

  [key: string]: unknown;
}

export interface Tarjeta {
  id: string;
  lista_id: string;
  empresa_id?: string;
  creador_id?: string;
  posicion?: number;
  datos_valores?: TarjetaDatosValores;
  created_at: string;
  updated_at?: string;
  estado_archivo?: boolean;
  perfiles?: { nombre_completo?: string | null } | null;
  listas?: { nombre?: string; color_fondo?: string } | null;
  [key: string]: unknown;
}

export interface PermisosRelacionales {
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_mover?: boolean;
  puede_eliminar?: boolean;
  [key: string]: unknown;
}

export interface Lista {
  id: string;
  tablero_id?: string;
  empresa_id?: string;
  nombre: string;
  slug?: string;
  orden?: number;
  posicion?: number;
  color?: string;
  color_fondo?: string;
  tableros?: { id?: string; nombre?: string; tipo?: string } | null;
  estado_archivo?: boolean;
  transiciones_permitidas?: string[];
  tarjetas: Tarjeta[];
  permisos_relacionales?: PermisosRelacionales;
  [key: string]: unknown;
}

export interface TableroInfo {
  id: string;
  nombre: string;
  tipo?: string;
  sucursal_id?: string;
  sucursal_nombre?: string;
  empresa_id?: string;
  fondo_url?: string;
  es_favorito?: boolean;
  descripcion?: string;
  opacidad_listas?: number;
  [key: string]: unknown;
}

export interface TableroDisponible {
  id: string;
  nombre: string;
  fondo_url?: string | null;
  [key: string]: unknown;
}
