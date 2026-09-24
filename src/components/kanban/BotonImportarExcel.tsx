import { Download, FileSpreadsheet } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  importarYReconciliarCobranzaDesdeExcel,
  procesarArchivoExcelBuffer,
} from '../../services/excelImportService';
import { descargarPlantillaCobranza } from '../../services/plantillaCobranzaService';
import { Tarjeta, TarjetaDatosValores } from '../../types/kanban';
import { ModalConfirmarCargaExcel } from './modals/ModalConfirmarCargaExcel';

interface BotonImportarExcelProps {
  listaId: string;
  listaNombre?: string;
  onImportComplete?: (tarjetasNuevas: Tarjeta[]) => void;
}

export function BotonImportarExcel({
  listaId,
  listaNombre,
  onImportComplete,
}: BotonImportarExcelProps) {
  const { session, empresaId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filasExtraidas, setFilasExtraidas] = useState<TarjetaDatosValores[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFileWeb = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const filas = procesarArchivoExcelBuffer(buffer);
        setFilasExtraidas(filas);
        setModalVisible(true);
      } catch (err: unknown) {
        Alert.alert('Error al leer Excel', (err as Error)?.message || 'Formato de archivo no válido.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePressBoton = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    } else {
      Alert.alert(
        'Importar Excel',
        'Por favor, utiliza la versión Web de Metricall para subir archivos Excel (.xlsx).'
      );
    }
  };

  const handleConfirmarCarga = async () => {
    if (!listaId || filasExtraidas.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await importarYReconciliarCobranzaDesdeExcel(
        filasExtraidas,
        listaId,
        empresaId,
        session?.user?.id || null
      );

      if (res.exito) {
        setModalVisible(false);
        setFilasExtraidas([]);
        Alert.alert(
          'Reconciliación y Carga Exitosa',
          `• ${res.tarjetasMovidasAEfectiva} clientes pagaron (movidos a Acción Efectiva).\n` +
          `• ${res.tarjetasConservadas} clientes se conservaron sin cambios.\n` +
          `• ${res.tarjetasNuevasInsertadas} clientes nuevos agregados.`
        );
        if (onImportComplete) {
          onImportComplete(res.tarjetasInsertadas || []);
        }
      } else {
        Alert.alert('Error en Carga', res.mensajes.join('\n'));
      }
    } catch (err: unknown) {
      Alert.alert('Error', 'No se pudo completar la importación: ' + ((err as Error)?.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <View style={styles.botonesRow}>
        <TouchableOpacity
          style={styles.btnImportar}
          onPress={handlePressBoton}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              <FileSpreadsheet size={15} color="#2563EB" />
              <Text style={styles.btnText}>Cargar Clientes Excel</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPlantilla}
          onPress={descargarPlantillaCobranza}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Download size={14} color="#64748B" />
          <Text style={styles.btnPlantillaTxt}>Plantilla</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          onChange={handleSelectFileWeb}
          style={{ display: 'none' }}
        />
      )}

      <ModalConfirmarCargaExcel
        visible={modalVisible}
        isProcessing={isProcessing}
        nombreArchivo={nombreArchivo}
        listaNombre={listaNombre}
        filasExtraidas={filasExtraidas}
        onClose={() => setModalVisible(false)}
        onConfirmar={handleConfirmarCarga}
      />
    </>
  );
}

const styles = StyleSheet.create({
  botonesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnImportar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btnText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 12,
  },
  btnPlantilla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btnPlantillaTxt: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});

export function esListaCargaExcel(nombre?: string): boolean {
  if (!nombre) return false;
  const n = nombre.toLowerCase().trim();
  if (
    n.includes('efectiva') ||
    n.includes('negativa') ||
    n.includes('positiva') ||
    n.includes('resultado') ||
    n.includes('(recupero)')
  ) {
    return false;
  }
  return (
    n.includes('carga de cobranza') ||
    n.includes('clientes cortados') ||
    n === 'recupero' ||
    n === 'carga de recupero' ||
    n.includes('carga recupero')
  );
}
