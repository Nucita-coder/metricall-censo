import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  X,
  FolderKanban,
  ListFilter,
  FileText,
  Building2,
  ChevronRight,
  ArrowLeft,
  PlusCircle,
} from 'lucide-react-native';
import { InputTexto } from '../venta/CamposVenta';
import {
  ElementoAdjunto,
  buscarElementosParaAdjuntar,
  obtenerSucursales,
  obtenerTablerosDeSucursal,
  obtenerListasDeTablero,
  obtenerTarjetasDeLista,
} from '../../services/mensajesService';
import { styles } from './ModalAdjuntarElemento.styles';

interface ModalAdjuntarElementoProps {
  visible: boolean;
  empresaId: string;
  onClose: () => void;
  onSelectElemento: (elemento: ElementoAdjunto) => void;
}

export function ModalAdjuntarElemento({
  visible,
  empresaId,
  onClose,
  onSelectElemento,
}: ModalAdjuntarElementoProps) {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [nivel, setNivel] = useState<1 | 2 | 3 | 4>(1);

  const [sucursalSel, setSucursalSel] = useState<{ id: string; nombre: string } | null>(null);
  const [tableroSel, setTableroSel] = useState<{ id: string; nombre: string } | null>(null);
  const [listaSel, setListaSel] = useState<{ id: string; nombre: string } | null>(null);

  const [sucursales, setSucursales] = useState<any[]>([]);
  const [tableros, setTableros] = useState<any[]>([]);
  const [listas, setListas] = useState<any[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [busquedaResultados, setBusquedaResultados] = useState<ElementoAdjunto[]>([]);

  useEffect(() => {
    if (visible && empresaId) {
      setBusqueda('');
      setNivel(1);
      setSucursalSel(null);
      setTableroSel(null);
      setListaSel(null);
      cargarSucursales();
    }
  }, [visible, empresaId]);

  const cargarSucursales = async () => {
    setLoading(true);
    const res = await obtenerSucursales(empresaId);
    setSucursales(res);
    setLoading(false);
  };

  const handleSeleccionarSucursal = async (suc: any) => {
    setSucursalSel(suc);
    setNivel(2);
    setLoading(true);
    const res = await obtenerTablerosDeSucursal(empresaId, suc.id);
    setTableros(res);
    setLoading(false);
  };

  const handleSeleccionarTablero = async (tab: any) => {
    setTableroSel(tab);
    setNivel(3);
    setLoading(true);
    const res = await obtenerListasDeTablero(empresaId, tab.id);
    setListas(res);
    setLoading(false);
  };

  const handleSeleccionarLista = async (lis: any) => {
    setListaSel(lis);
    setNivel(4);
    setLoading(true);
    const res = await obtenerTarjetasDeLista(empresaId, lis.id);
    setTarjetas(res);
    setLoading(false);
  };

  const handleRetrocederNivel = () => {
    if (nivel === 4) { setNivel(3); setListaSel(null); }
    else if (nivel === 3) { setNivel(2); setTableroSel(null); }
    else if (nivel === 2) { setNivel(1); setSucursalSel(null); }
  };

  const handleSearchChange = async (text: string) => {
    setBusqueda(text);
    if (!text.trim()) return;
    setLoading(true);
    const res = await buscarElementosParaAdjuntar(empresaId, text);
    setBusquedaResultados(res);
    setLoading(false);
  };

  const emitirSeleccion = (elemento: ElementoAdjunto) => {
    onSelectElemento(elemento);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {nivel > 1 && !busqueda.trim() ? (
                <TouchableOpacity onPress={handleRetrocederNivel} style={{ marginRight: 6 }}>
                  <ArrowLeft size={18} color="#579DFF" />
                </TouchableOpacity>
              ) : null}
              <Text style={styles.title}>
                {busqueda.trim() ? 'Búsqueda' : nivel === 1 ? 'Sucursales' : nivel === 2 ? sucursalSel?.nombre : nivel === 3 ? tableroSel?.nombre : listaSel?.nombre}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={20} color="#B6C2CF" /></TouchableOpacity>
          </View>

          {!busqueda.trim() && nivel > 1 && (
            <View style={styles.breadcrumbBar}>
              <Text style={styles.breadcrumbText} numberOfLines={1}>
                {['Empresa', sucursalSel?.nombre, tableroSel?.nombre, listaSel?.nombre].filter(Boolean).join(' > ')}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <InputTexto label="Buscar por palabra clave" value={busqueda} onChangeText={handleSearchChange} placeholder="Ej. Venta, Censo..." />
          </View>

          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="small" color="#0C66E4" /></View>
          ) : busqueda.trim() ? (
            <FlatList
              data={busquedaResultados}
              keyExtractor={(item) => `${item.tipo}-${item.id}`}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemRow} onPress={() => emitirSeleccion(item)}>
                  <View style={styles.iconCircle}>
                    {item.tipo === 'tablero' ? <FolderKanban size={16} color="#0C66E4" /> : item.tipo === 'lista' ? <ListFilter size={16} color="#6E5DC6" /> : <FileText size={16} color="#1F8CD0" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemTitulo}>{item.titulo}</Text>
                    <Text style={styles.itemDetalles}>{item.tipo.toUpperCase()} • {item.detalles}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : nivel === 1 ? (
            <FlatList
              data={sucursales}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemRow} onPress={() => handleSeleccionarSucursal(item)}>
                  <View style={[styles.iconCircle, { backgroundColor: '#382319' }]}><Building2 size={16} color="#F59E0B" /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemTitulo}>{item.nombre}</Text>
                    <Text style={styles.itemDetalles}>SUCURSAL {item.ubicacion ? `• ${item.ubicacion}` : ''}</Text>
                  </View>
                  <ChevronRight size={18} color="#8C9BAB" />
                </TouchableOpacity>
              )}
            />
          ) : nivel === 2 ? (
            <FlatList
              data={tableros}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handleSeleccionarTablero(item)}>
                    <View style={[styles.iconCircle, { backgroundColor: '#09326C' }]}><FolderKanban size={16} color="#0C66E4" /></View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemTitulo}>{item.nombre}</Text>
                      <Text style={styles.itemDetalles}>TABLERO</Text>
                    </View>
                    <ChevronRight size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnAdjuntarContainer} onPress={() => emitirSeleccion({ tipo: 'tablero', id: item.id, titulo: item.nombre, detalles: `Sucursal: ${sucursalSel?.nombre}`, tableroId: item.id })}>
                    <PlusCircle size={16} color="#579DFF" />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : nivel === 3 ? (
            <FlatList
              data={listas}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handleSeleccionarLista(item)}>
                    <View style={[styles.iconCircle, { backgroundColor: '#2C1B4D' }]}><ListFilter size={16} color="#9F8FEF" /></View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemTitulo}>{item.nombre}</Text>
                      <Text style={styles.itemDetalles}>LISTA DE PROCESOS</Text>
                    </View>
                    <ChevronRight size={18} color="#8C9BAB" style={{ marginRight: 8 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnAdjuntarContainer} onPress={() => emitirSeleccion({ tipo: 'lista', id: item.id, titulo: item.nombre, detalles: `En: ${tableroSel?.nombre}`, tableroId: tableroSel?.id, listaId: item.id })}>
                    <PlusCircle size={16} color="#9F8FEF" />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <FlatList
              data={tarjetas}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemRow} onPress={() => emitirSeleccion({ tipo: 'tarjeta', id: item.id, titulo: item.titulo || 'Sin título', detalles: `En: ${listaSel?.nombre}`, tableroId: tableroSel?.id, listaId: listaSel?.id })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#093B54' }]}><FileText size={16} color="#1F8CD0" /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemTitulo}>{item.titulo || 'Sin título'}</Text>
                    <Text style={styles.itemDetalles}>TARJETA DE TRABAJO</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
