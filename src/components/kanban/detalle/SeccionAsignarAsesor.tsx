import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { UserCheck, RefreshCw, ShoppingCart, User } from 'lucide-react-native';
import { FaseProps, Miembro } from './types';
import { renderSection } from './SeccionRegistro';
import { useAuth } from '../../../context/AuthContext';
import { soundService } from '../../../services/soundService';
import { styles } from './SeccionAsignarAsesor.styles';

export const SeccionAsignarAsesor = ({
  tarjeta,
  miembros = [],
  onUpdateTarjeta,
  isSaving,
  setIsSaving,
  onSolicitarConversionVenta,
}: FaseProps) => {
  const { userRol, isDeveloper, session, nombreCompleto } = useAuth();
  const rolLower = (userRol || '').toLowerCase();
  const canReasignar =
    isDeveloper ||
    ['admin', 'lider', 'lider_sucursal', 'supervisor', 'developer', 'administrador'].includes(rolLower);

  const data = tarjeta.datos_valores || {};
  const asesorActualId = (data.asignado_a || data.asesor_id) as string | undefined;
  const asesorActualNombre = (data.asignadoA || data.asesorComercial || data.asesorAsignado) as string | undefined;
  const fechaAsignacion = data.fechaAsignacionAsesor as string | undefined;

  // El único que puede marcar si la venta se concretó es el asesor asignado a la tarjeta
  const currentUserId = session?.user?.id;
  const currentUserName = (nombreCompleto || '').trim().toLowerCase();
  const assignedUserId = asesorActualId;
  const assignedUserName = String(asesorActualNombre || '').trim().toLowerCase();

  const isUserAssigned = Boolean(
    (currentUserId && assignedUserId && currentUserId === assignedUserId) ||
    (currentUserName && assignedUserName && (
      currentUserName === assignedUserName ||
      currentUserName.includes(assignedUserName) ||
      assignedUserName.includes(currentUserName)
    ))
  );

  const [mostrarSelector, setMostrarSelector] = useState(!asesorActualNombre);

  // Filtrar miembros con etiqueta o rol comercial (asesor / vendedor)
  const asesoresFiltrados = miembros.filter((m: Miembro) => {
    const rolMatch = m.rol === 'asesor' || m.rol === 'vendedor';
    const etiquetaMatch =
      Array.isArray(m.etiquetas) &&
      m.etiquetas.some((e: string) => {
        const clean = String(e).toLowerCase().trim();
        return clean === 'asesor' || clean === 'vendedor' || clean.includes('asesor') || clean.includes('vendedor');
      });
    return rolMatch || etiquetaMatch;
  });

  const listaAsesores = asesoresFiltrados.length > 0 ? asesoresFiltrados : miembros;

  const handleAsignarAsesor = async (asesor: Miembro) => {
    setIsSaving(true);
    const nombre = String(asesor.nombre_completo || asesor.nombre || 'Asesor Comercial');
    const asesorId = asesor.id || null;

    try {
      await onUpdateTarjeta({
        asignado_a: asesorId,
        asignadoA: nombre,
        asesorComercial: nombre,
        asesor_id: asesorId,
        fechaAsignacionAsesor: new Date().toISOString(),
        estadoAsignacion: 'asignado_a_asesor',
      });

      soundService.playNotification('action_success');
      setMostrarSelector(false);
      Alert.alert('¡Asesor Asignado!', `La tarjeta fue asignada exitosamente a ${nombre}.`);
    } catch (e: unknown) {
      soundService.playNotification('action_error');
      Alert.alert('Error', (e as Error).message || 'No se pudo asignar el asesor.');
    } finally {
      setIsSaving(false);
    }
  };

  return renderSection(
    'Reasignación',
    <View>
      {/* ── CARD INFORMATIVA SI YA TIENE ASESOR ASIGNADO ───── */}
      {Boolean(asesorActualNombre) && !mostrarSelector && (
        <View style={styles.cardAsignado}>
          <View style={styles.headerAsignado}>
            <View style={styles.badgeAsignado}>
              <Text style={styles.badgeText}>ASESOR ASIGNADO</Text>
            </View>
            {Boolean(fechaAsignacion) && (
              <Text style={styles.fechaTexto}>
                {new Date(fechaAsignacion!).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.avatarCircle}>
              <UserCheck size={20} color="#579DFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombreAsesor}>{asesorActualNombre}</Text>
              <Text style={styles.subtextoAsesor}>
                Responsable del cierre de venta de este prospecto censado
              </Text>
            </View>
          </View>

          {/* ACCIONES DEL ASESOR / SUPERVISOR */}
          {(isUserAssigned || canReasignar) && (
            <View style={styles.botonesContainer}>
              {/* Solo el asesor asignado puede marcar la venta como concretada */}
              {isUserAssigned && Boolean(onSolicitarConversionVenta) && (
                <TouchableOpacity
                  style={[styles.botonConcretar, !canReasignar && { flex: 1 }]}
                  onPress={() => {
                    onSolicitarConversionVenta!({
                      etapa: 'gestion_asesor',
                      asesor: asesorActualNombre,
                      fechaConversion: new Date().toISOString(),
                    });
                  }}
                  disabled={isSaving}
                >
                  <ShoppingCart size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.textoBotonConcretar}>Concretar Venta</Text>
                </TouchableOpacity>
              )}

              {/* El administrador/supervisor puede reasignar libremente */}
              {canReasignar && (
                <TouchableOpacity
                  style={[styles.botonReasignar, !isUserAssigned && { flex: 1 }]}
                  onPress={() => setMostrarSelector(true)}
                  disabled={isSaving}
                >
                  <RefreshCw size={14} color="#8C9BAB" style={{ marginRight: 6 }} />
                  <Text style={styles.textoBotonReasignar}>Reasignar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── SELECTOR DE ASESORES (Si no hay asignado o si el admin quiere reasignar) ───── */}
      {mostrarSelector && (
        <View style={styles.contenedorSelector}>
          <Text style={styles.instruccionTexto}>
            Se han completado las gestiones iniciales. Selecciona un asesor comercial para continuar el seguimiento:
          </Text>

          {asesoresFiltrados.length === 0 && miembros.length > 0 && (
            <Text style={styles.advertenciaSinFiltro}>
              Aviso: No se encontraron usuarios con la etiqueta "asesor". Mostrando miembros del equipo:
            </Text>
          )}

          {listaAsesores.map((m: Miembro, idx: number) => {
            const esElActual = m.id === asesorActualId;
            return (
              <TouchableOpacity
                key={m.id || String(idx)}
                style={[styles.itemAsesor, esElActual && styles.itemAsesorActual]}
                onPress={() => handleAsignarAsesor(m)}
                disabled={isSaving}
              >
                <View style={styles.itemAvatar}>
                  <User size={16} color={esElActual ? '#579DFF' : '#8C9BAB'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemNombre, esElActual && { color: '#579DFF' }]}>
                    {m.nombre_completo || (m.nombre as string) || 'Sin Nombre'}
                  </Text>
                  <Text style={styles.itemRol}>
                    {Array.isArray(m.etiquetas) && m.etiquetas.length > 0
                      ? m.etiquetas.join(', ')
                      : (m.rol || 'Miembro')}
                  </Text>
                </View>

                <View style={[styles.botonSeleccionar, esElActual && styles.botonSeleccionarActual]}>
                  <Text style={[styles.textoSeleccionar, esElActual && { color: '#579DFF' }]}>
                    {esElActual ? 'Asignado' : 'Asignar'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {Boolean(asesorActualNombre) && (
            <TouchableOpacity
              style={styles.botonCancelarReasignacion}
              onPress={() => setMostrarSelector(false)}
              disabled={isSaving}
            >
              <Text style={styles.textoCancelar}>Cancelar Reasignación</Text>
            </TouchableOpacity>
          )}

          {isSaving && (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <ActivityIndicator color="#579DFF" size="small" />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

