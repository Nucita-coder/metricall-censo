import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Filter, X, RefreshCw, Check } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';
import { OPCIONES_RESULTADO_COBRANZA, OPCIONES_TIPO_CONTACTO_COBRANZA } from '../detalle/FaseCobranza';

export interface FiltrosTableroEstado {
  estadoCobro: 'todos' | 'pendientes' | 'cobrados';
  flujo: 'todos' | 'cobranza' | 'recupero';
  resultadoEspecifico: string;
  tipoContacto: string;
}

export const FILTROS_DEFAULT: FiltrosTableroEstado = {
  estadoCobro: 'todos',
  flujo: 'todos',
  resultadoEspecifico: 'todos',
  tipoContacto: 'todos',
};

interface ModalFiltrosTableroProps {
  visible: boolean;
  onClose: () => void;
  filtros: FiltrosTableroEstado;
  setFiltros: (f: FiltrosTableroEstado) => void;
  onLimpiar: () => void;
  isCobranzaBoard?: boolean;
}

export function ModalFiltrosTablero({
  visible,
  onClose,
  filtros,
  setFiltros,
  onLimpiar,
  isCobranzaBoard = true,
}: ModalFiltrosTableroProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const update = <K extends keyof FiltrosTableroEstado>(key: K, val: FiltrosTableroEstado[K]) => {
    setFiltros({ ...filtros, [key]: val });
  };

  const isFilteredActive =
    filtros.estadoCobro !== 'todos' ||
    filtros.flujo !== 'todos' ||
    filtros.resultadoEspecifico !== 'todos' ||
    filtros.tipoContacto !== 'todos';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, WEB_MODAL_CONTAINER, isDesktop && { maxWidth: 440 }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Filter size={18} color="#3B82F6" />
              <Text style={styles.headerTitle}>Filtros del Tablero</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isFilteredActive && (
                <TouchableOpacity onPress={onLimpiar} style={styles.btnLimpiar}>
                  <RefreshCw size={13} color="#9CA3AF" />
                  <Text style={styles.btnLimpiarTxt}>Limpiar Filtros</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.btnClose}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isCobranzaBoard && (
              <>
                {/* 1. ESTADO DE COBRO / PAGO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>1. ESTADO DE COBRO / PAGO</Text>
                  <View style={styles.optionsGrid}>
                    {[
                      { key: 'todos', label: 'Todos los clientes', desc: 'Sin filtro de cobranza' },
                      { key: 'pendientes', label: 'Pagos Pendientes', desc: 'Acciones negativas y compromisos de pago sin abonar' },
                      { key: 'cobrados', label: 'Pagos Liquidados', desc: 'Cobro efectivo y cliente recuperado' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.optionBtn,
                          filtros.estadoCobro === opt.key && styles.optionBtnActive,
                        ]}
                        onPress={() => update('estadoCobro', opt.key as any)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.optionLabel, filtros.estadoCobro === opt.key && styles.optionLabelActive]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.optionDesc}>{opt.desc}</Text>
                        </View>
                        {filtros.estadoCobro === opt.key && <Check size={16} color="#3B82F6" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 2. FLUJO / PROCESO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>2. FLUJO DE TRABAJO</Text>
                  <View style={styles.pillsRow}>
                    {[
                      { key: 'todos', label: 'Todos los flujos' },
                      { key: 'cobranza', label: 'Flujo de Cobranza' },
                      { key: 'recupero', label: 'Flujo de Recupero' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => update('flujo', item.key as any)}
                        style={[styles.pill, filtros.flujo === item.key && styles.pillActive]}
                      >
                        <Text style={[styles.pillTxt, filtros.flujo === item.key && styles.pillTxtActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 3. TIPO DE CONTACTO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>3. TIPO DE CONTACTO</Text>
                  <View style={styles.pillsRow}>
                    <TouchableOpacity
                      onPress={() => update('tipoContacto', 'todos')}
                      style={[styles.pill, filtros.tipoContacto === 'todos' && styles.pillActive]}
                    >
                      <Text style={[styles.pillTxt, filtros.tipoContacto === 'todos' && styles.pillTxtActive]}>
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {OPCIONES_TIPO_CONTACTO_COBRANZA.map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        onPress={() => update('tipoContacto', tipo)}
                        style={[styles.pill, filtros.tipoContacto === tipo && styles.pillActive]}
                      >
                        <Text style={[styles.pillTxt, filtros.tipoContacto === tipo && styles.pillTxtActive]}>
                          {tipo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 4. RESULTADO / CAUSA ESPECÍFICA */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>4. RESULTADO / CAUSA ESPECÍFICA</Text>
                  <View style={styles.pillsRow}>
                    <TouchableOpacity
                      onPress={() => update('resultadoEspecifico', 'todos')}
                      style={[styles.pill, filtros.resultadoEspecifico === 'todos' && styles.pillActive]}
                    >
                      <Text style={[styles.pillTxt, filtros.resultadoEspecifico === 'todos' && styles.pillTxtActive]}>
                        Todas las causas
                      </Text>
                    </TouchableOpacity>
                    {OPCIONES_RESULTADO_COBRANZA.map((res) => (
                      <TouchableOpacity
                        key={res}
                        onPress={() => update('resultadoEspecifico', res)}
                        style={[styles.pill, filtros.resultadoEspecifico === res && styles.pillActive]}
                      >
                        <Text style={[styles.pillTxt, filtros.resultadoEspecifico === res && styles.pillTxtActive]}>
                          {res}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnAplicar} onPress={onClose}>
              <Text style={styles.btnAplicarTxt}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    width: '100%',
    maxHeight: '85%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#020617',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  btnLimpiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  btnLimpiarTxt: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  btnClose: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  optionsGrid: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  optionLabelActive: {
    color: '#60A5FA',
    fontWeight: 'bold',
  },
  optionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  pillTxt: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pillTxtActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#020617',
  },
  btnAplicar: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAplicarTxt: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
