// api/services/whatsappFlujoFalla.js
// Orquestador del flujo de Reporte de Falla y Autodiagnóstico Técnico en Tiempo Real
// Fibex Telecom, sede Anaco

import { saeplusService } from './saeplus.js';
import {
  enviarMensajeTexto,
  actualizarEstadoSesionRest,
  crearTarjetaFallaRest
} from './whatsapp.js';
import {
  enviarSolicitudCedulaFalla,
  enviarDiagnosticoSuspendido,
  enviarDiagnosticoDegradado,
  enviarDiagnosticoOffline,
  enviarDiagnosticoOptimo,
  enviarConfirmacionRefresco,
  enviarMenuTiposFalla
} from './whatsappFallaMessages.js';
import { insertarLog } from './logger.js';

// 1. Iniciar flujo: solicita la cédula de identidad para diagnosticar
export async function iniciarFlujoReporteFalla(fromPhone, enFlujoActivo = false) {
  if (enFlujoActivo) {
    await enviarMensajeTexto(fromPhone, 'ℹ️ *Se canceló la gestión anterior* para iniciar un Reporte de Falla.');
  }

  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_CEDULA_FALLA');
  await enviarSolicitudCedulaFalla(fromPhone);
  await insertarLog({
    tipo: 'outgoing',
    numero_telefono: fromPhone,
    mensaje_texto: 'Flujo de falla iniciado: solicitando cédula para autodiagnóstico'
  });
}

// 2. Procesar cédula recibida: consulta SAEplus y SmartOLT
export async function procesarCedulaReporteFalla(fromPhone, textBody, sesion) {
  const cedulaLimpia = String(textBody || '').replace(/\D/g, '').trim();

  if (cedulaLimpia.length < 5) {
    await enviarMensajeTexto(
      fromPhone,
      '✏️ Por favor escribe un número de *Cédula de Identidad válido* (mínimo 5 dígitos, ejemplo: *8693154*):'
    );
    return;
  }

  await enviarMensajeTexto(fromPhone, '🔎 *Consultando estado de su conexión y equipo en central...* Por favor espere un momento.');

  let diag;
  try {
    diag = await saeplusService.consultarDiagnosticoEquipo(cedulaLimpia);
  } catch (err) {
    console.error('[FLUJO FALLA DIAGNOSTICO ERROR]:', err);
    await enviarMensajeTexto(fromPhone, '⚠️ Ocurrió una intermitencia al conectar con el sistema de diagnóstico. Por favor intenta de nuevo en unos minutos.');
    return;
  }

  // Caso: Abonado no encontrado en SAEplus
  if (!diag || !diag.encontrado) {
    await enviarMensajeTexto(
      fromPhone,
      `⚠️ No encontramos ningún contrato registrado con la Cédula *${cedulaLimpia}* en Fibex Telecom.\n\nPor favor verifica tu número de cédula e inténtalo nuevamente:`
    );
    return;
  }

  const datosTemp = {
    cedula: cedulaLimpia,
    nombre: diag.cliente?.nombreCompleto || 'Cliente',
    telefono: fromPhone,
    sector: diag.contrato?.sector || 'Anaco',
    plan: diag.contrato?.plan || 'HOGAR',
    idContrato: diag.contrato?.idContrato || '',
    nroContrato: diag.contrato?.nroContrato || '',
    id_es: diag.equipo?.id_es || null,
    codigo_es: diag.equipo?.codigo_es || null,
    potencia: diag.diagnostico?.potencia || null,
    statusOnt: diag.diagnostico?.status || null,
    nivel: diag.diagnostico?.nivel || null
  };

  // Caso 1: Contrato suspendido por cobranza
  if (diag.contrato?.esSuspendido) {
    await actualizarEstadoSesionRest(fromPhone, 'INICIO', datosTemp);
    await enviarDiagnosticoSuspendido(fromPhone, diag);
    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: fromPhone,
      mensaje_texto: `Diagnóstico falla: Contrato suspendido por deuda ($${diag.contrato.saldoPendiente})`,
      contenido: { cedula: cedulaLimpia, saldo: diag.contrato.saldoPendiente }
    });
    return;
  }

  // Caso 2: Sin equipo ONT asignado formalmente en el sistema
  if (!diag.equipo || !diag.diagnostico) {
    await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_TIPO_FALLA', datosTemp);
    await enviarMensajeTexto(
      fromPhone,
      `*Abonado:* ${datosTemp.nombre}\n*Sector:* ${datosTemp.sector} (${datosTemp.plan})\n\nNo registramos una ONT activa para este contrato. Por favor indícanos el tipo de inconveniente que presentas:`
    );
    await enviarMenuTiposFalla(fromPhone);
    return;
  }

  // Guardar estado con los datos del equipo y diagnóstico
  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_ACCION_FALLA', datosTemp);

  // Caso 3: Equipo Offline / Sin señal óptica
  if (!diag.diagnostico.esOnline) {
    await enviarDiagnosticoOffline(fromPhone, diag);
    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: fromPhone,
      mensaje_texto: 'Diagnóstico falla: ONT Offline (Sin luz óptica)',
      contenido: datosTemp
    });
    return;
  }

  // Caso 4: Conexión Degradada (Warning / Critical) -> Ofrece Refrescar
  if (diag.diagnostico.esDegradada) {
    await enviarDiagnosticoDegradado(fromPhone, diag);
    await insertarLog({
      tipo: 'outgoing',
      numero_telefono: fromPhone,
      mensaje_texto: `Diagnóstico falla: Conexión degradada (${diag.diagnostico.potencia})`,
      contenido: datosTemp
    });
    return;
  }

  // Caso 5: Conexión Óptima (Online Normal)
  await enviarDiagnosticoOptimo(fromPhone, diag);
  await insertarLog({
    tipo: 'outgoing',
    numero_telefono: fromPhone,
    mensaje_texto: `Diagnóstico falla: Conexión óptima (${diag.diagnostico.potencia})`,
    contenido: datosTemp
  });
}

// 3. Ejecutar comando de refresco del equipo en la central
export async function procesarRefrescoEquipo(fromPhone, sesion) {
  const datosTemp = sesion.datos_temporales || {};
  const idEs = datosTemp.id_es;

  if (!idEs) {
    await enviarMensajeTexto(fromPhone, '⚠️ No se localizó el identificador del equipo. Procediendo a abrir el reporte técnico...');
    await abrirSelectorTiposFalla(fromPhone, sesion);
    return;
  }

  await enviarMensajeTexto(fromPhone, '🔄 *Enviando instrucción de refresco y sincronización a su equipo en nuestra central...* Por favor espere unos segundos.');

  // Esperar 3 segundos para que la central actualice la lectura y volver a medir
  await new Promise(resolve => setTimeout(resolve, 3000));

  let nuevoDiag = null;
  try {
    nuevoDiag = await saeplusService.consultarSmartOlt(idEs);
  } catch (err) {
    console.error('[ERROR REFRESCO SMARTOLT]:', err);
  }

  const datosActualizados = {
    ...datosTemp,
    potencia: nuevoDiag?.potencia || datosTemp.potencia,
    statusOnt: nuevoDiag?.status || datosTemp.statusOnt,
    nivel: nuevoDiag?.nivel || datosTemp.nivel
  };

  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_ACCION_FALLA', datosActualizados);
  await enviarConfirmacionRefresco(fromPhone, { diagnostico: nuevoDiag || { status: 'Online', potencia: datosTemp.potencia } });
}

// 4. Desplegar el selector de fallas técnicas
export async function abrirSelectorTiposFalla(fromPhone, sesion) {
  await actualizarEstadoSesionRest(fromPhone, 'ESPERANDO_TIPO_FALLA', sesion.datos_temporales || {});
  await enviarMenuTiposFalla(fromPhone);
}

// 5. Completar y registrar el ticket con pre-diagnóstico técnico en Metricall
export async function completarReporteFallaConDiagnostico(fromPhone, tipoFallaLabel, sesion) {
  const datosTemp = sesion.datos_temporales || {};

  const sectorTxt = datosTemp.sector ? ` [Sector: ${datosTemp.sector}]` : '';
  const diagTxt = datosTemp.statusOnt
    ? ` [ONT: ${datosTemp.statusOnt} | Pot: ${datosTemp.potencia || 'N/D'}]`
    : '';
  const tipoFallaEnriquecida = `${tipoFallaLabel}${sectorTxt}${diagTxt}`;

  const payloadTarjeta = {
    nombre: datosTemp.nombre || 'Cliente WhatsApp',
    cedula: datosTemp.cedula || '',
    telefono: fromPhone,
    tipoFalla: tipoFallaEnriquecida,
    sector: datosTemp.sector || '',
    diagnostico: {
      status: datosTemp.statusOnt,
      potencia: datosTemp.potencia
    }
  };

  await crearTarjetaFallaRest(payloadTarjeta);
  await actualizarEstadoSesionRest(fromPhone, 'INICIO');

  const mensajeConfirmacion =
`*REPORTE TÉCNICO REGISTRADO — FIBEX TELECOM*

Estimado(a) *${datosTemp.nombre || 'Cliente'}*, su reporte técnico ha sido registrado formalmente en nuestro sistema:

* Falla reportada: *${tipoFallaLabel}*
* Cédula: *${datosTemp.cedula || 'N/D'}*
* Sector: *${datosTemp.sector || 'Anaco'}*
* Diagnóstico de fibra: *${datosTemp.statusOnt ? `${datosTemp.statusOnt} (${datosTemp.potencia || 'Verificado'})` : 'En revisión'}*

Nuestro personal de soporte técnico de Fibex Telecom, sede Anaco, atenderá su solicitud a la brevedad posible.

_Fibex Telecom, sede Anaco_`;

  await enviarMensajeTexto(fromPhone, mensajeConfirmacion);
  await insertarLog({
    tipo: 'outgoing',
    numero_telefono: fromPhone,
    mensaje_texto: `Reporte de falla registrado: ${tipoFallaEnriquecida}`,
    contenido: payloadTarjeta
  });
}
