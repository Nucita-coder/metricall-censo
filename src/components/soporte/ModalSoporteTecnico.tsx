import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { X, LifeBuoy, Bot, User } from 'lucide-react-native';
import { styles } from './ModalSoporteTecnico.styles';
import { ChatSoporteIa } from './ChatSoporteIa';
import { ChatSoporteHumano } from './ChatSoporteHumano';
import { ModalSoporteTecnicoProps, TabSoporte } from './types';

export function ModalSoporteTecnico({ visible, onClose }: ModalSoporteTecnicoProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const [tabActivo, setTabActivo] = useState<TabSoporte>('ia');

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {/* Header principal */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LifeBuoy size={22} color="#0C66E4" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.title}>Soporte Técnico</Text>
                <Text style={styles.subtitle}>Centro de Asistencia Operativa y Técnica</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#B6C2CF" />
            </TouchableOpacity>
          </View>

          {/* Barra de pestañas para alternar entre Asistente IA y Soporte Humano */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, tabActivo === 'ia' && styles.tabBtnActive]}
              onPress={() => setTabActivo('ia')}
            >
              <Bot size={18} color={tabActivo === 'ia' ? '#579DFF' : '#8C9BAB'} />
              <Text style={[styles.tabText, tabActivo === 'ia' && styles.tabTextActive]}>
                Asistente IA (24/7)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tabActivo === 'humano' && styles.tabBtnActive]}
              onPress={() => setTabActivo('humano')}
            >
              <User size={18} color={tabActivo === 'humano' ? '#579DFF' : '#8C9BAB'} />
              <Text style={[styles.tabText, tabActivo === 'humano' && styles.tabTextActive]}>
                Soporte Humano
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido según la pestaña activa */}
          {tabActivo === 'ia' ? <ChatSoporteIa /> : <ChatSoporteHumano />}
        </View>
      </View>
    </Modal>
  );
}
