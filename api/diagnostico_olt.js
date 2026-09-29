// api/diagnostico_olt.js
// Endpoint serverless para diagnóstico técnico y control remoto de OLT y SAEplus
// Uso exclusivo para rol Developer en Metricall

import { saeplusService } from './_services/saeplus.js';
import { crearTarjetaFallaRest } from './_services/whatsappDb.js';

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
    // 1. Creación rápida de orden / ticket técnico en Metricall
    if (accion === 'crear_ticket') {
      const { nombre, cedula, telefono, tipoFalla } = params;
      const ok = await crearTarjetaFallaRest({
        nombre: String(nombre || 'Abonado OLT').trim(),
        cedula: String(cedula || '').trim(),
        telefono: String(telefono || '').trim(),
        tipoFalla: String(tipoFalla || 'Falla Técnica OLT').trim()
      });
      return res.status(200).json({
        success: ok,
        message: ok ? 'Ticket técnico registrado exitosamente en Metricall.' : 'No se pudo generar la tarjeta en el tablero.'
      });
    }

    await saeplusService.asegurarSesion();

    // 2. Refresco en tiempo real de potencia óptica (SmartOLT)
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
        return res.status(200).json({ success: true, diagnostico: diagSmart });
      }

      if (cedula) {
        const diagFull = await saeplusService.consultarDiagnosticoEquipo(cedula);
        return res.status(200).json({ success: true, ...diagFull });
      }

      return res.status(400).json({
        success: false,
        error: 'Debe especificar id_es o cédula para refrescar la lectura del equipo.'
      });
    }

    // 3. Reinicio remoto de ONT vía comando OMCI
    if (accion === 'reboot') {
      const idTse = String(params.id_tse || '').trim();
      const codigoEs = String(params.codigo_es || '').trim();
      const idContrato = String(params.id_contrato || '').trim();

      const resp = await saeplusService._postControlador([{
        clase: 'url_made4graph',
        accion: 'reinicio_equipo_made4graph',
        datos: { id_tse: idTse, codigo_es: codigoEs, id_contrato: idContrato, boton_accion: 'SI' }
      }]);

      if (resp && resp.code === 403) {
        return res.status(200).json({
          success: false,
          sinPermiso: true,
          error: 'Permiso restringido en SAEplus: el usuario de central no tiene habilitado el módulo de reinicio remoto made4graph.'
        });
      }

      return res.status(200).json({
        success: Boolean(resp?.status),
        message: resp?.message || (resp?.status ? 'Comando de reinicio enviado a la ONT.' : 'Error al enviar reinicio.'),
        raw: resp
      });
    }

    // 4. Auditoría de Wi-Fi a distancia (SSID y claves 2.4G / 5.8G)
    if (accion === 'wifi') {
      const idTse = String(params.id_tse || '').trim();
      const codigoEs = String(params.codigo_es || '').trim();

      const resp = await saeplusService._postControlador([{
        clase: 'url_made4graph',
        accion: 'tab_wifi_equipo',
        datos: { id_tse: idTse, codigo_es: codigoEs }
      }]);

      if (resp && resp.code === 403) {
        return res.status(200).json({
          success: false,
          sinPermiso: true,
          error: 'Permiso restringido en SAEplus: se requiere habilitar acceso a parámetros Wi-Fi para el usuario de central.'
        });
      }

      return res.status(200).json({
        success: Boolean(resp?.status),
        wifi: resp?.data?.wifi || null,
        message: resp?.message || '',
        raw: resp
      });
    }

    // 5. Escaneo de dispositivos conectados en la LAN/WLAN del cliente
    if (accion === 'dispositivos') {
      const idTse = String(params.id_tse || '').trim();
      const codigoEs = String(params.codigo_es || '').trim();

      const resp = await saeplusService._postControlador([{
        clase: 'url_made4graph',
        accion: 'tab_dispositivos_equipos',
        datos: { id_tse: idTse, codigo_es: codigoEs }
      }]);

      if (resp && resp.code === 403) {
        return res.status(200).json({
          success: false,
          sinPermiso: true,
          error: 'Permiso restringido en SAEplus: se requiere habilitar escaneo de dispositivos LAN para el usuario de central.'
        });
      }

      return res.status(200).json({
        success: Boolean(resp?.status),
        dispositivos: Array.isArray(resp?.data) ? resp.data : [],
        message: resp?.message || '',
        raw: resp
      });
    }

    // 6. Consulta de diagnóstico completo por Cédula (SAEplus + SmartOLT)
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
