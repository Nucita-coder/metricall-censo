import { supabase } from '../../../lib/supabase';
import { Tarjeta, TarjetaDatosValores, TarjetaMaterialItem } from '../../../types/kanban';

export interface ParametrosConversionCenso {
  tarjetaSeleccionada: Tarjeta;
  conversionData: TarjetaDatosValores | null;
  datosComerciales: Record<string, unknown>;
  onRemoveTarjetaLocal?: (id: string) => void;
  setTarjetaSeleccionada: (t: Tarjeta | null) => void;
  setConversionData: (d: TarjetaDatosValores | null) => void;
}

export async function ejecutarConversionCensoAVenta({
  tarjetaSeleccionada,
  conversionData,
  datosComerciales,
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
  setConversionData,
}: ParametrosConversionCenso): Promise<void> {
  const gestiones = tarjetaSeleccionada.datos_valores?.gestiones || [];
  const oldData = tarjetaSeleccionada.datos_valores || {};
  let gpsValues: Record<string, unknown> = {};
  if (oldData.geo_censo?.lat && oldData.geo_censo?.lng) {
    gpsValues = { latitud: oldData.geo_censo.lat, longitud: oldData.geo_censo.lng, ubicacion_cliente: oldData.geo_censo };
  }

  const nuevosDatos: Record<string, unknown> = {
    ...oldData,
    ...gpsValues,
    ...datosComerciales,
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
    origen: 'censo',
  };

  const camposAPurgar = [
    'tipoProspecto', 'tipoDocumentoIdentidad', 'nroIdentidad', 'nroTelefonoMovil', 'nroTelefonoAdicional',
    'nroTelefonoResidencial', 'ciudadMunicipio', 'zonaCuadrante', 'calleManzanaVereda', 'urbanizacionBarrio',
    'pisoNivel', 'edificioCasa', 'puntoReferencia', 'geo_censo', 'fechaCenso', 'supervisor', 'asesorComercial',
    'cuentaConInternet', 'proveedorActual', 'proveedor_otro', 'tipoTecnologia', 'planContratado', 'costoPlan',
    'nivelSatisfaccion', 'principalProblema', 'dispuestoCambiar', 'servicioAdicionalInteres', 'observacionesCenso',
  ];

  camposAPurgar.forEach((campo) => {
    delete nuevosDatos[campo];
  });

  const { error: rpcError } = await supabase.rpc('convertir_venta_factibilidad', {
    p_tarjeta_id: tarjetaSeleccionada.id,
    p_nuevos_datos: nuevosDatos,
  });

  if (rpcError) throw rpcError;

  if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjetaSeleccionada.id);
  setTarjetaSeleccionada(null);
  setConversionData(null);
}

export async function notificarAsignacionMaterialDetalle({
  editFormData,
  empresaId,
  tarjetaId,
}: {
  editFormData: TarjetaDatosValores;
  empresaId?: string;
  tarjetaId: string;
}): Promise<void> {
  const tipoUpper = (editFormData.tipoCarga || '').toUpperCase();
  const isDevolucion = tipoUpper.includes('DEVOLUCION') || tipoUpper.includes('DEVOLUCIÓN');
  const isAsignado = !isDevolucion && (tipoUpper.includes('ASIGNA') || Boolean(editFormData.asignadoA && editFormData.asignadoA.trim()));

  if (!((isAsignado || isDevolucion) && editFormData.asignadoA && editFormData.asignadoA.trim())) {
    return;
  }

  try {
    const targetName = editFormData.asignadoA.trim().toLowerCase();
    const { data: perfiles, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, nombre_completo')
      .eq('empresa_id', empresaId);

    if (perfilError) {
      console.error('Error al buscar perfiles para notificación:', perfilError);
    }

    const matchedProfile = perfiles?.find((p) => {
      const pName = (p.nombre_completo || '').trim().toLowerCase();
      return pName === targetName || (pName && targetName && (pName.includes(targetName) || targetName.includes(pName)));
    });

    if (matchedProfile?.id) {
      const itemsList = Array.isArray(editFormData.items) && editFormData.items.length > 0 ? editFormData.items : [editFormData];
      const resumenItems = (itemsList as TarjetaMaterialItem[])
        .map((it) => `${it.cantidadRecibida || '0'} und. de ${(it.nombreMaterial || it.codigoMaterial || 'Material').toUpperCase()}`)
        .join(', ');
      const mensaje = isDevolucion
        ? `Se registró la devolución de ${resumenItems} al almacén correctamente.`
        : `Se te asignó ${resumenItems}. Este material está ahora en tu custodia.`;

      const { error: notifError } = await supabase.from('notificaciones').insert({
        usuario_id: matchedProfile.id,
        tarjeta_id: tarjetaId,
        mensaje,
        leida: false,
      });

      if (notifError) {
        console.error('Error al insertar notificación:', notifError);
      }
    } else {
      console.warn('Perfil no encontrado para notificación. Nombre buscado:', editFormData.asignadoA);
    }
  } catch (errNotif) {
    console.error('Error notificacion:', errNotif);
  }
}
