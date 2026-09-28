import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search, User } from 'lucide-react-native';
import { InputTexto } from '../venta/CamposVenta';
import { ConsultaFacturasSaeResponse, FacturaSaeItem } from './types';
import { FacturaCardItem } from './FacturaCardItem';

export function WhatsAppFacturasSae() {
  const [cedulaInput, setCedulaInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<ConsultaFacturasSaeResponse | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);

  const consultarFacturas = async () => {
    const cedulaLimpia = cedulaInput.replace(/\D/g, '').trim();
    if (!cedulaLimpia) {
      setErrorMensaje('Por favor ingrese un número de cédula válido.');
      return;
    }

    setBuscando(true);
    setErrorMensaje(null);
    setResultado(null);

    try {
      const res = await fetch(`/api/facturas_sae?accion=consultar&cedula=${encodeURIComponent(cedulaLimpia)}`);
      const data: ConsultaFacturasSaeResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorMensaje(data.error || 'No se pudieron consultar las facturas en SAEplus.');
      } else {
        setResultado(data);
        if (!data.facturas || data.facturas.length === 0) {
          setErrorMensaje('No se encontraron facturas o avisos de cobro oficiales para esta cédula.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor.';
      setErrorMensaje(msg);
    } finally {
      setBuscando(false);
    }
  };

  const descargarFactura = (item: FacturaSaeItem) => {
    setDescargandoId(item.idPago);
    try {
      const downloadUrl = `/api/facturas_sae?accion=descargar&idPago=${encodeURIComponent(
        item.idPago
      )}&formato=${encodeURIComponent(item.archivoFormatoFactura)}&nroFactura=${encodeURIComponent(
        item.nroFactura
      )}`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = `Factura_Fibex_${item.nroFactura}.pdf`;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        Linking.openURL(downloadUrl).catch(() => {
          Alert.alert('Error', 'No se pudo abrir el enlace de descarga de la factura.');
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar descarga';
      Alert.alert('Descarga', msg);
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tarjetaBusqueda}>
        <Text style={styles.tituloSeccion}>CONSULTA DE FACTURAS ORIGINALES SAEPLUS</Text>
        <Text style={styles.descripcionSeccion}>
          Descarga las facturas originales en PDF con sello fiscal y aviso de cobro para trámites administrativos y confirmaciones en taquilla.
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
            onPress={consultarFacturas}
            disabled={buscando}
          >
            {buscando ? (
              <ActivityIndicator size="small" color="#1D2125" />
            ) : (
              <>
                <Search size={16} color="#1D2125" />
                <Text style={styles.botonBuscarText}>BUSCAR</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {errorMensaje && (
          <View style={styles.contenedorError}>
            <Text style={styles.textoError}>{errorMensaje}</Text>
          </View>
        )}
      </View>

      {resultado && resultado.facturas && resultado.facturas.length > 0 && (
        <View style={styles.resumenClienteCard}>
          <View style={styles.resumenHeader}>
            <User size={16} color="#B6C2CF" />
            <Text style={styles.resumenNombre}>
              {resultado.cliente || 'CLIENTE REGISTRADO'}
            </Text>
          </View>
          <View style={styles.resumenDetalles}>
            <Text style={styles.resumenMeta}>CÉDULA: {resultado.cedula}</Text>
            {resultado.nroContrato && (
              <Text style={styles.resumenMeta}>CONTRATO: {resultado.nroContrato}</Text>
            )}
            <Text style={styles.resumenMeta}>
              TOTAL FACTURAS: {resultado.totalFacturas || resultado.facturas.length}
            </Text>
          </View>
        </View>
      )}

      {resultado && resultado.facturas && resultado.facturas.length > 0 && (
        <FlatList
          data={resultado.facturas}
          keyExtractor={(item) => item.idPago || item.nroFactura}
          renderItem={({ item }) => (
            <FacturaCardItem
              item={item}
              estaDescargando={descargandoId === item.idPago}
              onDescargar={descargarFactura}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1D2125',
  },
  tarjetaBusqueda: {
    backgroundColor: '#2C333A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
    marginBottom: 16,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  descripcionSeccion: {
    fontSize: 12,
    color: '#8C9BAB',
    marginBottom: 16,
    lineHeight: 18,
  },
  filaFormulario: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  botonBuscar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#A0B2C6',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 6,
    marginBottom: 12,
  },
  botonBuscarText: {
    color: '#1D2125',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contenedorError: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#22272B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
  },
  textoError: {
    color: '#B6C2CF',
    fontSize: 12,
  },
  resumenClienteCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 12,
    marginBottom: 16,
  },
  resumenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  resumenNombre: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resumenDetalles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  resumenMeta: {
    fontSize: 11,
    color: '#8C9BAB',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
});
