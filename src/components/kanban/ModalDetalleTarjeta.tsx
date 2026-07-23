import { History, Pencil, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, Modal, Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Tarjeta, TarjetaDatosValores } from '../../types/kanban';

import { WEB_MODAL_CONTAINER } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import FormularioCenso from '../FormularioCenso';
import FormularioVenta from '../FormularioVenta';
import { AccionesExportacionCenso } from './detalle/AccionesExportacionCenso';
import { BotonesAccionEdicion } from './detalle/BotonesAccionEdicion';
import { FaseAsignadoA } from './detalle/FaseAsignadoA';
import { FaseClienteActivo } from './detalle/FaseClienteActivo';
import { FaseEnProceso } from './detalle/FaseEnProceso';
import { FaseFactibilidad } from './detalle/FaseFactibilidad';
import { FaseLiberada } from './detalle/FaseLiberada';
import { FasePorActivar } from './detalle/FasePorActivar';
import { FasePorInstalar } from './detalle/FasePorInstalar';
import { FaseVenta } from './detalle/FaseVenta';
import { FormularioConversionVenta } from './detalle/FormularioConversionVenta';
import { SeccionAdjuntos } from './detalle/SeccionAdjuntos';
import { SeccionComentarios } from './detalle/SeccionComentarios';
import { SeccionGestion } from './detalle/SeccionGestion';
import { SeccionRegistro } from './detalle/SeccionRegistro';
import { FaseProps } from './detalle/types';

export interface ModalDetalleTarjetaProps {
  tarjetaSeleccionada: Tarjeta | null;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  listas: any[];
  miembros: any[];
  onUpdateTarjeta: (nuevosDatos: Partial<TarjetaDatosValores>) => Promise<void>;
  autoMoverTarjeta: (tarjeta: Tarjeta, lista: string) => Promise<void>;
  nuevoComentario: string;
  setNuevoComentario: (c: string) => void;
  handleEnviarComentario: () => void;
  onRemoveTarjetaLocal?: (tarjetaId: string) => void;
  startInEditMode?: boolean;
  onOpenReasignacion?: (t: Tarjeta) => void;
  onOpenTrazabilidad?: (t: Tarjeta) => void;
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
}: ModalDetalleTarjetaProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const { userRol } = useAuth();
  const puedeEditar = userRol !== 'empleado';

  const [isSaving, setIsSaving] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);
  const [conversionData, setConversionData] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editFormData, setEditFormData] = useState<any>(tarjetaSeleccionada?.datos_valores || {});

  React.useEffect(() => {
    setIsEditing(startInEditMode);
    if (tarjetaSeleccionada?.datos_valores) {
      setEditFormData(tarjetaSeleccionada.datos_valores);
    }
  }, [startInEditMode, tarjetaSeleccionada]);

  if (!tarjetaSeleccionada) return null;

  const listaActualNombre = listas.find(l => l.id === tarjetaSeleccionada.lista_id)?.nombre || '';
  const isCensoFormat = ['Censo', 'si desea', 'no desea', 'es posible'].includes(listaActualNombre);

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

  const renderFaseDinamica = () => {
    switch (listaActualNombre) {
      case 'Venta': return <FaseVenta {...faseProps} />;
      case 'Factibilidad': return <FaseFactibilidad {...faseProps} />;
      case 'Por Instalar': return <FasePorInstalar {...faseProps} />;
      case 'Asignado A': return <FaseAsignadoA {...faseProps} />;
      case 'Liberada': return <FaseLiberada {...faseProps} />;
      case 'En Proceso': return <FaseEnProceso {...faseProps} />;
      case 'Por Activar': return <FasePorActivar {...faseProps} />;
      case 'Cliente Activo': return <FaseClienteActivo {...faseProps} />;
      default: return null;
    }
  };

  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      await onUpdateTarjeta(editFormData);
      setIsEditing(false);
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#B6C2CF' }}>
                  {tarjetaSeleccionada?.datos_valores?.tipoServicio?.toUpperCase() || 'DETALLE DE TARJETA'}
                </Text>
              {puedeEditar && !isEditing && (
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
                isSubmitting={isSaving}
                onCancel={() => setConversionData(null)}
                onConfirm={async (datosComerciales: any) => {
                  setIsSaving(true);
                  try {
                    const gestiones = tarjetaSeleccionada.datos_valores?.gestiones || [];
                    const oldData = tarjetaSeleccionada.datos_valores || {};
                    let gpsValues = {};
                    if (oldData.geo_censo?.lat && oldData.geo_censo?.lng) {
                      gpsValues = { latitud: oldData.geo_censo.lat, longitud: oldData.geo_censo.lng, ubicacion_cliente: oldData.geo_censo };
                    }

                    const nuevosDatos = {
                      ...oldData, ...gpsValues, ...datosComerciales,
                      tipoServicio: datosComerciales.tipoServicio || oldData.tipoProspecto,
                      tipoDocumento: oldData.tipoDocumentoIdentidad,
                      documentoIdentidad: oldData.nroIdentidad,
                      telefonoMovil: oldData.nroTelefonoMovil,
                      telefonoAdicional: oldData.nroTelefonoAdicional,
                      telefonoResidencial: oldData.nroTelefonoResidencial,
                      ciudad: oldData.ciudadMunicipio,
                      zona: oldData.zonaCuadrante,
                      calle: oldData.calleManzanaVereda,
                      urbanizacion: oldData.urbanizacionBarrio,
                      piso: oldData.pisoNivel,
                      edificio: oldData.edificioCasa,
                      referencia: oldData.puntoReferencia,
                      gestiones: [...gestiones, conversionData],
                      origen: 'censo'
                    };

                    const camposAPurgar = [
                      'tipoProspecto', 'tipoDocumentoIdentidad', 'nroIdentidad', 'nroTelefonoMovil', 'nroTelefonoAdicional',
                      'nroTelefonoResidencial', 'ciudadMunicipio', 'zonaCuadrante', 'calleManzanaVereda', 'urbanizacionBarrio',
                      'pisoNivel', 'edificioCasa', 'puntoReferencia', 'geo_censo', 'fechaCenso', 'supervisor', 'asesorComercial',
                      'cuentaConInternet', 'proveedorActual', 'proveedor_otro', 'tipoTecnologia', 'planContratado', 'costoPlan',
                      'nivelSatisfaccion', 'principalProblema', 'dispuestoCambiar', 'servicioAdicionalInteres', 'observacionesCenso'
                    ];

                    camposAPurgar.forEach(campo => { delete nuevosDatos[campo]; });

                    const { error: rpcError } = await supabase.rpc('convertir_venta_factibilidad', {
                      p_tarjeta_id: tarjetaSeleccionada.id,
                      p_nuevos_datos: nuevosDatos
                    });

                    if (rpcError) throw rpcError;

                    if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjetaSeleccionada.id);
                    setTarjetaSeleccionada(null);
                    setConversionData(null);
                    alert('Venta concretada. Tarjeta movida a Instalaciones -> Factibilidad.');
                  } catch (e: any) {
                    alert('Error al convertir la venta: ' + e.message);
                  } finally {
                    setIsSaving(false);
                  }
                }}
              />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24 }}>
                  <View style={{ flex: isDesktop ? 2 : 1 }}>
                    <View style={{ opacity: puedeEditar ? 1 : 0.8, pointerEvents: puedeEditar ? 'auto' : 'none' }}>
                      {isCensoFormat ? (
                        <View style={{ marginBottom: 24 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#B6C2CF', marginBottom: 16 }}>
                            {isEditing ? 'Editar Formulario de Censo' : 'Formulario de Censo Original'}
                          </Text>
                          <FormularioCenso
                            formData={isEditing ? editFormData : (tarjetaSeleccionada.datos_valores || {})}
                            handleChange={isEditing ? ((k: string, v: any) => setEditFormData((prev: any) => ({ ...prev, [k]: v }))) : () => { }}
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
                      ) : (
                        <>
                          {isEditing ? (
                            <View style={{ marginBottom: 24 }}>
                              <FormularioVenta
                                formData={editFormData}
                                handleChange={(k: string, v: any) => setEditFormData((prev: any) => ({ ...prev, [k]: v }))}
                              />
                              <BotonesAccionEdicion isSaving={isSaving} onCancelar={() => setIsEditing(false)} onGuardar={handleGuardarCambios} />
                            </View>
                          ) : (
                            <>
                              <SeccionRegistro {...faseProps} />
                              {tarjetaSeleccionada.datos_valores?.gestiones && tarjetaSeleccionada.datos_valores.gestiones.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                  <SeccionGestion {...faseProps} soloHistorial={true} />
                                </View>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {!isCensoFormat && !isEditing && <SeccionAdjuntos {...faseProps} />}
                      {!isEditing && renderFaseDinamica()}
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
      </Modal>

      <Modal visible={!!imagenExpandida} transparent={true} animationType="fade">
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
