import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  HardDrive,
  Laptop,
  Power,
  Radio,
  RefreshCw,
  Server,
  Wifi,
  X,
} from 'lucide-react-native';
import { DiagnosticoOltHost, DiagnosticoOltResponse, DiagnosticoOltWifi } from './types';
import { styles } from './diagnosticoOltStyles';

interface DiagnosticoOltEquipoCardProps {
  resultado: DiagnosticoOltResponse;
  refrescando: boolean;
  ultimaActualizacion: string | null;
  onRefrescar: () => void;
}

export function DiagnosticoOltEquipoCard({
  resultado,
  refrescando,
  ultimaActualizacion,
  onRefrescar,
}: DiagnosticoOltEquipoCardProps) {
  const [ejecutandoAccion, setEjecutandoAccion] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitulo, setModalTitulo] = useState('');
  const [wifiData, setWifiData] = useState<DiagnosticoOltWifi | null>(null);
  const [hostsData, setHostsData] = useState<DiagnosticoOltHost[]>([]);
  const [mensajeModal, setMensajeModal] = useState<string | null>(null);

  const eq = resultado.equipo;
  const diag = resultado.diagnostico;
  const rf = eq?.redFisica;
  const isOnline = diag?.esOnline ?? false;
  const isDegradada = diag?.esDegradada ?? false;

  const ejecutarAccionRemota = async (tipo: 'reboot' | 'wifi' | 'dispositivos') => {
    if (!eq?.id_tse || !eq?.codigo_es) {
      Alert.alert('Aviso', 'El equipo no cuenta con identificador de sistema para asistencia remota.');
      return;
    }

    setEjecutandoAccion(tipo);
    setMensajeModal(null);
    setWifiData(null);
    setHostsData([]);

    try {
      const url = `/api/diagnostico_olt?accion=${tipo}&id_tse=${encodeURIComponent(eq.id_tse)}&codigo_es=${encodeURIComponent(eq.codigo_es)}&id_contrato=${encodeURIComponent(resultado.contrato?.idContrato || '')}`;
      const res = await fetch(url);
      const data: { success: boolean; sinPermiso?: boolean; error?: string; message?: string; wifi?: DiagnosticoOltWifi; dispositivos?: DiagnosticoOltHost[] } = await res.json();

      if (data.sinPermiso) {
        setModalTitulo('Control Remoto Restringido');
        setMensajeModal(data.error || 'Permiso restringido en el rol de SAEplus para este módulo.');
        setModalVisible(true);
        return;
      }

      if (tipo === 'reboot') {
        Alert.alert('Reinicio ONT', data.message || (data.success ? 'Comando enviado con éxito a la ONT.' : 'Error al reiniciar ONT.'));
      } else if (tipo === 'wifi') {
        setModalTitulo('Parámetros Wi-Fi de la ONT');
        setWifiData(data.wifi || null);
        if (!data.wifi) setMensajeModal(data.message || 'No se obtuvieron credenciales Wi-Fi.');
        setModalVisible(true);
      } else if (tipo === 'dispositivos') {
        setModalTitulo('Dispositivos Conectados en la Casa');
        setHostsData(data.dispositivos || []);
        if (!data.dispositivos || data.dispositivos.length === 0) setMensajeModal('No se detectaron hosts o dispositivos activos en la LAN del módem.');
        setModalVisible(true);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al conectar con la central.');
    } finally {
      setEjecutandoAccion(null);
    }
  };

  if (!eq) {
    return (
      <View style={styles.tarjetaInfo}>
        <View style={styles.sinEquipoContainer}>
          <Text style={styles.sinEquipoTexto}>
            No se encuentra una ONT asignada a este contrato en SAEplus.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tarjetaInfo}>
      {/* Encabezado Equipo & OLT */}
      <View style={styles.cardHeader}>
        <View style={styles.rowAlign}>
          <Server size={16} color="#B6C2CF" />
          <Text style={styles.cardHeaderTitle}>EQUIPO ONT & INGENIERÍA GPON</Text>
        </View>
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
      </View>

      {/* Grid de Ingeniería de Red */}
      <View style={styles.detallesGrid}>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>CENTRAL OLT</Text>
          <Text style={styles.detalleValor}>{eq.sistema || 'SMARTOLT'}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>TARJETA / PUERTO</Text>
          <Text style={styles.detalleValor}>
            {rf?.board ? `Board ${rf.board} / Port ${rf.port}` : 'N/D'}
          </Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>MODELO & MARCA</Text>
          <Text style={styles.detalleValor}>{eq.modelo} ({eq.marca})</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>SERIAL (PON SN)</Text>
          <Text style={styles.detalleValor}>{eq.codigo_es}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>VLAN / SVLAN</Text>
          <Text style={styles.detalleValor}>{rf?.vlan ? `${rf.vlan} / ${rf.svlan}` : 'N/D'}</Text>
        </View>
        <View style={styles.detalleItem}>
          <Text style={styles.detalleLabel}>MODO ONT</Text>
          <Text style={styles.detalleValor}>{rf?.onuMode || 'Bridging'}</Text>
        </View>
      </View>

      {/* Telemetría Óptica en Tiempo Real */}
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
              <Text style={styles.detalleLabel}>POTENCIA GLOBAL</Text>
            </View>
            <Text style={styles.potenciaValor}>{diag?.potencia || 'N/D'}</Text>
          </View>

          <View style={styles.telemetriaItem}>
            <View style={styles.rowAlign}>
              <ArrowUpRight size={14} color="#8C9BAB" />
              <Text style={styles.detalleLabel}>SUBIDA (1310nm)</Text>
            </View>
            <Text style={styles.potenciaValor}>{diag?.potencia1310 || 'N/D'}</Text>
          </View>

          <View style={styles.telemetriaItem}>
            <View style={styles.rowAlign}>
              <ArrowDownLeft size={14} color="#8C9BAB" />
              <Text style={styles.detalleLabel}>BAJADA (1490nm)</Text>
            </View>
            <Text style={styles.potenciaValor}>{diag?.potencia1490 || 'N/D'}</Text>
          </View>
        </View>

        {ultimaActualizacion && (
          <Text style={styles.actualizacionTexto}>Última lectura: {ultimaActualizacion}</Text>
        )}
      </View>

      {/* Gráfica de Atenuación Óptica Histórica */}
      {diag?.graficaBase64 && (
        <View style={styles.graficaContainer}>
          <View style={styles.graficaHeader}>
            <Text style={styles.graficaTitulo}>HISTORIAL DE ESTABILIDAD ÓPTICA (SMARTOLT)</Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>TELEMETRÍA GPON</Text>
            </View>
          </View>
          <Image
            source={{ uri: `data:image/png;base64,${diag.graficaBase64}` }}
            style={styles.graficaImagen}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Barra de Herramientas de Asistencia Remota */}
      <View style={styles.barraAcciones}>
        <TouchableOpacity
          style={styles.botonAccion}
          onPress={() => ejecutarAccionRemota('reboot')}
          disabled={Boolean(ejecutandoAccion)}
        >
          {ejecutandoAccion === 'reboot' ? (
            <ActivityIndicator size="small" color="#B6C2CF" />
          ) : (
            <>
              <Power size={14} color="#B6C2CF" />
              <Text style={styles.botonAccionText}>REINICIAR ONT</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonAccion}
          onPress={() => ejecutarAccionRemota('wifi')}
          disabled={Boolean(ejecutandoAccion)}
        >
          {ejecutandoAccion === 'wifi' ? (
            <ActivityIndicator size="small" color="#B6C2CF" />
          ) : (
            <>
              <Wifi size={14} color="#B6C2CF" />
              <Text style={styles.botonAccionText}>AUDITAR WI-FI</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonAccion}
          onPress={() => ejecutarAccionRemota('dispositivos')}
          disabled={Boolean(ejecutandoAccion)}
        >
          {ejecutandoAccion === 'dispositivos' ? (
            <ActivityIndicator size="small" color="#B6C2CF" />
          ) : (
            <>
              <Laptop size={14} color="#B6C2CF" />
              <Text style={styles.botonAccionText}>DISPOSITIVOS LAN</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Respuestas Técnicas */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{modalTitulo}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={18} color="#B6C2CF" />
              </TouchableOpacity>
            </View>

            {mensajeModal && <Text style={styles.textoError}>{mensajeModal}</Text>}

            {wifiData && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <View style={styles.auditoriaFila}>
                  <Text style={styles.auditoriaLabel}>SSID 2.4 GHz:</Text>
                  <Text style={styles.auditoriaValor}>{wifiData.wifi_ssid_24 || 'N/D'}</Text>
                </View>
                <View style={styles.auditoriaFila}>
                  <Text style={styles.auditoriaLabel}>Clave 2.4 GHz:</Text>
                  <Text style={styles.auditoriaValor}>{wifiData.wifi_password_24 || '******'}</Text>
                </View>
                <View style={styles.auditoriaFila}>
                  <Text style={styles.auditoriaLabel}>SSID 5.8 GHz:</Text>
                  <Text style={styles.auditoriaValor}>{wifiData.wifi_ssid_58 || 'N/D'}</Text>
                </View>
                <View style={styles.auditoriaFila}>
                  <Text style={styles.auditoriaLabel}>Clave 5.8 GHz:</Text>
                  <Text style={styles.auditoriaValor}>{wifiData.wifi_password_58 || '******'}</Text>
                </View>
              </View>
            )}

            {hostsData.length > 0 && (
              <View style={{ gap: 6, marginTop: 8 }}>
                {hostsData.map((h, idx) => (
                  <View key={idx} style={styles.auditoriaFila}>
                    <Text style={styles.auditoriaLabel}>{h.hostname || `Dispositivo ${idx + 1}`}</Text>
                    <Text style={styles.auditoriaValor}>{h.ip || h.mac || 'Conectado'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
