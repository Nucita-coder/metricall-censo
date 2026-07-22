import { logoBase64 } from '../../assets/logoBase64';

export interface DatosValores {
  [key: string]: any;
}

export interface TarjetaDatos {
  id?: string;
  datos_valores?: DatosValores;
  [key: string]: any;
}

const formatValue = (val: any) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return null;
      return val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
    } else {
      if (Object.keys(val).length === 0) return null;
      if (val.lat && val.lng) return `${val.lat}, ${val.lng}`;
      return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(' | ');
    }
  }
  return String(val);
};

const formatKey = (k: string) => {
  return k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toUpperCase().trim();
};

export const generarHTMLInforme = (tarjeta: TarjetaDatos) => {
  const datos = tarjeta.datos_valores || {};
  
  const geofotos = datos.geofotos || [];
  const adjuntos = datos.adjuntos || [];
  const lchImagen = datos.lch_imagen;
  
  const allImages = [...(lchImagen ? [lchImagen] : []), ...geofotos, ...adjuntos];
  const imagesHtml = allImages.map(url => `<img src="${url}" style="width: 100%; max-width: 500px; display: block; margin: 0 auto 20px auto; border-radius: 8px; border: 1px solid #CCC;" />`).join('\n');

  let comentariosHtml = '';
  let comentariosTexto = '';
  if (Array.isArray(datos.comentarios)) {
    comentariosTexto = datos.comentarios.map((c: any) => `[${c.fecha}] ${c.autor}: ${c.texto}`).join('<br/>');
  } else if (typeof datos.comentarios === 'string') {
    comentariosTexto = datos.comentarios;
  }

  const posiblesComentarios = [
    { label: 'COMENTARIOS GENERALES', val: comentariosTexto },
    { label: 'MOTIVO FACTIBILIDAD', val: datos.motivoFactibilidad },
    { label: 'OBSERVACIONES', val: datos.observaciones },
    { label: 'MOTIVO DE RETORNO', val: datos.motivoRetorno || datos.ultimoMotivoRetorno },
    { label: 'COMENTARIO DE INSTALACIÓN', val: datos.comentario_instalacion }
  ];
  
  posiblesComentarios.forEach(c => {
    if (c.val && typeof c.val === 'string' && c.val.trim() !== '') {
      comentariosHtml += `<div style="background:#F7FAFC; padding:10px; border-radius:4px; margin-bottom:8px; border-left:4px solid #3182CE;"><strong>${c.label}:</strong><br/>${c.val}</div>`;
    }
  });
  
  if (!comentariosHtml) comentariosHtml = '<p>No hay comentarios registrados.</p>';

  const clienteKeys = ['nombreApellido', 'nombres', 'lch_numero', 'tecnico', 'asignado_a', 'serial_onu', 'serialEquipo', 'mac_equipo', 'macEquipo'];
  const redKeys = ['tipoInstalacion', 'tipo_instalacion', 'cable_preconectorizado', 'nap', 'nroNap', 'potenciaNap', 'potencia_casa', 'potenciaCasa', 'cable_drop', 'cableDrop', 'puerto', 'puertoAsignado', 'puertos_disponibles', 'geo_nap', 'geo_casa'];
  
  const excludeKeys = ['geofotos', 'adjuntos', 'lch_imagen', 'comentarios', 'motivoFactibilidad', 'observaciones', 'motivoRetorno', 'ultimoMotivoRetorno', 'comentario_instalacion', 'materiales', 'historial_auditoria', 'gestiones'];
  
  const renderGroup = (keys: string[], title: string) => {
    let html = '';
    keys.forEach(k => {
      excludeKeys.push(k);
      const val = formatValue(datos[k]);
      if (val !== null) html += `<tr><th>${formatKey(k)}</th><td>${val}</td></tr>`;
    });
    if (html) {
      return `
        <div class="section">
          <h3>${title}</h3>
          <table>${html}</table>
        </div>`;
    }
    return '';
  };

  const ventaHtml = renderGroup(['nombreApellido', 'nombres', 'nroIdentidad', 'telefono', 'tipoInstalacion', 'tipo_instalacion'], '1. DATOS DEL CLIENTE Y VENTA');
  const factibilidadHtml = renderGroup(['lch_numero', 'tecnico', 'asignado_a', 'geo_casa', 'potencia_casa', 'potenciaCasa'], '2. ASIGNACIÓN Y FACTIBILIDAD');
  const redHtml = renderGroup(['nap', 'nroNap', 'puertos_disponibles', 'puerto', 'puertoAsignado', 'potenciaNap', 'cable_preconectorizado', 'cable_drop', 'cableDrop', 'geo_nap'], '3. INSTALACIÓN Y RED');
  const activacionHtml = renderGroup(['serial_onu', 'serialEquipo', 'mac_equipo', 'macEquipo'], '4. ACTIVACIÓN DE SERVICIO');

  let otrosHtml = '';
  Object.keys(datos).forEach(key => {
    if (excludeKeys.includes(key)) return;
    let val = formatValue(datos[key]);
    
    // Tratamiento especial para geo_censo
    if (key === 'geo_censo' && datos[key]?.lat && datos[key]?.lng) {
      val = `<a href="https://www.google.com/maps/search/?api=1&query=${datos[key].lat},${datos[key].lng}" style="color: #3182CE; text-decoration: none;"><strong>Ver en Google Maps (${Number(datos[key].lat).toFixed(6)}, ${Number(datos[key].lng).toFixed(6)})</strong></a>`;
    }
    
    if (val !== null) {
      otrosHtml += `<tr><th>${formatKey(key)}</th><td>${val}</td></tr>`;
    }
  });
  if (otrosHtml) {
    const tituloSeccion = datos.fechaCenso ? '2. DETALLES DEL CENSO' : '5. INFORMACIÓN ADICIONAL';
    otrosHtml = `
        <div class="section">
          <h3>${tituloSeccion}</h3>
          <table>${otrosHtml}</table>
        </div>`;
  }

  let materialesHtml = '';
  if (datos.materiales && typeof datos.materiales === 'object') {
    Object.keys(datos.materiales).forEach(key => {
      const val = formatValue(datos.materiales[key]);
      if (val !== null && val !== '0') { // Omit 0 quantities
        materialesHtml += `<tr><th>${formatKey(key)}</th><td>${val}</td></tr>`;
      }
    });
    if (materialesHtml) {
      materialesHtml = `
        <div class="section">
          <h3>6. INVENTARIO DE MATERIALES</h3>
          <table>${materialesHtml}</table>
        </div>`;
    }
  }

  let gestionesHtml = '';
  if (datos.gestiones && Array.isArray(datos.gestiones) && datos.gestiones.length > 0) {
    let gestRows = '';
    datos.gestiones.forEach((g: any, idx: number) => {
      const etapaStr = g.etapa === 'gestion_1' ? 'Gestión 1' : 'Gestión 2 (Cierre)';
      let rowHtml = `<tr><th colspan="2" style="background-color: #EBF8FF; color: #2B6CB0; text-align: center;">${etapaStr} - ${g.fecha}</th></tr>`;
      rowHtml += `<tr><th>Tipo de Contacto</th><td>${g.tipoContacto}</td></tr>`;
      rowHtml += `<tr><th>Resultado</th><td>${g.resultado}</td></tr>`;
      
      if (g.motivoRechazo) {
        rowHtml += `<tr><th>Motivo de Rechazo</th><td style="color: #E53E3E;">${g.motivoRechazo}</td></tr>`;
      }
      
      if (g.evidenciaUrl) {
        rowHtml += `<tr><th>Evidencia</th><td><a href="${g.evidenciaUrl}" style="color: #3182CE; text-decoration: none;"><strong>Ver Evidencia Adjunta</strong></a></td></tr>`;
      }
      gestRows += rowHtml;
    });
    
    gestionesHtml = `
      <div class="section">
        <h3>GESTIONES COMERCIALES</h3>
        <table>${gestRows}</table>
      </div>`;
  }

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; position: relative; }
          .header { text-align: center; border-bottom: 2px solid #E53E3E; padding-bottom: 20px; margin-bottom: 20px; position: relative; }
          .header h1 { color: #E53E3E; margin: 0; font-size: 24px; text-transform: uppercase; padding-right: 60px; }
          .logo { position: absolute; top: 0; right: 0; width: 60px; height: auto; border-radius: 4px; }
          .section { margin-bottom: 24px; }
          .section h3 { margin-top: 0; color: #2D3748; font-size: 16px; border-bottom: 1px solid #CBD5E0; padding-bottom: 8px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; }
          th { background-color: #F7FAFC; color: #4A5568; font-weight: bold; width: 40%; text-transform: uppercase; font-size: 14px; }
          td { font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoBase64}" class="logo" />
          <h1>${datos.fechaCenso ? 'REPORTE TÉCNICO DE CENSO' : 'REPORTE TÉCNICO DE INSTALACIÓN'}</h1>
          <p style="color:#718096; margin:4px 0;"><strong>ID Tarjeta:</strong> ${tarjeta.id || 'N/A'} | <strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${ventaHtml}
        ${factibilidadHtml}
        ${redHtml}
        ${activacionHtml}
        ${otrosHtml}
        ${materialesHtml}
        ${gestionesHtml}

        <div class="section">
          <h3>7. HISTORIAL DE COMENTARIOS</h3>
          ${comentariosHtml}
        </div>

        ${allImages.length > 0 ? `
        <div class="section" style="page-break-before: always;">
          <h3>8. EVIDENCIA FOTOGRÁFICA</h3>
          ${imagesHtml}
        </div>
        ` : ''}
      </body>
    </html>
  `;
};

export const generarReporteActivacion = (datos: DatosValores, fotosSeleccionadas: Record<string, boolean>) => {
  const tipoInstalacionRaw = datos.tipoInstalacion || 'N/A';
  const tipoAjustado = tipoInstalacionRaw.toUpperCase();
  const mat = datos.materiales || {};

  let reporte = `TECHNOLOGICAL PROJECT INSTALACION ${tipoAjustado}
TECNICO: ${datos.tecnico || 'N/A'}

*ABONADO*
LCH${datos.lch_numero || 'N/A'}
CLIENTE: ${datos.nombreApellido || datos.nombres || 'N/A'}
SERIAL EQUIPO: ${datos.serial_onu || datos.serialEquipo || 'N/A'}
MAC EQUIPO: ${datos.mac_equipo || datos.macEquipo || 'N/A'}

*Materiales*
TENSOR PLÁSTICO: ${mat.tensorPlastico || 'N/A'}
TENSOR HIERRO: ${mat.tensorHierro || 'N/A'}
GRAPAS: ${mat.grapas || 'N/A'}
TIRRAP: ${mat.tirrap || 'N/A'}
PACH CORD APC: ${mat.pachCordApc || 'N/A'}
PACH CORD UPC: ${mat.pachCordUpc || 'N/A'}
PACH CORD APC/UPC: ${mat.pachCordApcUpc || 'N/A'}
CAJA TERM. CON ACCESORIOS: ${mat.cajaTerminalCon || 'N/A'}
CAJA TERM. SIN ACCESORIOS: ${mat.cajaTerminalSin || 'N/A'}
CONECTOR/ACOPLE H-H: ${mat.conectorAcople || 'N/A'}
CONECTOR MECÁNICO APC: ${mat.conectorMecanicoApc || 'N/A'}
CONECTOR MECÁNICO UPC: ${mat.conectorMecanicoUpc || 'N/A'}
PRECINTO: ${mat.precinto || 'N/A'}

*Cable Preconectorizado: ${mat.cablePreconectorizado || datos.cable_preconectorizado || 'N/A'}*
*Nro de NAP: ${datos.nap || datos.nroNap || 'N/A'}*
*Potencia NAP: ${datos.potenciaNap || 'N/A'}*
*Potencia Casa: ${datos.potencia_casa || datos.potenciaCasa || 'N/A'}*
*Cable Drop: ${datos.cable_drop || datos.cableDrop || 'N/A'}*
*Puerto Asignado: ${datos.puerto || datos.puertoAsignado || 'N/A'}*
*Puertos Disponibles: ${datos.puertos_disponibles || datos.puertosDisponibles || 'N/A'}*

*Geo NAP: ${datos.geo_nap ? datos.geo_nap.lat + ',' + datos.geo_nap.lng : 'N/A'}*
*Geo Casa: ${datos.geo_casa ? datos.geo_casa.lat + ',' + datos.geo_casa.lng : 'N/A'}*`;

  let evidencias = '';

  if (datos.lch_imagen && fotosSeleccionadas[datos.lch_imagen]) {
    evidencias += `\n*Foto LCH:*\n${datos.lch_imagen}\n`;
  }

  if (datos.geofotos && datos.geofotos.length > 0) {
    datos.geofotos.forEach((url: string, idx: number) => {
      if (fotosSeleccionadas[url]) {
        evidencias += `\n*GeoFoto/Evidencia ${idx + 1}:*\n${url}\n`;
      }
    });
  }

  if (datos.adjuntos && datos.adjuntos.length > 0) {
    datos.adjuntos.forEach((url: string, idx: number) => {
      if (fotosSeleccionadas[url]) {
        evidencias += `\n*Imagen Adjunta ${idx + 1}:*\n${url}\n`;
      }
    });
  }

  if (evidencias !== '') {
    reporte += `\n\n📸 *Evidencias Adjuntas:*\n${evidencias}`;
  }

  return reporte;
};
