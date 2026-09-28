// api/_services/reciboFiscalService.js
// Submódulo para obtener y estructurar los datos del comprobante fiscal oficial en Bolívares desde SAEplus o tarjeta

import { saeplusService } from './saeplus.js';
import { formatearBs } from './reciboPdfService.js';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function obtenerNombreMes(fechaStr) {
  if (!fechaStr) return '';
  const parts = String(fechaStr).split('-');
  if (parts.length >= 2) {
    const mesIdx = parseInt(parts[1], 10) - 1;
    const ano = parts[0];
    if (mesIdx >= 0 && mesIdx < 12) {
      return `${MESES[mesIdx]} ${ano}`;
    }
  }
  return '';
}

function parsearReciboHtml(html) {
  if (!html || !html.includes('body_recibo')) return null;

  const fecha = html.match(/Fecha:\s*([0-9\/\s:]+)/i)?.[1]?.trim() || '';
  const nroRecibo = html.match(/Recibo de Pago:\s*([0-9]+)/i)?.[1]?.trim() || '';
  const nroAbonado = html.match(/Nro Abonado:\s*([a-zA-Z0-9]+)/i)?.[1]?.trim() || '';
  const cliente = html.match(/Cliente:\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const cedula = html.match(/<div>\s*([VEJPG]\s*[0-9]+)\s*<\/div>/i)?.[1]?.trim() || '';
  const direccionCliente = html.match(/Direcci[oó]n:\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const cajero = html.match(/Cajero\(a\):\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const caja = html.match(/Caja:\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const totalReciboBs = html.match(/Total recibo\s*:\s*<\/div>\s*<\/td>\s*<td[^>]*>\s*<div[^>]*>\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const totalPagoBs = html.match(/Total pago:\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const saldoActualBs = html.match(/Saldo Actual:\s*([^<\n\r]+)/i)?.[1]?.trim() || '';
  const igtfBs = html.match(/IGTF 3%\s*<\/td>\s*<td[^>]*>\s*<div[^>]*>\s*([^<\n\r]+)/i)?.[1]?.trim() || '0,00 BS';

  const cargos = [];
  const cargoRegex = /<tr>\s*<td class="texto">\s*([^<]+?)\s*<\/td>\s*<td class="texto">\s*<p align="right">\s*([^<]+?)\s*<\/p>\s*<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = cargoRegex.exec(html)) !== null) {
    cargos.push({ descripcion: m[1].trim(), montoBs: m[2].trim() });
  }

  const formasPago = [];
  const fpRegex = /<tr>\s*<td class="texto">\s*([^<]+?)\s*<\/td>\s*<td class="texto">\s*<div align="right">\s*([^<]+?)\s*<\/div>\s*<\/td>\s*<\/tr>/gi;
  while ((m = fpRegex.exec(html)) !== null) {
    const tipo = m[1].trim();
    if (!tipo.includes('IGTF')) {
      formasPago.push({ tipo, montoBs: m[2].trim() });
    }
  }

  return {
    fecha,
    nroRecibo,
    nroAbonado,
    cliente,
    cedula,
    direccionCliente,
    cajero,
    caja,
    cargos: cargos.length > 0 ? cargos : [{ descripcion: 'ABONO', montoBs: totalPagoBs }],
    totalReciboBs: totalReciboBs || totalPagoBs,
    formasPago: formasPago.length > 0 ? formasPago : [{ tipo: 'PAGO MOVIL', montoBs: totalPagoBs }],
    igtfBs,
    totalPagoBs,
    saldoActualBs
  };
}

/**
 * Obtiene los datos fiscales completos del último recibo de pago desde SAEplus o genera el fallback desde la tarjeta
 */
export async function obtenerDatosReciboFiscal({ cedula, nroContrato, tarjeta = {} }) {
  const datosTarjeta = tarjeta?.datos_valores || tarjeta || {};
  let fiscalData = null;

  // 1. Intentar consultar SAEplus si tenemos cédula o contrato
  const rawCedula = String(cedula || '').replace(/\D/g, '').trim();
  const rawContrato = String(nroContrato || '').trim();

  if (rawCedula || rawContrato) {
    try {
      await saeplusService.asegurarSesion();
      const payload = [{
        clase: 'tabs',
        accion: 'consultar_documento',
        datos: {
          nro_factura: '',
          nro_control: '',
          nro_contrato: rawContrato || '',
          cedulacli: rawCedula || ''
        }
      }];

      const res = await saeplusService._postControlador(payload);
      const docs = Array.isArray(res?.retorno) ? res.retorno : [];

      // Buscar coincidencia por número de recibo o el más reciente tipo PAGO
      const refBuscada = String(datosTarjeta.referencia || datosTarjeta.nroReferencia || '').trim();
      let docPago = null;
      if (refBuscada) {
        docPago = docs.find(d => d.tipo === 'PAGO' && String(d.nro_factura || '').trim() === refBuscada);
      }
      if (!docPago) {
        docPago = docs.find(d => d.tipo === 'PAGO' && (d.verdatos || d.id_pago));
      }

      // Si no se encontró en consultar_documento, buscar en estado_cuenta del abonado
      if (!docPago && rawCedula) {
        const infoAbonado = await saeplusService.consultarAbonadoPorCedula(rawCedula).catch(() => null);
        const idContrato = infoAbonado?.datos?.id_contrato;
        if (idContrato) {
          const resEdo = await saeplusService._postControlador([{
            clase: 'tabs',
            accion: 'estado_cuenta',
            datos: { id_contrato: idContrato }
          }]);
          const edoRows = resEdo?.retorno?.estado_cuenta || [];
          if (refBuscada) {
            docPago = edoRows.find(d => d.tipo === 'PAGO' && String(d.nro_factura || '').trim() === refBuscada);
          }
          if (!docPago) {
            docPago = edoRows.find(d => d.tipo === 'PAGO' && (d.id_pago || d.verdatos));
          }
        }
      }

      if (docPago && (docPago.verdatos || docPago.id_pago)) {
        let idPago = docPago.id_pago;
        if (!idPago && docPago.verdatos) {
          const matchId = docPago.verdatos.match(/imprimir_recibo_pago(?:_cliente)?\('([^']+)'/);
          idPago = matchId ? matchId[1] : null;
        }

        if (idPago) {
          // A. Intentar extraer directamente el reporte HTML oficial del SAEplus
          try {
            const repRes = await saeplusService._postControlador([{
              clase: 'pagos',
              accion: 'formato_pago',
              datos: { id_pago: idPago, tipificacion: 'FACTURA' }
            }]);
            const archivoRep = repRes?.retorno?.archivo_rep || 'recibo_pago_conex_ven_2.php';
            const urlRep = `${saeplusService.baseUrl}/modules/cobranza/report/${archivoRep}?id_pago=${idPago}`;
            const resHtml = await fetch(urlRep, {
              headers: {
                Cookie: saeplusService.cookies,
                'User-Agent': 'Mozilla/5.0'
              },
              signal: AbortSignal.timeout(10000)
            });
            if (resHtml.ok) {
              const html = await resHtml.text();
              const datosDesdeHtml = parsearReciboHtml(html);
              if (datosDesdeHtml && datosDesdeHtml.nroRecibo) {
                return datosDesdeHtml;
              }
            }
          } catch (errHtml) {
            console.warn('[RECIBO FISCAL] Error obteniendo reporte HTML de SAEplus:', errHtml.message);
          }

          // B. Fallback a controlador_informacion si el HTML no se pudo obtener
          const params = JSON.stringify({
            clase: 'informacion_pago_fiscal',
            datos: { id_pago: idPago }
          });
          const url = `${saeplusService.baseUrl}/controlador_informacion.php?parametros=${encodeURIComponent(params)}`;
          const resFisc = await fetch(url, {
            headers: {
              Cookie: saeplusService.cookies,
              'User-Agent': 'Mozilla/5.0'
            },
            signal: AbortSignal.timeout(10000)
          });
          const jsonFisc = await resFisc.json().catch(() => null);

          if (jsonFisc?.success && jsonFisc?.campo?.pagos?.length > 0) {
            fiscalData = jsonFisc.campo;
          }
        }
      }
    } catch (errSae) {
      console.warn('[RECIBO FISCAL SERVICE] Error obteniendo datos fiscales de SAEplus:', errSae.message);
    }
  }

  // 2. Si SAEplus retornó datos fiscales válidos, estructurarlos idénticamente a la emisión fiscal
  if (fiscalData && fiscalData.pagos && fiscalData.pagos.length > 0) {
    const p = fiscalData.pagos[0];
    const tasa = parseFloat(p.cambio || '1');

    const cargos = (fiscalData.cargos || []).map(c => {
      const mesStr = obtenerNombreMes(c.fecha_inst);
      const desc = mesStr ? `MENS. ${mesStr}` : (c.tipo_serv === 'MENSUALIDAD' ? 'MENSUALIDAD SERVICIO' : (c.nombre_servicio || 'SERVICIO'));
      const montoBsNum = parseFloat(c.costo_cobro || '0') * tasa;
      return {
        descripcion: desc,
        montoBs: formatearBs(montoBsNum)
      };
    });

    const totalReciboBsNum = cargos.reduce((acc, c) => {
      const n = parseFloat(c.montoBs.replace(/\./g, '').replace(',', '.'));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);

    const formasPago = (fiscalData.forma_pago || []).map(fp => {
      const montoBsNum = parseFloat(fp.monto_tp || '0') * tasa;
      return {
        tipo: fp.tipo_pago || 'TARJETA DE DEBITO',
        montoBs: formatearBs(montoBsNum)
      };
    });

    const totalPagoBs = formasPago.length > 0 ? formasPago[0].montoBs : formatearBs(totalReciboBsNum);

    return {
      nroRecibo: p.nro_factura || '520896',
      nroAbonado: p.nro_contrato || 'S/N',
      fecha: `${p.fecha_pago_factory || p.fecha_pago || ''} ${p.hora_pago || ''}`.trim(),
      cliente: `${p.nombrecli || ''} ${p.apellidocli || ''}`.trim(),
      cedula: `${p.inicial_doc || 'V'} ${p.cedulacli || ''}`.trim(),
      direccionCliente: p.direccion_fiscal || `${p.nombre_sector || ''}, ${p.nombre_ciudad || 'ANACO'}`.trim(),
      cajero: p.cobrador || 'ANDRIANNY MALPICA AGENTE TECHNOLOGICAL PROJECT',
      caja: p.nombre_caja || 'CAJA ANDRIANNY MALPICA',
      cargos: cargos.length > 0 ? cargos : [{ descripcion: 'MENSUALIDAD INTERNET', montoBs: totalPagoBs }],
      totalReciboBs: formatearBs(totalReciboBsNum),
      formasPago: formasPago.length > 0 ? formasPago : [{ tipo: 'TARJETA DE DEBITO', montoBs: totalPagoBs }],
      igtfBs: '0,00 BS',
      totalPagoBs,
      saldoActualBs: totalPagoBs
    };
  }

  // 3. Fallback inteligente utilizando datos directos de la tarjeta de Metricall
  const montoRaw = String(datosTarjeta.montoPago || datosTarjeta.monto || '0').replace(/[^0-9,.]/g, '');
  const totalPagoBs = formatearBs(montoRaw);
  const clienteNombre = String(datosTarjeta.nombreApellido || datosTarjeta.nombreCliente || tarjeta?.titulo || 'CLIENTE').toUpperCase();
  const nroRecibo = String(datosTarjeta.referencia || datosTarjeta.nroReferencia || `REC-${Date.now().toString().slice(-6)}`);
  const cedulaDoc = (rawCedula ? `V ${rawCedula}` : (datosTarjeta.documentoIdentidad || 'V-S/N'));
  const fechaActual = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaActual = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    nroRecibo,
    nroAbonado: rawContrato || 'S/N',
    fecha: `${fechaActual} ${horaActual}`,
    cliente: clienteNombre,
    cedula: cedulaDoc,
    direccionCliente: datosTarjeta.direccion || 'SECTOR CENTRO, ANACO',
    cajero: 'ANDRIANNY MALPICA AGENTE TECHNOLOGICAL PROJECT',
    caja: 'CAJA ANDRIANNY MALPICA',
    cargos: [{ descripcion: 'MENSUALIDAD SERVICIO FIBRA', montoBs: totalPagoBs }],
    totalReciboBs: totalPagoBs,
    formasPago: [{ tipo: datosTarjeta.bancoOrigen || 'PAGO MOVIL / TRANSFERENCIA', montoBs: totalPagoBs }],
    igtfBs: '0,00 BS',
    totalPagoBs,
    saldoActualBs: totalPagoBs
  };
}
