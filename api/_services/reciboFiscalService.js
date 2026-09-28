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
        docPago = docs.find(d => d.tipo === 'PAGO' && d.verdatos);
      }

      if (docPago && docPago.verdatos) {
        const matchId = docPago.verdatos.match(/imprimir_recibo_pago\('([^']+)'\)/);
        const idPago = matchId ? matchId[1] : null;

        if (idPago) {
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
