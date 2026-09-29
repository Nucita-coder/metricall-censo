import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Search } from 'lucide-react-native';
import { InputTexto } from '../venta/CamposVenta';
import { DiagnosticoOltResponse, DiagnosticoOltSmartOlt } from './types';
import { DiagnosticoOltCard } from './DiagnosticoOltCard';
import { DiagnosticoOltEquipoCard } from './DiagnosticoOltEquipoCard';
import { styles } from './diagnosticoOltStyles';

export function WhatsAppDiagnosticoOlt() {
  const [cedulaInput, setCedulaInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoOltResponse | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);

  const consultarDiagnostico = async () => {
    const cedulaLimpia = cedulaInput.replace(/\D/g, '').trim();
    if (!cedulaLimpia) {
      setErrorMensaje('Por favor ingrese un número de cédula válido.');
      return;
    }

    setBuscando(true);
    setErrorMensaje(null);
    setResultado(null);
    setUltimaActualizacion(null);

    try {
      const res = await fetch(`/api/diagnostico_olt?accion=consultar&cedula=${encodeURIComponent(cedulaLimpia)}`);
      const data: DiagnosticoOltResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorMensaje(data.error || 'No se pudo consultar el diagnóstico en la central.');
      } else if (!data.encontrado) {
        setErrorMensaje(`No se encontró ningún abonado con la cédula ${cedulaLimpia} en SAEplus.`);
      } else {
        setResultado(data);
        setUltimaActualizacion(new Date().toLocaleTimeString());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor.';
      setErrorMensaje(msg);
    } finally {
      setBuscando(false);
    }
  };

  const refrescarSenal = async () => {
    if (!resultado?.equipo?.id_es) return;
    setRefrescando(true);
    setErrorMensaje(null);

    try {
      const res = await fetch(
        `/api/diagnostico_olt?accion=refrescar&id_es=${encodeURIComponent(resultado.equipo.id_es)}`
      );
      const data: { success: boolean; diagnostico?: DiagnosticoOltSmartOlt; error?: string } = await res.json();

      if (res.ok && data.success && data.diagnostico) {
        setResultado((prev) => (prev ? { ...prev, diagnostico: data.diagnostico } : prev));
        setUltimaActualizacion(new Date().toLocaleTimeString());
      } else {
        setErrorMensaje(data.error || 'No se pudo actualizar la lectura de la OLT.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con la central.';
      setErrorMensaje(msg);
    } finally {
      setRefrescando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Tarjeta de Búsqueda */}
      <View style={styles.tarjetaBusqueda}>
        <Text style={styles.tituloSeccion}>DIAGNÓSTICO TÉCNICO & OLT EN TIEMPO REAL</Text>
        <Text style={styles.descripcionSeccion}>
          Consulta el estado administrativo en SAEplus y telemetría óptica de la ONT directamente en la OLT central.
        </Text>

        <View style={styles.filaFormulario}>
          <View style={{ flex: 1 }}>
            <InputTexto
              label="Cédula de Identidad"
              value={cedulaInput}
              onChangeText={setCedulaInput}
              placeholder="Ej: 11000126"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.botonBuscar}
            onPress={consultarDiagnostico}
            disabled={buscando}
          >
            {buscando ? (
              <ActivityIndicator size="small" color="#1D2125" />
            ) : (
              <>
                <Search size={16} color="#1D2125" />
                <Text style={styles.botonBuscarText}>CONSULTAR</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {errorMensaje && (
          <View style={styles.contenedorError}>
            <AlertTriangle size={14} color="#B6C2CF" />
            <Text style={styles.textoError}>{errorMensaje}</Text>
          </View>
        )}
      </View>

      {/* Resultados de Diagnóstico */}
      {resultado && resultado.encontrado && (
        <View style={styles.panelResultados}>
          <DiagnosticoOltCard resultado={resultado} />
          <DiagnosticoOltEquipoCard
            resultado={resultado}
            refrescando={refrescando}
            ultimaActualizacion={ultimaActualizacion}
            onRefrescar={refrescarSenal}
          />
        </View>
      )}
    </ScrollView>
  );
}
