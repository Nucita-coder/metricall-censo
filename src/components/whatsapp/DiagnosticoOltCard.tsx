import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  DollarSign,
  Radio,
  RefreshCw,
  Server,
  User,
  Wifi,
} from 'lucide-react-native';
import { DiagnosticoOltResponse } from './types';
import { styles } from './diagnosticoOltStyles';

interface DiagnosticoOltCardProps {
  resultado: DiagnosticoOltResponse;
  refrescando: boolean;
  ultimaActualizacion: string | null;
  onRefrescar: () => void;
}

export function DiagnosticoOltCard({
  resultado,
  refrescando,
  ultimaActualizacion,
  onRefrescar,
}: DiagnosticoOltCardProps) {
  const diag = resultado.diagnostico;
  const isOnline = diag?.esOnline ?? false;
  const isDegradada = diag?.esDegradada ?? false;

  return (
    <View style={styles.panelResultados}>
      {/* Ficha del Abonado */}
      <View style={styles.tarjetaInfo}>
        <View style={styles.cardHeader}>
          <View style={styles.rowAlign}>
            <User size={16} color="#B6C2CF" />
            <Text style={styles.cardHeaderTitle}>
              {resultado.cliente?.nombreCompleto || 'ABONADO'}
            </Text>
          </View>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>
              {resultado.contrato?.plan || 'HOGAR'}
            </Text>
          </View>
        </View>

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

        {/* Estatus Administrativo */}
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
      </View>

      {/* Ficha del Equipo y Telemetría OLT */}
      <View style={styles.tarjetaInfo}>
        <View style={styles.cardHeader}>
          <View style={styles.rowAlign}>
            <Server size={16} color="#B6C2CF" />
            <Text style={styles.cardHeaderTitle}>EQUIPO ONT & OLT CENTRAL</Text>
          </View>
          {resultado.equipo?.id_es && (
            <TouchableOpacity
              style={styles.botonRefrescar}
              onPress={onRefrescar}
              disabled={refrescando}
            >
              {refrescando ? (
                <ActivityIndicator size="small" color="#B6C2CF" />
              ) : (
                <>
                  <RefreshCw size={13} color="#B6C2CF" />
                  <Text style={styles.botonRefrescarText}>REFRESCAR</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {resultado.equipo ? (
          <>
            <View style={styles.detallesGrid}>
              <View style={styles.detalleItem}>
                <Text style={styles.detalleLabel}>MODELO</Text>
                <Text style={styles.detalleValor}>{resultado.equipo.modelo}</Text>
              </View>
              <View style={styles.detalleItem}>
                <Text style={styles.detalleLabel}>SERIAL (PON SN)</Text>
                <Text style={styles.detalleValor}>{resultado.equipo.codigo_es}</Text>
              </View>
              <View style={styles.detalleItem}>
                <Text style={styles.detalleLabel}>CENTRAL OLT</Text>
                <Text style={styles.detalleValor}>{resultado.equipo.sistema || 'SMARTOLT'}</Text>
              </View>
              <View style={styles.detalleItem}>
                <Text style={styles.detalleLabel}>MARCA</Text>
                <Text style={styles.detalleValor}>{resultado.equipo.marca}</Text>
              </View>
            </View>

            {/* Telemetría en Tiempo Real */}
            <View style={styles.telemetriaContainer}>
              <View style={styles.telemetriaRow}>
                <View style={styles.telemetriaItem}>
                  <View style={styles.rowAlign}>
                    <Radio size={14} color="#8C9BAB" />
                    <Text style={styles.detalleLabel}>ESTADO ONT</Text>
                  </View>
                  <View
                    style={[
                      styles.pillBadge,
                      isOnline ? styles.pillBadgeActivo : styles.pillBadgeAlerta,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        isOnline ? styles.pillBadgeTextActivo : styles.pillBadgeTextAlerta,
                      ]}
                    >
                      {diag?.status ? diag.status.toUpperCase() : 'DESCONOCIDO'}
                    </Text>
                  </View>
                </View>

                <View style={styles.telemetriaItem}>
                  <View style={styles.rowAlign}>
                    <Activity size={14} color="#8C9BAB" />
                    <Text style={styles.detalleLabel}>POTENCIA ÓPTICA</Text>
                  </View>
                  <Text style={styles.potenciaValor}>
                    {diag?.potencia || 'N/D'}
                  </Text>
                </View>

                <View style={styles.telemetriaItem}>
                  <View style={styles.rowAlign}>
                    <Wifi size={14} color="#8C9BAB" />
                    <Text style={styles.detalleLabel}>CALIDAD SEÑAL</Text>
                  </View>
                  <View
                    style={[
                      styles.pillBadge,
                      isDegradada ? styles.pillBadgeAlerta : styles.pillBadgeNeutral,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        isDegradada && styles.pillBadgeTextAlerta,
                      ]}
                    >
                      {diag?.nivel ? diag.nivel.toUpperCase() : 'NORMAL'}
                    </Text>
                  </View>
                </View>
              </View>

              {ultimaActualizacion && (
                <Text style={styles.actualizacionTexto}>
                  Última lectura: {ultimaActualizacion}
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.sinEquipoContainer}>
            <Text style={styles.sinEquipoTexto}>
              No se encuentra una ONT asignada a este contrato en SAEplus.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
