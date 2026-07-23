import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, ScrollView, Platform, TextInput, ActivityIndicator, Image } from 'react-native';
import Reanimated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { X, Star, Copy, Info, Archive, Plus, Image as ImageIcon } from 'lucide-react-native';

let Slider: any = null;
if (Platform.OS !== 'web') {
  Slider = require('@react-native-community/slider').default;
}

interface ModalTableroMenuProps {
  visible: boolean;
  onClose: () => void;
  tableroInfo: any;
  miembros: any[];
  toggleFavorite: () => void;
  handleCloneTablero: () => void;
  saveDescripcion: () => void;
  tempDesc: string;
  setTempDesc: (desc: string) => void;
  fetchArchivedCards: () => void;
  handleOpacityChange: (val: number) => void;
  saveOpacityConfig: (val: number) => void;
  handleCambiarFondo?: () => void;
  isUploadingImage?: boolean;
}

export const ModalTableroMenu = ({
  visible,
  onClose,
  tableroInfo,
  miembros,
  toggleFavorite,
  handleCloneTablero,
  saveDescripcion,
  tempDesc,
  setTempDesc,
  fetchArchivedCards,
  handleOpacityChange,
  saveOpacityConfig,
  handleCambiarFondo,
  isUploadingImage
}: ModalTableroMenuProps) => {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, flexDirection: 'row', justifyContent: 'flex-end', pointerEvents: 'box-none' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Reanimated.View
        entering={SlideInRight.duration(250)}
        exiting={SlideOutRight.duration(200)}
        style={styles.modalContentSide}
      >
        <View style={styles.sideHeader}>
          <Text style={styles.sideTitle}>Menú del Tablero</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#B6C2CF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={toggleFavorite}>
              <Star size={24} color={tableroInfo?.es_favorito ? "#FFC107" : "#FFF"} fill={tableroInfo?.es_favorito ? "#FFC107" : "transparent"} />
              <Text style={styles.quickActionText}>Favorito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleCloneTablero}>
              <Copy size={24} color="#FFF" />
              <Text style={styles.quickActionText}>Clonar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionSubtitle}>Miembros</Text>
            <View style={styles.membersRow}>
              {miembros.map((m, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.memberAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}
                  onPress={() => setSelectedMember(m)}
                  activeOpacity={0.7}
                >
                  {m.avatar_url ? (
                    <Image source={{ uri: m.avatar_url }} style={styles.memberAvatarImg} />
                  ) : (
                    <Text style={styles.memberAvatarText}>
                      {m.nombre_completo ? m.nombre_completo.substring(0, 2).toUpperCase() : 'US'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              <View style={styles.memberAvatarAdd}>
                <Plus size={16} color="#8C9BAB" />
              </View>
            </View>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuListItem}
              onPress={() => {
                setTempDesc(tableroInfo?.descripcion || '');
                setIsEditingDesc(!isEditingDesc);
              }}
            >
              <Info size={20} color="#B6C2CF" />
              <Text style={styles.menuListText}>Acerca de este tablero</Text>
            </TouchableOpacity>

            {isEditingDesc && (
              <View style={styles.descEditor}>
                <TextInput
                  style={styles.descInput}
                  multiline
                  value={tempDesc}
                  onChangeText={setTempDesc}
                  placeholder="Añade una descripción al tablero..."
                />
                <TouchableOpacity style={styles.descSaveBtn} onPress={() => {
                  saveDescripcion();
                  setIsEditingDesc(false);
                }}>
                  <Text style={styles.descSaveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.menuListItem} onPress={fetchArchivedCards}>
              <Archive size={20} color="#B6C2CF" />
              <Text style={styles.menuListText}>Tarjetas archivadas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionSubtitle}>Diseño del Tablero</Text>
            
            {handleCambiarFondo && (
              <TouchableOpacity 
                style={[styles.menuListItem, { marginBottom: 12 }]} 
                onPress={handleCambiarFondo}
                disabled={isUploadingImage}
              >
                <ImageIcon size={20} color="#B6C2CF" />
                <Text style={[styles.menuListText, { flex: 1 }]}>
                  {isUploadingImage ? 'Subiendo imagen de fondo...' : 'Cambiar fondo del tablero'}
                </Text>
                {isUploadingImage && <ActivityIndicator size="small" color="#0C66E4" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            )}

            <Text style={styles.menuListText}>Opacidad de las listas</Text>
            {Platform.OS !== 'web' && Slider ? (
              <Slider
                style={{ width: '100%', height: 40, marginTop: 8 }}
                minimumValue={0.1}
                maximumValue={1.0}
                step={0.05}
                value={tableroInfo?.opacidad_listas || 0.85}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="#CCCCCC"
                onValueChange={handleOpacityChange}
                onSlidingComplete={saveOpacityConfig}
              />
            ) : (
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                defaultValue={tableroInfo?.opacidad_listas || 0.85}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                onMouseUp={(e: any) => saveOpacityConfig(Number(e.target.value))}
                style={{ width: '100%', marginTop: 8 } as any}
              />
            )}
          </View>
        </ScrollView>
      </Reanimated.View>

      {/* MODAL DETALLE DE MIEMBRO */}
      <Modal visible={!!selectedMember} transparent animationType="fade">
        <TouchableOpacity
          style={styles.memberModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMember(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.memberModalCard}>
            <TouchableOpacity style={styles.memberModalCloseBtn} onPress={() => setSelectedMember(null)}>
              <X size={18} color="#8C9BAB" />
            </TouchableOpacity>

            <View style={styles.memberModalAvatarBox}>
              {selectedMember?.avatar_url ? (
                <Image source={{ uri: selectedMember.avatar_url }} style={styles.memberModalAvatarImg} />
              ) : (
                <View style={styles.memberModalAvatarFallback}>
                  <Text style={styles.memberModalAvatarText}>
                    {selectedMember?.nombre_completo ? selectedMember.nombre_completo.substring(0, 2).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.memberModalName}>{selectedMember?.nombre_completo || 'Usuario del Equipo'}</Text>
            {selectedMember?.rol && (
              <View style={styles.memberModalRoleBadge}>
                <Text style={styles.memberModalRoleText}>{selectedMember.rol.toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContentSide: {
    width: Platform.OS === 'web' ? 340 : '85%',
    height: '100%',
    backgroundColor: '#22272B',
    borderLeftWidth: 1,
    borderLeftColor: '#384148',
  },
  sideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  sideTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#2C333A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
  },
  quickActionText: {
    color: '#B6C2CF',
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuSection: {
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#384148',
    paddingTop: 16,
  },
  sectionSubtitle: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22272B',
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  memberAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberAvatarAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C333A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuListText: {
    color: '#B6C2CF',
    fontSize: 14,
    marginLeft: 12,
  },
  descEditor: {
    backgroundColor: '#2C333A',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  descInput: {
    color: '#FFF',
    fontSize: 14,
    minHeight: 80,
    outlineStyle: 'none',
  } as any,
  descSaveBtn: {
    backgroundColor: '#0C66E4',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  descSaveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  memberModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  memberModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#2C333A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#384148',
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  memberModalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
  memberModalAvatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0C66E4',
  },
  memberModalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  memberModalAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberModalAvatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  memberModalName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  memberModalRoleBadge: {
    backgroundColor: 'rgba(12, 102, 228, 0.2)',
    borderWidth: 1,
    borderColor: '#0C66E4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberModalRoleText: {
    color: '#579DFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
