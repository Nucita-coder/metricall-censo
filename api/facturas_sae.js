// api/facturas_sae.js
// Endpoint serverless para consultar y descargar facturas oficiales de SAEplus (formato original con sello)

import { saeplusService } from './_services/saeplus.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = req.method;
  const params = method === 'GET' ? req.query : (req.body || {});
  const accion = String(params.accion || 'consultar').toLowerCase();

  try {
    await saeplusService.asegurarSesion();

    // 1. Descarga binaria de factura oficial en PDF
    if (accion === 'descargar') {
      const idPago = String(params.idPago || '').trim();
      const formato = String(params.formato || params.archivoFormatoFactura || '').trim();
      const nroFactura = String(params.nroFactura || 'Oficial').trim();

      if (!idPago || !formato) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos (idPago, formato) para descargar la factura.'
        });
      }

      const pdfBuffer = await saeplusService.descargarFacturaPdf(idPago, formato);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Factura_Fibex_${nroFactura}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
    }

    // 2. Consulta de facturas oficiales por Cédula
    const cedula = String(params.cedula || '').replace(/\D/g, '').trim();
    if (!cedula) {
      return res.status(400).json({
        success: false,
        error: 'Debe ingresar un número de cédula válido.'
      });
    }

    const payload = [{
      clase: 'tabs',
      accion: 'consultar_documento',
      datos: {
        nro_factura: '',
        nro_control: '',
        nro_contrato: '',
        cedulacli: cedula
      }
    }];

    const resp = await saeplusService._postControlador(payload);
    let docs = Array.isArray(resp?.retorno) ? resp.retorno : [];

    // Fallback con estado_cuenta si consultar_documento no devuelve registros
    if (docs.length === 0) {
      const abonadoInfo = await saeplusService.consultarAbonadoPorCedula(cedula).catch(() => null);
      const idContrato = abonadoInfo?.datos?.id_contrato;
      if (idContrato) {
        const resEdo = await saeplusService._postControlador([{
          clase: 'tabs',
          accion: 'estado_cuenta',
          datos: { id_contrato: idContrato }
        }]);
        docs = Array.isArray(resEdo?.retorno?.estado_cuenta) ? resEdo.retorno.estado_cuenta : [];
      }
    }

    const facturas = [];
    let clienteNombre = '';
    let nroContrato = '';

    for (const doc of docs) {
      const verdatos = doc.verdatos || '';
      const match = verdatos.match(/imprimir_factura_cargar_deuda\('([^']+)',\s*'([^']+)'\)/);
      if (match) {
        if (!clienteNombre && doc.cliente) clienteNombre = doc.cliente;
        if (!nroContrato && doc.nro_contrato) nroContrato = doc.nro_contrato;

        facturas.push({
          nroFactura: doc.nro_factura || 'S/N',
          tipo: doc.tipo || 'FACTURA',
          fechaEmision: doc.fecha || doc.fecha_pago || '',
          monto: doc.monto_pago || doc.cargo || '0.00',
          concepto: doc.obser_pago || 'SERVICIO DE INTERNET',
          idPago: match[1],
          archivoFormatoFactura: match[2],
          franquicia: doc.nombre_franq || ''
        });
      }
    }

    return res.status(200).json({
      success: true,
      cedula,
      cliente: clienteNombre,
      nroContrato,
      totalFacturas: facturas.length,
      facturas
    });

  } catch (error) {
    console.error('[API FACTURAS SAE ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al consultar facturas en SAEplus'
    });
  }
}
