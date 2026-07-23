import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { X, HelpCircle, BookOpen, Layers, ShieldCheck, LifeBuoy, ChevronRight } from 'lucide-react-native';

interface ModalCentroAyudaProps {
  visible: boolean;
  onClose: () => void;
}

interface SeccionFaq {
  id: string;
  icon: any;
  titulo: string;
  descripcion: string;
  detalles: string[];
}

const FAQ_SECCIONES: SeccionFaq[] = [
  {
    id: 'flujo',
    icon: Layers,
    titulo: 'Flujo de Trabajo y Tarjetas Kanban',
    descripcion: 'Metricall organiza los procesos en 5 fases estandarizadas:',
    detalles: [
      '1. Censo: Captura inicial de datos estructurados de clientes o prospectos en campo.',
      '2. Factibilidad: Verificación de cobertura técnica, puertos y viabilidad de servicio.',
      '3. Por Instalar: Asignación de cuadrillas y ejecución de trabajos de instalación.',
      '4. Por Activar: Pruebas de señal, configuración de equipos y validación de servicio.',
      '5. Liberada: Finalización del proceso e ingreso oficial del cliente al sistema.',
    ],
  },
  {
    id: 'formularios',
    icon: BookOpen,
    titulo: 'Formularios Dinámicos y Datos',
    descripcion: 'Garantía de calidad de datos sin texto libre desordenado:',
    detalles: [
      '• Cada lista cuenta con campos tabulados y validados dinámicamente.',
      '• Al mover una tarjeta de fase, el sistema valida que los campos requeridos estén completos.',
      '• Puedes adjuntar fotos de evidencia y documentos directamente a la tarjeta.',
    ],
  },
  {
    id: 'permisos',
    icon: ShieldCheck,
    titulo: 'Jerarquía y Permisos de Usuario',
    descripcion: 'Sistema de control de acceso en dos capas:',
    detalles: [
      '• Líder (Admin): Control total de la empresa, sucursales, tableros y usuarios.',
      '• Supervisor / Líder Sucursal: Gestión de tableros y supervisión de equipos locales.',
      '• Empleado: Creación y actualización de tarjetas asignadas.',
      '• Permisos Especiales: El admin puede habilitar/deshabilitar acciones granulares.',
    ],
  },
  {
    id: 'soporte',
    icon: LifeBuoy,
    titulo: 'Soporte Técnico Directo',
    descripcion: '¿Tienes una duda o falla técnica específica?',
    detalles: [
      '• Puedes chatear directamente con el encargado de soporte de tu empresa.',
      '• Ve al Menú Principal (barra lateral) y selecciona "Soporte Técnico".',
      '• El soporte responderá tus consultas en tiempo real dentro de la aplicación.',
    ],
  },
];

export function ModalCentroAyuda({ visible, onClose }: ModalCentroAyudaProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const [activeTab, setActiveTab] = useState<string>('flujo');

  if (!visible) return null;

  const seccionSeleccionada = FAQ_SECCIONES.find((s) => s.id === activeTab) || FAQ_SECCIONES[0];
  const IconoActual = seccionSeleccionada.icon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <HelpCircle size={22} color="#0C66E4" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.title}>Centro de Ayuda y Guía</Text>
                <Text style={styles.subtitle}>Preguntas frecuentes y explicación del flujo</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
            {/* Tabs Sidebar */}
            <View style={[styles.sidebar, isDesktop ? { width: 220 } : { flexDirection: 'row', flexWrap: 'wrap' }]}>
              {FAQ_SECCIONES.map((sec) => {
                const SecIcon = sec.icon;
                const isActive = sec.id === activeTab;
                return (
                  <TouchableOpacity
                    key={sec.id}
                    style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                    onPress={() => setActiveTab(sec.id)}
                  >
                    <SecIcon size={18} color={isActive ? '#0C66E4' : '#8C9BAB'} />
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                      {sec.titulo.split(' ')[0]} {sec.titulo.split(' ')[1] || ''}
                    </Text>
                    {isDesktop && <ChevronRight size={16} color={isActive ? '#0C66E4' : 'transparent'} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Content Area */}
            <ScrollView style={styles.contentArea} contentContainerStyle={{ padding: 20 }}>
              <View style={styles.titleCard}>
                <IconoActual size={28} color="#0C66E4" />
                <Text style={styles.sectionTitle}>{seccionSeleccionada.titulo}</Text>
              </View>

              <Text style={styles.sectionDesc}>{seccionSeleccionada.descripcion}</Text>

              <View style={styles.detallesList}>
                {seccionSeleccionada.detalles.map((item, idx) => (
                  <View key={idx} style={styles.itemBox}>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', maxWidth: 700, height: 520, backgroundColor: '#22272B', borderRadius: 16, borderWidth: 1, borderColor: '#384148', overflow: 'hidden' },
  containerDesktop: { height: 550 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#1D2125', borderBottomWidth: 1, borderBottomColor: '#384148' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 13, color: '#8C9BAB' },
  closeBtn: { padding: 4 },
  sidebar: { backgroundColor: '#1D2125', borderRightWidth: 1, borderRightColor: '#384148', padding: 12, gap: 6 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, gap: 10, borderWidth: 1, borderColor: 'transparent' },
  tabBtnActive: { backgroundColor: '#22272B', borderColor: '#0C66E4' },
  tabText: { fontSize: 14, color: '#8C9BAB', flex: 1, fontWeight: '600' },
  tabTextActive: { color: '#FFF', fontWeight: 'bold' },
  contentArea: { flex: 1, backgroundColor: '#22272B' },
  titleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  sectionDesc: { fontSize: 14, color: '#B6C2CF', marginBottom: 16, lineHeight: 22 },
  detallesList: { gap: 10 },
  itemBox: { backgroundColor: '#1D2125', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#384148' },
  itemText: { color: '#B6C2CF', fontSize: 14, lineHeight: 22 },
});
