import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Clock, ShoppingCart, UserX } from 'lucide-react-native';
import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { FaseProps } from './types';
import { supabase } from '../../../lib/supabase';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import { FormularioConversionVenta } from './FormularioConversionVenta';
import { resolverListaDestino } from './gestionOnlineHelpers';
import { styles } from './SeccionAccionesVentaOnline.styles';

type TipoConfirmacion = 'sin_caja' | 'no_quiso' | 'comprara_luego' | null;

interface SeccionAccionesVentaOnlineProps {
  tarjeta: Tarjeta;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  onUpdateTarjeta: (updates: Partial<TarjetaDatosValores>) => Promise<void>;
  autoMoverTarjeta: (tarjeta: Tarjeta, nuevaListaId: string) => Promise<void>;
  listasGlobales?: FaseProps['listasGlobales'];
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  setTarjetaSeleccionada?: (tarjeta: Tarjeta | null) => void;
}

export function SeccionAccionesVentaOnline({
  tarjeta,
  isSaving,
  setIsSaving,
  onUpdateTarjeta,
  autoMoverTarjeta,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: SeccionAccionesVentaOnlineProps) {
  const { showDiagnosticError } = useErrorDiagnostics();
  const [confirmando, setConfirmando] = useState<TipoConfirmacion>(null);
  const [mostrarFormularioVenta, setMostrarFormularioVenta] = useState(false);
  const [isSavingVenta, setIsSavingVenta] = useState(false);

  // 1. Sector sin caja (Mueve a LIBERADA)
  const handleSectorSinCaja = async () => {
    if (confirmando !== 'sin_caja') {
      setConfirmando('sin_caja');
      return;
    }

    setIsSaving(true);
    setConfirmando(null);
    try {
      await onUpdateTarjeta({
        motivoLiberada: 'No se pudo instalar por no haber caja en el sector',
        motivoLiberacion: 'No se pudo instalar por no haber caja en el sector',
        estadoGestion: 'liberada_sin_caja',
      });

      const destId = await resolverListaDestino('liberada', listasGlobales, tarjeta.empresa_id);
      if (!destId) {
        throw new Error("No se encontró la lista 'Liberada' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-ONLINE-SIN-CAJA', 'Error al mover la tarjeta a Liberada.', e, 'GestionOnline');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. No quiso servicio (Mueve a NO DESEA en Censo)
  const handleNoQuisoServicio = async () => {
    if (confirmando !== 'no_quiso') {
      setConfirmando('no_quiso');
      return;
    }

    setIsSaving(true);
    setConfirmando(null);
    try {
      await onUpdateTarjeta({
        nombreApellido: tarjeta.datos_valores?.nombreApellido || tarjeta.datos_valores?.nombre || 'Cliente WhatsApp',
        telefonoMovil: tarjeta.datos_valores?.telefonoMovil || tarjeta.datos_valores?.telefono || '',
        sector: tarjeta.datos_valores?.sector || '',
        dispuestoCambiar: 'No',
        motivoNoDesea: 'Cliente manifestó no querer el servicio (WhatsApp Bot)',
        estadoGestion: 'no_quiso_servicio',
      });

      const destId = await resolverListaDestino('no desea', listasGlobales, tarjeta.empresa_id);
      if (!destId) {
        throw new Error("No se encontró la lista 'NO DESEA' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-ONLINE-NO-QUIZO', 'Error al mover la tarjeta a la lista NO DESEA de Censo.', e, 'GestionOnline');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Comprará luego (Mueve a SI DESEA en Censo)
  const handleCompraraLuego = async () => {
    if (confirmando !== 'comprara_luego') {
      setConfirmando('comprara_luego');
      return;
    }

    setIsSaving(true);
    setConfirmando(null);
    try {
      await onUpdateTarjeta({
        nombreApellido: tarjeta.datos_valores?.nombreApellido || tarjeta.datos_valores?.nombre || 'Cliente WhatsApp',
        telefonoMovil: tarjeta.datos_valores?.telefonoMovil || tarjeta.datos_valores?.telefono || '',
        sector: tarjeta.datos_valores?.sector || '',
        dispuestoCambiar: 'Sí',
        motivoCompraraLuego: 'Cliente indicó que comprará luego (WhatsApp Bot)',
        estadoGestion: 'comprara_luego',
      });

      const destId = await resolverListaDestino('si desea', listasGlobales, tarjeta.empresa_id);
      if (!destId) {
        throw new Error("No se encontró la lista 'SI DESEA' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-ONLINE-COMPRARA-LUEGO', 'Error al mover la tarjeta a la lista SI DESEA de Censo.', e, 'GestionOnline');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmarVenta = async (datosComerciales: Record<string, unknown>) => {
    setIsSavingVenta(true);
    try {
      const oldData = tarjeta.datos_valores || {};

      const nuevosDatos = {
        ...oldData,
        ...datosComerciales,
        tipoServicio: (datosComerciales.tipoServicio as string) || '',
        documentoIdentidad: oldData.documentoIdentidad || oldData.cedula || '',
        telefonoMovil: oldData.telefonoMovil || oldData.telefono || '',
        sector: oldData.sector || '',
        origen: 'WhatsApp Bot → Venta Efectiva',
        estadoGestion: 'compra_efectiva',
      };

      const { error: rpcError } = await supabase.rpc('convertir_venta_factibilidad', {
        p_tarjeta_id: tarjeta.id,
        p_nuevos_datos: nuevosDatos,
      });

      if (rpcError) throw rpcError;

      setMostrarFormularioVenta(false);
      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-ONLINE-COMPRA-EFECTIVA', 'Error al convertir la tarjeta a Venta Efectiva en Instalaciones.', e, 'GestionOnline');
    } finally {
      setIsSavingVenta(false);
    }
  };

  return (
    <>
      <Text style={styles.description}>
        Selecciona la acción correspondiente para esta solicitud recibida por WhatsApp.
      </Text>

      {/* 1. Sector sin caja */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          confirmando === 'sin_caja' && styles.actionBtnActive,
          isSaving && styles.btnDisabled,
        ]}
        onPress={handleSectorSinCaja}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving && confirmando === 'sin_caja' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <AlertTriangle size={16} color="#B6C2CF" />
            <Text style={styles.actionBtnText}>
              {confirmando === 'sin_caja' ? '¿Confirmar? Toca de nuevo para liberar' : 'Sector sin caja'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* 2. No quiso servicio */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          confirmando === 'no_quiso' && styles.actionBtnActive,
          isSaving && styles.btnDisabled,
        ]}
        onPress={handleNoQuisoServicio}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving && confirmando === 'no_quiso' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <UserX size={16} color="#B6C2CF" />
            <Text style={styles.actionBtnText}>
              {confirmando === 'no_quiso' ? '¿Confirmar? Toca de nuevo para mover a Censo' : 'No quiso servicio'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* 3. Comprará luego */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          confirmando === 'comprara_luego' && styles.actionBtnActive,
          isSaving && styles.btnDisabled,
        ]}
        onPress={handleCompraraLuego}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving && confirmando === 'comprara_luego' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Clock size={16} color="#B6C2CF" />
            <Text style={styles.actionBtnText}>
              {confirmando === 'comprara_luego' ? '¿Confirmar? Toca de nuevo para mover a Censo' : 'Comprará luego'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Caja de confirmación activa */}
      {confirmando && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            {confirmando === 'sin_caja' && (
              <>
                La tarjeta se moverá a <Text style={styles.boldText}>LIBERADA</Text> con el
                motivo: <Text style={styles.italicText}>"No se pudo instalar por no haber caja en el sector"</Text>.
              </>
            )}
            {confirmando === 'no_quiso' && (
              <>
                La tarjeta se moverá al tablero <Text style={styles.boldText}>Censo</Text> en la lista <Text style={styles.boldText}>NO DESEA</Text>.
              </>
            )}
            {confirmando === 'comprara_luego' && (
              <>
                La tarjeta se moverá al tablero <Text style={styles.boldText}>Censo</Text> en la lista <Text style={styles.boldText}>SI DESEA</Text>.
              </>
            )}
          </Text>
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => setConfirmando(null)}
          >
            <Text style={styles.cancelLinkText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Compra Efectiva */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnPrimary, isSaving && styles.btnDisabled]}
        onPress={() => {
          setConfirmando(null);
          setMostrarFormularioVenta(true);
        }}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        <ShoppingCart size={16} color="#1D2125" />
        <Text style={styles.actionBtnPrimaryText}>Compra Efectiva</Text>
      </TouchableOpacity>

      {/* Modal: Formulario de Datos de Venta */}
      <Modal
        visible={mostrarFormularioVenta}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMostrarFormularioVenta(false)}
      >
        <FormularioConversionVenta
          initialData={tarjeta.datos_valores || {}}
          isSubmitting={isSavingVenta}
          onCancel={() => setMostrarFormularioVenta(false)}
          onConfirm={handleConfirmarVenta}
        />
      </Modal>
    </>
  );
}
