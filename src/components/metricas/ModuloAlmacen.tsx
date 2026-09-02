import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Package,
  Search,
  Calendar,
  UserCheck,
  X,
  User,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../../types/kanban';

export interface SKUDetailItem {
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  unidadesAlmacen: number;
  unidadesAsignadas: number;
  unidadesTotales: number;
  fechaEntrada: string;
  numMovimientos: number;
}

export interface AsignacionDetallada {
  id: string;
  tecnicoNombre: string;
  codigoMaterial: string;
  nombreMaterial: string;
  modeloMaterial: string;
  serialMaterial?: string;
  cantidad: number;
  fechaAsignacion: string;
  nroOrden: string;
  entregadoPor: string;
  motivo: string;
  tipoMovimiento: 'ASIGNACION' | 'INSTALACION_CONSUMO' | 'DEVOLUCION';
  tarjetaDestino?: string;
}

export interface TecnicoResumen {
  nombre: string;
  totalUnidadesAsignadas: number;
  totalOrdenes: number;
  totalConsumidas: number;
}

interface ModuloAlmacenProps {
  empresaId: string | null;
}

// Mapa de correspondencia de campos de formulario de instalación a SKUs
const MAPA_CAMPOS_INSTALACION: Record<string, { cod: string; nombre: string }> = {
  tensorPlastico: { cod: 'MAT-TENSOR-PLASTICO', nombre: 'TENSOR PLÁSTICO' },
  tensorHierro: { cod: 'MAT-TENSOR-HIERRO', nombre: 'TENSOR HIERRO' },
  grapas: { cod: 'MAT-GRAPAS', nombre: 'GRAPAS' },
  tirrap: { cod: 'MAT-TIRRAP', nombre: 'TIRRAP' },
  pachCordApc: { cod: 'MAT-PACH-APC', nombre: 'PACH CORD APC' },
  pachCordUpc: { cod: 'MAT-PACH-UPC', nombre: 'PACH CORD UPC' },
  pachCordApcUpc: { cod: 'MAT-PACH-APC-UPC', nombre: 'PACH CORD APC/UPC' },
  cajaTerminalCon: { cod: 'MAT-CAJA-TERM-CON', nombre: 'CAJA TERMINAL CON ACCESORIOS' },
  cajaTerminalSin: { cod: 'MAT-CAJA-TERM-SIN', nombre: 'CAJA TERMINAL SIN ACCESORIOS' },
  conectorAcople: { cod: 'MAT-CONECTOR-ACOPLE-HH', nombre: 'CONECTOR/ACOPLE H-H' },
  conectorMecanicoApc: { cod: 'MAT-CONECTOR-MEC-APC', nombre: 'CONECTOR MECÁNICO APC' },
  conectorMecanicoUpc: { cod: 'MAT-CONECTOR-MEC-UPC', nombre: 'CONECTOR MECÁNICO UPC' },
  precinto: { cod: 'MAT-PRECINTO', nombre: 'PRECINTO' },
  cablePreconectorizado: { cod: 'MAT-CABLE-PRECONECTORIZADO', nombre: 'CABLE PRECONECTORIZADO' },
  cableDrop: { cod: 'MAT-CABLE-DROP', nombre: 'CABLE DROP' },
  cable_drop: { cod: 'MAT-CABLE-DROP', nombre: 'CABLE DROP' },
};

export function ModuloAlmacen({ empresaId }: ModuloAlmacenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [isLoading, setIsLoading] = useState(true);
  const [materialesList, setMaterialesList] = useState<SKUDetailItem[]>([]);
  const [asignacionesList, setAsignacionesList] = useState<AsignacionDetallada[]>([]);
  const [tecnicosList, setTecnicosList] = useState<TecnicoResumen[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTecnicoQuery, setSearchTecnicoQuery] = useState('');
  const [filtroTab, setFiltroTab] = useState<'todos' | 'almacen' | 'asignado'>('todos');
  const [menuTecnicosExpanded, setMenuTecnicosExpanded] = useState(true);

  const cargarDatosAlmacen = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);

      // 1. Cargar TODAS las tarjetas de la empresa para sincronizar Almacén e Instalaciones
      const { data: tarjetas, error: errorTar } = await supabase
        .from('tarjetas')
        .select('id, datos_valores, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (errorTar) throw errorTar;
      if (!tarjetas) {
        setIsLoading(false);
        return;
      }

      const mapaSKU: Record<string, SKUDetailItem> = {};
      const desgloseAsignaciones: AsignacionDetallada[] = [];
      const mapaTecnicos: Record<string, TecnicoResumen> = {};

      (tarjetas as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();

        let fechaCard = (v.fechaInstalacion as string) || (v.fechaRecibido as string) || (v.fechaCenso as string) || '';
        if (!fechaCard && row.created_at) {
          fechaCard = row.created_at.split('T')[0];
        }
        if (!fechaCard) fechaCard = '—';

        // ── CASO A: TARJETAS DE MOVIMIENTO DE ALMACÉN (CARGA, ASIGNACIÓN, DEVOLUCIÓN) ──
        if (tipo) {
          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          const isDevAsignacion = tipo.includes('DEVOLUCIÓN DE ASIGNACIÓN') || tipo.includes('DEVOLUCION DE ASIGNACION');
          const isDevCentral = tipo.includes('DEVOLUCIÓN A ALMACÉN CENTRAL') || tipo.includes('DEVOLUCION A ALMACEN CENTRAL');
          const isAsignacion = !isDevAsignacion && !isDevCentral && (tipo.includes('ASIGN') || tipo.includes('MATERIAL ASIGNADO'));
          const isEntrada = !isAsignacion && !isDevAsignacion && !isDevCentral;

          const tecnico = ((v.asignadoA as string) || (v.recibidoPor as string) || 'SIN TÉCNICO ASIGNADO').toString().trim().toUpperCase();
          const entregado = ((v.entregadoPor as string) || 'ALMACÉN CENTRAL').toString().trim().toUpperCase();
          const orden = (v.nroOrdenEntrega as string) || 'S/N';
          const motivo = (v.motivoAsignacion as string) || 'Asignación de Material';

          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            if (!cod) return;
            const cant = parseFloat(String(subItem.cantidadRecibida || subItem.cantidad || '0')) || 0;
            const nombre = (subItem.nombreMaterial || 'MATERIAL').toUpperCase();
            const modelo = (subItem.modeloMaterial || 'GENERAL').toUpperCase();
            const serial = subItem.serialMaterial || '';

            if (!mapaSKU[cod]) {
              mapaSKU[cod] = {
                codigoMaterial: cod,
                nombreMaterial: nombre,
                modeloMaterial: modelo,
                unidadesAlmacen: 0,
                unidadesAsignadas: 0,
                unidadesTotales: 0,
                fechaEntrada: fechaCard,
                numMovimientos: 0,
              };
            }

            mapaSKU[cod].numMovimientos += 1;
            if (nombre && mapaSKU[cod].nombreMaterial === 'MATERIAL') mapaSKU[cod].nombreMaterial = nombre;
            if (modelo && mapaSKU[cod].modeloMaterial === 'GENERAL') mapaSKU[cod].modeloMaterial = modelo;
            if (isEntrada && fechaCard !== '—') mapaSKU[cod].fechaEntrada = fechaCard;

            if (isEntrada) {
              mapaSKU[cod].unidadesAlmacen += cant;
            } else if (isAsignacion) {
              mapaSKU[cod].unidadesAlmacen -= cant;
              mapaSKU[cod].unidadesAsignadas += cant;

              desgloseAsignaciones.push({
                id: `asig_${row.id}_${cod}_${desgloseAsignaciones.length}`,
                tecnicoNombre: tecnico,
                codigoMaterial: cod,
                nombreMaterial: nombre,
                modeloMaterial: modelo,
                serialMaterial: serial,
                cantidad: cant,
                fechaAsignacion: fechaCard,
                nroOrden: orden,
                entregadoPor: entregado,
                motivo: motivo,
                tipoMovimiento: 'ASIGNACION',
              });

              if (!mapaTecnicos[tecnico]) {
                mapaTecnicos[tecnico] = { nombre: tecnico, totalUnidadesAsignadas: 0, totalOrdenes: 0, totalConsumidas: 0 };
              }
              mapaTecnicos[tecnico].totalUnidadesAsignadas += cant;
              mapaTecnicos[tecnico].totalOrdenes += 1;
            } else if (isDevAsignacion) {
              mapaSKU[cod].unidadesAlmacen += cant;
              mapaSKU[cod].unidadesAsignadas = Math.max(0, mapaSKU[cod].unidadesAsignadas - cant);
            } else if (isDevCentral) {
              mapaSKU[cod].unidadesAlmacen = Math.max(0, mapaSKU[cod].unidadesAlmacen - cant);
            }

            mapaSKU[cod].unidadesTotales = mapaSKU[cod].unidadesAlmacen + mapaSKU[cod].unidadesAsignadas;
          });
        }

        // ── CASO B: TARJETAS DE INSTALACIÓN / VENTA (CONSUMO DE MATERIALES EN CAMPO) ──
        const tieneReporteInstalacion = Boolean(
          v.materiales || v.serialEquipo || v.macEquipo || v.cable_drop || v.tipoInstalacion
        );

        if (tieneReporteInstalacion) {
          const tecnicoInstalador = (
            v.tecnicoAsignado || v.tecnico || v.asignadoA || v.creadorNombre || 'TÉCNICO OPERATIVO'
          ).toString().trim().toUpperCase();

          const clienteNombre = (
            v.nombreCliente || v.cliente || v.nombreApellido || v.titulo || v.nombre || 'Cliente / Instalación'
          ).toString().trim();

          const cardIdShort = row.id ? row.id.slice(0, 8) : '';

          // Procesar consumo de materiales individuales
          if (v.materiales && typeof v.materiales === 'object') {
            Object.keys(v.materiales).forEach((fk) => {
              const cantUsada = parseFloat(String(v.materiales?.[fk] || '0')) || 0;
              if (cantUsada > 0 && MAPA_CAMPOS_INSTALACION[fk]) {
                const itemMeta = MAPA_CAMPOS_INSTALACION[fk];
                const cod = itemMeta.cod;

                // Descontar de la custodia del técnico
                if (mapaSKU[cod]) {
                  mapaSKU[cod].unidadesAsignadas = Math.max(0, mapaSKU[cod].unidadesAsignadas - cantUsada);
                  mapaSKU[cod].unidadesTotales = mapaSKU[cod].unidadesAlmacen + mapaSKU[cod].unidadesAsignadas;
                }

                if (mapaTecnicos[tecnicoInstalador]) {
                  mapaTecnicos[tecnicoInstalador].totalUnidadesAsignadas = Math.max(
                    0,
                    mapaTecnicos[tecnicoInstalador].totalUnidadesAsignadas - cantUsada
                  );
                  mapaTecnicos[tecnicoInstalador].totalConsumidas += cantUsada;
                }

                // Registrar en el historial de trazabilidad la tarjeta destino
                desgloseAsignaciones.push({
                  id: `cons_${row.id}_${cod}_${desgloseAsignaciones.length}`,
                  tecnicoNombre: tecnicoInstalador,
                  codigoMaterial: cod,
                  nombreMaterial: itemMeta.nombre,
                  modeloMaterial: 'CONSUMIBLE DE INSTALACIÓN',
                  cantidad: cantUsada,
                  fechaAsignacion: fechaCard,
                  nroOrden: `TARJETA: ${clienteNombre.toUpperCase()} (#${cardIdShort})`,
                  entregadoPor: 'REPORTE DE INSTALACIÓN',
                  motivo: `Instalado en cliente: ${clienteNombre}`,
                  tipoMovimiento: 'INSTALACION_CONSUMO',
                  tarjetaDestino: clienteNombre,
                });
              }
            });
          }

          // Procesar consumo de equipo seriado (ONU/ONT)
          if (v.serialEquipo) {
            const codEquipo = 'MAT-EQUIPO-ONU';
            if (mapaSKU[codEquipo]) {
              mapaSKU[codEquipo].unidadesAsignadas = Math.max(0, mapaSKU[codEquipo].unidadesAsignadas - 1);
              mapaSKU[codEquipo].unidadesTotales = mapaSKU[codEquipo].unidadesAlmacen + mapaSKU[codEquipo].unidadesAsignadas;
            }

            desgloseAsignaciones.push({
              id: `onu_${row.id}_${desgloseAsignaciones.length}`,
              tecnicoNombre: tecnicoInstalador,
              codigoMaterial: codEquipo,
              nombreMaterial: 'EQUIPO ONU / ONT',
              modeloMaterial: v.tipoInstalacion ? v.tipoInstalacion.toUpperCase() : 'ONU/ONT',
              serialMaterial: v.serialEquipo,
              cantidad: 1,
              fechaAsignacion: fechaCard,
              nroOrden: `TARJETA: ${clienteNombre.toUpperCase()} (#${cardIdShort})`,
              entregadoPor: 'REPORTE DE INSTALACIÓN',
              motivo: `Instalado en cliente: ${clienteNombre} (S/N: ${v.serialEquipo})`,
              tipoMovimiento: 'INSTALACION_CONSUMO',
              tarjetaDestino: clienteNombre,
            });
          }
        }
      });

      const listaProcesada = Object.values(mapaSKU);
      listaProcesada.sort((a, b) => b.unidadesTotales - a.unidadesTotales || a.nombreMaterial.localeCompare(b.nombreMaterial));

      desgloseAsignaciones.sort((a, b) => b.fechaAsignacion.localeCompare(a.fechaAsignacion));

      const listaTecnicos = Object.values(mapaTecnicos);
      listaTecnicos.sort((a, b) => b.totalUnidadesAsignadas - a.totalUnidadesAsignadas);

      setMaterialesList(listaProcesada);
      setAsignacionesList(desgloseAsignaciones);
      setTecnicosList(listaTecnicos);

      if (listaTecnicos.length > 0 && !tecnicoSeleccionado) {
        setTecnicoSeleccionado(listaTecnicos[0].nombre);
      }
    } catch (err) {
      console.error('[ModuloAlmacen] Error al cargar inventario:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, tecnicoSeleccionado]);

  useEffect(() => {
    cargarDatosAlmacen();
  }, [cargarDatosAlmacen]);

  // Filtrado de materiales generales
  const listaFiltrada = materialesList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.codigoMaterial.toLowerCase().includes(q) ||
      item.nombreMaterial.toLowerCase().includes(q) ||
      item.modeloMaterial.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filtroTab === 'almacen') return item.unidadesAlmacen > 0;
    return true;
  });

  // Filtrado de técnicos en el menú desplegable
  const tecnicosFiltrados = tecnicosList.filter((t) =>
    t.nombre.toLowerCase().includes(searchTecnicoQuery.toLowerCase().trim())
  );

  // Filtrado de asignaciones por técnico seleccionado y buscador
  const asignacionesDelTecnico = asignacionesList.filter((item) => {
    const matchTecnico =
      !tecnicoSeleccionado || tecnicoSeleccionado === 'TODOS' || item.tecnicoNombre === tecnicoSeleccionado;

    if (!matchTecnico) return false;

    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      item.codigoMaterial.toLowerCase().includes(q) ||
      item.nombreMaterial.toLowerCase().includes(q) ||
      item.modeloMaterial.toLowerCase().includes(q) ||
      item.nroOrden.toLowerCase().includes(q) ||
      (item.tarjetaDestino && item.tarjetaDestino.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#8C9BAB" />
        <Text style={styles.loadingTxt}>Cargando inventario y trazabilidad de tarjetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── BARRA DE BÚSQUEDA Y FILTROS ─────────────────────────────────── */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color="#8C9BAB" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              filtroTab === 'asignado'
                ? "Buscar por técnico, material, código, orden o cliente..."
                : "Buscar por código, material o modelo..."
            }
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#8C9BAB" />
            </TouchableOpacity>
          )}
        </View>

        {/* CHIPS DE FILTRO MONOCROMÁTICOS */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filtroTab === 'todos' && styles.filterChipActive]}
            onPress={() => setFiltroTab('todos')}
          >
            <Text style={[styles.filterChipText, filtroTab === 'todos' && styles.filterChipTextActive]}>
              Todos ({materialesList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtroTab === 'almacen' && styles.filterChipActive]}
            onPress={() => setFiltroTab('almacen')}
          >
            <Text style={[styles.filterChipText, filtroTab === 'almacen' && styles.filterChipTextActive]}>
              En Almacén ({materialesList.filter((m) => m.unidadesAlmacen > 0).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtroTab === 'asignado' && styles.filterChipActive]}
            onPress={() => setFiltroTab('asignado')}
          >
            <Text style={[styles.filterChipText, filtroTab === 'asignado' && styles.filterChipTextActive]}>
              Asignados ({tecnicosList.length} técnicos)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── VISTA DE TABLA SOBRIA EN TONOS GRISES ────────────────────────── */}
      {filtroTab === 'asignado' ? (
        /* ── VISTA CON MENÚ LATERAL/PLEGABLE DE TÉCNICOS E HISTORIAL DE MATERIALES ── */
        <View style={[styles.asignadosLayoutRow, !isDesktop && styles.asignadosLayoutCol]}>
          {/* MENÚ PLEGABLE / LATERAL DE TÉCNICOS */}
          <View style={[styles.sidebarTecnicos, !isDesktop && styles.sidebarTecnicosMobile]}>
            <TouchableOpacity
              style={styles.sidebarHeader}
              activeOpacity={0.7}
              onPress={() => setMenuTecnicosExpanded(!menuTecnicosExpanded)}
            >
              <View style={styles.sidebarHeaderLeft}>
                <User size={15} color="#F3F4F6" />
                <Text style={styles.sidebarTitle}>TÉCNICOS Y CUSTODIOS ({tecnicosList.length})</Text>
              </View>
              {!isDesktop && (
                <View style={styles.toggleIcon}>
                  {menuTecnicosExpanded ? (
                    <ChevronUp size={16} color="#8C9BAB" />
                  ) : (
                    <ChevronDown size={16} color="#8C9BAB" />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {(isDesktop || menuTecnicosExpanded) && (
              <View style={styles.sidebarBody}>
                {/* BUSCADOR DE TÉCNICO */}
                <View style={styles.searchTecnicoBox}>
                  <Search size={14} color="#6B7280" />
                  <TextInput
                    style={styles.searchTecnicoInput}
                    placeholder="Filtrar técnico..."
                    placeholderTextColor="#6B7280"
                    value={searchTecnicoQuery}
                    onChangeText={setSearchTecnicoQuery}
                  />
                  {searchTecnicoQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTecnicoQuery('')}>
                      <X size={12} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* BOTÓN "TODOS LOS TÉCNICOS" */}
                <TouchableOpacity
                  style={[
                    styles.tecnicoMenuItem,
                    tecnicoSeleccionado === 'TODOS' && styles.tecnicoMenuItemActive,
                  ]}
                  onPress={() => setTecnicoSeleccionado('TODOS')}
                >
                  <Text
                    style={[
                      styles.tecnicoMenuName,
                      tecnicoSeleccionado === 'TODOS' && styles.tecnicoMenuNameActive,
                    ]}
                  >
                    TODOS LOS TÉCNICOS
                  </Text>
                  <Text style={styles.tecnicoMenuBadge}>{asignacionesList.length}</Text>
                </TouchableOpacity>

                {/* LISTA DE TÉCNICOS */}
                <ScrollView style={styles.tecnicosScrollList} nestedScrollEnabled>
                  {tecnicosFiltrados.length === 0 ? (
                    <Text style={styles.emptyTecnicosTxt}>Sin resultados de técnicos</Text>
                  ) : (
                    tecnicosFiltrados.map((tec) => {
                      const isSelected = tecnicoSeleccionado === tec.nombre;
                      return (
                        <TouchableOpacity
                          key={tec.nombre}
                          style={[
                            styles.tecnicoMenuItem,
                            isSelected && styles.tecnicoMenuItemActive,
                          ]}
                          onPress={() => setTecnicoSeleccionado(tec.nombre)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.tecnicoMenuName,
                                isSelected && styles.tecnicoMenuNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {tec.nombre}
                            </Text>
                            <Text style={styles.tecnicoMenuSub}>
                              Custodia activa: {tec.totalUnidadesAsignadas} und.
                            </Text>
                          </View>
                          <View style={styles.tecnicoBadgeBox}>
                            <ChevronRight size={14} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* TABLA PRINCIPAL DE HISTORIAL Y TRAZABILIDAD DE DESTINO */}
          <View style={[styles.tableCard, { flex: 1 }]}>
            {/* ENCABEZADO DE SECCIÓN DEL TÉCNICO SELECCIONADO */}
            <View style={styles.tecnicoSectionBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <History size={16} color="#E5E7EB" />
                <Text style={styles.tecnicoBannerTitle}>
                  HISTORIAL Y TRAZABILIDAD — {tecnicoSeleccionado === 'TODOS' || !tecnicoSeleccionado ? 'TODOS LOS TÉCNICOS' : tecnicoSeleccionado}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: isDesktop ? '100%' : 880 }}>
                {/* ENCABEZADO DE TABLA HISTORIAL */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.colHeader, styles.colEstado]}>ESTADO / TIPO</Text>
                  <Text style={[styles.colHeader, styles.colCod]}>CÓDIGO</Text>
                  <Text style={[styles.colHeader, styles.colMat]}>MATERIAL Y MODELO</Text>
                  <Text style={[styles.colHeader, styles.colNum]}>CANTIDAD</Text>
                  <Text style={[styles.colHeader, styles.colFecha]}>FECHA</Text>
                  <Text style={[styles.colHeader, styles.colOrden]}>DESTINO / TARJETA INSTALACIÓN</Text>
                </View>

                {/* FILAS DE HISTORIAL DE ASIGNACIÓN Y CONSUMO */}
                {asignacionesDelTecnico.length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <UserCheck size={32} color="#4B5563" />
                    <Text style={styles.emptyTableTxt}>
                      No hay historial de materiales asignados o consumidos para este técnico
                    </Text>
                  </View>
                ) : (
                  asignacionesDelTecnico.map((item, index) => {
                    const isAlt = index % 2 === 1;
                    const isConsumo = item.tipoMovimiento === 'INSTALACION_CONSUMO';

                    return (
                      <View key={item.id} style={[styles.tableDataRow, isAlt && styles.tableDataRowAlt]}>
                        {/* ESTADO / TIPO */}
                        <View style={[styles.colEstado, styles.cellEstadoBox]}>
                          {isConsumo ? (
                            <View style={styles.badgeConsumido}>
                              <CheckCircle2 size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                              <Text style={styles.badgeConsumidoTxt}>INSTALADO</Text>
                            </View>
                          ) : (
                            <View style={styles.badgeAsignado}>
                              <Package size={11} color="#D1D5DB" style={{ marginRight: 4 }} />
                              <Text style={styles.badgeAsignadoTxt}>CUSTODIA</Text>
                            </View>
                          )}
                        </View>

                        {/* CÓDIGO */}
                        <Text style={[styles.colCod, styles.cellCod]}>{item.codigoMaterial}</Text>

                        {/* MATERIAL Y MODELO */}
                        <View style={styles.colMat}>
                          <Text style={styles.cellMat} numberOfLines={1}>
                            {item.nombreMaterial}
                          </Text>
                          <Text style={styles.cellSubModel} numberOfLines={1}>
                            Modelo: {item.modeloMaterial}{item.serialMaterial ? ` · Serial: ${item.serialMaterial}` : ''}
                          </Text>
                        </View>

                        {/* CANTIDAD */}
                        <Text style={[styles.colNum, styles.cellNumBold, isConsumo && styles.cellNumConsumo]}>
                          {isConsumo ? `-${item.cantidad}` : `+${item.cantidad}`} und.
                        </Text>

                        {/* FECHA */}
                        <View style={[styles.colFecha, styles.cellFechaBox]}>
                          <Calendar size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                          <Text style={styles.cellFechaTxt}>{item.fechaAsignacion}</Text>
                        </View>

                        {/* DESTINO / TARJETA INSTALACIÓN */}
                        <View style={styles.colOrden}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isConsumo && <MapPin size={11} color="#9CA3AF" style={{ marginRight: 4 }} />}
                            <Text style={styles.cellOrdenTxt} numberOfLines={1}>
                              {item.nroOrden}
                            </Text>
                          </View>
                          <Text style={styles.cellEntregadoTxt} numberOfLines={1}>
                            {isConsumo ? `Cliente: ${item.tarjetaDestino}` : `Despachado por: ${item.entregadoPor}`}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* PIE DE TABLA - BALANCE NETO DE CUSTODIA ACTIVA */}
                <View style={styles.tableFooterRow}>
                  <Text style={[styles.colEstado, styles.cellFootLabel]}>CUSTODIA ACTIVA</Text>
                  <Text style={[styles.colCod, styles.cellFootNum, { textAlign: 'left' }]}>
                    {Math.max(
                      0,
                      asignacionesDelTecnico.reduce(
                        (s, i) => s + (i.tipoMovimiento === 'ASIGNACION' ? i.cantidad : -i.cantidad),
                        0
                      )
                    ).toLocaleString()} und.
                  </Text>
                  <Text style={styles.colMat} />
                  <Text style={styles.colNum} />
                  <Text style={styles.colFecha} />
                  <Text style={styles.colOrden} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        /* ── VISTA DE TABLA GENERAL DE STOCK SOBRIA ── */
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: isDesktop ? '100%' : 780 }}>
              {/* ENCABEZADO DE TABLA GENERAL SOBRIO */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colHeader, styles.colCod]}>CÓDIGO</Text>
                <Text style={[styles.colHeader, styles.colMat]}>MATERIAL</Text>
                <Text style={[styles.colHeader, styles.colMod]}>MODELO</Text>
                <Text style={[styles.colHeader, styles.colFecha]}>FECHA ENTRADA</Text>
                <Text style={[styles.colHeader, styles.colNum]}>EN ALMACÉN</Text>
                <Text style={[styles.colHeader, styles.colNum]}>ASIGNADAS</Text>
                <Text style={[styles.colHeader, styles.colNum]}>TOTAL</Text>
              </View>

              {/* FILAS DE TABLA GENERAL */}
              {listaFiltrada.length === 0 ? (
                <View style={styles.emptyTableRow}>
                  <Package size={32} color="#4B5563" />
                  <Text style={styles.emptyTableTxt}>Sin resultados para los filtros aplicados</Text>
                </View>
              ) : (
                listaFiltrada.map((item, index) => {
                  const isAlt = index % 2 === 1;
                  return (
                    <View key={item.codigoMaterial} style={[styles.tableDataRow, isAlt && styles.tableDataRowAlt]}>
                      <Text style={[styles.colCod, styles.cellCod]}>{item.codigoMaterial}</Text>
                      <Text style={[styles.colMat, styles.cellMat]} numberOfLines={1}>
                        {item.nombreMaterial}
                      </Text>
                      <Text style={[styles.colMod, styles.cellMod]} numberOfLines={1}>
                        {item.modeloMaterial}
                      </Text>
                      <View style={[styles.colFecha, styles.cellFechaBox]}>
                        <Calendar size={12} color="#8C9BAB" style={{ marginRight: 4 }} />
                        <Text style={styles.cellFechaTxt}>{item.fechaEntrada}</Text>
                      </View>
                      <Text style={[styles.colNum, styles.cellNum]}>
                        {item.unidadesAlmacen.toLocaleString()}
                      </Text>
                      <Text style={[styles.colNum, styles.cellNum]}>
                        {item.unidadesAsignadas.toLocaleString()}
                      </Text>
                      <Text style={[styles.colNum, styles.cellTotalNum]}>
                        {item.unidadesTotales.toLocaleString()}
                      </Text>
                    </View>
                  );
                })
              )}

              {/* PIE DE TABLA - TOTALES */}
              <View style={styles.tableFooterRow}>
                <Text style={[styles.colCod, styles.cellFootLabel]}>TOTALES</Text>
                <Text style={[styles.colMat, styles.cellFootSub]}>
                  {listaFiltrada.length} materiales mostrados
                </Text>
                <Text style={styles.colMod} />
                <Text style={styles.colFecha} />
                <Text style={[styles.colNum, styles.cellFootNum]}>
                  {listaFiltrada.reduce((s, i) => s + Math.max(0, i.unidadesAlmacen), 0).toLocaleString()}
                </Text>
                <Text style={[styles.colNum, styles.cellFootNum]}>
                  {listaFiltrada.reduce((s, i) => s + Math.max(0, i.unidadesAsignadas), 0).toLocaleString()}
                </Text>
                <Text style={[styles.colNum, styles.cellFootNum]}>
                  {listaFiltrada.reduce((s, i) => s + Math.max(0, i.unidadesTotales), 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <Text style={styles.footNote}>
        {filtroTab === 'asignado'
          ? '* Trazabilidad conectada en tiempo real entre tarjetas de instalación y el inventario del técnico.'
          : '* Vista de inventario desglosada con resumen de totales al pie de tabla.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 24,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingTxt: {
    color: '#8C9BAB',
    marginTop: 12,
    fontSize: 14,
  },

  // Búsqueda y Filtros
  searchBarContainer: {
    marginBottom: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 13,
    marginLeft: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#343A40',
  },
  filterChipActive: {
    backgroundColor: '#2C333A',
    borderColor: '#5C6873',
  },
  filterChipText: {
    color: '#8C9BAB',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // ── LAYOUT SECCIÓN ASIGNADOS (MENÚ LATERAL TÉCNICOS + HISTORIAL) ───────
  asignadosLayoutRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  asignadosLayoutCol: {
    flexDirection: 'column',
  },

  // MENÚ DE TÉCNICOS
  sidebarTecnicos: {
    width: 260,
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    overflow: 'hidden',
  },
  sidebarTecnicosMobile: {
    width: '100%',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191D21',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  toggleIcon: {
    padding: 2,
  },
  sidebarBody: {
    padding: 10,
    gap: 8,
  },
  searchTecnicoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#343A40',
    paddingHorizontal: 8,
    height: 34,
  },
  searchTecnicoInput: {
    flex: 1,
    fontSize: 11,
    color: '#F3F4F6',
    marginLeft: 6,
  },
  tecnicosScrollList: {
    maxHeight: 380,
  },
  emptyTecnicosTxt: {
    fontSize: 11,
    color: '#8C9BAB',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  tecnicoMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tecnicoMenuItemActive: {
    backgroundColor: '#2C333A',
    borderColor: '#5C6873',
  },
  tecnicoMenuName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  tecnicoMenuNameActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tecnicoMenuSub: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 2,
  },
  tecnicoBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tecnicoMenuBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },

  // BANNER SECCIÓN HISTORIAL
  tecnicoSectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
  },
  tecnicoBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  tecnicoBannerSub: {
    fontSize: 11,
    color: '#8C9BAB',
    fontStyle: 'italic',
  },

  // ── TABLA DE DATOS SOBRIA EN TONOS GRISES ───────────────────────────
  tableCard: {
    backgroundColor: '#22272B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343A40',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#343A40',
    alignItems: 'center',
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8C9BAB',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  colEstado: {
    width: 110,
  },
  colCod: {
    width: 100,
  },
  colMat: {
    flex: 2,
    minWidth: 180,
  },
  colMod: {
    flex: 1.2,
    minWidth: 130,
  },
  colFecha: {
    width: 110,
  },
  colNum: {
    width: 95,
    textAlign: 'right',
  },
  colOrden: {
    flex: 1.5,
    minWidth: 160,
  },

  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3036',
    alignItems: 'center',
  },
  tableDataRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.012)',
  },

  cellEstadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeAsignado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C333A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeAsignadoTxt: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  badgeConsumido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#343A40',
  },
  badgeConsumidoTxt: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },

  cellCod: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D1D5DB',
  },
  cellMat: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
    paddingRight: 8,
  },
  cellSubModel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cellMod: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingRight: 8,
  },
  cellFechaBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellFechaTxt: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cellNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
    textAlign: 'right',
  },
  cellNumBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'right',
  },
  cellNumConsumo: {
    color: '#9CA3AF',
  },
  cellTotalNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  cellOrdenTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  cellEntregadoTxt: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 1,
  },

  emptyTableRow: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTableTxt: {
    color: '#8C9BAB',
    fontSize: 13,
  },

  // Pie de tabla
  tableFooterRow: {
    flexDirection: 'row',
    backgroundColor: '#191D21',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#343A40',
    alignItems: 'center',
  },
  cellFootLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  cellFootSub: {
    fontSize: 11,
    color: '#8C9BAB',
    fontStyle: 'italic',
  },
  cellFootNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },

  footNote: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});
