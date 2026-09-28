// api/services/whatsappFallaMessages.js
// Submódulo de mensajería y plantillas interactivas para el Diagnóstico Técnico y Reporte de Fallas
// Fibex Telecom, sede Anaco

import { getCredentials, apiPost } from './whatsappMessages.js';

// Helper interno para envío de mensajes de texto
async function enviarTexto(toPhone, texto) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) {
    console.error('[WHATSAPP FALLA ERROR]: Token no configurado');
    return;
  }
  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: texto }
    });
  } catch (err) {
    console.error('[WHATSAPP FALLA TEXT ERROR]:', err);
  }
}

// 1. Solicitud de Cédula para Autodiagnóstico
export async function enviarSolicitudCedulaFalla(toPhone) {
  const mensaje =
`*ATENCIÓN TÉCNICA — FIBEX TELECOM*

¡Hola! Para verificar el estado de su conexión y realizar un autodiagnóstico en tiempo real, por favor escriba su número de *Cédula de Identidad* (ejemplo: *8693154*):

_Fibex Telecom, sede Anaco_`;

  return await enviarTexto(toPhone, mensaje);
}

// 2. Notificación de Contrato Suspendido por Cobranza
export async function enviarDiagnosticoSuspendido(toPhone, info) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const titular = info.cliente?.nombreCompleto || 'Estimado Cliente';
  const contrato = info.contrato?.nroContrato || 'N/D';
  const plan = info.contrato?.plan || 'HOGAR';
  const sector = info.contrato?.sector || 'Anaco';
  const saldo = info.contrato?.saldoPendiente || '0.00';

  const texto =
`*ESTATUS DE CUENTA — FIBEX TELECOM*

Titular: *${titular}*
Contrato: *${contrato}* (${plan})
Sector: *${sector}*
Estatus: *SUSPENDIDO POR FACTURACIÓN*
Saldo pendiente: *$${saldo} USD*

Estimado cliente, su servicio presenta una suspensión administrativa debido a un saldo pendiente de pago. La interrupción no se debe a una avería física en la fibra óptica.

_Fibex Telecom, sede Anaco_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_reporte_pago', title: 'Reportar Pago' } },
            { type: 'reply', reply: { id: 'btn_menu_principal', title: 'Menú Principal' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP DIAGNOSTICO SUSPENDIDO ERROR]:', err);
  }
}

// 3. Notificación de Conexión Degradada (Atenuación) con botón de refrescar
export async function enviarDiagnosticoDegradado(toPhone, info) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const titular = info.cliente?.nombreCompleto || 'Estimado Cliente';
  const plan = info.contrato?.plan || 'HOGAR';
  const sector = info.contrato?.sector || 'Anaco';
  const potencia = info.diagnostico?.potencia || 'N/D';

  const texto =
`*DIAGNÓSTICO TÉCNICO DE FIBRA ÓPTICA*

Titular: *${titular}* | Sector: *${sector}*
Plan: *${plan}*
Estatus ONT: *EN LÍNEA (SEÑAL DEGRADADA)*
Nivel óptico: *${potencia}* (Atenuación detectada)

Su módem está sincronizado con la central, pero la señal de fibra presenta pérdida de potencia óptica, lo que puede causar lentitud e intermitencia.

*Posibles causas:*
1. Curvatura forzada o tensión en el cable amarillo de fibra óptica en su domicilio.
2. Desajuste o suciedad en el conector óptico.
3. Pérdida de potencia en la caja de empalme o manga de su sector.

_Fibex Telecom, sede Anaco_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_falla_refrescar', title: 'Refrescar Equipo' } },
            { type: 'reply', reply: { id: 'btn_falla_abrir_ticket', title: 'Abrir Reporte' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP DIAGNOSTICO DEGRADADO ERROR]:', err);
  }
}

// 4. Notificación de Equipo Offline / Sin luz óptica
export async function enviarDiagnosticoOffline(toPhone, info) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const titular = info.cliente?.nombreCompleto || 'Estimado Cliente';
  const plan = info.contrato?.plan || 'HOGAR';
  const sector = info.contrato?.sector || 'Anaco';

  const texto =
`*DIAGNÓSTICO TÉCNICO DE FIBRA ÓPTICA*

Titular: *${titular}* | Sector: *${sector}*
Plan: *${plan}*
Estatus ONT: *SIN SEÑAL ÓPTICA (OFFLINE)*

Su módem no está recibiendo haz de luz desde la red de fibra óptica (Luz roja LOS o equipo apagado).

*Posibles causas:*
1. Cable de fibra óptica desconectado, partido o aprisionado.
2. Módem apagado o falla en la toma eléctrica.
3. Rotura de fibra exterior en el tendido de su sector en Anaco.

_Fibex Telecom, sede Anaco_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_falla_abrir_ticket', title: 'Generar Reporte' } },
            { type: 'reply', reply: { id: 'btn_menu_principal', title: 'Menú Principal' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP DIAGNOSTICO OFFLINE ERROR]:', err);
  }
}

// 5. Notificación de Conexión Óptima
export async function enviarDiagnosticoOptimo(toPhone, info) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const titular = info.cliente?.nombreCompleto || 'Estimado Cliente';
  const plan = info.contrato?.plan || 'HOGAR';
  const sector = info.contrato?.sector || 'Anaco';
  const potencia = info.diagnostico?.potencia || 'Normal';

  const texto =
`*DIAGNÓSTICO TÉCNICO DE FIBRA ÓPTICA*

Titular: *${titular}* | Sector: *${sector}*
Plan: *${plan}*
Estatus ONT: *ÓPTIMO (ONLINE)*
Nivel óptico: *${potencia}* (Señal en rango ideal)

La señal de fibra óptica hacia su módem se encuentra operando con total normalidad.

*Posibles causas si no tiene internet:*
1. Cable de red LAN flojo o desconectado entre el módem Fibex y su router Wi-Fi.
2. Saturación o bloqueo en el router Wi-Fi (se recomienda desconectarlo de la corriente 30 segundos y encenderlo nuevamente).
3. Problemas de alcance o interferencia en la red inalámbrica Wi-Fi.

_Fibex Telecom, sede Anaco_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_falla_abrir_ticket', title: 'Continuar Reporte' } },
            { type: 'reply', reply: { id: 'btn_menu_principal', title: 'Menú Principal' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP DIAGNOSTICO OPTIMO ERROR]:', err);
  }
}

// 6. Notificación de Refresco Realizado con Nuevos Niveles
export async function enviarConfirmacionRefresco(toPhone, info) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  const potencia = info.diagnostico?.potencia || 'N/D';
  const status = info.diagnostico?.status || 'Online';

  const texto =
`*REINICIO / REFRESCO DE EQUIPO*

Comando de refresco y re-sincronización enviado satisfactoriamente a la ONT.

Estatus actualizado: *${status}*
Potencia actual: *${potencia}*

Por favor espere unos instantes mientras se estabilizan los parámetros. Si el inconveniente persiste, puede generar el reporte técnico.

_Fibex Telecom, sede Anaco_`;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_falla_abrir_ticket', title: 'Abrir Reporte' } },
            { type: 'reply', reply: { id: 'btn_menu_principal', title: 'Menú Principal' } }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP CONFIRMACION REFRESCO ERROR]:', err);
  }
}

// 7. Lista interactiva de Tipos de Falla Técnica
export async function enviarMenuTiposFalla(toPhone) {
  const { accessToken, phoneNumberId } = getCredentials();
  if (!accessToken) return;

  try {
    return await apiPost(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Reporte de Falla' },
        body: { text: 'Selecciona la opción que describe el problema en tu servicio:' },
        footer: { text: 'Fibex Telecom, sede Anaco' },
        action: {
          button: 'Ver fallas',
          sections: [
            {
              title: 'Tipo de falla',
              rows: [
                { id: 'falla_luz_roja',      title: 'Luz roja en equipo', description: 'El módem tiene el LED LOS en rojo' },
                { id: 'falla_intermitencia', title: 'Intermitencia',      description: 'El servicio se cae y vuelve' },
                { id: 'falla_lento',         title: 'Internet lento',     description: 'Velocidad menor a la contratada' },
                { id: 'falla_paginas',       title: 'No cargan páginas',  description: 'Algunos sitios no abren' },
                { id: 'falla_sin_datos',     title: 'Sin navegación',     description: 'Conectado a Wi-Fi pero sin datos' }
              ]
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[WHATSAPP MENU FALLAS ERROR]:', err);
  }
}
