// api/diagnostico_olt.js
// Endpoint serverless para diagnóstico técnico en tiempo real de SmartOLT y SAEplus
// Uso exclusivo para rol Developer en Metricall

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

    // 1. Refresco en tiempo real de potencia óptica (SmartOLT)
    if (accion === 'refrescar') {
      const idEs = String(params.id_es || params.idEs || '').trim();
      const cedula = String(params.cedula || '').replace(/\D/g, '').trim();

      if (idEs) {
        const diagSmart = await saeplusService.consultarSmartOlt(idEs);
        if (!diagSmart) {
          return res.status(404).json({
            success: false,
            error: 'No se pudo obtener la lectura óptica actualizada del equipo en SmartOLT.'
          });
        }
        return res.status(200).json({
          success: true,
          diagnostico: diagSmart
        });
      }

      if (cedula) {
        const diagFull = await saeplusService.consultarDiagnosticoEquipo(cedula);
        return res.status(200).json({
          success: true,
          ...diagFull
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Debe especificar id_es o cédula para refrescar la lectura del equipo.'
      });
    }

    // 2. Consulta de diagnóstico completo por Cédula (SAEplus + SmartOLT)
    const cedula = String(params.cedula || '').replace(/\D/g, '').trim();
    if (!cedula) {
      return res.status(400).json({
        success: false,
        error: 'Debe ingresar un número de cédula válido.'
      });
    }

    const diagnostico = await saeplusService.consultarDiagnosticoEquipo(cedula);

    if (!diagnostico || !diagnostico.encontrado) {
      return res.status(200).json({
        success: true,
        encontrado: false,
        error: `No se encontró ningún abonado con la cédula ${cedula} en SAEplus.`
      });
    }

    return res.status(200).json({
      success: true,
      ...diagnostico
    });

  } catch (err) {
    console.error('[API DIAGNOSTICO OLT ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error al consultar diagnóstico en central.'
    });
  }
}
