import { KANBAN_COLORS, getResultadoColor } from '../../../constants/theme';
import { Tarjeta, TarjetaMaterialItem } from '../../../types/kanban';
import { clasificarMovimientoAlmacen } from '../../../services/almacenService';
import {
  StatusBadgeItem,
  UniversalCardData,
  cleanEmojis,
  formatCedula,
  formatTelefono,
  toTitleCase,
} from './cardTypes';

function extractMaterialesData(
  item: Tarjeta,
  data: Record<string, unknown>,
  cardBg: string,
  isBloqueada: boolean,
  listaNombre?: string
): UniversalCardData {
  const items = Array.isArray(data.items) ? (data.items as TarjetaMaterialItem[]) : [];
  const totalCant =
    items.length > 0
      ? items.reduce((s, it) => s + (parseFloat(String(it.cantidadRecibida || it.cantidad || '0')) || 0), 0)
      : parseFloat(String(data.cantidadRecibida || data.cantidad || '0')) || 0;

  let badge = 'MATERIAL';
  if (items.length > 1) {
    badge = `GUÍA (${items.length} ÍTEMS)`;
  } else if (data.codigoMaterial) {
    badge = String(data.codigoMaterial).toUpperCase();
  } else if (items[0]?.codigoMaterial) {
    badge = String(items[0].codigoMaterial).toUpperCase();
  }

  const matNom = String(data.nombreMaterial || items[0]?.nombreMaterial || 'Carga de Material').trim();
  const matMod = String(data.modeloMaterial || items[0]?.modeloMaterial || 'GENERAL').toUpperCase();

  const tipoMov = clasificarMovimientoAlmacen(
    typeof data.tipoCarga === 'string' ? data.tipoCarga : undefined,
    listaNombre || item.listas?.nombre
  );

  const badges: StatusBadgeItem[] = [];
  if (tipoMov === 'MATERIAL_ASIGNADO' && data.asignadoA) {
    badges.push({
      text: `Asignado a: ${String(data.asignadoA)}`,
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#2563EB',
      border: 'rgba(59, 130, 246, 0.25)',
    });
  }

  const footLeft = data.nroOrdenEntrega
    ? `Orden: ${String(data.nroOrdenEntrega)}`
    : data.entregadoPor
    ? `Entregó: ${String(data.entregadoPor)}`
    : ' ';

  const codMat = String(data.codigoMaterial || items[0]?.codigoMaterial || '').toUpperCase();
  const nomMat = String(data.nombreMaterial || items[0]?.nombreMaterial || '').toUpperCase();
  const esMetraje =
    items.length > 1
      ? false
      : codMat === 'MAT-CABLE-DROP' ||
        nomMat.includes('BOBINA') ||
        (nomMat.includes('CABLE DROP') && !nomMat.includes('MTS'));
  const unidad = esMetraje ? 'mts' : 'und';

  return {
    topBadgeText: badge,
    topBadgeBg: 'rgba(12, 102, 228, 0.15)',
    topBadgeColor: '#0C66E4',
    isCobranzaBadge: false,
    topMetricText: totalCant > 0 ? `${totalCant} ${unidad}` : '',
    title: toTitleCase(cleanEmojis(matNom)),
    subtitle: matMod !== 'GENERAL' ? `Modelo: ${matMod}` : '',
    statusBadges: badges,
    footerLeft: footLeft,
    footerRight: data.fechaRecibido ? String(data.fechaRecibido) : new Date(item.created_at).toLocaleDateString(),
    cardBg,
    isBloqueada,
    bloqueadaText: 'MATERIAL BLOQUEADO',
  };
}

function extractCensoData(
  item: Tarjeta,
  data: Record<string, unknown>,
  lowerLista: string,
  cardBg: string,
  isBloqueada: boolean
): UniversalCardData {
  let badgeTxt = 'CENSO';
  let badgeBg = 'rgba(56, 189, 248, 0.15)';
  let badgeColor = '#0284C7';

  if (lowerLista === 'si desea') {
    badgeTxt = 'SI DESEA';
    badgeBg = 'rgba(16, 185, 129, 0.15)';
    badgeColor = '#059669';
  } else if (lowerLista === 'no desea') {
    badgeTxt = 'NO DESEA';
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    badgeColor = '#DC2626';
  } else if (lowerLista === 'es posible') {
    badgeTxt = 'ES POSIBLE';
    badgeBg = 'rgba(59, 130, 246, 0.15)';
    badgeColor = '#2563EB';
  }

  const rawNombre = String(data.nombreApellido || data.nombre || 'Nuevo Censo').trim();
  const docVal = data.documentoIdentidad || data.nroIdentidad || data.cedula;
  const formattedDoc = docVal ? `${String(data.tipoDocumento || 'CI')}: ${formatCedula(String(docVal))}` : '';
  const telVal = data.telefonoMovil || data.nroTelefonoMovil || data.telefono;
  const formattedTel = telVal ? formatTelefono(String(telVal)) : '';
  const subtitle = [formattedDoc, formattedTel].filter(Boolean).join(' • ');

  const badges: StatusBadgeItem[] = [];
  if (Boolean(data.es_reasignada)) {
    badges.push({ text: 'REASIGNADA', bg: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', border: 'rgba(239, 68, 68, 0.3)' });
  }

  const cleanInternet = String(data.cuentaConInternet ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const tieneInternet =
    data.cuentaConInternet === true ||
    cleanInternet === 'si' ||
    cleanInternet === 'true' ||
    Boolean(data.proveedorActual && String(data.proveedorActual).trim() !== '');

  const debeMostrarBadgeInternet =
    (data.cuentaConInternet !== undefined && data.cuentaConInternet !== null && String(data.cuentaConInternet).trim() !== '') ||
    Boolean(data.proveedorActual && String(data.proveedorActual).trim() !== '');

  if (debeMostrarBadgeInternet) {
    badges.push({
      text: tieneInternet ? 'CON INTERNET' : 'SIN INTERNET',
      bg: tieneInternet ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
      color: tieneInternet ? '#2563EB' : '#64748B',
    });
  }

  if (data.proveedorActual && String(data.proveedorActual).trim() !== '') {
    badges.push({
      text: `ACTUAL: ${String(data.proveedorActual).toUpperCase().trim()}`,
      bg: 'rgba(148, 163, 184, 0.15)',
      color: '#334155',
    });
  }

  const footLeft = data.asesorComercial
    ? `Asesor: ${cleanEmojis(String(data.asesorComercial))}`
    : data.origen === 'WhatsApp Bot'
    ? 'WhatsApp Bot'
    : 'Censo';

  const footRight = data.fechaCenso
    ? String(data.fechaCenso)
    : data.fechaVenta
    ? String(data.fechaVenta)
    : new Date(item.created_at).toLocaleDateString();

  return {
    topBadgeText: badgeTxt,
    topBadgeBg: badgeBg,
    topBadgeColor: badgeColor,
    isCobranzaBadge: false,
    topMetricText: '',
    title: toTitleCase(cleanEmojis(rawNombre)),
    subtitle,
    statusBadges: badges,
    footerLeft: footLeft,
    footerRight: footRight,
    cardBg,
    isBloqueada,
    bloqueadaText: 'CENSO BLOQUEADO',
  };
}

function resolveTopBadgeGeneral(
  data: Record<string, unknown>,
  lowerLista: string,
  tipoServicio: string,
  bCfg: { bg: string; text: string }
): { text: string; bg: string; color: string; isCobranza: boolean } {
  const isProcSAE = Boolean(data.estadoSoporte === 'Procesado en SAE' || data.accionFalla === 'Procesado en SAE' || data.estadoGestion === 'procesado_en_sae');
  const esListaLimpia = lowerLista.includes('ventas') || lowerLista.includes('falla') || lowerLista.includes('soporte');
  const isFalla = Boolean(data.tipoFalla || data.estadoSoporte || lowerLista.includes('falla') || lowerLista.includes('soporte'));
  const esReportePago = !esListaLimpia && !isFalla && (lowerLista.includes('pago') || Boolean(data.comprobantePagoUrl || data.bancoOrigen || data.montoPago));
  const isCobranza = Boolean(data.origenImportacion === 'COBRANZA-RECUPERO-CHURN' || lowerLista.includes('cobranza') || lowerLista.includes('recupero'));
  const isVentaOnline = Boolean(lowerLista.includes('ventas online') || lowerLista.includes('gestion online') || lowerLista.includes('gestión online'));
  const esWhatsapp = Boolean(data.origen === 'WhatsApp Bot' || data.origen === 'whatsapp' || data.origen === 'Gestión Online' || data.origenImportacion === 'WHATSAPP');

  if (isProcSAE) {
    return { text: 'PROCESADO EN SAE', bg: KANBAN_COLORS.badge.procesadoSAE?.bg || 'rgba(59, 130, 246, 0.15)', color: KANBAN_COLORS.badge.procesadoSAE?.text || '#3B82F6', isCobranza: false };
  }
  if (esReportePago) {
    const est = String(data.estadoCobranza || 'Pago Pendiente Revisión');
    const isProc = est === 'Pago Procesado';
    const isRech = est === 'Pago Rechazado';
    return {
      text: isProc ? 'PAGO PROCESADO' : isRech ? 'PAGO RECHAZADO' : 'PAGO EN REVISIÓN',
      bg: isProc ? KANBAN_COLORS.badge.pagoProcesado.bg : isRech ? KANBAN_COLORS.badge.pagoRechazado.bg : KANBAN_COLORS.badge.pagoPendiente.bg,
      color: isProc ? KANBAN_COLORS.badge.pagoProcesado.text : isRech ? KANBAN_COLORS.badge.pagoRechazado.text : KANBAN_COLORS.badge.pagoPendiente.text,
      isCobranza: false,
    };
  }
  if (tipoServicio) {
    return { text: tipoServicio.toUpperCase(), bg: bCfg.bg, color: bCfg.text, isCobranza: false };
  }
  if (isCobranza) {
    return { text: 'COBRANZA', bg: '#FFFFFF', color: '#000000', isCobranza: true };
  }
  if (esWhatsapp && !isVentaOnline) {
    return { text: 'WHATSAPP', bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', isCobranza: false };
  }
  return { text: '', bg: bCfg.bg, color: bCfg.text, isCobranza: false };
}

export function extractUniversalCardData(
  item: Tarjeta,
  listaNombre?: string,
  isLiberada?: boolean
): UniversalCardData {
  const data = (item.datos_valores || {}) as Record<string, unknown>;
  const lowerLista = (listaNombre || '').toLowerCase();
  const isBloqueada = data.estadoLiberacion === 'bloqueada' || Boolean(isLiberada);

  let cardBg = KANBAN_COLORS.card.defaultBg;
  if (lowerLista === 'si desea' || lowerLista === 'acción efectiva' || lowerLista === 'acción efectiva (recupero)') {
    cardBg = KANBAN_COLORS.card.censoInteresadosBg;
  } else if (lowerLista === 'no desea' || lowerLista === 'acción negativa' || lowerLista === 'acción negativa (recupero)') {
    cardBg = KANBAN_COLORS.card.censoNoInteresadosBg;
  } else if (lowerLista === 'es posible') {
    cardBg = KANBAN_COLORS.card.censoPosiblesBg;
  }
  if (isBloqueada) cardBg = KANBAN_COLORS.card.bloqueadaBg;

  if (
    ['carga de materiales', 'material recibido', 'material asignado', 'devolución de asignación', 'devolución a almacén central', 'recuperados'].includes(lowerLista) ||
    data.codigoMaterial !== undefined ||
    data.nroOrdenEntrega !== undefined
  ) {
    return extractMaterialesData(item, data, cardBg, isBloqueada, listaNombre);
  }

  if (
    ['censo', 'si desea', 'no desea', 'es posible', 'interesados', 'no interesados', 'posibles'].includes(lowerLista) ||
    Boolean(data.origen === 'censo' && lowerLista.includes('censo'))
  ) {
    return extractCensoData(item, data, lowerLista, cardBg, isBloqueada);
  }

  // General: Cobranza, Ventas, Instalaciones, Pagos, Fallas
  const rawServ = String(data.tipoServicio || '').toLowerCase().trim();
  const tipoServicio = rawServ === 'n/a' || rawServ === 'none' ? '' : rawServ;
  const bCfg = tipoServicio === 'hogar'
    ? KANBAN_COLORS.badge.hogar
    : tipoServicio === 'pymes'
    ? KANBAN_COLORS.badge.pymes
    : tipoServicio === 'dedicado'
    ? KANBAN_COLORS.badge.dedicado
    : tipoServicio === 'isp'
    ? KANBAN_COLORS.badge.isp
    : KANBAN_COLORS.badge.default;

  const badgeInfo = resolveTopBadgeGeneral(data, lowerLista, tipoServicio, bCfg);

  const rawSaldo = data.saldo ?? data['SALDO'] ?? data.monto ?? data.Monto ?? data['MONTO'] ?? data.montoDeuda ?? data.montoPago;
  let topMetricText = '';
  if (rawSaldo !== undefined && rawSaldo !== null && rawSaldo !== '') {
    const num = parseFloat(String(rawSaldo).replace(/[^0-9.-]/g, ''));
    topMetricText = isNaN(num) ? `$${rawSaldo}` : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const rawNombre = String(data.nombreApellido || data.nombre || 'Tarjeta sin datos').trim();
  const docVal = data.documentoIdentidad || data.nroIdentidad || data.cedula;
  const formattedDoc = docVal ? `${String(data.tipoDocumento || 'CI')}: ${formatCedula(String(docVal))}` : '';
  const telVal = data.telefonoMovil || data.nroTelefonoMovil || data.telefono;
  const formattedTel = telVal ? formatTelefono(String(telVal)) : '';
  const subtitle = [formattedDoc, formattedTel].filter(Boolean).join(' • ');

  const badges: StatusBadgeItem[] = [];
  if (data.tipoContacto) {
    badges.push({ text: String(data.tipoContacto), bg: 'rgba(56, 189, 248, 0.12)', color: '#0284C7', border: 'rgba(56, 189, 248, 0.25)' });
  }
  if (data.resultadoContacto) {
    const resColor = getResultadoColor(String(data.resultadoContacto));
    badges.push({ text: String(data.resultadoContacto), bg: resColor.bg, color: resColor.text, border: resColor.border });
  }
  if (data.tipoFalla && !badgeInfo.isCobranza) {
    badges.push({ text: String(data.tipoFalla).toUpperCase(), bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: 'rgba(239, 68, 68, 0.25)' });
  }

  const abonadoVal = data.nroAbonado || data['NRO SUSCRIPTOR'] || data.abonado || data.lch_numero || data.lchNumero || data.nro_lch || data.lch;
  const rawAbonado = abonadoVal ? String(abonadoVal).replace(/^[#\s]+/, '').replace(/^LCH[:\s-]*/i, '').trim() : '';
  const formattedAbonado = rawAbonado ? `LCH: ${rawAbonado}` : '';

  const footLeft = formattedAbonado || (data.tecnicoAsignado ? `Téc: ${String(data.tecnicoAsignado)}` : (data.planContratado ? String(data.planContratado) : ' '));
  const footRight = new Date(item.created_at).toLocaleDateString();

  return {
    topBadgeText: badgeInfo.text,
    topBadgeBg: badgeInfo.bg,
    topBadgeColor: badgeInfo.color,
    isCobranzaBadge: badgeInfo.isCobranza,
    topMetricText,
    title: toTitleCase(cleanEmojis(rawNombre)),
    subtitle,
    statusBadges: badges,
    footerLeft: footLeft,
    footerRight: footRight,
    cardBg,
    isBloqueada,
    bloqueadaText: 'INSTALACIÓN LIBERADA (CAÍDA)',
  };
}
