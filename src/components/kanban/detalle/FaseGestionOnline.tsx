import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Clock, Hourglass, Paperclip, ShoppingCart, UserX, Wrench, X, XCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { FaseProps, findListaTarget, getAtencionFallasListaId } from './types';
import { renderSection } from './SeccionRegistro';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import { supabase } from '../../../lib/supabase';
import { FormularioConversionVenta } from './FormularioConversionVenta';
import { KANBAN_COLORS } from '../../../constants/theme';
import { uploadImageToSupabase } from '../../../services/uploadImage';
import { notificarPagoProcesado, notificarPagoRechazado } from '../../../services/whatsappNotificacionesService';

/**
 * FaseGestionOnline
 * Botones de acción para tarjetas creadas desde el bot de WhatsApp (Gestión Online).
 * Se muestra cuando la tarjeta tiene origen='WhatsApp Bot'.
 */
export const FaseGestionOnline = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const { showDiagnosticError } = useErrorDiagnostics();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [confirmandoSinCaja, setConfirmandoSinCaja] = useState(false);
  const [confirmandoNoQuiso, setConfirmandoNoQuiso] = useState(false);
  const [confirmandoCompraraLuego, setConfirmandoCompraraLuego] = useState(false);
  const [mostrarFormularioVenta, setMostrarFormularioVenta] = useState(false);
  const [isSavingVenta, setIsSavingVenta] = useState(false);

  // 1. Handler: Sector sin caja (Mueve a LIBERADA en Ventas/Instalaciones)
  const handleSectorSinCaja = async () => {
    if (!confirmandoSinCaja) {
      setConfirmandoSinCaja(true);
      setConfirmandoNoQuiso(false);
      setConfirmandoCompraraLuego(false);
      return;
    }

    setIsSaving(true);
    setConfirmandoSinCaja(false);
    try {
      await onUpdateTarjeta({
        motivoLiberada: 'No se pudo instalar por no haber caja en el sector',
        motivoLiberacion: 'No se pudo instalar por no haber caja en el sector',
        estadoGestion: 'liberada_sin_caja',
      });

      let destId =
        findListaTarget(listasGlobales, 'liberada')?.id ||
        listasGlobales.find(l => (l.nombre || '').toLowerCase().includes('liberada'))?.id;

      if (!destId) {
        let query = supabase
          .from('listas')
          .select('id, nombre')
          .ilike('nombre', '%liberada%');

        if (tarjeta.empresa_id) {
          query = query.eq('empresa_id', tarjeta.empresa_id);
        }

        const { data: listasBd, error: errBd } = await query.limit(1);
        if (errBd) console.error('[GESTION ONLINE] Error buscando lista Liberada en BD:', errBd);
        if (listasBd && listasBd.length > 0) destId = listasBd[0].id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'Liberada' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-ONLINE-SIN-CAJA',
        'Error al mover la tarjeta a Liberada.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Handler: No quiso servicio (Mueve a NO DESEA en Censo)
  const handleNoQuisoServicio = async () => {
    if (!confirmandoNoQuiso) {
      setConfirmandoNoQuiso(true);
      setConfirmandoSinCaja(false);
      setConfirmandoCompraraLuego(false);
      return;
    }

    setIsSaving(true);
    setConfirmandoNoQuiso(false);
    try {
      await onUpdateTarjeta({
        nombreApellido: tarjeta.datos_valores?.nombreApellido || tarjeta.datos_valores?.nombre || 'Cliente WhatsApp',
        telefonoMovil: tarjeta.datos_valores?.telefonoMovil || tarjeta.datos_valores?.telefono || '',
        sector: tarjeta.datos_valores?.sector || '',
        dispuestoCambiar: 'No',
        motivoNoDesea: 'Cliente manifestó no querer el servicio (WhatsApp Bot)',
        estadoGestion: 'no_quiso_servicio',
      });

      let destId =
        findListaTarget(listasGlobales, 'no_desea')?.id ||
        findListaTarget(listasGlobales, 'no desea')?.id ||
        listasGlobales.find(l => (l.nombre || '').toLowerCase().includes('no desea'))?.id;

      if (!destId) {
        let query = supabase
          .from('listas')
          .select('id, nombre')
          .ilike('nombre', '%no desea%');

        if (tarjeta.empresa_id) {
          query = query.eq('empresa_id', tarjeta.empresa_id);
        }

        const { data: listasBd, error: errBd } = await query.limit(1);
        if (errBd) console.error('[GESTION ONLINE] Error buscando lista NO DESEA en BD:', errBd);
        if (listasBd && listasBd.length > 0) destId = listasBd[0].id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'NO DESEA' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-ONLINE-NO-QUIZO',
        'Error al mover la tarjeta a la lista NO DESEA de Censo.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Handler: Comprará luego (Mueve a SI DESEA en Censo)
  const handleCompraraLuego = async () => {
    if (!confirmandoCompraraLuego) {
      setConfirmandoCompraraLuego(true);
      setConfirmandoSinCaja(false);
      setConfirmandoNoQuiso(false);
      return;
    }

    setIsSaving(true);
    setConfirmandoCompraraLuego(false);
    try {
      await onUpdateTarjeta({
        nombreApellido: tarjeta.datos_valores?.nombreApellido || tarjeta.datos_valores?.nombre || 'Cliente WhatsApp',
        telefonoMovil: tarjeta.datos_valores?.telefonoMovil || tarjeta.datos_valores?.telefono || '',
        sector: tarjeta.datos_valores?.sector || '',
        dispuestoCambiar: 'Sí',
        motivoCompraraLuego: 'Cliente indicó que comprará luego (WhatsApp Bot)',
        estadoGestion: 'comprara_luego',
      });

      let destId =
        findListaTarget(listasGlobales, 'si_desea')?.id ||
        findListaTarget(listasGlobales, 'si desea')?.id ||
        findListaTarget(listasGlobales, 'sí desea')?.id ||
        listasGlobales.find(l => (l.nombre || '').toLowerCase().includes('si desea') || (l.nombre || '').toLowerCase().includes('sí desea'))?.id;

      if (!destId) {
        let query = supabase
          .from('listas')
          .select('id, nombre')
          .ilike('nombre', '%si desea%');

        if (tarjeta.empresa_id) {
          query = query.eq('empresa_id', tarjeta.empresa_id);
        }

        const { data: listasBd, error: errBd } = await query.limit(1);
        if (errBd) console.error('[GESTION ONLINE] Error buscando lista SI DESEA en BD:', errBd);
        if (listasBd && listasBd.length > 0) destId = listasBd[0].id;
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'SI DESEA' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-ONLINE-COMPRARA-LUEGO',
        'Error al mover la tarjeta a la lista SI DESEA de Censo.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const datosValores = tarjeta.datos_valores || {};
  const isReporteFalla = Boolean(
    datosValores.tipoFalla ||
    datosValores.estadoSoporte ||
    (datosValores.origen && String(datosValores.origen).toLowerCase().includes('soporte')) ||
    (datosValores.origen && String(datosValores.origen).toLowerCase().includes('falla')) ||
    String(datosValores.nombreApellido || '').toLowerCase().includes('falla')
  );
  const esReportePago = !isReporteFalla && Boolean(
    datosValores.comprobantePagoUrl ||
    datosValores.bancoOrigen ||
    datosValores.montoPago ||
    (datosValores.estadoCobranza && ['Pago Procesado', 'Pago Rechazado', 'Pago Pendiente Revisión', 'Pendiente Verificación'].includes(datosValores.estadoCobranza))
  );
  const estadoPagoActual = datosValores.estadoCobranza || 'Pago Pendiente Revisión';

  const handleCambiarEstadoPago = async (nuevoEstado: string) => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoCobranza: nuevoEstado,
        estadoGestion: nuevoEstado.toLowerCase().replace(/\s+/g, '_'),
        fechaUltimaGestionPago: new Date().toISOString(),
      });

      let mensajeResultado = `El pago ahora está marcado como: ${nuevoEstado}`;
      if (nuevoEstado === 'Pago Procesado') {
        const notif = await notificarPagoProcesado(tarjeta);
        if (notif.success) {
          mensajeResultado += '\n\n📲 Se envió la notificación de confirmación al cliente por WhatsApp.';
        } else if (notif.noPhone) {
          mensajeResultado += '\n\nℹ️ (La tarjeta no tiene número telefónico registrado para enviar WhatsApp).';
        } else {
          mensajeResultado += `\n\n⚠️ (No se pudo entregar el mensaje por WhatsApp: ${notif.error || 'Error de conexión'}).`;
        }
      } else if (nuevoEstado === 'Pago Rechazado') {
        const notif = await notificarPagoRechazado(tarjeta);
        if (notif.success) {
          mensajeResultado += '\n\n📲 Se notificó al cliente sobre el rechazo del pago por WhatsApp.';
        } else if (notif.noPhone) {
          mensajeResultado += '\n\nℹ️ (La tarjeta no tiene número telefónico registrado para enviar WhatsApp).';
        } else {
          mensajeResultado += `\n\n⚠️ (No se pudo entregar el mensaje por WhatsApp: ${notif.error || 'Error de conexión'}).`;
        }
      }

      Alert.alert('Estatus Actualizado', mensajeResultado);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-PAGO-ESTADO',
        'Error al actualizar el estado de pago.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcesadoSAE = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        estadoSoporte: 'Procesado en SAE',
        accionFalla: 'Procesado en SAE',
        estadoGestion: 'procesado_en_sae',
        fechaUltimaGestionFalla: new Date().toISOString(),
      });

      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Procesado en SAE!', 'La tarjeta fue marcada correctamente como resuelta.');
    } catch (e: unknown) {
      showDiagnosticError('ERR-GESTION-FALLA-SAE', 'Error al marcar Procesado en SAE.', e, 'GestionOnline');
    } finally {
      setIsSaving(false);
    }
  };

  const [mostrarFormFalla, setMostrarFormFalla] = useState(false);
  const [nroOrden, setNroOrden] = useState('');
  const [fechaOrden] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [adjuntoOrdenUrl, setAdjuntoOrdenUrl] = useState<string | null>(null);
  const [nombreAdjunto, setNombreAdjunto] = useState<string | null>(null);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const pickDocumentOrImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,application/pdf';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target?.files?.[0];
          if (file) {
            setSubiendoAdjunto(true);
            try {
              const fileUri = URL.createObjectURL(file);
              const publicUrl = await uploadImageToSupabase(fileUri, 'adjuntos', 'ordenes');
              setAdjuntoOrdenUrl(publicUrl || fileUri);
              setNombreAdjunto(file.name);
            } catch (err: unknown) {
              Alert.alert('Error al subir archivo', (err as Error).message || 'Ocurrió un error inesperado');
            } finally {
              setSubiendoAdjunto(false);
            }
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso a los archivos para adjuntar la orden.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSubiendoAdjunto(true);
        try {
          const asset = result.assets[0];
          const publicUrl = await uploadImageToSupabase(asset.uri, 'adjuntos', 'ordenes');
          setAdjuntoOrdenUrl(publicUrl || asset.uri);
          setNombreAdjunto(asset.fileName || 'orden_adjunta.jpg');
        } catch (err: unknown) {
          Alert.alert('Error al subir imagen', (err as Error).message || 'Ocurrió un error inesperado');
        } finally {
          setSubiendoAdjunto(false);
        }
      }
    } catch (e: unknown) {
      console.error('[ASISTENCIA TECNICA] Error selector de archivo:', e);
      Alert.alert('Error', (e as Error).message || 'No se pudo seleccionar el archivo');
    }
  };

  const handleProcesarAsistenciaTecnica = async () => {
    if (!nroOrden.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa el Número de Orden.');
      return;
    }

    const adjuntosActuales = Array.isArray(tarjeta.datos_valores?.adjuntos)
      ? tarjeta.datos_valores.adjuntos
      : [];
    const nuevosAdjuntos = adjuntoOrdenUrl
      ? Array.from(new Set([...adjuntosActuales, adjuntoOrdenUrl]))
      : adjuntosActuales;

    setIsSaving(true);
    try {
      await onUpdateTarjeta({
        nroOrden: nroOrden.trim(),
        fechaOrdenGenerada: fechaOrden,
        archivoOrdenUrl: adjuntoOrdenUrl || '',
        adjuntos: nuevosAdjuntos,
        estadoSoporte: 'Asistencia Técnica',
        accionFalla: 'Asistencia Técnica',
        estadoGestion: 'asistencia_tecnica',
        fechaUltimaGestionFalla: new Date().toISOString(),
      });

      let destId = await getAtencionFallasListaId('Por asignar', tarjeta.empresa_id);

      if (!destId) {
        throw new Error("No se encontró la lista 'Por asignar' en el tablero 'Atención de Fallas'.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
      Alert.alert('¡Orden Procesada!', `La orden ${nroOrden.trim()} fue procesada y enviada a Atención de Fallas (Por Asignar).`);
    } catch (e: unknown) {
      showDiagnosticError(
        'ERR-GESTION-FALLA-ASISTENCIA-TECNICA',
        'Error al procesar la asistencia técnica.',
        e,
        'GestionOnline'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const sectionTitle = esReportePago ? 'Gestión de Reporte de Pago' : isReporteFalla ? 'Gestión de Reporte de Falla' : 'Acciones de Gestión Online';

  return renderSection(sectionTitle, (
    <View>
      {/* ── SECCIÓN DE ESTADO DE PAGO (Si es reporte de pago) ───── */}
      {esReportePago ? (
        <View style={{
          backgroundColor: '#1E232A',
          borderRadius: 10,
          padding: 14,
          borderWidth: 1,
          borderColor: '#384148',
        }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B6C2CF', marginBottom: 8 }}>
            Estatus del Pago:
          </Text>

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

          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: estadoPagoActual === 'Pago Procesado' ? '#15803D' : '#1F2937',
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
                backgroundColor: estadoPagoActual === 'Pago Rechazado' ? '#991B1B' : '#1F2937',
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
                backgroundColor: estadoPagoActual === 'Pago Pendiente Revisión' ? '#854D0E' : '#1F2937',
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
      ) : isReporteFalla ? (
        <View style={{
          backgroundColor: '#1E232A',
          borderRadius: 10,
          padding: 14,
          borderWidth: 1,
          borderColor: '#384148',
        }}>
          <Text style={{ fontSize: 12, color: '#8C9BAB', marginBottom: 12, lineHeight: 18 }}>
            Selecciona la acción correspondiente para esta falla técnica:
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#1F2937',
                borderWidth: 1,
                borderColor: '#3B82F6',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={handleProcesadoSAE}
              disabled={isSaving}
            >
              <CheckCircle2 size={16} color="#3B82F6" />
              <Text style={{ color: '#60A5FA', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>
                Procesado en SAE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: mostrarFormFalla ? '#B45309' : '#1F2937',
                borderWidth: 1,
                borderColor: '#F59E0B',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isSaving ? 0.6 : 1,
              }}
              onPress={() => setMostrarFormFalla(!mostrarFormFalla)}
              disabled={isSaving}
            >
              <Wrench size={16} color={mostrarFormFalla ? '#FFF' : '#F59E0B'} />
              <Text style={{ color: mostrarFormFalla ? '#FFF' : '#FBBF24', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>
                Asistencia Técnica
              </Text>
              <ChevronDown size={14} color={mostrarFormFalla ? '#FFF' : '#FBBF24'} style={{ transform: [{ rotate: mostrarFormFalla ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* ── Mini Formulario Desplegable: Asistencia Técnica ── */}
          {mostrarFormFalla && (
            <View style={{
              backgroundColor: '#151921',
              borderRadius: 8,
              padding: 14,
              marginTop: 12,
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.4)',
            }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FBBF24', marginBottom: 12 }}>
                Registro de Orden de Asistencia Técnica
              </Text>

              {/* 1. Número de Orden */}
              <Text style={{ fontSize: 11, color: '#B6C2CF', marginBottom: 4, fontWeight: 'bold' }}>
                NÚMERO DE ORDEN *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#22272B',
                  color: '#FFF',
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: '#384148',
                  marginBottom: 10,
                }}
                placeholder="Ej. ORD-10294"
                placeholderTextColor="#6B7280"
                value={nroOrden}
                onChangeText={setNroOrden}
              />

              {/* 2. Fecha de Orden Generada */}
              <Text style={{ fontSize: 11, color: '#B6C2CF', marginBottom: 4, fontWeight: 'bold' }}>
                FECHA DE ORDEN GENERADA
              </Text>
              <View style={{
                backgroundColor: '#1E232A',
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: '#2C333A',
                marginBottom: 10,
              }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                  {fechaOrden}
                </Text>
              </View>

              {/* 3. Adjuntar Orden */}
              <Text style={{ fontSize: 11, color: '#B6C2CF', marginBottom: 4, fontWeight: 'bold' }}>
                ADJUNTAR ORDEN
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: adjuntoOrdenUrl ? '#064E3B' : '#22272B',
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: adjuntoOrdenUrl ? '#10B981' : '#384148',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
                onPress={pickDocumentOrImage}
                disabled={subiendoAdjunto}
              >
                {subiendoAdjunto ? (
                  <ActivityIndicator size="small" color="#FBBF24" />
                ) : (
                  <>
                    <Paperclip size={15} color={adjuntoOrdenUrl ? '#34D399' : '#9CA3AF'} />
                    <Text style={{ color: adjuntoOrdenUrl ? '#34D399' : '#9CA3AF', fontSize: 12, fontWeight: 'bold' }}>
                      {nombreAdjunto || (adjuntoOrdenUrl ? 'Orden Adjuntada' : 'Adjuntar')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 4. Botón de Procesar */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: 6,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  opacity: (isSaving || subiendoAdjunto) ? 0.6 : 1,
                }}
                onPress={handleProcesarAsistenciaTecnica}
                disabled={isSaving || subiendoAdjunto}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Check size={16} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>
                      Procesar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: '#8C9BAB', marginBottom: 16, lineHeight: 20 }}>
            Selecciona la acción correspondiente para esta solicitud recibida por WhatsApp.
          </Text>

          {/* ── Botón 1: Sector sin caja ──────────────────────────── */}
          <TouchableOpacity
            style={{
              backgroundColor: confirmandoSinCaja ? '#E84040' : '#2C333A',
              borderWidth: 1,
              borderColor: confirmandoSinCaja ? '#E84040' : '#D94F4F',
              borderRadius: 8,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 10,
              opacity: isSaving ? 0.6 : 1,
            }}
            onPress={handleSectorSinCaja}
            disabled={isSaving}
          >
        {isSaving && confirmandoSinCaja ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <AlertTriangle size={16} color={confirmandoSinCaja ? '#FFF' : '#D94F4F'} />
            <Text style={{ color: confirmandoSinCaja ? '#FFF' : '#D94F4F', fontWeight: 'bold', fontSize: 14 }}>
              {confirmandoSinCaja ? '¿Confirmar? Toca de nuevo para liberar' : 'Sector sin caja'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {confirmandoSinCaja && (
        <View style={{
          backgroundColor: '#2C1A1A',
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#D94F4F44',
        }}>
          <Text style={{ color: '#F87171', fontSize: 12, lineHeight: 18 }}>
            ⚠️ La tarjeta se moverá a <Text style={{ fontWeight: 'bold' }}>LIBERADA</Text> con el
            motivo: <Text style={{ fontStyle: 'italic' }}>"No se pudo instalar por no haber caja en el sector"</Text>.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
            onPress={() => setConfirmandoSinCaja(false)}
          >
            <Text style={{ color: '#8C9BAB', fontSize: 12, textDecorationLine: 'underline' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Botón 2: No quiso servicio ───────────────────────── */}
      <TouchableOpacity
        style={{
          backgroundColor: confirmandoNoQuiso ? '#D97706' : '#2C333A',
          borderWidth: 1,
          borderColor: confirmandoNoQuiso ? '#D97706' : '#F59E0B',
          borderRadius: 8,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
          opacity: isSaving ? 0.6 : 1,
        }}
        onPress={handleNoQuisoServicio}
        disabled={isSaving}
      >
        {isSaving && confirmandoNoQuiso ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <UserX size={16} color={confirmandoNoQuiso ? '#FFF' : '#F59E0B'} />
            <Text style={{ color: confirmandoNoQuiso ? '#FFF' : '#F59E0B', fontWeight: 'bold', fontSize: 14 }}>
              {confirmandoNoQuiso ? '¿Confirmar? Toca de nuevo para mover a Censo' : 'No quiso servicio'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {confirmandoNoQuiso && (
        <View style={{
          backgroundColor: '#2A2115',
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#F59E0B44',
        }}>
          <Text style={{ color: '#FBBF24', fontSize: 12, lineHeight: 18 }}>
            ⚠️ La tarjeta se moverá al tablero <Text style={{ fontWeight: 'bold' }}>Censo</Text> en la lista <Text style={{ fontWeight: 'bold' }}>NO DESEA</Text>.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
            onPress={() => setConfirmandoNoQuiso(false)}
          >
            <Text style={{ color: '#8C9BAB', fontSize: 12, textDecorationLine: 'underline' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Botón 3: Comprará luego ─────────────────────────── */}
      <TouchableOpacity
        style={{
          backgroundColor: confirmandoCompraraLuego ? '#0284C7' : '#2C333A',
          borderWidth: 1,
          borderColor: confirmandoCompraraLuego ? '#0284C7' : '#38BDF8',
          borderRadius: 8,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
          opacity: isSaving ? 0.6 : 1,
        }}
        onPress={handleCompraraLuego}
        disabled={isSaving}
      >
        {isSaving && confirmandoCompraraLuego ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Clock size={16} color={confirmandoCompraraLuego ? '#FFF' : '#38BDF8'} />
            <Text style={{ color: confirmandoCompraraLuego ? '#FFF' : '#38BDF8', fontWeight: 'bold', fontSize: 14 }}>
              {confirmandoCompraraLuego ? '¿Confirmar? Toca de nuevo para mover a Censo' : 'Comprará luego'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {confirmandoCompraraLuego && (
        <View style={{
          backgroundColor: '#152535',
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#38BDF844',
        }}>
          <Text style={{ color: '#38BDF8', fontSize: 12, lineHeight: 18 }}>
            ⚠️ La tarjeta se moverá al tablero <Text style={{ fontWeight: 'bold' }}>Censo</Text> en la lista <Text style={{ fontWeight: 'bold' }}>SI DESEA</Text>.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
            onPress={() => setConfirmandoCompraraLuego(false)}
          >
            <Text style={{ color: '#8C9BAB', fontSize: 12, textDecorationLine: 'underline' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Botón 4: Compra Efectiva ───────────────────── */}
      <TouchableOpacity
        style={{
          backgroundColor: '#2C333A',
          borderWidth: 1,
          borderColor: '#22C55E',
          borderRadius: 8,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
          opacity: isSaving ? 0.6 : 1,
        }}
        onPress={() => {
          setConfirmandoSinCaja(false);
          setConfirmandoNoQuiso(false);
          setConfirmandoCompraraLuego(false);
          setMostrarFormularioVenta(true);
        }}
        disabled={isSaving}
      >
        <ShoppingCart size={16} color="#22C55E" />
        <Text style={{ color: '#22C55E', fontWeight: 'bold', fontSize: 14 }}>
          Compra Efectiva
        </Text>
      </TouchableOpacity>

      {/* ── Modal: Formulario de Datos de Venta ───────── */}
      <Modal
        visible={mostrarFormularioVenta}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMostrarFormularioVenta(false)}
        {...(Platform.OS === 'web' ? {} : {})}
      >
        <FormularioConversionVenta
          initialData={tarjeta.datos_valores || {}}
          isSubmitting={isSavingVenta}
          onCancel={() => setMostrarFormularioVenta(false)}
          onConfirm={async (datosComerciales: Record<string, unknown>) => {
            setIsSavingVenta(true);
            try {
              const oldData = tarjeta.datos_valores || {};

              // Mapear campos de la tarjeta WhatsApp al formato de ventas
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
              showDiagnosticError(
                'ERR-GESTION-ONLINE-COMPRA-EFECTIVA',
                'Error al convertir la tarjeta a Venta Efectiva en Instalaciones.',
                e,
                'GestionOnline'
              );
            } finally {
              setIsSavingVenta(false);
            }
          }}
        />
      </Modal>
        </>
      )}
    </View>
  ));
};
