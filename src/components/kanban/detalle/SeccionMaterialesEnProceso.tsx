import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface SeccionMaterialesEnProcesoProps {
  materiales: Record<string, string>;
  setMateriales: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  stockCustodia: Record<string, number>;
  readOnly: boolean;
  isSaving: boolean;
}

const ITEMS_MATERIALES = [
  { key: 'tensorPlastico', label: 'Tensor Plástico', cod: 'MAT-TENSOR-PLASTICO' },
  { key: 'tensorHierro', label: 'Tensor Hierro', cod: 'MAT-TENSOR-HIERRO' },
  { key: 'grapas', label: 'Grapas', cod: 'MAT-GRAPAS' },
  { key: 'tirrap', label: 'Tirrap', cod: 'MAT-TIRRAP' },
  { key: 'pachCordApc', label: 'Pach Cord APC', cod: 'MAT-PACH-APC' },
  { key: 'pachCordUpc', label: 'Pach Cord UPC', cod: 'MAT-PACH-UPC' },
  { key: 'pachCordApcUpc', label: 'Pach Cord APC/UPC', cod: 'MAT-PACH-APC-UPC' },
  { key: 'cajaTerminalCon', label: 'Caja Term. Con Accesorios', cod: 'MAT-CAJA-TERM-CON' },
  { key: 'cajaTerminalSin', label: 'Caja Term. Sin Accesorios', cod: 'MAT-CAJA-TERM-SIN' },
  { key: 'conectorAcople', label: 'Conector/Acople H-H', cod: 'MAT-CONECTOR-ACOPLE-HH' },
  { key: 'conectorMecanicoApc', label: 'Conector Mecánico APC', cod: 'MAT-CONECTOR-MEC-APC' },
  { key: 'conectorMecanicoUpc', label: 'Conector Mecánico UPC', cod: 'MAT-CONECTOR-MEC-UPC' },
  { key: 'precinto', label: 'Precinto', cod: 'MAT-PRECINTO' },
];

export function SeccionMaterialesEnProceso({
  materiales,
  setMateriales,
  stockCustodia,
  readOnly,
  isSaving,
}: SeccionMaterialesEnProcesoProps) {
  const [mostrarDropdownCable, setMostrarDropdownCable] = useState(false);

  return (
    <View>
      <Text style={styles.tituloSeccion}>
        {readOnly ? 'MATERIALES REGISTRADOS Y UTILIZADOS' : 'MATERIALES UTILIZADOS (SE DESCONTARÁN DE CUSTODIA)'}
      </Text>

      <View style={styles.gridMateriales}>
        {ITEMS_MATERIALES.map((item) => {
          const disp =
            stockCustodia[item.cod] !== undefined
              ? stockCustodia[item.cod]
              : stockCustodia[item.label.toUpperCase()] || 0;
          const numVal = parseFloat(materiales[item.key] || '0') || 0;

          return (
            <View key={item.key} style={styles.colMaterial}>
              <Text style={styles.labelMaterial}>{item.label}</Text>
              <TextInput
                style={[
                  styles.inputMaterial,
                  numVal > disp && disp > 0 && { borderColor: '#F87171' },
                ]}
                keyboardType="numeric"
                value={String(materiales[item.key] || '')}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  if (!cleaned) {
                    setMateriales((p) => ({ ...p, [item.key]: '' }));
                    return;
                  }
                  const inputNum = parseInt(cleaned, 10);
                  if (inputNum > 0 && inputNum > disp) {
                    Alert.alert(
                      'Acción no permitida',
                      `No posees suficiente stock de ${item.label} en tu custodia (Disponible: ${disp} und.). Solicita una carga a Almacén.`
                    );
                    setMateriales((p) => ({ ...p, [item.key]: '' }));
                    return;
                  }
                  setMateriales((p) => ({ ...p, [item.key]: cleaned }));
                }}
                editable={!readOnly && !isSaving}
              />
              {!readOnly &&
                (disp > 0 ? (
                  <Text
                    style={[
                      styles.stockInfoText,
                      { color: numVal > disp ? '#F87171' : '#4ADE80' },
                      numVal > disp && { fontWeight: 'bold' },
                    ]}
                  >
                    {numVal > disp ? `⚠️ Excede tu stock (${disp} und.)` : `✓ En custodia: ${disp} und.`}
                  </Text>
                ) : (
                  <Text style={[styles.stockInfoText, { color: '#8C9BAB', fontStyle: 'italic' }]}>
                    Sin stock asignado
                  </Text>
                ))}
            </View>
          );
        })}
      </View>

      {/* Selector Cable Preconectorizado */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.labelMaterial}>Cable Preconectorizado</Text>
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => !readOnly && !isSaving && setMostrarDropdownCable(!mostrarDropdownCable)}
          disabled={readOnly || isSaving}
        >
          <Text style={{ color: materiales.cablePreconectorizado ? '#B6C2CF' : '#8C9BAB' }}>
            {materiales.cablePreconectorizado || 'Seleccionar...'}
          </Text>
          {!readOnly && <ChevronDown size={16} color="#8C9BAB" />}
        </TouchableOpacity>

        {mostrarDropdownCable && !readOnly && !isSaving && (
          <View style={styles.dropdownMenu}>
            {['50', '70', '100'].map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  const dispCable =
                    stockCustodia['MAT-CABLE-PRECONECTORIZADO'] !== undefined
                      ? stockCustodia['MAT-CABLE-PRECONECTORIZADO']
                      : stockCustodia['CABLE PRECONECTORIZADO'] || 0;
                  const cantCable = parseFloat(opcion) || 0;
                  if (cantCable > dispCable) {
                    Alert.alert(
                      'Acción no permitida',
                      `No posees suficiente stock de Cable Preconectorizado de ${opcion}m en tu custodia (Disponible: ${dispCable} und.).`
                    );
                    setMostrarDropdownCable(false);
                    return;
                  }
                  setMateriales((p) => ({ ...p, cablePreconectorizado: opcion }));
                  setMostrarDropdownCable(false);
                }}
              >
                <Text style={{ color: '#B6C2CF' }}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tituloSeccion: {
    fontSize: 12,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  gridMateriales: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colMaterial: {
    width: '48%',
    marginBottom: 12,
  },
  labelMaterial: {
    fontSize: 10,
    color: '#8C9BAB',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputMaterial: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 8,
    color: '#B6C2CF',
  },
  stockInfoText: {
    fontSize: 9,
    marginTop: 2,
  },
  dropdownToggle: {
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
});
