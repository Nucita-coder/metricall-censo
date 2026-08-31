import React from 'react';
import { View, Text } from 'react-native';
import { FaseProps } from './types';
import { renderSection } from './SeccionRegistro';
import { FaseEnProceso } from './FaseEnProceso';

export const FaseSolventada = (props: FaseProps) => {
  const { tarjeta } = props;
  const data = tarjeta.datos_valores || {};

  return (
    <View style={{ gap: 14 }}>
      {renderSection("Resumen de Atención", (
        <View style={{ backgroundColor: '#1E232A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#384148' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Boolean(data.tecnicoAsignado || tarjeta.asignado_a) && (
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB' }}>TÉCNICO QUE ATENDIÓ</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#B6C2CF', marginTop: 2 }}>
                  {data.tecnicoAsignado || 'Técnico Asignado'}
                </Text>
              </View>
            )}

            {Boolean(data.nroOrden) && (
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB' }}>NRO DE ORDEN</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#60A5FA', marginTop: 2 }}>
                  {data.nroOrden}
                </Text>
              </View>
            )}

            {Boolean(data.fechaOrdenGenerada) && (
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB' }}>FECHA ORDEN GENERADA</Text>
                <Text style={{ fontSize: 12, color: '#B6C2CF', marginTop: 2 }}>
                  {data.fechaOrdenGenerada}
                </Text>
              </View>
            )}

            {Boolean(data.fechaSolventada) && (
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 10, color: '#8C9BAB' }}>FECHA SOLVENTADA</Text>
                <Text style={{ fontSize: 12, color: '#34D399', marginTop: 2 }}>
                  {new Date(data.fechaSolventada).toLocaleDateString()} {new Date(data.fechaSolventada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Renderizado del informe técnico y materiales cargados en modo solo lectura */}
      <FaseEnProceso {...props} readOnly={true} />
    </View>
  );
};
