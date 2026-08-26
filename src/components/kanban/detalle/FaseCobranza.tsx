import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { getResultadoColor } from '../../../constants/theme';
import { FaseProps, findListaTarget } from './types';
import { PhoneCall, CheckCircle2, History } from 'lucide-react-native';

export const OPCIONES_TIPO_CONTACTO_COBRANZA = [
  'LLAMADA TELEFONICA',
  'MENSAJE WHATSAPP',
  'MENSAJE TEXTO',
  'CORREO',
  'VISITA RESIDENCIAL',
];

// ✅ POSITIVOS → mueven a "Acción efectiva" (Imagen 1)
export const OPCIONES_RESULTADO_COBRANZA = [
  // --- ACCIÓN EFECTIVA (8 opciones) ---
  'COBRO EFECTIVO',
  'CONVENIO DE PAGO',
  'ABONO PARCIALMENTE',
  'RECUPERADO',
  'NO CONTESTO',
  'LUEGO PASA POR OFIC',
  'FUERA DE ZONA',
  'PIDE AJUSTE DE PLAN',
  // --- ACCIÓN NEGATIVA (9 opciones) ---
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
  'FUERA DE ZONA',
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

  return (
    <View style={styles.cardSection}>
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
