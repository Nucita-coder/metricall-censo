import { logoBase64 } from '../../assets/logoBase64';
import { TarjetaDatos } from './reportes';

const ITEMS_MATERIALES_MAP: Record<string, string> = {
  tensorPlastico: 'Tensor Plástico',
  tensorHierro: 'Tensor Hierro',
  grapas: 'Grapas',
  tirrap: 'Tirrap',
  pachCordApc: 'Patch Cord APC',
  pachCordUpc: 'Patch Cord UPC',
  pachCordApcUpc: 'Patch Cord APC/UPC',
  cajaTerminalCon: 'Caja Terminal Con Accesorios',
  cajaTerminalSin: 'Caja Terminal Sin Accesorios',
  conectorAcople: 'Conector / Acople H-H',
  conectorMecanicoApc: 'Conector Mecánico APC',
  conectorMecanicoUpc: 'Conector Mecánico UPC',
  precinto: 'Precinto',
  cablePreconectorizado: 'Cable Preconectorizado',
};

function formatFecha(fechaStr?: string | null): string {
  if (!fechaStr) return 'N/A';
  try {
    const d = new Date(fechaStr);
    return isNaN(d.getTime()) ? String(fechaStr) : d.toLocaleString('es-VE');
  } catch {
    return String(fechaStr);
  }
}

export function generarHTMLInformeEscrito(tarjeta: TarjetaDatos): string {
  const d = tarjeta.datos_valores || {};

  const nombreCliente = String(d.nombreApellido || d.nombre || d.nombres || d.cliente || 'Sin registrar').trim();
  const cedula = String(d.documentoIdentidad || d.nroIdentidad || d.cedula || 'Sin registrar').trim();
  const movil = String(d.telefonoMovil || d.telefono || 'Sin registrar').trim();
  const telfAdicional = String(d.telefonoAdicional || 'Sin registrar').trim();
  const correo = String(d.correo || d.email || 'Sin registrar').trim();
  const asesor = String(d.vendedor || d.asesorComercial || d.asesor || 'Sin registrar').trim();

  const tipoServicio = String(d.tipoServicio || d.servicio || 'HOGAR').toUpperCase();
  const planEspecífico = String(d.plan_hogar || d.plan_pymes || d.tipoPlan || d.plan || 'Plan Estándar').trim();
  const planCompleto = `${tipoServicio} — ${planEspecífico}`;

  const dirPartes = [d.ciudad, d.sector || d.zona, d.calle, d.edificio || d.casa, d.referencia ? `(Punto Ref: ${d.referencia})` : null].filter(Boolean);
  const direccionCompleta = dirPartes.length > 0 ? dirPartes.join(', ') : 'Sin dirección detallada';

  const geoCasa = d.geo_casa as { lat?: number; lng?: number } | undefined;
  const geoNap = d.geo_nap as { lat?: number; lng?: number } | undefined;
  const coordsCasaStr = geoCasa && typeof geoCasa.lat === 'number' ? `${geoCasa.lat.toFixed(5)}, ${geoCasa.lng?.toFixed(5)}` : 'N/A';
  const coordsNapStr = geoNap && typeof geoNap.lat === 'number' ? `${geoNap.lat.toFixed(5)}, ${geoNap.lng?.toFixed(5)}` : 'N/A';

  const nroLch = String(d.lch_numero || d.lchNumero || d.nro_lch || d.nroAbonado || 'N/A').trim();
  const serialOnu = String(d.serialEquipo || d.serial_onu || 'Sin registrar').trim();
  const macEquipo = String(d.mac_equipo || d.macEquipo || 'Sin registrar').trim();
  const tipoInstalacion = String(d.tipoInstalacion || d.tipo_instalacion || 'Fibra Óptica (FTTH)').trim();

  const cajaNap = String(d.nroNap || d.nap || 'N/A').trim();
  const puertoAsignado = String(d.puertoAsignado || d.puerto || 'N/A').trim();
  const puertosDisponibles = d.puertosDisponibles !== undefined && d.puertosDisponibles !== null && String(d.puertosDisponibles).trim() !== '' ? String(d.puertosDisponibles) : 'N/A';
  const potNap = d.potenciaNap ? `${d.potenciaNap} dBm` : 'N/A';
  const potCasaVal = (d.potencia_casa || d.potenciaCasa) as string | number | undefined;
  const potCasa = potCasaVal ? `${potCasaVal} dBm` : 'N/A';
  const cableDrop = (d.cable_drop || d.cableDrop) ? `${d.cable_drop || d.cableDrop} metros` : 'Sin registrar';

  const mat = (d.materiales || {}) as Record<string, unknown>;
  const cablePrecon = String(d.cable_preconectorizado || d.cablePreconectorizado || mat.cablePreconectorizado || 'N/A');

  const tecnico = String(d.tecnicoAsignado || d.asignadoA || d.tecnico || 'N/A').trim();
  const fechaInst = formatFecha((d.fechaInstalacion || tarjeta.created_at) as string);
  const activadoPor = String(d.activadoPor || 'NOC / Operaciones Central').trim();
  const fechaAct = formatFecha(d.fechaActivacion as string);

  const observaciones = String(d.observaciones || d.comentario_instalacion || d.motivoFactibilidad || '').trim();

  const geofotosArr = (Array.isArray(d.geofotos) ? d.geofotos : []) as string[];
  const lchImagen = d.lch_imagen as string | undefined;

  let tablaMateriales = '';
  Object.keys(ITEMS_MATERIALES_MAP).forEach((key) => {
    let cant = mat[key];
    if (key === 'cablePreconectorizado' && (!cant || cant === '0')) cant = cablePrecon !== 'N/A' ? cablePrecon : '0';
    const cantStr = cant !== undefined && cant !== null && String(cant).trim() !== '' ? String(cant) : '0';
    tablaMateriales += `<tr><td style="padding: 6px 10px; border: 1px solid #E2E8F0; font-weight: 500;">${ITEMS_MATERIALES_MAP[key]}</td><td style="padding: 6px 10px; border: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: ${cantStr !== '0' ? '#0F172A' : '#94A3B8'};">${cantStr}</td></tr>`;
  });

  let fotosHtml = '';
  if (lchImagen) {
    fotosHtml += `<div style="flex: 1; min-width: 220px; max-width: 280px; margin-bottom: 14px; text-align: center;"><div style="border: 1px solid #CBD5E1; border-radius: 6px; overflow: hidden; height: 190px; background: #F1F5F9;"><img src="${lchImagen}" style="width: 100%; height: 100%; object-fit: cover;" /></div><span style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-top: 4px;">Comprobante LCH</span></div>`;
  }
  geofotosArr.forEach((url, i) => {
    fotosHtml += `<div style="flex: 1; min-width: 220px; max-width: 280px; margin-bottom: 14px; text-align: center;"><div style="border: 1px solid #CBD5E1; border-radius: 6px; overflow: hidden; height: 190px; background: #F1F5F9;"><img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" /></div><span style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-top: 4px;">GeoFoto de Instalación #${i + 1}</span></div>`;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Informe de Instalación - ${nombreCliente}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1E293B; background: #FFFFFF; margin: 0; padding: 24px; font-size: 12px; line-height: 1.45; }
    .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 18px; }
    .title-main { font-size: 18px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px; }
    .subtitle-main { font-size: 11px; color: #64748B; margin: 0; font-weight: 600; text-transform: uppercase; }
    .badge-bar { margin-top: 6px; display: flex; gap: 8px; }
    .badge-pill { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .pill-lch { background: #F1F5F9; border: 1px solid #CBD5E1; color: #0F172A; }
    .pill-ok { background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; }
    .card-block { border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 14px; overflow: hidden; page-break-inside: avoid; }
    .card-header { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 7px 12px; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-body { padding: 10px 12px; }
    .hero-box { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; page-break-inside: avoid; }
    .hero-title { font-size: 17px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin: 0 0 2px 0; }
    .hero-plan { font-size: 12px; font-weight: 800; color: #2563EB; text-transform: uppercase; margin-bottom: 8px; }
    .grid-row { display: flex; flex-wrap: wrap; margin-left: -6px; margin-right: -6px; }
    .col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 6px; box-sizing: border-box; margin-bottom: 6px; }
    .col-12 { flex: 0 0 100%; max-width: 100%; padding: 0 6px; box-sizing: border-box; margin-bottom: 6px; }
    .field-lbl { font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 1px; }
    .field-val { font-size: 12px; font-weight: 600; color: #0F172A; display: block; }
    .code-box { font-family: monospace; font-size: 12px; font-weight: bold; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 6px; display: inline-block; color: #0F172A; }
    .material-tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 26px; gap: 30px; page-break-inside: avoid; }
    .sig-col { flex: 1; text-align: center; border-top: 1.5px solid #0F172A; padding-top: 6px; }
    @media print {
      @page { margin: 10mm; size: A4; }
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card-block, .hero-box, .signatures { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- ENCABEZADO Y MEMBRETE OFICIAL -->
  <div class="header-box">
    <div>
      <h1 class="title-main">Acta de Instalación y Entrega de Servicio</h1>
      <p class="subtitle-main">Informe Técnico - Comercial de Abonado en Red FTTH</p>
      <div class="badge-bar">
        <span class="badge-pill pill-lch">Nº ORDEN / LCH: ${nroLch}</span>
        <span class="badge-pill pill-ok">ESTADO: INSTALADO Y ACTIVO</span>
        <span class="badge-pill pill-lch">FECHA: ${new Date().toLocaleDateString('es-VE')}</span>
      </div>
    </div>
    <div>
      <img src="${logoBase64}" style="width: 75px; height: auto;" />
    </div>
  </div>

  <!-- 1. IDENTIFICACIÓN JERÁRQUICA: CLIENTE Y PLAN CONTRATADO -->
  <div class="hero-box">
    <div class="hero-title">${nombreCliente}</div>
    <div class="hero-plan">${planCompleto}</div>
    <div class="grid-row">
      <div class="col-6">
        <span class="field-lbl">Cédula / Documento de Identidad</span>
        <span class="field-val">${cedula}</span>
      </div>
      <div class="col-6">
        <span class="field-lbl">Teléfono Principal</span>
        <span class="field-val">${movil}</span>
      </div>
      <div class="col-6">
        <span class="field-lbl">Teléfono Adicional</span>
        <span class="field-val">${telfAdicional}</span>
      </div>
      <div class="col-6">
        <span class="field-lbl">Correo Electrónico</span>
        <span class="field-val">${correo}</span>
      </div>
      <div class="col-6">
        <span class="field-lbl">Asesor / Vendedor Responsable</span>
        <span class="field-val">${asesor}</span>
      </div>
      <div class="col-6">
        <span class="field-lbl">Fecha de Registro Comercial</span>
        <span class="field-val">${fechaInst}</span>
      </div>
    </div>
  </div>

  <!-- 2. UBICACIÓN Y DIRECCIÓN DEL INMUEBLE -->
  <div class="card-block">
    <div class="card-header">1. Ubicación y Dirección de Instalación</div>
    <div class="card-body">
      <div class="grid-row">
        <div class="col-12">
          <span class="field-lbl">Dirección Detallada</span>
          <span class="field-val">${direccionCompleta}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Geolocalización Satelital Casa (GPS)</span>
          <span class="field-val">${coordsCasaStr}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Punto de Referencia</span>
          <span class="field-val">${d.referencia ? String(d.referencia) : 'Sin referencia específica'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. ESPECIFICACIONES TÉCNICAS Y RED FTTH -->
  <div class="card-block">
    <div class="card-header">2. Parámetros Técnicos y Niveles Ópticos de Red</div>
    <div class="card-body">
      <div class="grid-row">
        <div class="col-6">
          <span class="field-lbl">Caja NAP Asignada</span>
          <span class="field-val">${cajaNap}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Puerto Asignado en NAP</span>
          <span class="field-val">${puertoAsignado} (Disponibles: ${puertosDisponibles})</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Potencia Óptica en NAP</span>
          <span class="field-val">${potNap}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Potencia Óptica en Casa</span>
          <span class="field-val" style="color: #166534; font-weight: 800;">${potCasa}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Metros Cable Drop Utilizados</span>
          <span class="field-val">${cableDrop}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Coordenadas Satelitales NAP</span>
          <span class="field-val">${coordsNapStr}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 4. EQUIPAMIENTO INSTALADO -->
  <div class="card-block">
    <div class="card-header">3. Equipamiento Terminal Entregado (CPE)</div>
    <div class="card-body">
      <div class="grid-row">
        <div class="col-6">
          <span class="field-lbl">Tipo de Instalación</span>
          <span class="field-val">${tipoInstalacion}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Número de Abonado / LCH</span>
          <span class="code-box">${nroLch}</span>
        </div>
        <div class="col-6" style="margin-top: 4px;">
          <span class="field-lbl">Serial Equipo Módem ONU (S/N)</span>
          <span class="code-box">${serialOnu}</span>
        </div>
        <div class="col-6" style="margin-top: 4px;">
          <span class="field-lbl">Dirección MAC Física</span>
          <span class="code-box">${macEquipo}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 5. RELACIÓN DE MATERIALES Y CONSUMO -->
  <div class="card-block">
    <div class="card-header">4. Desglose de Insumos y Materiales Utilizados</div>
    <div class="card-body" style="padding: 0;">
      <table class="material-tbl">
        <thead>
          <tr style="background: #F1F5F9;">
            <th style="padding: 6px 10px; border: 1px solid #CBD5E1; text-align: left; font-size: 10px; text-transform: uppercase;">Material / Insumo</th>
            <th style="padding: 6px 10px; border: 1px solid #CBD5E1; text-align: right; font-size: 10px; text-transform: uppercase;">Cantidad Consumida</th>
          </tr>
        </thead>
        <tbody>
          ${tablaMateriales}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 6. OPERACIONES Y ACTIVACIÓN -->
  <div class="card-block">
    <div class="card-header">5. Certificación de Operaciones y Activación</div>
    <div class="card-body">
      <div class="grid-row">
        <div class="col-6">
          <span class="field-lbl">Técnico Instalador en Campo</span>
          <span class="field-val">${tecnico}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Fecha de Culminación Técnica</span>
          <span class="field-val">${fechaInst}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Activado en Sistema por (NOC)</span>
          <span class="field-val">${activadoPor}</span>
        </div>
        <div class="col-6">
          <span class="field-lbl">Fecha y Hora de Activación</span>
          <span class="field-val">${fechaAct}</span>
        </div>
      </div>
      ${observaciones ? `
      <div style="margin-top: 8px; border-top: 1px dashed #CBD5E1; padding-top: 6px;">
        <span class="field-lbl">Observaciones de Campo</span>
        <span class="field-val" style="font-weight: 500; font-style: italic;">${observaciones}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- 7. EVIDENCIAS FOTOGRÁFICAS -->
  ${fotosHtml ? `
  <div class="card-block" style="page-break-before: auto;">
    <div class="card-header">6. Registro Fotográfico y Evidencias de Conformidad</div>
    <div class="card-body" style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
      ${fotosHtml}
    </div>
  </div>` : ''}

  <!-- 8. CIERRE FORMAL Y FIRMAS -->
  <div style="margin-top: 24px; padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 10px; color: #475569; text-align: justify; page-break-inside: avoid;">
    Se hace constar que el servicio de telecomunicaciones por fibra óptica ha sido instalado, aprovisionado y certificado de conformidad con las normativas técnicas vigentes. El abonado declara recibir a entera satisfacción el equipamiento y la conectividad activa.
  </div>

  <div class="signatures">
    <div class="sig-col">
      <span style="font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Firma del Técnico Instalador</span>
      <span class="field-lbl" style="margin-top: 2px;">${tecnico}</span>
    </div>
    <div class="sig-col">
      <span style="font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Firma de Aceptación del Abonado</span>
      <span class="field-lbl" style="margin-top: 2px;">${nombreCliente} — C.I. ${cedula}</span>
    </div>
  </div>

</body>
</html>
  `;
}
