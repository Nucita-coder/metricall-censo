import React from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Filter, X, RefreshCw } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../../constants/theme';
import { SelectDropdown } from '../../venta/CamposVenta';
import { OPCIONES_RESULTADO_COBRANZA, OPCIONES_TIPO_CONTACTO_COBRANZA } from '../detalle/FaseCobranza';
import { styles } from './ModalFiltrosTablero.styles';

export interface FiltrosTableroEstado {
  estadoCobro: 'todos' | 'pendientes' | 'cobrados';
  flujo: 'todos' | 'cobranza' | 'recupero';
  resultadoEspecifico: string;
  tipoContacto: string;
  orden: 'recientes' | 'antiguas';
  listaId: string;
  etiqueta: string;
  rangoFecha: 'todos' | 'hoy' | '7dias' | 'este_mes';
}

export const FILTROS_DEFAULT: FiltrosTableroEstado = {
  estadoCobro: 'todos',
  flujo: 'todos',
  resultadoEspecifico: 'todos',
  tipoContacto: 'todos',
  orden: 'recientes',
  listaId: 'todas',
  etiqueta: 'todas',
  rangoFecha: 'todos',
};

interface ModalFiltrosTableroProps {
  visible: boolean;
  onClose: () => void;
  filtros: FiltrosTableroEstado;
  setFiltros: (f: FiltrosTableroEstado) => void;
  onLimpiar: () => void;
  isCobranzaBoard?: boolean;
  listas?: { id: string; nombre: string }[];
}

const OPCIONES_ORDEN = ['Más recientes primero', 'Más antiguas primero'];
const ORDEN_MAP_LABEL: Record<string, string> = {
  recientes: 'Más recientes primero',
  antiguas: 'Más antiguas primero',
};
const ORDEN_MAP_KEY: Record<string, 'recientes' | 'antiguas'> = {
  'Más recientes primero': 'recientes',
  'Más antiguas primero': 'antiguas',
};

const OPCIONES_ETIQUETAS = [
  'Todas las etiquetas',
  'PAGO PROCESADO',
  'PAGO EN REVISIÓN',
  'PAGO RECHAZADO',
  'PROCESADO EN SAE',
];

const OPCIONES_FECHAS = ['Todas las fechas', 'Hoy', 'Últimos 7 días', 'Este mes'];
const FECHA_MAP_LABEL: Record<string, string> = {
  todos: 'Todas las fechas',
  hoy: 'Hoy',
  '7dias': 'Últimos 7 días',
  este_mes: 'Este mes',
};
const FECHA_MAP_KEY: Record<string, 'todos' | 'hoy' | '7dias' | 'este_mes'> = {
  'Todas las fechas': 'todos',
  'Hoy': 'hoy',
  'Últimos 7 días': '7dias',
  'Este mes': 'este_mes',
};

const OPCIONES_ESTADO_COBRO = ['Todos los clientes', 'Pagos Pendientes', 'Pagos Liquidados'];
const ESTADO_COBRO_MAP_LABEL: Record<string, string> = {
  todos: 'Todos los clientes',
  pendientes: 'Pagos Pendientes',
  cobrados: 'Pagos Liquidados',
};
const ESTADO_COBRO_MAP_KEY: Record<string, 'todos' | 'pendientes' | 'cobrados'> = {
  'Todos los clientes': 'todos',
  'Pagos Pendientes': 'pendientes',
  'Pagos Liquidados': 'cobrados',
};

const OPCIONES_FLUJO = ['Todos los flujos', 'Flujo de Cobranza', 'Flujo de Recupero'];
const FLUJO_MAP_LABEL: Record<string, string> = {
  todos: 'Todos los flujos',
  cobranza: 'Flujo de Cobranza',
  recupero: 'Flujo de Recupero',
};
const FLUJO_MAP_KEY: Record<string, 'todos' | 'cobranza' | 'recupero'> = {
  'Todos los flujos': 'todos',
  'Flujo de Cobranza': 'cobranza',
  'Flujo de Recupero': 'recupero',
};

export function ModalFiltrosTablero({
  visible,
  onClose,
  filtros,
  setFiltros,
  onLimpiar,
  isCobranzaBoard = false,
  listas = [],
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
    filtros.tipoContacto !== 'todos' ||
    (filtros.orden && filtros.orden !== 'recientes') ||
    (filtros.listaId && filtros.listaId !== 'todas') ||
    (filtros.etiqueta && filtros.etiqueta !== 'todas') ||
    (filtros.rangoFecha && filtros.rangoFecha !== 'todos');

  const opcionesListas = ['Todas las listas', ...listas.map((l) => l.nombre)];
  const listaSeleccionadaNombre =
    filtros.listaId && filtros.listaId !== 'todas'
      ? listas.find((l) => l.id === filtros.listaId)?.nombre || 'Todas las listas'
      : 'Todas las listas';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, WEB_MODAL_CONTAINER, isDesktop && { maxWidth: 460 }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Filter size={18} color="#8C9BAB" />
              <Text style={styles.headerTitle}>Filtros del Tablero</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isFilteredActive && (
                <TouchableOpacity onPress={onLimpiar} style={styles.btnLimpiar}>
                  <RefreshCw size={13} color="#8C9BAB" />
                  <Text style={styles.btnLimpiarTxt}>Limpiar Filtros</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.btnClose}>
                <X size={20} color="#8C9BAB" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. ORDEN DE TARJETAS */}
            <SelectDropdown
              label="Orden de Tarjetas"
              options={OPCIONES_ORDEN}
              value={ORDEN_MAP_LABEL[filtros.orden || 'recientes']}
              onSelect={(val) => update('orden', ORDEN_MAP_KEY[val] || 'recientes')}
              compact
            />

            {/* 2. FILTRAR POR LISTA ESPECÍFICA */}
            {listas && listas.length > 0 && (
              <SelectDropdown
                label="Filtrar por Lista"
                options={opcionesListas}
                value={listaSeleccionadaNombre}
                onSelect={(val) => {
                  if (val === 'Todas las listas') {
                    update('listaId', 'todas');
                  } else {
                    const l = listas.find((item) => item.nombre === val);
                    update('listaId', l ? l.id : 'todas');
                  }
                }}
                compact
              />
            )}

            {/* 3. ESTATUS DE PAGO / ETIQUETA */}
            <SelectDropdown
              label="Estatus de Pago / Etiqueta"
              options={OPCIONES_ETIQUETAS}
              value={filtros.etiqueta === 'todas' ? 'Todas las etiquetas' : filtros.etiqueta}
              onSelect={(val) => update('etiqueta', val === 'Todas las etiquetas' ? 'todas' : val)}
              compact
            />

            {/* 4. RANGO DE FECHA */}
            <SelectDropdown
              label="Rango de Fecha"
              options={OPCIONES_FECHAS}
              value={FECHA_MAP_LABEL[filtros.rangoFecha || 'todos']}
              onSelect={(val) => update('rangoFecha', FECHA_MAP_KEY[val] || 'todos')}
              compact
            />

            {/* SECCIONES ESPECÍFICAS DE COBRANZA */}
            {isCobranzaBoard && (
              <>
                <SelectDropdown
                  label="Estado de Cobro / Pago"
                  options={OPCIONES_ESTADO_COBRO}
                  value={ESTADO_COBRO_MAP_LABEL[filtros.estadoCobro || 'todos']}
                  onSelect={(val) => update('estadoCobro', ESTADO_COBRO_MAP_KEY[val] || 'todos')}
                  compact
                />

                <SelectDropdown
                  label="Flujo de Trabajo"
                  options={OPCIONES_FLUJO}
                  value={FLUJO_MAP_LABEL[filtros.flujo || 'todos']}
                  onSelect={(val) => update('flujo', FLUJO_MAP_KEY[val] || 'todos')}
                  compact
                />

                <SelectDropdown
                  label="Tipo de Contacto"
                  options={['Todos', ...OPCIONES_TIPO_CONTACTO_COBRANZA]}
                  value={filtros.tipoContacto === 'todos' ? 'Todos' : filtros.tipoContacto}
                  onSelect={(val) => update('tipoContacto', val === 'Todos' ? 'todos' : val)}
                  compact
                />

                <SelectDropdown
                  label="Resultado / Causa Específica"
                  options={['Todas las causas', ...OPCIONES_RESULTADO_COBRANZA]}
                  value={filtros.resultadoEspecifico === 'todos' ? 'Todas las causas' : filtros.resultadoEspecifico}
                  onSelect={(val) => update('resultadoEspecifico', val === 'Todas las causas' ? 'todos' : val)}
                  compact
                />
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
