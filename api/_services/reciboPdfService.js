// api/_services/reciboPdfService.js
// Servicio de generación de Recibo / Comprobante de Pago Oficial de Fibex Telecom en PDF (formato idéntico al ticket térmico en Bolívares)

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Formatea un número como monto en Bolívares con formato venezolano (ej: 12.959,00 BS)
 */
export function formatearBs(valor) {
  if (valor === undefined || valor === null || valor === '') return '0,00 BS';
  if (typeof valor === 'string' && valor.toUpperCase().includes('BS')) {
    return valor.trim();
  }
  const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return '0,00 BS';
  const parts = Math.abs(num).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]} BS`;
}

/**
 * Genera un PDF binario (Buffer) con el formato exacto del comprobante oficial Fibex Telecom (Copia de Recibo)
 */
export async function generarReciboPagoPdf(datos = {}) {
  const pdfDoc = await PDFDocument.create();

  const cargos = Array.isArray(datos.cargos) && datos.cargos.length > 0
    ? datos.cargos
    : [{ descripcion: 'MENSUALIDAD SERVICIO', montoBs: datos.totalPagoBs || '0,00 BS' }];

  const formasPago = Array.isArray(datos.formasPago) && datos.formasPago.length > 0
    ? datos.formasPago
    : [{ tipo: datos.formaPago || 'PAGO MOVIL / TRANSFERENCIA', montoBs: datos.totalPagoBs || '0,00 BS' }];

  // Cálculo de altura dinámica para acomodar los ítems
  const rowHeight = 14;
  const baseHeight = 480;
  const dynamicHeight = Math.max(520, baseHeight + (cargos.length + formasPago.length) * rowHeight);

  const width = 360;
  const height = dynamicHeight;
  const page = pdfDoc.addPage([width, height]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const margin = 24;
  let y = height - 26;

  const drawCenter = (text, size = 9, isBold = false) => {
    const f = isBold ? fontBold : fontRegular;
    const cleanText = String(text || '').trim();
    const textWidth = f.widthOfTextAtSize(cleanText, size);
    page.drawText(cleanText, {
      x: Math.max(margin, (width - textWidth) / 2),
      y,
      size,
      font: f,
      color: rgb(0, 0, 0)
    });
    y -= (size + 3.5);
  };

  const drawLeft = (text, size = 8.5, isBold = false) => {
    const f = isBold ? fontBold : fontRegular;
    const cleanText = String(text || '').trim();
    page.drawText(cleanText, {
      x: margin,
      y,
      size,
      font: f,
      color: rgb(0, 0, 0)
    });
    y -= (size + 3.5);
  };

  const drawRow = (left, right, size = 8.5, isBold = false) => {
    const f = isBold ? fontBold : fontRegular;
    const cleanLeft = String(left || '').trim();
    const cleanRight = String(right || '').trim();
    page.drawText(cleanLeft, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
    const rightWidth = f.widthOfTextAtSize(cleanRight, size);
    page.drawText(cleanRight, { x: width - margin - rightWidth, y, size, font: f, color: rgb(0, 0, 0) });
    y -= (size + 4.5);
  };

  const drawDashedLine = () => {
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: width - margin, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
      dashArray: [2, 2]
    });
    y -= 8;
  };

  // 1. Encabezado Oficial Corporativo Fibex
  drawCenter('CORPORACION FIBEXTELECOM C.A.', 9.5, false);
  drawCenter('(FIBEXTELECOM)', 9, false);
  drawCenter('RIF J-30818251-6', 8.5, false);

  const dirEmp1 = 'CARACAS, PARAISO, URB. LAS FUENTES, CALLE II Y III QUINTA SAN JOSE';
  const dirEmp2 = 'NRO 8';
  drawCenter(dirEmp1, 7.8, false);
  drawCenter(dirEmp2, 7.8, false);
  drawCenter('SOMOS PROVEEDORES DE SERVICIOS DE TELECOMUNICACIONES', 7.8, false);

  y -= 3;
  drawCenter('COPIA DE RECIBO', 9.5, true);
  y -= 4;

  // 2. Metadatos del Pago y Abonado
  drawLeft(`Fecha: ${datos.fecha || new Date().toLocaleDateString('es-VE')}`, 8.5, false);
  drawLeft(`Recibo de Pago: ${datos.nroRecibo || 'S/N'}`, 8.5, false);
  drawLeft(`Nro Abonado: ${datos.nroAbonado || 'S/N'}`, 8.5, false);
  drawLeft(`Cliente: ${String(datos.cliente || 'CLIENTE').toUpperCase()}`, 8.5, false);
  drawLeft(`${datos.cedula || ''}`, 8.5, false);

  const direccion = datos.direccionCliente || 'PUEBLO NUEVO, ANACO';
  if (direccion.length > 58) {
    drawLeft(`Dirección: ${direccion.slice(0, 55)}...`, 7.8, false);
  } else {
    drawLeft(`Dirección: ${direccion}`, 7.8, false);
  }

  const cajero = datos.cajero || 'FRANCISBEL ARELIANNYS SALAZAR';
  drawLeft(`Cajero(a): ${cajero}`, 7.8, false);
  drawLeft(`Caja: ${datos.caja || 'CAJA VIRTUAL'}`, 8.5, false);
  y -= 4;

  // 3. Tabla de Cargos / Mensualidades
  drawRow('Descripción', 'Monto', 8.5, true);
  y -= 1;

  for (const cargo of cargos) {
    drawRow(cargo.descripcion, cargo.montoBs, 8.5, false);
  }

  // Línea divisoria sólida idéntica a <hr> de SAEplus
  page.drawLine({
    start: { x: margin, y: y + 2 },
    end: { x: width - margin, y: y + 2 },
    thickness: 0.6,
    color: rgb(0.2, 0.2, 0.2)
  });
  y -= 8;

  // 4. Total Recibo
  drawRow('Total recibo :', datos.totalReciboBs || datos.totalPagoBs || '0,00 BS', 8.5, true);
  y -= 6;

  // 5. Forma de Pago
  page.drawText('Forma de Pago', { x: margin, y, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
  y -= 13;

  for (const fp of formasPago) {
    drawRow(fp.tipo, fp.montoBs, 8.5, false);
  }

  const igtf = datos.igtfBs || '0,00 BS';
  drawRow('IGTF 3%', igtf, 8.5, false);
  y -= 6;

  // 6. Pie de Página y Totales
  drawCenter(`Total pago: ${datos.totalPagoBs || '0,00 BS'}`, 8.5, true);
  if (datos.saldoActualBs) {
    drawCenter(`Saldo Actual: ${datos.saldoActualBs}`, 8.5, true);
  }
  drawCenter('*Gracias por su Pago*', 8.5, true);
  drawCenter('.', 8, false);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
