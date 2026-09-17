import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Paperclip, X } from 'lucide-react-native';
import { InputTexto, SelectDropdown } from '../../venta/CamposVenta';
import { TarjetaDatosValores } from '../../../types/kanban';

interface SeccionAdjuntosResponsablesProps {
  formData: TarjetaDatosValores;
  updateHeaderField: (key: string, val: unknown) => void;
  readOnly?: boolean;
  isDevolucionMode: boolean;
  isAsignadoMode?: boolean;
  adjuntos: string[];
  subiendoImagen: boolean;
  handleAdjuntarFotoFactura: () => void;
  handleRemoveAdjunto: (index: number) => void;
  nombreCompleto?: string | null;
}

export const SeccionAdjuntosResponsables: React.FC<SeccionAdjuntosResponsablesProps> = ({
  formData,
  updateHeaderField,
  readOnly = false,
  isDevolucionMode,
  isAsignadoMode = false,
  adjuntos,
  subiendoImagen,
  handleAdjuntarFotoFactura,
  handleRemoveAdjunto,
  nombreCompleto,
}) => {
  return (
    <>
      {/* 3. ADJUNTO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. ADJUNTO</Text>
        <Text style={styles.sectionSubDesc}>
          Sube fotos de la nota de entrega, guía o estado de la devolución.
        </Text>
        {!readOnly && (
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAdjuntarFotoFactura}
            disabled={subiendoImagen}
          >
            {subiendoImagen ? (
              <ActivityIndicator size="small" color="#8C9BAB" />
            ) : (
              <>
                <Paperclip size={16} color="#8C9BAB" />
                <Text style={styles.attachBtnText}>Adjuntar archivo / foto</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {adjuntos.length > 0 && (
          <View style={styles.adjuntosGrid}>
            {adjuntos.map((uri, i) => (
              <View key={i} style={styles.adjuntoThumbnail}>
                <ImageBackground source={{ uri }} style={styles.adjuntoImg}>
                  {!readOnly && (
                    <TouchableOpacity
                      style={styles.removeAdjuntoBtn}
                      onPress={() => handleRemoveAdjunto(i)}
                    >
                      <X size={12} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </ImageBackground>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. RESPONSABLES Y MOTIVO */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {isDevolucionMode || isAsignadoMode ? '4. RESPONSABLES Y MOTIVO' : '4. RESPONSABLES'}
        </Text>
        <View style={styles.row}>
          {isDevolucionMode ? (
            <>
              <View style={styles.flex1}>
                <InputTexto
                  label="Devuelto por"
                  value={nombreCompleto || formData.entregadoPor || ''}
                  placeholder="Tu usuario"
                  isRequired
                  readOnly
                />
              </View>
              <View style={styles.flex1}>
                <InputTexto
                  label="Entregado a"
                  value={formData.recibidoPor}
                  onChangeText={(v) => updateHeaderField('recibidoPor', v)}
                  placeholder="Ej. Juan Pérez (Almacén)"
                  isRequired
                  readOnly={readOnly}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.flex1}>
                <InputTexto
                  label="Recibido por"
                  value={formData.recibidoPor}
                  onChangeText={(v) => updateHeaderField('recibidoPor', v)}
                  placeholder="Ej. Juan Pérez (Almacén)"
                  isRequired
                  readOnly={readOnly}
                />
              </View>
              <View style={styles.flex1}>
                <InputTexto
                  label="Entregado por"
                  value={formData.entregadoPor}
                  onChangeText={(v) => updateHeaderField('entregadoPor', v)}
                  placeholder="Ej. Transporte / Personal"
                  isRequired
                  readOnly={readOnly}
                />
              </View>
            </>
          )}
        </View>
        {isDevolucionMode && (
          <SelectDropdown
            label="Motivo de Devolución"
            value={formData.motivoAsignacion}
            onSelect={(v) => updateHeaderField('motivoAsignacion', v)}
            options={[
              'Sobrante de Instalación',
              'Material Defectuoso',
              'Cambio de Equipo',
              'Fin de Proyecto',
              'Otras',
            ]}
            placeholder="Seleccionar motivo de devolución..."
            isRequired
            disabled={readOnly}
          />
        )}
        {isAsignadoMode && (
          <SelectDropdown
            label="Motivo de Asignación"
            value={formData.motivoAsignacion}
            onSelect={(v) => updateHeaderField('motivoAsignacion', v)}
            options={[
              'Instalaciones',
              'Construcción',
              'Verticales',
              'Fallas FTTH',
              'Fallas FTTX',
              'Otras',
            ]}
            placeholder="Seleccionar motivo..."
            isRequired
            disabled={readOnly}
          />
        )}
      </View>
    </>
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
  sectionSubDesc: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 12,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  attachBtnText: {
    color: '#B6C2CF',
    fontSize: 12,
    fontWeight: '600',
  },
  adjuntosGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adjuntoThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1D2125',
  },
  adjuntoImg: {
    width: '100%',
    height: '100%',
  },
  removeAdjuntoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
});
