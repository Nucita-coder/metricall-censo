import { useMemo, useState } from 'react';
import { Lista, Tarjeta } from '../types/kanban';
import {
  FiltrosTableroEstado,
  FILTROS_DEFAULT,
} from '../components/kanban/modals/ModalFiltrosTablero';

interface UseKanbanFiltrosParams {
  listas: Lista[];
  userRol: string | null;
}

export const useKanbanFiltros = ({ listas, userRol }: UseKanbanFiltrosParams) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtrosTablero, setFiltrosTablero] = useState<FiltrosTableroEstado>(FILTROS_DEFAULT);
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  // Constante memoizada: resultados que califican como "pendiente de cobro"
  const RESULTADOS_PENDIENTES_COBRO = useMemo(() => [
    'CONVENIO DE PAGO',
    'ABONO PARCIALMENTE',
    'LUEGO PASA POR OFIC',
    'PIDE AJUSTE DE PLAN',
    'NO CONTESTO',
    'FUERA DE ZONA',
  ], []);

  /** Indica si hay al menos un filtro activo distinto del estado por defecto */
  const isFiltroActivo = useMemo(() => (
    filtrosTablero.estadoCobro !== 'todos' ||
    filtrosTablero.flujo !== 'todos' ||
    filtrosTablero.resultadoEspecifico !== 'todos' ||
    filtrosTablero.tipoContacto !== 'todos' ||
    (filtrosTablero.orden && filtrosTablero.orden !== 'recientes') ||
    (filtrosTablero.listaId && filtrosTablero.listaId !== 'todas') ||
    (filtrosTablero.etiqueta && filtrosTablero.etiqueta !== 'todas') ||
    (filtrosTablero.rangoFecha && filtrosTablero.rangoFecha !== 'todos')
  ), [filtrosTablero]);

  /** Texto resumen del filtro activo para mostrar en el header */
  const resumenFiltro = useMemo(() => {
    if (filtrosTablero.listaId && filtrosTablero.listaId !== 'todas') {
      const l = listas.find(item => item.id === filtrosTablero.listaId);
      if (l) return l.nombre;
    }
    if (filtrosTablero.etiqueta && filtrosTablero.etiqueta !== 'todas') return filtrosTablero.etiqueta;
    if (filtrosTablero.rangoFecha && filtrosTablero.rangoFecha !== 'todos') return filtrosTablero.rangoFecha.toUpperCase();
    if (filtrosTablero.orden === 'antiguas') return 'Más Antiguas';
    if (filtrosTablero.estadoCobro === 'pendientes') return 'Pagos Pendientes';
    if (filtrosTablero.estadoCobro === 'cobrados') return 'Pagos Liquidados';
    if (filtrosTablero.flujo !== 'todos') return `Flujo ${filtrosTablero.flujo.toUpperCase()}`;
    if (filtrosTablero.resultadoEspecifico !== 'todos') return filtrosTablero.resultadoEspecifico;
    if (filtrosTablero.tipoContacto !== 'todos') return filtrosTablero.tipoContacto;
    return 'Activos';
  }, [filtrosTablero, listas]);

  /**
   * Listas filtradas y ordenadas según búsqueda de texto y filtros activos.
   * Algoritmo: Flujo → Lista → tarjetas (texto, cobro, contacto, resultado, etiqueta, fecha) → orden.
   */
  const filteredListas = useMemo(() => {
    let baseListas = listas;

    // Restricción de visibilidad para empleados
    if (userRol === 'empleado') {
      baseListas = listas.filter(lista => lista.permisos_relacionales?.puede_ver === true);
    }

    // 1. Filtro por lista específica
    if (filtrosTablero.listaId && filtrosTablero.listaId !== 'todas') {
      baseListas = baseListas.filter(lista => lista.id === filtrosTablero.listaId);
    }

    // 2. Filtro por flujo (cobranza vs recupero)
    if (filtrosTablero.flujo === 'cobranza') {
      baseListas = baseListas.filter(lista => {
        const n = (lista.nombre || '').toLowerCase();
        return n.includes('cobranza') ||
          (n.includes('efectiva') && !n.includes('recupero')) ||
          (n.includes('negativa') && !n.includes('recupero'));
      });
    } else if (filtrosTablero.flujo === 'recupero') {
      baseListas = baseListas.filter(lista => (lista.nombre || '').toLowerCase().includes('recupero'));
    }

    const q = searchQuery.toLowerCase().trim();

    return baseListas.map(lista => {
      const nombreClean = (lista.nombre || '').toLowerCase();
      const esNegativa = nombreClean.includes('negativa');
      const esEfectiva = nombreClean.includes('efectiva');

      const tarjetasFiltradas = (lista.tarjetas || []).filter(t => {
        const vals = t.datos_valores || {};

        // A. Búsqueda por texto libre (nombre, cédula, abonado, id)
        if (q) {
          const nombre = (vals.nombreApellido || vals.nombre || vals.cliente || '').toLowerCase();
          const cedula = (vals.cedula || vals.documento || vals.rif || '').toLowerCase();
          const abonado = String(vals.nroAbonado || vals['NRO SUSCRIPTOR'] || vals.abonado || '').toLowerCase();
          const idStr = String(t.id).toLowerCase();
          if (!nombre.includes(q) && !cedula.includes(q) && !abonado.includes(q) && !idStr.includes(q)) return false;
        }

        // B. Estado de cobro (pendientes vs cobrados)
        if (filtrosTablero.estadoCobro === 'pendientes') {
          const res = (vals.resultadoContacto || vals.resultado || vals.RESULTADO || '').trim().toUpperCase();
          if (!(res === 'FUERA DE ZONA' || esNegativa) && esEfectiva && !RESULTADOS_PENDIENTES_COBRO.includes(res)) return false;
        } else if (filtrosTablero.estadoCobro === 'cobrados') {
          const res = (vals.resultadoContacto || vals.resultado || vals.RESULTADO || '').trim().toUpperCase();
          if (res === 'FUERA DE ZONA' || !esEfectiva || (res !== 'COBRO EFECTIVO' && res !== 'RECUPERADO')) return false;
        }

        // C. Tipo de contacto específico
        if (filtrosTablero.tipoContacto !== 'todos') {
          const tipoCard = (vals.tipoContacto || vals['TIPO DE CONTACTO'] || '').trim().toUpperCase();
          if (tipoCard !== filtrosTablero.tipoContacto.trim().toUpperCase()) return false;
        }

        // D. Resultado / causa específica
        if (filtrosTablero.resultadoEspecifico !== 'todos') {
          const resCard = (vals.resultadoContacto || vals.resultado || vals.RESULTADO || '').trim().toUpperCase();
          if (resCard !== filtrosTablero.resultadoEspecifico.trim().toUpperCase()) return false;
        }

        // E. Filtro por etiqueta / estatus de pago / soporte
        if (filtrosTablero.etiqueta && filtrosTablero.etiqueta !== 'todas') {
          const targetBadge = filtrosTablero.etiqueta.trim().toUpperCase();
          const estadoCob = String(vals.estadoCobranza || vals.estado_cobranza || '').trim().toUpperCase();
          const estadoSop = String(vals.estadoSoporte || vals.accionFalla || vals.estadoGestion || '').trim().toUpperCase();
          if (targetBadge === 'PROCESADO EN SAE') {
            if (estadoSop !== 'PROCESADO EN SAE' && vals.estadoGestion !== 'procesado_en_sae') return false;
          } else if (targetBadge === 'PAGO PROCESADO' && estadoCob !== 'PAGO PROCESADO') {
            return false;
          } else if (
            targetBadge === 'PAGO EN REVISIÓN' &&
            estadoCob !== 'PAGO PENDIENTE REVISIÓN' &&
            estadoCob !== 'PAGO EN REVISIÓN' &&
            estadoCob !== 'PENDIENTE VERIFICACIÓN'
          ) {
            return false;
          } else if (targetBadge === 'PAGO RECHAZADO' && estadoCob !== 'PAGO RECHAZADO') {
            return false;
          }
        }

        // F. Filtro por rango de fecha
        if (filtrosTablero.rangoFecha && filtrosTablero.rangoFecha !== 'todos') {
          const dateStr = vals.fechaVenta || vals.fechaCenso || t.created_at || t.updated_at;
          if (dateStr) {
            const cardDate = new Date(dateStr);
            const now = new Date();
            if (!isNaN(cardDate.getTime())) {
              if (filtrosTablero.rangoFecha === 'hoy') {
                const isSameDay =
                  cardDate.getDate() === now.getDate() &&
                  cardDate.getMonth() === now.getMonth() &&
                  cardDate.getFullYear() === now.getFullYear();
                if (!isSameDay) return false;
              } else if (filtrosTablero.rangoFecha === '7dias') {
                const diffDays = (now.getTime() - cardDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays < 0 || diffDays > 7) return false;
              } else if (filtrosTablero.rangoFecha === 'este_mes') {
                const isSameMonth =
                  cardDate.getMonth() === now.getMonth() &&
                  cardDate.getFullYear() === now.getFullYear();
                if (!isSameMonth) return false;
              }
            }
          }
        }

        return true;
      });

      // Ordenamiento por timestamp de última gestión
      const esAntiguas = filtrosTablero.orden === 'antiguas';
      const getTs = (t: Tarjeta): number => {
        const v = t.datos_valores || {};
        const gestiones = v.gestionesCobranza;
        if (Array.isArray(gestiones) && gestiones.length > 0) {
          const ult = gestiones[gestiones.length - 1];
          if (ult?.fecha) { const ts = new Date(ult.fecha).getTime(); if (!isNaN(ts)) return ts; }
        }
        const fechaStr = v.fechaCobroReconciliacion || t.updated_at || t.created_at;
        if (fechaStr) { const ts = new Date(fechaStr).getTime(); if (!isNaN(ts)) return ts; }
        return 0;
      };

      return {
        ...lista,
        tarjetas: [...tarjetasFiltradas].sort((a, b) => esAntiguas ? getTs(a) - getTs(b) : getTs(b) - getTs(a)),
      };
    });
  }, [listas, searchQuery, filtrosTablero, userRol, RESULTADOS_PENDIENTES_COBRO]);

  return {
    searchQuery,
    setSearchQuery,
    filtrosTablero,
    setFiltrosTablero,
    modalFiltrosVisible,
    setModalFiltrosVisible,
    isMobileSearchActive,
    setIsMobileSearchActive,
    isFiltroActivo,
    resumenFiltro,
    filteredListas,
  };
};
