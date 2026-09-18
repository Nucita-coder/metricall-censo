import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeftRight } from 'lucide-react-native';
import { Lista, Tarjeta } from '../../../types/kanban';

interface ModalReubicarTarjetaProps {
  tarjeta: Tarjeta | null;
  listas: Lista[];
  isProcessing: boolean;
  onCancelar: () => void;
  onConfirmar: (listaDestinoId: string) => Promise<void>;
}

export function ModalReubicarTarjeta({
  tarjeta,
  listas,
  isProcessing,
  onCancelar,
  onConfirmar,
}: ModalReubicarTarjetaProps) {
  const [seleccionada, setSeleccionada] = React.useState<string | null>(null);

  // Reset selección al cambiar tarjeta
  React.useEffect(() => { setSeleccionada(null); }, [tarjeta?.id]);

  if (!tarjeta) return null;

  const nombre = (tarjeta.datos_valores?.nombre || tarjeta.datos_valores?.cliente || '') as string;
  // Ordenar listas por posición y excluir la lista actual
  const listasOrdenadas = [...listas]
    .filter((l) => l.id !== tarjeta.lista_id && !l.estado_archivo)
    .sort(
      (a, b) =>
        ((a.posicion ?? a.orden ?? 0) as number) -
        ((b.posicion ?? b.orden ?? 0) as number)
    );

  const listaActual = listas.find((l) => l.id === tarjeta.lista_id);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={styles.overlay} onPress={onCancelar} />
      <View style={styles.centeredBox}>
        {/* Encabezado */}
        <View style={styles.header}>
          <ArrowLeftRight size={16} color="#B6C2CF" />
          <Text style={styles.titulo}>Reubicar Tarjeta</Text>
        </View>
        <Text style={styles.subtitulo} numberOfLines={1}>
          {nombre || tarjeta.id}
        </Text>
        <Text style={styles.infoActual}>
          Lista actual:{' '}
          <Text style={{ color: '#B6C2CF', fontWeight: 'bold' }}>
            {listaActual?.nombre || '—'}
          </Text>
        </Text>

        {/* Advertencia */}
        <View style={styles.advertencia}>
          <Text style={styles.advertenciaTexto}>
            Se borrarán todos los datos operativos acumulados desde la lista destino
            hacia adelante. Esta acción no se puede deshacer.
          </Text>
        </View>

        {/* Lista de destinos */}
        <Text style={styles.labelDestino}>SELECCIONAR LISTA DESTINO</Text>
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {listasOrdenadas.map((lista) => {
            const isSelected = seleccionada === lista.id;
            return (
              <TouchableOpacity
                key={lista.id}
                style={[styles.listaItem, isSelected && styles.listaItemSelected]}
                onPress={() => setSeleccionada(lista.id)}
                disabled={isProcessing}
              >
                {lista.color_fondo ? (
                  <View style={[styles.colorDot, { backgroundColor: lista.color_fondo }]} />
                ) : null}
                <Text style={[styles.listaItemText, isSelected && { color: '#FFF' }]}>
                  {lista.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Botones */}
        <View style={styles.botones}>
          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={onCancelar}
            disabled={isProcessing}
          >
            <Text style={styles.btnCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnConfirmar, (!seleccionada || isProcessing) && styles.btnDisabled]}
            onPress={() => seleccionada && onConfirmar(seleccionada)}
            disabled={!seleccionada || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#1D2125" size="small" />
            ) : (
              <Text style={styles.btnConfirmarTexto}>Reubicar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  centeredBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -170 }, { translateY: -240 }],
    width: 340,
    maxHeight: 480,
    backgroundColor: '#2C333A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titulo: {
    color: '#B6C2CF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#8C9BAB',
    fontSize: 12,
    marginBottom: 4,
  },
  infoActual: {
    color: '#8C9BAB',
    fontSize: 11,
    marginBottom: 10,
  },
  advertencia: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  advertenciaTexto: {
    color: '#F87171',
    fontSize: 11,
    lineHeight: 16,
  },
  labelDestino: {
    color: '#8C9BAB',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  listScroll: {
    maxHeight: 180,
    marginBottom: 12,
  },
  listaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#1D2125',
    marginBottom: 6,
  },
  listaItemSelected: {
    borderColor: '#0C66E4',
    backgroundColor: '#0C66E4',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  listaItemText: {
    color: '#B6C2CF',
    fontSize: 13,
  },
  botones: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#1D2125',
    alignItems: 'center',
  },
  btnCancelarTexto: {
    color: '#B6C2CF',
    fontSize: 13,
    fontWeight: '600',
  },
  btnConfirmar: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#A0B2C6',
    alignItems: 'center',
  },
  btnConfirmarTexto: {
    color: '#1D2125',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
