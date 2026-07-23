import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Save, LifeBuoy, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { SelectDropdown } from '../venta/CamposVenta';

interface TarjetaSoporteTecnicoProps {
  empresaId: string | null;
  userRol: string;
}

interface MiembroPerfil {
  id: string;
  nombre_completo: string;
  rol: string;
}

export function TarjetaSoporteTecnico({ empresaId, userRol }: TarjetaSoporteTecnicoProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [miembros, setMiembros] = useState<MiembroPerfil[]>([]);
  const [selectedNombre, setSelectedNombre] = useState<string>('');
  const [currentSoporteId, setCurrentSoporteId] = useState<string | null>(null);

  useEffect(() => {
    if (empresaId) {
      cargarDatos();
    }
  }, [empresaId]);

  const cargarDatos = async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      // 1. Obtener miembros de la empresa
      const { data: perfilesData, error: errorPerfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol')
        .eq('empresa_id', empresaId)
        .order('nombre_completo', { ascending: true });

      if (errorPerfiles) throw errorPerfiles;

      setMiembros(perfilesData || []);

      // 2. Obtener soporte_tecnico_id actual de la empresa
      const { data: empresaData, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('soporte_tecnico_id')
        .eq('id', empresaId)
        .maybeSingle();

      if (!errorEmpresa && empresaData?.soporte_tecnico_id) {
        setCurrentSoporteId(empresaData.soporte_tecnico_id);
        const asignado = (perfilesData || []).find((m) => m.id === empresaData.soporte_tecnico_id);
        if (asignado) {
          setSelectedNombre(asignado.nombre_completo);
        }
      }
    } catch (e: any) {
      console.warn('Error al cargar miembros o soporte:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSoporte = async () => {
    if (!empresaId) return;
    try {
      setSaving(true);
      const miembroEncontrado = miembros.find((m) => m.nombre_completo === selectedNombre);
      const nuevoId = miembroEncontrado ? miembroEncontrado.id : null;

      const { error } = await supabase
        .from('empresas')
        .update({ soporte_tecnico_id: nuevoId })
        .eq('id', empresaId);

      if (error) throw error;

      setCurrentSoporteId(nuevoId);
      Alert.alert('Éxito', 'Encargado de Soporte Técnico actualizado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el soporte técnico.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#0C66E4" />
      </View>
    );
  }

  const opcionesDropdown = ['Ninguno', ...miembros.map((m) => m.nombre_completo)];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <LifeBuoy size={20} color="#0C66E4" />
        <Text style={styles.cardTitle}>Encargado de Soporte Técnico</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        Selecciona al miembro del equipo que responderá las consultas directas cuando los usuarios hagan clic en el botón de ayuda (?).
      </Text>

      <View style={styles.fieldGroup}>
        <SelectDropdown
          label="Usuario Encargado de Soporte"
          value={selectedNombre}
          options={opcionesDropdown}
          onSelect={(val) => setSelectedNombre(val)}
          placeholder="Seleccionar encargado..."
          disabled={userRol !== 'lider' && userRol !== 'admin'}
        />
      </View>

      {(userRol === 'lider' || userRol === 'admin') && (
        <TouchableOpacity
          style={[styles.btnSave, saving && { opacity: 0.7 }]}
          onPress={handleSaveSoporte}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Save size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnSaveText}>Guardar Asignación</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {currentSoporteId && (
        <View style={styles.badgeAsignado}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.badgeText}>Soporte activo asignado correctamente</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#22272B',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#384148',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  btnSave: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  badgeAsignado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#1C3829',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgeText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
});
