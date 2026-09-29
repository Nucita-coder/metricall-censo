import { Tarjeta, TarjetaDatosValores, GestionItem } from '../../../types/kanban';

export interface PerfilRowVentas {
  id: string;
  nombre_completo: string | null;
  rol: string | null;
  etiquetas: unknown;
}

export function esAsesorPerfilVentas(p: PerfilRowVentas): boolean {
  if (!p.nombre_completo || !p.nombre_completo.trim()) return false;

  const rol = String(p.rol || '').toLowerCase().trim();
  if (['asesor', 'vendedor', 'ventas', 'comercial', 'censador'].includes(rol)) {
    return true;
  }

  const rawEtiquetas = p.etiquetas;
  let etiquetasList: string[] = [];

  if (Array.isArray(rawEtiquetas)) {
    etiquetasList = rawEtiquetas.map((e) => String(e));
  } else if (typeof rawEtiquetas === 'string') {
    etiquetasList = rawEtiquetas
      .replace(/[{}[\]"']/g, '')
      .split(',')
      .map((e) => e.trim());
  }

  return etiquetasList.some((e) => {
    const val = e.toLowerCase().trim();
    return (
      val === 'asesor' ||
      val.includes('asesor') ||
      val === 'vendedor' ||
      val.includes('vendedor') ||
      val === 'censador'
    );
  });
}

export function esTarjetaDeVenta(t: Tarjeta, listaMap: Map<string, string>): boolean {
  const d = (t.datos_valores || {}) as TarjetaDatosValores;
  const listaNombre = (listaMap.get(t.lista_id) || '').toLowerCase().trim();

  if (d.fechaVenta || d.origen === 'venta') return true;

  const gestiones = (Array.isArray(d.gestiones) ? d.gestiones : []) as GestionItem[];
  if (gestiones.some((g) => g.resultado === 'Venta concretada')) return true;

  if (
    listaNombre.includes('venta') ||
    listaNombre.includes('factibilidad') ||
    listaNombre.includes('instalar') ||
    listaNombre.includes('activar') ||
    listaNombre.includes('cliente activo') ||
    listaNombre.includes('asignado a') ||
    listaNombre.includes('en proceso') ||
    listaNombre.includes('liberada')
  ) {
    return true;
  }

  if (d.tipoServicio) return true;

  return false;
}

export function clasificarFactibilidad(
  t: Tarjeta,
  listaNombre: string
): 'factible' | 'verificacion' | 'rechazada' {
  const d = (t.datos_valores || {}) as TarjetaDatosValores;
  const cc = String(d.controlCalidad || '').toLowerCase().trim();
  const ln = listaNombre.toLowerCase().trim();

  if (cc === 'rechazado' || ln.includes('rechazad') || ln.includes('no factible')) {
    return 'rechazada';
  }

  const tieneLch = Boolean(d.lch_numero && String(d.lch_numero).trim() && d.lch_imagen);
  if (
    cc === 'aprobado' ||
    tieneLch ||
    ln.includes('por instalar') ||
    ln.includes('asignado a') ||
    ln.includes('en proceso') ||
    ln.includes('liberada') ||
    ln.includes('por activar') ||
    ln.includes('cliente activo')
  ) {
    return 'factible';
  }

  return 'verificacion';
}

export function extraerTipoServicio(d: TarjetaDatosValores): string {
  const raw = String(d.tipoServicio || '').toLowerCase().trim();
  if (raw === 'hogar' || raw === 'residencial') return 'Hogar';
  if (raw === 'pymes' || raw === 'comercial') return 'PYMES';
  if (raw === 'dedicado') return 'Dedicado';
  if (raw === 'isp') return 'ISP';
  return 'Hogar';
}

export function extraerPlan(d: TarjetaDatosValores, tipoServicio: string): string {
  if (tipoServicio === 'Hogar') {
    if (d.phConectados && d.phConectados !== 'Ninguno') return `Conectados (${d.phConectados})`;
    if (d.phGamer && d.phGamer !== 'Ninguno') return `Gamer (${d.phGamer})`;
    if (d.phCinefilos && d.phCinefilos !== 'Ninguno') return `Cinéfilos (${d.phCinefilos})`;
    if (d.phFamiliar && d.phFamiliar !== 'Ninguno') return `Familiar (${d.phFamiliar})`;
  } else if (tipoServicio === 'PYMES') {
    if (d.ppEmprendedores && d.ppEmprendedores !== 'Ninguno') return `Emprendedores (${d.ppEmprendedores})`;
    if (d.ppComercios && d.ppComercios !== 'Ninguno') return `Comercios (${d.ppComercios})`;
    if (d.ppOficinas && d.ppOficinas !== 'Ninguno') return `Oficinas (${d.ppOficinas})`;
    if (d.ppNegocios && d.ppNegocios !== 'Ninguno') return `Negocios (${d.ppNegocios})`;
  }

  const directPlan = String(d.plan || d.planNombre || d.tipoPlan || '').trim();
  if (directPlan && directPlan !== 'Ninguno') return directPlan;

  return `${tipoServicio} Estándar`;
}

export function extraerZona(d: TarjetaDatosValores): string {
  const raw = String(
    d.zona || d.sector || d.zonaCuadrante || d.urbanizacion || d.municipio || d.ciudad || ''
  ).trim();
  return raw || 'Zona No Especificada';
}
