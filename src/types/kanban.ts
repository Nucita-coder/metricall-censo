export interface TarjetaDatosValores {
  fechaVenta?: string;
  vendedor?: string;
  tipoServicio?: string;
  nombreApellido?: string;
  tipoDocumento?: string;
  documentoIdentidad?: string;
  nroIdentidad?: string;
  fechaNacimiento?: string;
  telefonoMovil?: string;
  telefonoAdicional?: string;
  telefonoResidencial?: string;
  correo?: string;
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
  nroAbonado?: string;
  cuentaConInternet?: string;
  dispuestoCambiar?: string;
  gestiones?: any[];
  comentarios?: any[];
  [key: string]: any;
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
  [key: string]: any;
}

export interface Lista {
  id: string;
  tablero_id?: string;
  empresa_id?: string;
  nombre: string;
  slug?: string;
  posicion?: number;
  tarjetas: Tarjeta[];
  permisos_relacionales?: {
    puede_editar?: boolean;
    puede_mover?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface TableroInfo {
  id: string;
  nombre: string;
  tipo?: string;
  sucursal_id?: string;
  empresa_id?: string;
  [key: string]: any;
}
