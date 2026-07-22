import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { FaseProps, findListaTarget } from './types';
import { renderSection } from './SeccionRegistro';
import { useErrorDiagnostics } from '../../../context/ErrorDiagnosticsContext';

export const FaseVenta = ({ tarjeta, onUpdateTarjeta, autoMoverTarjeta, isSaving, setIsSaving, listasGlobales = [] }: FaseProps) => {
  const data = tarjeta.datos_valores || {};
  const { showDiagnosticError } = useErrorDiagnostics();
  
  // Estado local encapsulado (solo lo que Venta necesita)
  const [planHogar, setPlanHogar] = useState(data.plan_hogar || '');
  const [planPymes, setPlanPymes] = useState(data.plan_pymes || '');
  const [mostrarDropdownHogar, setMostrarDropdownHogar] = useState(false);
  const [mostrarDropdownPymes, setMostrarDropdownPymes] = useState(false);

  const handleGuardar = async () => {
    setIsSaving(true);
    const updateData: any = {};
    if (planHogar && planHogar !== 'Ninguno') {
      updateData.plan_hogar = planHogar;
      updateData.plan_pymes = '';
      updateData.tipoServicio = 'hogar';
    } else if (planPymes && planPymes !== 'Ninguno') {
      updateData.plan_pymes = planPymes;
      updateData.plan_hogar = '';
      updateData.tipoServicio = 'pymes';
    } else {
      updateData.plan_hogar = '';
      updateData.plan_pymes = '';
    }
    
    try {
      await onUpdateTarjeta(updateData);
      const destId = findListaTarget(listasGlobales, 'factibilidad')?.id;
      if (!destId) throw new Error("No se encontró la lista destino 'Factibilidad' en la estructura del tablero.");
      await autoMoverTarjeta(tarjeta, destId);
    } catch (e: any) {
      showDiagnosticError('ERR-KANBAN-VENTA', 'Error al procesar la venta o enviar la tarjeta a Factibilidad.', e, 'Venta');
    } finally {
      setIsSaving(false);
    }
  };

  return renderSection("Acciones de Venta", (
    <View>
      <Text style={{ fontSize: 13, color: '#B6C2CF', marginBottom: 12 }}>Selecciona el plan contratado por el cliente:</Text>
      
      <View style={{ marginBottom: 16, opacity: planPymes && planPymes !== 'Ninguno' ? 0.5 : 1 }}>
        <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Plan Hogar</Text>
        <TouchableOpacity
          style={{ backgroundColor: planPymes && planPymes !== 'Ninguno' ? '#2C333A' : '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => setMostrarDropdownHogar(!mostrarDropdownHogar)}
          disabled={!!(planPymes && planPymes !== 'Ninguno') || isSaving}
        >
          <Text style={{ color: planHogar ? '#B6C2CF' : '#8C9BAB' }}>
            {planHogar || 'Ninguno'}
          </Text>
          <ChevronDown size={16} color="#8C9BAB" />
        </TouchableOpacity>
        
        {mostrarDropdownHogar && (
          <View style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
            {['Ninguno', 'Conectados', 'Gamer', 'Cinéfilos', 'Familiar'].map(opcion => (
              <TouchableOpacity
                key={opcion}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#384148' }}
                onPress={() => {
                  setPlanHogar(opcion === 'Ninguno' ? '' : opcion);
                  if (opcion !== 'Ninguno') setPlanPymes('');
                  setMostrarDropdownHogar(false);
                }}
              >
                <Text style={{ color: '#B6C2CF' }}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={{ marginBottom: 16, opacity: planHogar && planHogar !== 'Ninguno' ? 0.5 : 1 }}>
        <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Plan PYMES</Text>
        <TouchableOpacity
          style={{ backgroundColor: planHogar && planHogar !== 'Ninguno' ? '#2C333A' : '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => setMostrarDropdownPymes(!mostrarDropdownPymes)}
          disabled={!!(planHogar && planHogar !== 'Ninguno') || isSaving}
        >
          <Text style={{ color: planPymes ? '#B6C2CF' : '#8C9BAB' }}>
            {planPymes || 'Ninguno'}
          </Text>
          <ChevronDown size={16} color="#8C9BAB" />
        </TouchableOpacity>
        
        {mostrarDropdownPymes && (
          <View style={{ backgroundColor: '#2C333A', borderWidth: 1, borderColor: '#384148', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
            {['Ninguno', 'Emprendedores', 'Comercios', 'Oficinas', 'Negocios'].map(opcion => (
              <TouchableOpacity
                key={opcion}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#384148' }}
                onPress={() => {
                  setPlanPymes(opcion === 'Ninguno' ? '' : opcion);
                  if (opcion !== 'Ninguno') setPlanHogar('');
                  setMostrarDropdownPymes(false);
                }}
              >
                <Text style={{ color: '#B6C2CF' }}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={{ fontSize: 13, color: '#B6C2CF', marginBottom: 12, marginTop: 16 }}>Esta tarjeta se encuentra en Ventas. Puedes enviarla nuevamente a Factibilidad para su revisión.</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center' }}
        onPress={handleGuardar}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Guardar y Enviar a Factibilidad</Text>}
      </TouchableOpacity>
    </View>
  ));
};
