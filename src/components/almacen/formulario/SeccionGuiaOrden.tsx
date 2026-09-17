import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DatePickerInput, InputTexto, SelectDropdown } from '../../venta/CamposVenta';
import { TarjetaDatosValores } from '../../../types/kanban';
import {
  clasificarMovimientoAlmacen,
  normalizarTextoAlmacen,
} from '../../../services/almacenService';
import { MiembroResumen } from '../../../hooks/useFormularioStockDisponibles';

interface SeccionGuiaOrdenProps {
  formData: TarjetaDatosValores;
  updateHeaderField: (key: string, val: unknown) => void;
  readOnly?: boolean;
  isDevolucionMode: boolean;
  isDevolucionCentralMode: boolean;
  isDevolucionAsignacionMode: boolean;
  isAsignadoMode: boolean;
  miembrosList: string[];
  miembrosDetallados?: MiembroResumen[];
  nombreCompleto?: string | null;
}

export const SeccionGuiaOrden: React.FC<SeccionGuiaOrdenProps> = ({
  formData,
  updateHeaderField,
  readOnly = false,
  isDevolucionMode,
  isDevolucionCentralMode,
  isDevolucionAsignacionMode,
  isAsignadoMode,
  miembrosList,
  miembrosDetallados,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>1. GUÍA Y ORDEN DE ENTREGA</Text>
      <View style={styles.row}>
        {!isDevolucionMode && (
          <View style={styles.flex1}>
            <InputTexto
              label="Número Orden de Entrega"
              value={formData.nroOrdenEntrega}
              onChangeText={(v) => updateHeaderField('nroOrdenEntrega', v)}
              placeholder="Ej. ORD-2026-001"
              isRequired
              readOnly={readOnly}
            />
          </View>
        )}
        <View style={styles.flex1}>
          <DatePickerInput
            label={isDevolucionMode ? 'Fecha de Devolución' : 'Fecha de Recibido'}
            value={formData.fechaRecibido}
            onDateChange={(v) => updateHeaderField('fechaRecibido', v)}
            placeholder="Seleccionar fecha"
            isRequired
            disabled={readOnly}
          />
        </View>
      </View>

      <SelectDropdown
        label="Tipo de Carga"
        value={
          isDevolucionCentralMode
            ? 'Devolución a Almacén Central'
            : isDevolucionAsignacionMode
              ? 'Devolución de Asignación'
              : formData.tipoCarga
        }
        onSelect={(v) => {
          updateHeaderField('tipoCarga', v);
          const mov = clasificarMovimientoAlmacen(v);
          if (mov === 'MATERIAL_ASIGNADO' || mov === 'DEVOLUCION_CENTRAL') {
            updateHeaderField('origen', 'ALMACÉN PRINCIPAL');
          } else if (mov === 'DEVOLUCION_ASIGNACION') {
            updateHeaderField('origen', 'EMPLEADO');
          } else if (mov === 'MATERIAL_RECIBIDO') {
            if (!formData.origen || formData.origen === 'ALMACÉN PRINCIPAL') {
              updateHeaderField('origen', 'PROVEEDOR');
            }
          } else if (mov === 'RECUPERADOS') {
            if (!formData.origen || formData.origen === 'ALMACÉN PRINCIPAL') {
              updateHeaderField('origen', 'CLIENTE');
            }
          }
        }}
        options={[
          'Material Recibido',
          'Material Asignado',
          'Devolución de Asignación',
          'Devolución a Almacén Central',
          'Recuperados',
        ]}
        placeholder="Seleccionar tipo de carga..."
        isRequired
        disabled={readOnly}
      />

      <SelectDropdown
        label="Origen"
        value={isAsignadoMode ? 'ALMACÉN PRINCIPAL' : formData.origen}
        onSelect={(v) => updateHeaderField('origen', v)}
        options={
          isAsignadoMode
            ? ['Almacén Principal']
            : ['Almacén Principal', 'Almacén Fibex', 'Proveedor', 'Empleado', 'Contratista', 'Otros']
        }
        placeholder="Seleccionar origen..."
        isRequired
        disabled={readOnly || isAsignadoMode}
      />

      {isAsignadoMode && (
        <SelectDropdown
          label="Personal / Miembro Asignado"
          value={formData.asignadoA}
          onSelect={(v) => {
            updateHeaderField('asignadoA', v);
            updateHeaderField('recibidoPor', v);
            if (miembrosDetallados && miembrosDetallados.length > 0) {
              const vNorm = normalizarTextoAlmacen(v);
              const match = miembrosDetallados.find(
                (m) => m.nombre === v || normalizarTextoAlmacen(m.nombre) === vNorm
              );
              if (match?.id) {
                updateHeaderField('asignado_a', match.id);
              }
            }
          }}
          options={miembrosList.length > 0 ? miembrosList : ['No hay miembros registrados']}
          placeholder="Seleccionar miembro a asignar..."
          isRequired
          disabled={readOnly}
        />
      )}

      {isDevolucionCentralMode && (
        <InputTexto
          label="Sede / Almacén Central de Destino"
          value={formData.asignadoA || 'Almacén Central (Sede Matriz)'}
          onChangeText={(v) => updateHeaderField('asignadoA', v)}
          isRequired
          readOnly={readOnly}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B6C2CF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
});
