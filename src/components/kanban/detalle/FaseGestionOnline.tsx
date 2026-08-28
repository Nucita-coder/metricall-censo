import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';
import { supabase } from '../../../lib/supabase';

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
  const [confirmandoSinCaja, setConfirmandoSinCaja] = useState(false);

  const handleSectorSinCaja = async () => {
    if (!confirmandoSinCaja) {
      // Primer toque: pedir confirmación
      setConfirmandoSinCaja(true);
      return;
    }

    setIsSaving(true);
    setConfirmandoSinCaja(false);
    try {
      // Registrar motivo en datos_valores
      await onUpdateTarjeta({
        motivoLiberada: 'No se pudo instalar por no haber caja en el sector',
        estadoGestion: 'liberada_sin_caja',
      });

      // 1. Buscar primero en las listas del tablero actual
      let destId =
        findListaTarget(listasGlobales, 'liberada')?.id ||
        listasGlobales.find(l => (l.nombre || '').toLowerCase().includes('liberada'))?.id;

      // 2. Si la lista 'Liberada' está en otro tablero (ej: Ventas/Instalaciones), buscarla en Supabase
      if (!destId) {
        let query = supabase
          .from('listas')
          .select('id, nombre')
          .ilike('nombre', '%liberada%');

        if (tarjeta.empresa_id) {
          query = query.eq('empresa_id', tarjeta.empresa_id);
        }

        const { data: listasBd, error: errBd } = await query.limit(1);

        if (errBd) {
          console.error('[GESTION ONLINE] Error buscando lista Liberada en BD:', errBd);
        }

        if (listasBd && listasBd.length > 0) {
          destId = listasBd[0].id;
        }
      }

      if (!destId) {
        throw new Error("No se encontró la lista 'Liberada' en la base de datos.");
      }

      await autoMoverTarjeta(tarjeta, destId);

      if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
      if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
    } catch (e: any) {
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

  return renderSection('Acciones de Gestión Online', (
    <View>
      <Text style={{ fontSize: 13, color: '#8C9BAB', marginBottom: 16, lineHeight: 20 }}>
        Selecciona la acción correspondiente para esta solicitud recibida por WhatsApp.
      </Text>

      {/* ── Botón: Sector sin caja ───────────────────────────── */}
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
        {isSaving ? (
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

      {/* ── Placeholder para los 3 botones restantes ─────────── */}
      <Text style={{ fontSize: 11, color: '#4A5568', marginTop: 8, fontStyle: 'italic' }}>
        Más acciones próximamente...
      </Text>
    </View>
  ));
};
