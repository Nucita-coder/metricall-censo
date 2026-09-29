import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Gauge,
  Ticket,
  User,
} from 'lucide-react-native';
import { DiagnosticoOltResponse } from './types';
import { styles } from './diagnosticoOltStyles';

interface DiagnosticoOltCardProps {
  resultado: DiagnosticoOltResponse;
}

export function DiagnosticoOltCard({ resultado }: DiagnosticoOltCardProps) {
  const [generandoTicket, setGenerandoTicket] = useState(false);
  const [ticketMensaje, setTicketMensaje] = useState<string | null>(null);

  const planComercial = resultado.contrato?.plan || 'HOGAR';
  const velocidadOlt = resultado.equipo?.redFisica?.velocidadOlt || 'N/D';
  const board = resultado.equipo?.redFisica?.board || 'N/D';
  const port = resultado.equipo?.redFisica?.port || 'N/D';
  const oltNombre = resultado.equipo?.sistema || 'CENTRAL OLT';
  const statusOnt = resultado.diagnostico?.status || 'DESCONOCIDO';
  const potencia = resultado.diagnostico?.potencia || 'N/D';

  const coincidenPlanes = velocidadOlt !== 'N/D' &&
    (planComercial.toLowerCase().includes('250') && velocidadOlt.includes('250') ||
     planComercial.toLowerCase().includes('500') && velocidadOlt.includes('500') ||
     planComercial.toLowerCase().includes('100') && velocidadOlt.includes('100'));

  const crearTicketTecnico = async () => {
    setGenerandoTicket(true);
    setTicketMensaje(null);

    const tipoFallaFormateada = `[DIAGNÓSTICO OLT] ${statusOnt} (${potencia}) | ${oltNombre} B${board}/P${port} | SN: ${resultado.equipo?.codigo_es || 'S/N'} | Sector: ${resultado.contrato?.sector || 'Anaco'}`;

    try {
      const res = await fetch('/api/diagnostico_olt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear_ticket',
          nombre: resultado.cliente?.nombreCompleto || 'Abonado OLT',
          cedula: resultado.cliente?.cedula || '',
          telefono: resultado.cliente?.telefono || '',
          tipoFalla: tipoFallaFormateada
        })
      });

      const data: { success: boolean; message?: string } = await res.json();
      if (res.ok && data.success) {
        setTicketMensaje('Ticket registrado con éxito en el tablero de Metricall.');
        Alert.alert('Orden Generada', 'Se ha registrado la tarjeta técnica con la telemetría en Metricall.');
      } else {
        setTicketMensaje(data.message || 'No se pudo generar el ticket en Metricall.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Metricall.';
      setTicketMensaje(msg);
    } finally {
      setGenerandoTicket(false);
    }
  };

  return (
    <View style={styles.tarjetaInfo}>
      {/* Encabezado Abonado */}
      <View style={styles.cardHeader}>
        <View style={styles.rowAlign}>
          <User size={16} color="#B6C2CF" />
          <Text style={styles.cardHeaderTitle}>
            {resultado.cliente?.nombreCompleto || 'ABONADO'}
          </Text>
        </View>
        <View style={styles.pillBadge}>
          <Text style={styles.pillBadgeText}>{planComercial}</Text>
        </View>
      </View>

      {/* Datos del Contrato */}
      <View style={styles.detallesGrid}>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>CÉDULA</Text>
          <Text style={styles.detalleValor}>{resultado.cliente?.cedula}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>CONTRATO</Text>
          <Text style={styles.detalleValor}>{resultado.contrato?.nroContrato || 'N/D'}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>SECTOR</Text>
          <Text style={styles.detalleValor}>{resultado.contrato?.sector || 'Anaco'}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>TELÉFONO</Text>
          <Text style={styles.detalleValor}>{resultado.cliente?.telefono || 'N/D'}</Text>
        </View>
      </View>

      {/* Estatus Administrativo y Saldo */}
      <View style={styles.seccionAdmin}>
        <View style={styles.rowAlign}>
          <DollarSign size={14} color="#8C9BAB" />
          <Text style={styles.adminLabel}>ESTATUS ADMINISTRATIVO:</Text>
          <View
            style={[
              styles.pillBadge,
              resultado.contrato?.esSuspendido
                ? styles.pillBadgeAlerta
                : styles.pillBadgeNeutral,
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                resultado.contrato?.esSuspendido && styles.pillBadgeTextAlerta,
              ]}
            >
              {resultado.contrato?.estatus || 'ACTIVO'}
            </Text>
          </View>
        </View>
        <Text style={styles.saldoValor}>
          Saldo: ${resultado.contrato?.saldoPendiente || '0.00'} USD
        </Text>
      </View>

      {/* Pack A: Auditoría de Velocidad (Plan Facturación vs Perfil OLT) */}
      <View style={styles.auditoriaContainer}>
        <View style={styles.auditoriaHeader}>
          <Gauge size={14} color="#B6C2CF" />
          <Text style={styles.auditoriaTitulo}>AUDITORÍA DE VELOCIDAD APROVISIONADA</Text>
        </View>
        <View style={styles.auditoriaFila}>
          <Text style={styles.auditoriaLabel}>Plan Comercial Contratado:</Text>
          <Text style={styles.auditoriaValor}>{planComercial}</Text>
        </View>
        <View style={styles.auditoriaFila}>
          <Text style={styles.auditoriaLabel}>Perfil Aprovisionado en OLT:</Text>
          <Text style={styles.auditoriaValor}>{velocidadOlt}</Text>
        </View>
        <View style={styles.auditoriaFila}>
          <Text style={styles.auditoriaLabel}>Concordancia de Perfil:</Text>
          <View
            style={[
              styles.pillBadge,
              coincidenPlanes ? styles.pillBadgeActivo : styles.pillBadgeNeutral,
            ]}
          >
            <Text style={[styles.pillBadgeText, coincidenPlanes && styles.pillBadgeTextActivo]}>
              {coincidenPlanes ? 'CORRECTO' : 'AUDITAR EN CENTRAL'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pack C: Botón Creación Rápida de Ticket */}
      <TouchableOpacity
        style={styles.botonTicket}
        onPress={crearTicketTecnico}
        disabled={generandoTicket}
      >
        {generandoTicket ? (
          <ActivityIndicator size="small" color="#B6C2CF" />
        ) : (
          <>
            <Ticket size={16} color="#B6C2CF" />
            <Text style={styles.botonTicketText}>CREAR REPORTE TÉCNICO CON DIAGNÓSTICO</Text>
          </>
        )}
      </TouchableOpacity>

      {ticketMensaje && (
        <View style={styles.contenedorError}>
          <CheckCircle2 size={14} color="#B6C2CF" />
          <Text style={styles.textoError}>{ticketMensaje}</Text>
        </View>
      )}
    </View>
  );
}
