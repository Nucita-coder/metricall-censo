import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SeccionComentariosProps {
  nuevoComentario: string;
  setNuevoComentario: (c: string) => void;
  handleEnviarComentario: () => void;
  isSaving: boolean;
  puedeEditar: boolean;
  comentarios: any[];
  isDesktop: boolean;
}

export function SeccionComentarios({
  nuevoComentario,
  setNuevoComentario,
  handleEnviarComentario,
  isSaving,
  puedeEditar,
  comentarios,
  isDesktop,
}: SeccionComentariosProps) {
  return (
    <View
      style={{
        flex: 1,
        marginTop: isDesktop ? 0 : 24,
        borderLeftWidth: isDesktop ? 1 : 0,
        borderTopWidth: isDesktop ? 0 : 1,
        borderColor: '#384148',
        paddingLeft: isDesktop ? 24 : 0,
        paddingTop: isDesktop ? 0 : 20,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#B6C2CF', marginBottom: 16 }}>COMENTARIOS Y ACTIVIDAD</Text>

      <View style={{ flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <TextInput
          style={{
            backgroundColor: '#1D2125',
            borderWidth: 1,
            borderColor: '#384148',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            minHeight: 80,
            fontSize: 15,
            color: '#FFF',
          }}
          placeholder="Escribe un comentario..."
          placeholderTextColor="#8C9BAB"
          multiline
          value={nuevoComentario}
          onChangeText={setNuevoComentario}
          editable={!isSaving}
        />
        <TouchableOpacity
          style={{
            backgroundColor: '#0C66E4',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignSelf: 'flex-start',
            opacity: !nuevoComentario.trim() || isSaving || !puedeEditar ? 0.5 : 1,
          }}
          onPress={handleEnviarComentario}
          disabled={!nuevoComentario.trim() || isSaving || !puedeEditar}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {!comentarios || comentarios.length === 0 ? (
        <Text style={{ textAlign: 'left', color: '#8C9BAB', fontSize: 14, marginTop: 12 }}>No hay comentarios aún.</Text>
      ) : (
        comentarios.map((c: any, i: number) => (
          <View key={i} style={{ backgroundColor: '#2C333A', padding: 14, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#8C9BAB', marginBottom: 6 }}>
              {c.autor} • {c.fecha}
            </Text>
            <Text style={{ fontSize: 14, color: '#B6C2CF', lineHeight: 20 }}>{c.texto}</Text>
          </View>
        ))
      )}
    </View>
  );
}
