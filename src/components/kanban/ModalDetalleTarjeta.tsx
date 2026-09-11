import { History, Pencil, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Animated, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Tarjeta, TarjetaDatosValores, Lista } from '../../types/kanban';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import FormularioCenso from '../FormularioCenso';
import FormularioVenta from '../FormularioVenta';
import FormularioReciboMaterial from '../FormularioReciboMaterial';
import { AccionesExportacionCenso } from './detalle/AccionesExportacionCenso';
import { BotonesAccionEdicion } from './detalle/BotonesAccionEdicion';
import { FaseDinamicaSelector } from './detalle/FaseDinamicaSelector';
import { FormularioConversionVenta } from './detalle/FormularioConversionVenta';
import { SeccionAdjuntos } from './detalle/SeccionAdjuntos';
import { SeccionComentarios } from './detalle/SeccionComentarios';
import { SeccionGestion } from './detalle/SeccionGestion';
import { SeccionRegistro } from './detalle/SeccionRegistro';
import { FaseProps, Miembro } from './detalle/types';
import { validarDatosVenta } from '../venta/validacionesVenta';
import { ejecutarConversionCensoAVenta, notificarAsignacionMaterialDetalle } from './detalle/modalDetalleHelpers';

export interface ModalDetalleTarjetaProps {
  tarjetaSeleccionada: Tarjeta | null;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  listas: Lista[];
  miembros: Miembro[];
  onUpdateTarjeta: (nuevosDatos: Partial<TarjetaDatosValores>) => Promise<void>;
  autoMoverTarjeta: (tarjeta: Tarjeta, lista: string) => Promise<void>;
  nuevoComentario: string;
  setNuevoComentario: (c: string) => void;
  handleEnviarComentario: () => void;
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  startInEditMode?: boolean;
  onOpenReasignacion?: (t: Tarjeta) => void;
  onOpenTrazabilidad?: (t: Tarjeta) => void;
  isResaltada?: boolean;
}

export const ModalDetalleTarjeta = ({
  tarjetaSeleccionada,
  setTarjetaSeleccionada,
  listas,
  miembros,
  onUpdateTarjeta,
  autoMoverTarjeta,
  nuevoComentario,
  setNuevoComentario,
  handleEnviarComentario,
  onRemoveTarjetaLocal,
  startInEditMode = false,
  onOpenReasignacion,
  onOpenTrazabilidad,
  isResaltada,
}: ModalDetalleTarjetaProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const { userRol } = useAuth();
  const puedeEditar = userRol !== 'empleado';

  const [isSaving, setIsSaving] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);
  const [conversionData, setConversionData] = useState<TarjetaDatosValores | null>(null);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editFormData, setEditFormData] = useState<TarjetaDatosValores>(tarjetaSeleccionada?.datos_valores || {});
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isResaltada && tarjetaSeleccionada) {
      highlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isResaltada, tarjetaSeleccionada]);

  const [nombreListaRemota, setNombreListaRemota] = useState<string | null>(null);

  React.useEffect(() => {
    setIsEditing(startInEditMode);
    if (tarjetaSeleccionada?.datos_valores) {
      setEditFormData(tarjetaSeleccionada.datos_valores);
    }
  }, [startInEditMode, tarjetaSeleccionada]);

  React.useEffect(() => {
    if (!tarjetaSeleccionada) {
      setNombreListaRemota(null);
      return;
    }

    const encontradaLocal = listas.find(l => l.id === tarjetaSeleccionada.lista_id);
    if (encontradaLocal?.nombre) {
      setNombreListaRemota(encontradaLocal.nombre);
      return;
    }

    let isMounted = true;
    supabase
      .from('listas')
      .select('nombre')
      .eq('id', tarjetaSeleccionada.lista_id)
      .single()
      .then(({ data }) => {
        if (isMounted && data?.nombre) {
          setNombreListaRemota(data.nombre);
        }
      });

    return () => { isMounted = false; };
  }, [tarjetaSeleccionada, listas]);

  if (!tarjetaSeleccionada) return null;

  const listaActualNombre = nombreListaRemota || listas.find(l => l.id === tarjetaSeleccionada.lista_id)?.nombre || '';
  const isCensoFormat = ['censo', 'si desea', 'no desea', 'es posible', 'sí desea'].includes(listaActualNombre.toLowerCase().trim());
  const isMaterialesFormat = ['carga de materiales', 'material recibido', 'material asignado', 'devolución de asignación', 'devolución a almacén central', 'recuperados'].includes(listaActualNombre.toLowerCase().trim()) || tarjetaSeleccionada?.datos_valores?.codigoMaterial !== undefined || tarjetaSeleccionada?.datos_valores?.nroOrdenEntrega !== undefined;
  const isClienteActivo = listaActualNombre.toLowerCase().trim().includes('activo');

  const faseProps: FaseProps = {
    tarjeta: tarjetaSeleccionada,
    miembros,
    onUpdateTarjeta,
    autoMoverTarjeta,
    isSaving,
    setIsSaving,
    setImagenExpandida,
    onSolicitarConversionVenta: (gestionData) => setConversionData(gestionData),
    onRemoveTarjetaLocal,
    setTarjetaSeleccionada,
    listasGlobales: listas,
  };

  const handleGuardarCambios = async () => {
    if (!isCensoFormat && !isMaterialesFormat) {
      const { esValido, faltantes } = validarDatosVenta(editFormData);
      if (!esValido) {
        Alert.alert(
          'Casillas Obligatorias Requeridas',
          'Para guardar los cambios, debes completar las siguientes casillas obligatorias:\n\n• ' + faltantes.join('\n• ')
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      await onUpdateTarjeta(editFormData);
      if (isMaterialesFormat) {
        await notificarAsignacionMaterialDetalle({
          editFormData,
          empresaId: tarjetaSeleccionada.empresa_id,
          tarjetaId: tarjetaSeleccionada.id,
        });
      }
      setIsEditing(false);
    } catch (e: unknown) {
      alert('Error al guardar: ' + ((e as Error).message || String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal visible={!!tarjetaSeleccionada} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={[{
            flex: 1,
            width: '100%',
            backgroundColor: '#22272B',
            borderRadius: isDesktop ? 12 : 0,
            overflow: 'hidden',
            elevation: 10,
            ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 } }),
          },
            WEB_MODAL_CONTAINER,
          isDesktop && { maxHeight: '90%', marginVertical: 'auto' }
          ]}>
            <Animated.View pointerEvents="none" style={[styles.modalHighlightOverlay, { opacity: highlightAnim }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#B6C2CF' }}>
                  {tarjetaSeleccionada?.datos_valores?.tipoServicio?.toUpperCase() || 'DETALLE DE TARJETA'}
                </Text>
              {puedeEditar && !isEditing && !isMaterialesFormat && (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginLeft: 8, padding: 8, backgroundColor: '#1D2125', borderRadius: 8, borderWidth: 1, borderColor: '#384148' }}>
                  <Pencil size={16} color="#B6C2CF" />
                </TouchableOpacity>
              )}
              {onOpenTrazabilidad && (
                <TouchableOpacity onPress={() => onOpenTrazabilidad(tarjetaSeleccionada)} style={{ marginLeft: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1D2125', borderRadius: 8, borderWidth: 1, borderColor: '#0C66E4', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <History size={15} color="#579DFF" />
                  <Text style={{ color: '#579DFF', fontWeight: 'bold', fontSize: 13 }}>Trazabilidad</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => { setTarjetaSeleccionada(null); setConversionData(null); setIsEditing(false); }} style={{ padding: 4 }}>
              <X size={28} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

            {conversionData ? (
              <FormularioConversionVenta
                initialData={tarjetaSeleccionada.datos_valores || {}}
                isSubmitting={isSaving}
                onCancel={() => setConversionData(null)}
                onConfirm={async (datosComerciales: Record<string, unknown>) => {
                  setIsSaving(true);
                  try {
                    await ejecutarConversionCensoAVenta({
                      tarjetaSeleccionada,
                      conversionData,
                      datosComerciales,
                      onRemoveTarjetaLocal,
                      setTarjetaSeleccionada,
                      setConversionData,
                    });
                    alert('Venta concretada. Tarjeta movida a Instalaciones -> Factibilidad.');
                  } catch (e: unknown) {
                    alert('Error al convertir la venta: ' + ((e as Error).message || String(e)));
                  } finally {
                    setIsSaving(false);
                  }
                }}
              />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24 }}>
                  <View style={{ flex: isDesktop ? 2 : 1 }}>
                    <View style={{ flex: 1 }}>
                      {isCensoFormat ? (
                        <View style={{ marginBottom: 24 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#B6C2CF', marginBottom: 16 }}>
                            {isEditing ? 'Editar Formulario de Censo' : 'Formulario de Censo Original'}
                          </Text>
                          <FormularioCenso
                            formData={isEditing ? editFormData : (tarjetaSeleccionada.datos_valores || {})}
                            handleChange={isEditing ? ((k: string, v: unknown) => setEditFormData((prev) => ({ ...prev, [k]: v }))) : () => { }}
                            readOnly={!isEditing}
                          />
                          {isEditing ? (
                            <BotonesAccionEdicion isSaving={isSaving} onCancelar={() => setIsEditing(false)} onGuardar={handleGuardarCambios} />
                          ) : (
                            <AccionesExportacionCenso tarjetaSeleccionada={tarjetaSeleccionada} isSaving={isSaving} />
                          )}

                          {!isEditing && (
                            <View style={{ marginTop: 24 }}>
                              <SeccionGestion {...faseProps} />
                            </View>
                          )}
                        </View>
                      ) : isMaterialesFormat ? (
                        <View style={{ marginBottom: 24 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0C66E4', marginBottom: 16 }}>
                            Registro: Comprobante de Recepción de Material (Inmutable)
                          </Text>
                          <FormularioReciboMaterial
                            formData={tarjetaSeleccionada.datos_valores || {}}
                            readOnly={true}
                          />
                        </View>
                      ) : (
                        <>
                          {isEditing ? (
                            <View style={{ marginBottom: 24 }}>
                              <FormularioVenta
                                formData={editFormData}
                                handleChange={(k: string, v: unknown) => setEditFormData((prev) => ({ ...prev, [k]: v }))}
                              />
                              <BotonesAccionEdicion isSaving={isSaving} onCancelar={() => setIsEditing(false)} onGuardar={handleGuardarCambios} />
                            </View>
                          ) : (
                            <>
                              {!isClienteActivo && <SeccionRegistro {...faseProps} />}
                              {tarjetaSeleccionada.datos_valores?.gestiones && tarjetaSeleccionada.datos_valores.gestiones.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                  <SeccionGestion {...faseProps} soloHistorial={true} />
                                </View>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {!isCensoFormat && !isMaterialesFormat && !isEditing && !isClienteActivo && <SeccionAdjuntos {...faseProps} />}
                      {!isCensoFormat && !isMaterialesFormat && !isEditing && (
                        <FaseDinamicaSelector
                          listaActualNombre={listaActualNombre}
                          faseProps={faseProps}
                          isCensoFormat={isCensoFormat}
                          isMaterialesFormat={isMaterialesFormat}
                        />
                      )}
                    </View>
                  </View>

                  <SeccionComentarios
                    nuevoComentario={nuevoComentario}
                    setNuevoComentario={setNuevoComentario}
                    handleEnviarComentario={handleEnviarComentario}
                    isSaving={isSaving}
                    puedeEditar={puedeEditar}
                    comentarios={tarjetaSeleccionada.datos_valores?.comentarios || []}
                    isDesktop={isDesktop}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>      <Modal visible={!!imagenExpandida} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 }} onPress={() => setImagenExpandida(null)}>
            <X size={32} color="#FFF" />
          </TouchableOpacity>
          {imagenExpandida && (
            <ImageBackground source={{ uri: imagenExpandida }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalHighlightOverlay: {
    ...StyleSheet.absoluteFill,
    borderColor: '#0C66E4',
    borderWidth: 3,
    borderRadius: 12,
    shadowColor: '#579DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    zIndex: 100,
  },
});
