import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface PermisosAccionesVisibilidadProps {
  permisos: {
    tarjetas_visibilidad: 'todas' | 'propias';
    acciones: { crear: boolean; editar: boolean; borrar: boolean };
  };
  setPermisos: React.Dispatch<React.SetStateAction<any>>;
  etiquetas: string[];
  setEtiquetas: React.Dispatch<React.SetStateAction<string[]>>;
  opcionesEtiquetas: string[];
}

export function PermisosAccionesVisibilidad({
  permisos,
  setPermisos,
  etiquetas,
  setEtiquetas,
  opcionesEtiquetas,
}: PermisosAccionesVisibilidadProps) {
  return (
    <>
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Acciones Permitidas</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Crear Tarjetas</Text>
          <Switch
            value={permisos.acciones.crear}
            onValueChange={(val) => setPermisos((p: any) => ({ ...p, acciones: { ...p.acciones, crear: val } }))}
            trackColor={{ false: '#384148', true: '#0C66E4' }}
            thumbColor={permisos.acciones.crear ? '#FFF' : '#8C9BAB'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Editar Tarjetas</Text>
          <Switch
            value={permisos.acciones.editar}
            onValueChange={(val) => setPermisos((p: any) => ({ ...p, acciones: { ...p.acciones, editar: val } }))}
            trackColor={{ false: '#384148', true: '#0C66E4' }}
            thumbColor={permisos.acciones.editar ? '#FFF' : '#8C9BAB'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Borrar Tarjetas</Text>
          <Switch
            value={permisos.acciones.borrar}
            onValueChange={(val) => setPermisos((p: any) => ({ ...p, acciones: { ...p.acciones, borrar: val } }))}
            trackColor={{ false: '#384148', true: '#0C66E4' }}
            thumbColor={permisos.acciones.borrar ? '#FFF' : '#8C9BAB'}
          />
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Visibilidad de Tarjetas</Text>
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[styles.selectorBtn, permisos.tarjetas_visibilidad === 'propias' && styles.selectorBtnActive]}
            onPress={() => setPermisos((p: any) => ({ ...p, tarjetas_visibilidad: 'propias' }))}
          >
            <Text style={[styles.selectorBtnText, permisos.tarjetas_visibilidad === 'propias' && styles.selectorBtnTextActive]}>Solo Propias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, permisos.tarjetas_visibilidad === 'todas' && styles.selectorBtnActive]}
            onPress={() => setPermisos((p: any) => ({ ...p, tarjetas_visibilidad: 'todas' }))}
          >
            <Text style={[styles.selectorBtnText, permisos.tarjetas_visibilidad === 'todas' && styles.selectorBtnTextActive]}>Todas</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          {permisos.tarjetas_visibilidad === 'propias' ? 'Solo verá las tarjetas que él mismo haya creado.' : 'Verá todas las tarjetas de los tableros a los que tenga acceso.'}
        </Text>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Etiquetas Operativas (Opcional)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {opcionesEtiquetas.map((tag) => {
            const isActive = etiquetas.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? '#B6C2CF' : '#384148',
                  backgroundColor: isActive ? '#B6C2CF' : '#1D2125',
                }}
                onPress={() => {
                  if (isActive) {
                    setEtiquetas((prev) => prev.filter((t) => t !== tag));
                  } else {
                    setEtiquetas((prev) => [...prev, tag]);
                  }
                }}
              >
                <Text style={{ color: isActive ? '#1D2125' : '#8C9BAB', fontSize: 14, fontWeight: '500' }}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    backgroundColor: '#22272B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#384148',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#B6C2CF', marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  switchLabel: { fontSize: 16, color: '#B6C2CF', fontWeight: '500' },
  selectorContainer: { flexDirection: 'row', gap: 12 },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#384148',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1D2125',
  },
  selectorBtnActive: { borderColor: '#0C66E4', backgroundColor: '#0C66E4' },
  selectorBtnText: { fontSize: 14, fontWeight: '600', color: '#8C9BAB' },
  selectorBtnTextActive: { color: '#FFF' },
  helperText: { fontSize: 12, color: '#8C9BAB', marginTop: 12, fontStyle: 'italic' },
});
