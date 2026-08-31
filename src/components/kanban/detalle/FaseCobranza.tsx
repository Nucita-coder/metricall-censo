import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { KANBAN_COLORS, getResultadoColor } from '../../../constants/theme';
import { FaseProps, findListaTarget } from './types';
import { PhoneCall, CheckCircle2, History, XCircle, Hourglass } from 'lucide-react-native';

export const OPCIONES_TIPO_CONTACTO_COBRANZA = [
  'LLAMADA TELEFONICA',
  'MENSAJE WHATSAPP',
  'MENSAJE TEXTO',
  'CORREO',
  'VISITA RESIDENCIAL',
];

// ✅ POSITIVOS → mueven a "Acción efectiva"
export const OPCIONES_RESULTADO_COBRANZA = [
  // --- ACCIÓN EFECTIVA (7 opciones) ---
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'NO CONTESTO',
  'LUEGO PASA POR OFIC',
  'PIDE AJUSTE DE PLAN',
  // --- ACCIÓN NEGATIVA (10 opciones) ---
  'FUERA DE ZONA',
  'PIDE RETIRO',
  'RECHAZO A PAGAR POR DIAS SIN SERVICIO',
  'TIENE FALLA',
  'INCONFORMIDAD CON MONTO',
  'NO RECONOCE DEUDA',
  'REHUSA ENTREGAR EQUIPO',
  'PUERTO LIBERADO',
  'TIENE OTRO SERVICIO',
  'NO DESEA PAGAR',
];

// Positivos → Auto-mover a "Acción efectiva"
export const RESULTADOS_EFECTIVOS = [
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'NO CONTESTO',
  'LUEGO PASA POR OFIC',
  'PIDE AJUSTE DE PLAN',
];

// Negativos → Auto-mover a "Acción negativa" (todo lo que NO está en RESULTADOS_EFECTIVOS)

export function FaseCobranza({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  listasGlobales,
  isSaving,
  setIsSaving,
}: FaseProps) {
  const datos = tarjeta.datos_valores || {};

  const [tipoContacto, setTipoContacto] = useState<string>(
    datos.tipoContacto || datos['TIPO DE CONTACTO'] || ''
  );
  const [resultado, setResultado] = useState<string>(
    datos.resultadoContacto || datos.resultado || datos['RESULTADO'] || ''
  );

  const gestionesPrevias: any[] = datos.gestionesCobranza || [];

  const handleRegistrarGestionCobranza = async () => {
    if (!tipoContacto || !resultado) {
      Alert.alert(
        'Campos Incompletos',
        'Por favor selecciona el Tipo de Contacto y el Resultado antes de registrar.'
      );
      return;
    }

    const adjuntos = datos.adjuntos || [];
    if (!Array.isArray(adjuntos) || adjuntos.length === 0) {
      Alert.alert(
        'Evidencia Obligatoria',
        'Es obligatorio adjuntar al menos una imagen como evidencia en la sección "Archivos Adjuntos" antes de registrar el resultado de contacto.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const nuevaGestion = {
        fecha: new Date().toISOString(),
        tipoContacto,
        resultado,
        autor: datos.asesorComercial || 'Analista de Cobranza',
      };

      const updatedGestiones = [...gestionesPrevias, nuevaGestion];

      const updates: any = {
        tipoContacto,
        resultadoContacto: resultado,
        'TIPO DE CONTACTO': tipoContacto,
        RESULTADO: resultado,
        gestionesCobranza: updatedGestiones,
        adjuntosRegistrados: true,
      };

      await onUpdateTarjeta(updates);

      // Determinar si la tarjeta pertenece al flujo de Recupero o de Cobranza
      const listaActual = listasGlobales?.find(l => l.id === tarjeta.lista_id);
      const nombreListaActual = (listaActual?.nombre || '').toLowerCase();
      const esFlujoRecupero = nombreListaActual.includes('recupero');

      const nombreTargetEfectiva = esFlujoRecupero ? 'Acción efectiva (Recupero)' : 'Acción efectiva';
      const nombreTargetNegativa = esFlujoRecupero ? 'Acción negativa (Recupero)' : 'Acción negativa';

      // Auto-mover tarjeta según el resultado a la lista correspondiente de su flujo
      if (RESULTADOS_EFECTIVOS.includes(resultado)) {
        const listaDestino = findListaTarget(listasGlobales, nombreTargetEfectiva);
        if (listaDestino && listaDestino.id !== tarjeta.lista_id) {
          await autoMoverTarjeta(tarjeta, listaDestino.id);
        }
      } else {
        const listaDestino = findListaTarget(listasGlobales, nombreTargetNegativa);
        if (listaDestino && listaDestino.id !== tarjeta.lista_id) {
          await autoMoverTarjeta(tarjeta, listaDestino.id);
        }
      }

      Alert.alert('¡Gestión Registrada!', `Se guardó correctamente: ${resultado}`);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo guardar la gestión de cobranza: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const esReportePago = Boolean(
    datos.comprobantePagoUrl ||
    datos.bancoOrigen ||
    datos.montoPago ||
    (datos.estadoCobranza && ['Pago Procesado', 'Pago Rechazado', 'Pago Pendiente Revisión', 'Pendiente Verificación'].includes(datos.estadoCobranza))
  );

  const estadoPagoActual = datos.estadoCobranza || 'Pago Pendiente Revisión';

  const handleCambiarEstadoPago = async (nuevoEstado: string) => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoCobranza: nuevoEstado,
        estadoGestion: nuevoEstado.toLowerCase().replace(/\s+/g, '_'),
        fechaUltimaGestionPago: new Date().toISOString(),
      });
      Alert.alert('Estatus Actualizado', `El pago ahora está marcado como: ${nuevoEstado}`);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cambiar el estado de pago: ' + e?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.cardSection}>
      {/* ── SECCIÓN DE ESTADO DE PAGO (Solo si la tarjeta es un reporte de pago real) ────── */}
      {esReportePago && (
        <View style={{
          backgroundColor: '#161A1D',
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#384148',
        }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B6C2CF', marginBottom: 8 }}>
            Estatus del Pago:
          </Text>

          {/* Badge de Estatus Actual */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
            marginBottom: 12,
            backgroundColor:
              estadoPagoActual === 'Pago Procesado' ? KANBAN_COLORS.badge.pagoProcesado.bg :
              estadoPagoActual === 'Pago Rechazado' ? KANBAN_COLORS.badge.pagoRechazado.bg : KANBAN_COLORS.badge.pagoPendiente.bg,
            borderWidth: 1,
            borderColor:
              estadoPagoActual === 'Pago Procesado' ? 'rgba(34, 197, 94, 0.3)' :
              estadoPagoActual === 'Pago Rechazado' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          }}>
            {estadoPagoActual === 'Pago Procesado' && <CheckCircle2 size={16} color={KANBAN_COLORS.badge.pagoProcesado.text} />}
            {estadoPagoActual === 'Pago Rechazado' && <XCircle size={16} color={KANBAN_COLORS.badge.pagoRechazado.text} />}
            {estadoPagoActual !== 'Pago Procesado' && estadoPagoActual !== 'Pago Rechazado' && <Hourglass size={16} color={KANBAN_COLORS.badge.pagoPendiente.text} />}
            <Text style={{
              fontWeight: '900',
              fontSize: 13,
              color:
                estadoPagoActual === 'Pago Procesado' ? KANBAN_COLORS.badge.pagoProcesado.text :
                estadoPagoActual === 'Pago Rechazado' ? KANBAN_COLORS.badge.pagoRechazado.text : KANBAN_COLORS.badge.pagoPendiente.text,
            }}>
              {estadoPagoActual}
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: '#8C9BAB', marginBottom: 10 }}>
            Selecciona una acción para este pago:
          </Text>

          {/* Botones de Cambio de Estado de Pago */}
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: estadoPagoActual === 'Pago Procesado' ? '#15803D' : '#2C333A',
                borderWidth: 1,
                borderColor: '#22C55E',
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={() => handleCambiarEstadoPago('Pago Procesado')}
              disabled={isSaving}
            >
              <CheckCircle2 size={16} color="#22C55E" />
              <Text style={{ color: '#22C55E', fontWeight: 'bold', fontSize: 13 }}>
                Pago Procesado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: estadoPagoActual === 'Pago Rechazado' ? '#991B1B' : '#2C333A',
                borderWidth: 1,
                borderColor: '#EF4444',
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={() => handleCambiarEstadoPago('Pago Rechazado')}
              disabled={isSaving}
            >
              <XCircle size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>
                Pago Rechazado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: estadoPagoActual === 'Pago Pendiente Revisión' ? '#854D0E' : '#2C333A',
                borderWidth: 1,
                borderColor: '#EAB308',
                borderRadius: 8,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={() => handleCambiarEstadoPago('Pago Pendiente Revisión')}
              disabled={isSaving}
            >
              <Hourglass size={14} color="#EAB308" />
              <Text style={{ color: '#EAB308', fontWeight: 'bold', fontSize: 12 }}>
                Pago Pendiente Revisión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <PhoneCall size={18} color="#90CDF4" />
        <Text style={styles.sectionTitle}>Gestión de Cobranza / Contacto</Text>
      </View>

      <View style={styles.formContainer}>
        {/* SELECTOR 1: TIPO DE CONTACTO */}
        <SelectDropdown
          label="TIPO DE CONTACTO"
          value={tipoContacto}
          onSelect={(v) => setTipoContacto(v)}
          options={OPCIONES_TIPO_CONTACTO_COBRANZA}
          placeholder="Seleccione tipo de contacto..."
          isRequired
          disabled={isSaving}
        />

        {/* SELECTOR 2: RESULTADO */}
        <SelectDropdown
          label="RESULTADO"
          value={resultado}
          onSelect={(v) => setResultado(v)}
          options={OPCIONES_RESULTADO_COBRANZA}
          placeholder="Seleccione resultado de gestión..."
          isRequired
          disabled={isSaving}
        />

        {!(Array.isArray(datos.adjuntos) && datos.adjuntos.length > 0) && (
          <Text style={{ fontSize: 11, color: '#F87171', marginTop: 4, fontStyle: 'italic' }}>
            * Es obligatorio adjuntar al menos 1 imagen como evidencia en "Archivos Adjuntos"
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.btnGuardar,
            (!tipoContacto || !resultado || isSaving) && styles.btnDisabled,
          ]}
          onPress={handleRegistrarGestionCobranza}
          disabled={!tipoContacto || !resultado || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#1D2125" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#1D2125" />
              <Text style={styles.btnGuardarText}>Registrar Resultado de Contacto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* HISTORIAL DE GESTIONES */}
      {gestionesPrevias.length > 0 && (
        <View style={styles.historialContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <History size={14} color="#8C9BAB" />
            <Text style={styles.historialTitle}>Historial de Contactos ({gestionesPrevias.length})</Text>
          </View>
          {gestionesPrevias.map((g, idx) => (
            <View key={idx} style={styles.historialItem}>
              <Text style={styles.historialFecha}>
                {new Date(g.fecha).toLocaleString()}
              </Text>
              <Text style={styles.historialTxt}>
                • Contacto: <Text style={{ color: '#90CDF4' }}>{g.tipoContacto}</Text>
              </Text>
              <Text style={styles.historialTxt}>
                • Resultado:{' '}
                <Text style={{ color: getResultadoColor(g.resultado).text, fontWeight: 'bold' }}>
                  {g.resultado}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSection: {
    backgroundColor: '#1D2125',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  formContainer: {
    gap: 4,
  },
  btnGuardar: {
    backgroundColor: '#4ADE80',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGuardarText: {
    color: '#1D2125',
    fontWeight: 'bold',
    fontSize: 15,
  },
  historialContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  historialTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  historialItem: {
    backgroundColor: '#2C333A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  historialFecha: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 4,
  },
  historialTxt: {
    fontSize: 12,
    color: '#B6C2CF',
  },
});
