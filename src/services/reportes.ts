import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as shareAsync from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { logoBase64 } from '../../assets/logoBase64';
import { ComentarioItem, TarjetaDatosValores } from '../types/kanban';
import { generarHTMLInformeEscrito } from './informeHtmlBuilder';

export { generarHTMLInformeEscrito };

export type DatosValores = TarjetaDatosValores;

export interface TarjetaDatos {
  id?: string;
  datos_valores?: DatosValores;
  [key: string]: unknown;
}

const formatValue = (val: unknown) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return null;
      return val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    } else {
      const obj = val as Record<string, unknown>;
      if (Object.keys(obj).length === 0) return null;
      if (obj.lat && obj.lng) return `${obj.lat}, ${obj.lng}`;
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ');
    }
  }
  return String(val);
};

const formatKey = (k: string) => {
  return k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toUpperCase().trim();
};

export async function imprimirODescargarReporte(
  html: string,
  nombreArchivo: string
): Promise<void> {
  if (Platform.OS === 'web') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      throw new Error('No se pudo acceder al documento de impresión.');
    }

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((resolve) => setTimeout(resolve, 350));
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // Ignorar si ya fue removido
      }
    }, 5000);
    return;
  }

  const { uri, base64 } = await printToFileAsync({ html, base64: true });
  const finalUri = (FileSystem.documentDirectory || '') + `${nombreArchivo}.pdf`;

  if (base64) {
    await FileSystem.writeAsStringAsync(finalUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await shareAsync.shareAsync(finalUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Descargar Informe',
    });
  } else if (uri) {
    await shareAsync.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Descargar Informe',
    });
  }
}

const generarHTMLCenso = (tarjeta: TarjetaDatos): string => {
  const datos = tarjeta.datos_valores || {};
  const geofotosArr = Array.isArray(datos.geofotos) ? datos.geofotos : (datos.geofotos ? [datos.geofotos] : []);
  const adjuntosArr = Array.isArray(datos.adjuntos) ? datos.adjuntos : (datos.adjuntos ? [datos.adjuntos] : []);
  const allImages = [
    ...(geofotosArr as unknown[]).map(f => typeof f === 'string' ? f : (f as { url?: string; uri?: string })?.url || (f as { url?: string; uri?: string })?.uri).filter(Boolean) as string[],
    ...(adjuntosArr as unknown[]).map(a => typeof a === 'string' ? a : (a as { url?: string; uri?: string })?.url || (a as { url?: string; uri?: string })?.uri).filter(Boolean) as string[],
  ];
  const imagesHtml = allImages.map(url => `<img src="${url}" style="width: 100%; max-width: 500px; display: block; margin: 0 auto 20px auto; border-radius: 8px; border: 1px solid #CCC;" />`).join('\n');

  let comentariosHtml = '';
  if (Array.isArray(datos.comentarios)) {
    comentariosHtml = (datos.comentarios as ComentarioItem[]).map(c => `[${c.fecha}] ${c.autor}: ${c.texto}`).join('<br/>');
  } else if (typeof datos.comentarios === 'string') {
    comentariosHtml = datos.comentarios;
  }
  if (!comentariosHtml) comentariosHtml = '<p>No hay comentarios registrados.</p>';

  const excludeKeys = ['geofotos', 'adjuntos', 'lch_imagen', 'comentarios', 'historial_auditoria', 'gestiones'];
  let camposRows = '';
  Object.keys(datos).forEach(key => {
    if (excludeKeys.includes(key)) return;
    let val = formatValue(datos[key]);
    const punto = datos[key] as { lat?: string | number; lng?: string | number } | undefined;
    if (key === 'geo_censo' && punto?.lat && punto?.lng) {
      val = `<a href="https://www.google.com/maps/search/?api=1&query=${punto.lat},${punto.lng}" style="color: #3182CE; text-decoration: none;"><strong>Ver en Google Maps (${Number(punto.lat).toFixed(6)}, ${Number(punto.lng).toFixed(6)})</strong></a>`;
    }
    if (val !== null && val !== '') {
      camposRows += `<tr><th>${formatKey(key)}</th><td style="color: #2B6CB0; font-weight: bold;">${val}</td></tr>`;
    }
  });

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; position: relative; }
          .header { text-align: center; border-bottom: 2px solid #3182CE; padding-bottom: 20px; margin-bottom: 20px; position: relative; }
          .header h1 { color: #2B6CB0; margin: 0; font-size: 22px; text-transform: uppercase; padding-right: 60px; }
          .logo { position: absolute; top: 0; right: 0; width: 60px; height: auto; border-radius: 4px; }
          .section { margin-bottom: 24px; }
          .section h3 { margin-top: 0; color: #2D3748; font-size: 15px; border-bottom: 1px solid #CBD5E0; padding-bottom: 8px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px 10px; text-align: left; }
          th { background-color: #F7FAFC; color: #4A5568; font-weight: bold; width: 40%; text-transform: uppercase; font-size: 13px; }
          td { font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoBase64}" class="logo" />
          <h1>REPORTE TÉCNICO DE CENSO</h1>
          <p style="color:#718096; margin:4px 0;"><strong>ID:</strong> ${tarjeta.id || 'N/A'} | <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-VE')}</p>
        </div>
        <div class="section">
          <h3>DATOS RECOLECTADOS EN CENSO</h3>
          <table>${camposRows}</table>
        </div>
        <div class="section">
          <h3>OBSERVACIONES / COMENTARIOS</h3>
          ${comentariosHtml}
        </div>
        ${allImages.length > 0 ? `
        <div class="section" style="page-break-before: auto;">
          <h3>EVIDENCIAS FOTOGRÁFICAS</h3>
          ${imagesHtml}
        </div>` : ''}
      </body>
    </html>
  `;
};

export const generarHTMLInforme = (tarjeta: TarjetaDatos): string => {
  const datos = tarjeta.datos_valores || {};
  if (datos.fechaCenso || datos.dispuestoCambiar || datos.origenCenso) {
    return generarHTMLCenso(tarjeta);
  }
  return generarHTMLInformeEscrito(tarjeta);
};

export const generarReporteActivacion = (datos: DatosValores, fotosSeleccionadas: Record<string, boolean>) => {
  const tipoInstalacionRaw = String(datos.tipoInstalacion || 'N/A');
  const tipoAjustado = tipoInstalacionRaw.toUpperCase();
  const mat = (datos.materiales || {}) as Record<string, string | number | undefined>;

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

*Geo NAP: ${datos.geo_nap && datos.geo_nap.lat && datos.geo_nap.lng ? String(datos.geo_nap.lat) + ',' + String(datos.geo_nap.lng) : 'N/A'}*
*Geo Casa: ${datos.geo_casa && datos.geo_casa.lat && datos.geo_casa.lng ? String(datos.geo_casa.lat) + ',' + String(datos.geo_casa.lng) : 'N/A'}*`;

  let evidencias = '';

  if (datos.lch_imagen && fotosSeleccionadas[String(datos.lch_imagen)]) {
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
