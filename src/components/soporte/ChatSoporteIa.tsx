import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Send, Bot, RotateCcw, User } from 'lucide-react-native';
import { consultarSoporteIa, MensajeIa } from '../../services/soporteIaService';
import { useAuth } from '../../context/AuthContext';
import { styles } from './ChatSoporteIa.styles';

const MENSAJE_BIENVENIDA: MensajeIa = {
  id: 'bienvenida',
  rol: 'asistente',
  texto:
    '¡Hola! Soy tu asistente de Soporte Técnico con Inteligencia Artificial.\n\nTengo el contexto completo de cómo funciona Metricall y las operaciones de campo:\n• Flujos de tableros (Venta, Factibilidad con LCH, Por Instalar, En Proceso, Por Activar, Liberada).\n• Parámetros ópticos de fibra (dBm en NAP y casa, atenuación, luz roja/LOS).\n• Censo comercial y conversión a venta.\n• Almacén, custodia de materiales y devoluciones.\n\n¿En qué te puedo orientar hoy?',
  fecha: new Date().toISOString(),
};

export function ChatSoporteIa() {
  const { nombreCompleto, userRol, empresaId } = useAuth();
  const [mensajes, setMensajes] = useState<MensajeIa[]>([MENSAJE_BIENVENIDA]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [mensajes, isLoading]);

  const handleEnviar = async () => {
    const textoLimpio = inputText.trim();
    if (!textoLimpio || isLoading) return;

    const nuevoMensajeUsuario: MensajeIa = {
      id: Date.now().toString(),
      rol: 'usuario',
      texto: textoLimpio,
      fecha: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInputText('');
    setIsLoading(true);

    try {
      const respuesta = await consultarSoporteIa(
        mensajes,
        textoLimpio,
        {
          nombre: nombreCompleto || undefined,
          rol: userRol || undefined,
          empresa: empresaId || undefined,
        }
      );

      const nuevoMensajeIa: MensajeIa = {
        id: (Date.now() + 1).toString(),
        rol: 'asistente',
        texto: respuesta,
        fecha: new Date().toISOString(),
      };

      setMensajes((prev) => [...prev, nuevoMensajeIa]);
    } catch (e: unknown) {
      const errorIa: MensajeIa = {
        id: (Date.now() + 1).toString(),
        rol: 'asistente',
        texto:
          'Ocurrió un error inesperado al procesar tu consulta. Por favor, intenta de nuevo.',
        fecha: new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, errorIa]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReiniciar = () => {
    setMensajes([
      {
        ...MENSAJE_BIENVENIDA,
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
      },
    ]);
  };

  const formatHora = (fechaIso: string) => {
    try {
      const d = new Date(fechaIso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra superior de estado / reinicio */}
      <View style={styles.topBar}>
        <View style={styles.botInfoRow}>
          <View style={styles.botBadge}>
            <Bot size={14} color="#579DFF" />
            <Text style={styles.botBadgeText}>METRICALL IA 24/7</Text>
          </View>
          <Text style={styles.statusOnline}>En línea</Text>
        </View>
        <TouchableOpacity
          style={styles.btnReiniciar}
          onPress={handleReiniciar}
          disabled={isLoading}
        >
          <RotateCcw size={14} color="#8C9BAB" />
          <Text style={styles.btnReiniciarText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      {/* Cuerpo del chat */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {mensajes.map((m) => {
          const esUsuario = m.rol === 'usuario';
          return (
            <View
              key={m.id}
              style={[
                styles.messageRow,
                esUsuario ? styles.rowUsuario : styles.rowAsistente,
              ]}
            >
              {!esUsuario && (
                <View style={styles.avatarBot}>
                  <Bot size={16} color="#579DFF" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  esUsuario ? styles.bubbleUsuario : styles.bubbleAsistente,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    esUsuario ? styles.textUsuario : styles.textAsistente,
                  ]}
                >
                  {m.texto}
                </Text>
                <Text
                  style={[
                    styles.timeText,
                    esUsuario ? styles.timeUsuario : styles.timeAsistente,
                  ]}
                >
                  {formatHora(m.fecha)}
                </Text>
              </View>

              {esUsuario && (
                <View style={styles.avatarUsuario}>
                  <User size={14} color="#FFF" />
                </View>
              )}
            </View>
          );
        })}

        {isLoading && (
          <View style={[styles.messageRow, styles.rowAsistente]}>
            <View style={styles.avatarBot}>
              <Bot size={16} color="#579DFF" />
            </View>
            <View style={[styles.bubble, styles.bubbleAsistente, styles.bubbleLoading]}>
              <ActivityIndicator size="small" color="#579DFF" />
              <Text style={styles.loadingText}>
                Analizando con el contexto de Metricall...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input de mensajes */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu duda sobre el sistema o una falla técnica..."
          placeholderTextColor="#8C9BAB"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
          ]}
          onPress={handleEnviar}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={18} color="#1D2125" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
