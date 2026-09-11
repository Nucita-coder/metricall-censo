import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Tarjeta, TarjetaMaterialItem } from '../types/kanban';
import {
  SKUDetailItem,
  AsignacionDetallada,
  TecnicoResumen,
  FiltroAlmacenTab,
  MAPA_CAMPOS_INSTALACION,
} from '../components/metricas/almacen/types';

export function useModuloAlmacenData(empresaId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [materialesList, setMaterialesList] = useState<SKUDetailItem[]>([]);
  const [asignacionesList, setAsignacionesList] = useState<AsignacionDetallada[]>([]);
  const [tecnicosList, setTecnicosList] = useState<TecnicoResumen[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTecnicoQuery, setSearchTecnicoQuery] = useState('');
  const [filtroTab, setFiltroTab] = useState<FiltroAlmacenTab>('todos');

  const cargarDatosAlmacen = useCallback(async () => {
    if (!empresaId) return;
    try {
      setIsLoading(true);

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

      (tarjetas as unknown as Tarjeta[])
        .filter(t => {
          const v = t.datos_valores || {};
          const isAlmacen = Boolean(v.tipoCarga || v.codigoMaterial || v.nroOrdenEntrega || Array.isArray(v.items));
          if (isAlmacen) return !v.anulada && !v.anulado;
          return t.estado_archivo !== true && !v.eliminada && !v.eliminado && !v.borrada && !v.borrado && v.estado_archivo !== true;
        })
        .forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();

        let fechaCard =
          (v.fechaInstalacion as string) ||
          (v.fechaRecibido as string) ||
          (v.fechaCenso as string) ||
          '';
        if (!fechaCard && row.created_at) {
          fechaCard = row.created_at.split('T')[0];
        }
        if (!fechaCard) fechaCard = '—';

        // ── CASO A: TARJETAS DE MOVIMIENTO DE ALMACÉN ──
        if (tipo) {
          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          const isDevCentral = tipo.includes('ALMACÉN CENTRAL') || tipo.includes('ALMACEN CENTRAL');
          const isDevAsignacion = !isDevCentral && (tipo.includes('DEVOLUCIÓN') || tipo.includes('DEVOLUCION'));
          const isAsignacion = !isDevAsignacion && !isDevCentral && (tipo.includes('ASIGN') || tipo.includes('MATERIAL ASIGNADO'));
          const isEntrada = !isAsignacion && !isDevAsignacion && !isDevCentral;

          const tecnico = ((v.asignadoA as string) || (v.recibidoPor as string) || 'SIN TÉCNICO ASIGNADO').toString().trim().toUpperCase();
          const entregado = ((v.entregadoPor as string) || 'ALMACÉN CENTRAL').toString().trim().toUpperCase();
          const orden = (v.nroOrdenEntrega as string) || 'S/N';
          const motivo = (v.motivoAsignacion as string) || 'Asignación de Material';

          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((subItem) => {
            const nombre = (subItem.nombreMaterial || '').trim().toUpperCase();
            const cod = (subItem.codigoMaterial || '').trim().toUpperCase();
            const key = nombre || cod;
            if (!key) return;

            const cant =
              parseFloat(String(subItem.cantidadRecibida || subItem.cantidad || '0')) || 0;
            const modelo = (subItem.modeloMaterial || 'GENERAL').toUpperCase();
            const serial = subItem.serialMaterial || '';

            if (!mapaSKU[key]) {
              mapaSKU[key] = {
                codigoMaterial: cod || key,
                nombreMaterial: nombre || cod,
                modeloMaterial: modelo,
                unidadesAlmacen: 0,
                unidadesAsignadas: 0,
                unidadesTotales: 0,
                fechaEntrada: fechaCard,
                numMovimientos: 0,
                subItems: [],
              };
            }

            mapaSKU[key].numMovimientos += 1;
            mapaSKU[key].subItems?.push({
              codigoMaterial: cod,
              modeloMaterial: modelo,
              serialMaterial: serial,
              cantidad: cant,
            });

            if (cod && !mapaSKU[key].codigoMaterial.includes(cod)) {
              mapaSKU[key].codigoMaterial = mapaSKU[key].codigoMaterial
                ? `${mapaSKU[key].codigoMaterial}, ${cod}`
                : cod;
            }
            if (modelo && modelo !== 'GENERAL' && !mapaSKU[key].modeloMaterial.includes(modelo)) {
              mapaSKU[key].modeloMaterial =
                mapaSKU[key].modeloMaterial === 'GENERAL'
                  ? modelo
                  : `${mapaSKU[key].modeloMaterial}, ${modelo}`;
            }
            if (isEntrada && fechaCard !== '—') mapaSKU[key].fechaEntrada = fechaCard;

            if (isEntrada) {
              mapaSKU[key].unidadesAlmacen += cant;
            } else if (isAsignacion) {
              mapaSKU[key].unidadesAlmacen -= cant;
              mapaSKU[key].unidadesAsignadas += cant;

              desgloseAsignaciones.push({
                id: `asig_${row.id}_${cod || key}_${desgloseAsignaciones.length}`,
                tecnicoNombre: tecnico,
                codigoMaterial: cod || key,
                nombreMaterial: nombre || cod,
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
                mapaTecnicos[tecnico] = {
                  nombre: tecnico,
                  totalUnidadesAsignadas: 0,
                  totalOrdenes: 0,
                  totalConsumidas: 0,
                };
              }
              mapaTecnicos[tecnico].totalUnidadesAsignadas += cant;
              mapaTecnicos[tecnico].totalOrdenes += 1;
            } else if (isDevAsignacion) {
              mapaSKU[key].unidadesAlmacen += cant;
              mapaSKU[key].unidadesAsignadas = Math.max(0, mapaSKU[key].unidadesAsignadas - cant);
            } else if (isDevCentral) {
              mapaSKU[key].unidadesAlmacen = Math.max(0, mapaSKU[key].unidadesAlmacen - cant);
            }

            mapaSKU[key].unidadesTotales =
              mapaSKU[key].unidadesAlmacen + mapaSKU[key].unidadesAsignadas;
          });
        }

        // ── CASO B: TARJETAS DE INSTALACIÓN / VENTA ──
        const tieneReporteInstalacion = Boolean(
          v.materiales || v.serialEquipo || v.macEquipo || v.cable_drop || v.tipoInstalacion
        );

        if (tieneReporteInstalacion) {
          const tecnicoInstalador = (
            v.tecnicoAsignado ||
            v.tecnico ||
            v.asignadoA ||
            v.creadorNombre ||
            'TÉCNICO OPERATIVO'
          )
            .toString()
            .trim()
            .toUpperCase();

          const clienteNombre = (
            v.nombreCliente ||
            v.cliente ||
            v.nombreApellido ||
            v.titulo ||
            v.nombre ||
            'Cliente / Instalación'
          )
            .toString()
            .trim();

          const cardIdShort = row.id ? row.id.slice(0, 8) : '';

          if (v.materiales && typeof v.materiales === 'object') {
            const matObj = v.materiales as Record<string, unknown>;
            Object.keys(matObj).forEach((fk) => {
              const cantUsada = parseFloat(String(matObj[fk] || '0')) || 0;
              if (cantUsada > 0 && MAPA_CAMPOS_INSTALACION[fk]) {
                const itemMeta = MAPA_CAMPOS_INSTALACION[fk];
                const nom = (itemMeta.nombre || '').trim().toUpperCase();
                const cod = itemMeta.cod;
                const targetEntry = mapaSKU[nom] || mapaSKU[cod];

                if (targetEntry) {
                  targetEntry.unidadesAsignadas = Math.max(0, targetEntry.unidadesAsignadas - cantUsada);
                  targetEntry.unidadesTotales =
                    targetEntry.unidadesAlmacen + targetEntry.unidadesAsignadas;
                }

                if (mapaTecnicos[tecnicoInstalador]) {
                  mapaTecnicos[tecnicoInstalador].totalUnidadesAsignadas = Math.max(
                    0,
                    mapaTecnicos[tecnicoInstalador].totalUnidadesAsignadas - cantUsada
                  );
                  mapaTecnicos[tecnicoInstalador].totalConsumidas += cantUsada;
                }

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

          if (v.serialEquipo) {
            const nomEquipo = 'EQUIPO ONU / ONT';
            const codEquipo = 'MAT-EQUIPO-ONU';
            const targetEquipo = mapaSKU[nomEquipo] || mapaSKU[codEquipo];
            if (targetEquipo) {
              targetEquipo.unidadesAsignadas = Math.max(0, targetEquipo.unidadesAsignadas - 1);
              targetEquipo.unidadesTotales =
                targetEquipo.unidadesAlmacen + targetEquipo.unidadesAsignadas;
            }

            desgloseAsignaciones.push({
              id: `onu_${row.id}_${desgloseAsignaciones.length}`,
              tecnicoNombre: tecnicoInstalador,
              codigoMaterial: codEquipo,
              nombreMaterial: nomEquipo,
              modeloMaterial: v.tipoInstalacion ? String(v.tipoInstalacion).toUpperCase() : 'ONU/ONT',
              serialMaterial: String(v.serialEquipo),
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
      listaProcesada.sort(
        (a, b) => b.unidadesTotales - a.unidadesTotales || a.nombreMaterial.localeCompare(b.nombreMaterial)
      );

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

  const listaFiltrada = materialesList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const match = !q || item.codigoMaterial.toLowerCase().includes(q) || item.nombreMaterial.toLowerCase().includes(q) || item.modeloMaterial.toLowerCase().includes(q);
    return !match ? false : (filtroTab === 'almacen' ? item.unidadesAlmacen > 0 : true);
  });

  const tecnicosFiltrados = tecnicosList.filter((t) =>
    t.nombre.toLowerCase().includes(searchTecnicoQuery.toLowerCase().trim())
  );

  const asignacionesDelTecnico = asignacionesList.filter((item) => {
    const matchTecnico = !tecnicoSeleccionado || tecnicoSeleccionado === 'TODOS' || item.tecnicoNombre === tecnicoSeleccionado;
    if (!matchTecnico) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      !q || item.codigoMaterial.toLowerCase().includes(q) || item.nombreMaterial.toLowerCase().includes(q) ||
      item.modeloMaterial.toLowerCase().includes(q) || item.nroOrden.toLowerCase().includes(q) ||
      (item.tarjetaDestino && item.tarjetaDestino.toLowerCase().includes(q))
    );
  });

  return {
    isLoading, materialesList, asignacionesList, tecnicosList,
    tecnicoSeleccionado, setTecnicoSeleccionado,
    searchQuery, setSearchQuery, searchTecnicoQuery, setSearchTecnicoQuery,
    filtroTab, setFiltroTab, listaFiltrada, tecnicosFiltrados,
    asignacionesDelTecnico, cargarDatosAlmacen,
  };
}
