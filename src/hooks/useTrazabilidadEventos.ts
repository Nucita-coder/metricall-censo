import { useMemo } from 'react';
import { Tarjeta, GestionItem, ComentarioItem } from '../types/kanban';

export type TipoEventoTrazabilidad = 'creacion' | 'edicion' | 'gestion' | 'reasignacion' | 'movimiento' | 'comentario' | 'adjunto' | 'fase';

export interface AuditoriaModItem {
  campo: string;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
}

export interface AuditoriaItem {
  id?: string | number;
  autor?: string;
  fecha: string;
  tipo?: string;
  modificaciones?: AuditoriaModItem[];
}

export interface EventoDetallesGestion {
  etapa?: string;
  resultado?: string;
  motivoRechazo?: string;
  evidenciaUrl?: string;
  [key: string]: unknown;
}

export interface EventoDetallesAdjunto {
  url?: string;
  [key: string]: unknown;
}

export type EventoDetallesExtra =
  | AuditoriaModItem[]
  | EventoDetallesGestion
  | EventoDetallesAdjunto
  | Record<string, unknown>;

export interface EventoTrazabilidad {
  id: string;
  fecha: Date;
  fechaRaw?: string;
  usuario: string;
  tipoDeEvento: TipoEventoTrazabilidad;
  titulo: string;
  descripcion?: string;
  detallesExtra?: EventoDetallesExtra;
}

export function useTrazabilidadEventos(tarjeta: Tarjeta | null, filtroActivo: string) {
  const todosEventos = useMemo(() => {
    if (!tarjeta) return [];
    const consolidado: EventoTrazabilidad[] = [];

    // 1. Creación de la Tarjeta
    const fechaCreacion = new Date(tarjeta.created_at);
    consolidado.push({
      id: `creacion-${tarjeta.id}`,
      fecha: isNaN(fechaCreacion.getTime()) ? new Date() : fechaCreacion,
      fechaRaw: tarjeta.created_at,
      usuario: 'Sistema / Ingesta Inicial',
      tipoDeEvento: 'creacion',
      titulo: 'Tarjeta Creada',
      descripcion: `Tarjeta registrada originalmente en el sistema.`,
      detallesExtra: {
        cliente: (tarjeta.datos_valores as Record<string, unknown>)?.nombreCliente || tarjeta.datos_valores?.nombreApellido || 'Sin nombre',
        documento: tarjeta.datos_valores?.documentoIdentidad,
        servicio: tarjeta.datos_valores?.tipoServicio,
      },
    });

    const data = tarjeta.datos_valores || {};

    // 2. Historial de Auditoría
    if (Array.isArray(data.historial_auditoria)) {
      (data.historial_auditoria as unknown as AuditoriaItem[]).forEach((audit, idx) => {
        const fecha = new Date(audit.fecha);
        const mods = audit.modificaciones || [];

        const isMovimiento = audit.tipo === 'movimiento' || mods.some(m => m.campo === 'lista_id' || m.campo === 'lista');
        const isReasignacion = mods.some(m => m.campo === 'asignado_a' || m.campo === 'tecnico_id');

        let tipo: TipoEventoTrazabilidad = 'edicion';
        let titulo = 'Modificación de Datos';
        let desc = 'Se actualizaron datos del formulario.';

        if (isMovimiento) {
          tipo = 'movimiento';
          titulo = 'Movimiento de Columna';
          const modMov = mods.find(m => m.campo === 'lista_id' || m.campo === 'lista');
          if (modMov) {
            desc = `Tarjeta movida de "${String(modMov.valor_anterior || 'Fase Previa')}" a "${String(modMov.valor_nuevo || 'Fase Siguiente')}".`;
          } else {
            desc = 'La tarjeta cambió de fase en el Kanban.';
          }
        } else if (isReasignacion) {
          tipo = 'reasignacion';
          titulo = 'Reasignación de Responsable';
          desc = 'Se actualizó el usuario o técnico asignado.';
        }

        consolidado.push({
          id: `audit-${idx}-${audit.id || idx}`,
          fecha: isNaN(fecha.getTime()) ? new Date(0) : fecha,
          fechaRaw: audit.fecha,
          usuario: audit.autor || 'Usuario del Sistema',
          tipoDeEvento: tipo,
          titulo,
          descripcion: desc,
          detallesExtra: mods,
        });
      });
    }

    // 3. Gestiones Comerciales
    if (Array.isArray(data.gestiones)) {
      (data.gestiones as GestionItem[]).forEach((gestion, idx) => {
        let fecha = new Date(0);
        if (gestion.fecha) {
          const parsed = Date.parse(gestion.fecha);
          if (!isNaN(parsed)) {
            fecha = new Date(parsed);
          } else {
            fecha = new Date(new Date(tarjeta.created_at).getTime() + idx * 1000);
          }
        }

        const gestObj = gestion as Record<string, unknown>;
        consolidado.push({
          id: `gestion-${idx}`,
          fecha,
          fechaRaw: gestion.fecha,
          usuario: (gestObj.autor as string) || gestion.usuario || 'Asesor Comercial',
          tipoDeEvento: 'gestion',
          titulo: `Gestión Comercial (${(gestObj.tipoContacto as string) || gestion.tipo || 'Contacto'})`,
          descripcion: `Resultado: ${gestion.resultado || 'Registrado'}`,
          detallesExtra: {
            etapa: gestion.etapa,
            resultado: gestion.resultado,
            motivoRechazo: gestObj.motivoRechazo,
            evidenciaUrl: gestObj.evidenciaUrl,
          },
        });
      });
    }

    // 4. Comentarios
    if (Array.isArray(data.comentarios)) {
      (data.comentarios as ComentarioItem[]).forEach((com, idx) => {
        let fecha = new Date(0);
        if (com.fecha) {
          const parsed = Date.parse(com.fecha);
          if (!isNaN(parsed)) {
            fecha = new Date(parsed);
          } else {
            fecha = new Date(new Date(tarjeta.created_at).getTime() + idx * 1000);
          }
        }

        consolidado.push({
          id: `comentario-${idx}`,
          fecha,
          fechaRaw: com.fecha,
          usuario: com.autor || 'Miembro del Equipo',
          tipoDeEvento: 'comentario',
          titulo: 'Comentario Agregado',
          descripcion: com.texto,
          detallesExtra: {
            texto: com.texto,
          },
        });
      });
    }

    // 5. Adjuntos y Evidencias
    const todosAdjuntos: string[] = [];
    if (Array.isArray(data.adjuntos)) {
      todosAdjuntos.push(...data.adjuntos);
    }
    if (data.geo_nap?.fotoUrl) todosAdjuntos.push(data.geo_nap.fotoUrl);
    if (data.geo_casa?.fotoUrl) todosAdjuntos.push(data.geo_casa.fotoUrl);

    if (todosAdjuntos.length > 0) {
      todosAdjuntos.forEach((url, idx) => {
        consolidado.push({
          id: `adjunto-${idx}`,
          fecha: new Date(new Date(tarjeta.created_at).getTime() + (idx + 1) * 5000),
          usuario: 'Operaciones / Campo',
          tipoDeEvento: 'adjunto',
          titulo: 'Evidencia Adjunta',
          descripcion: `Archivo fotográfico o documento cargado.`,
          detallesExtra: { url },
        });
      });
    }

    // Ordenar cronológicamente descendente (más reciente primero)
    return consolidado.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [tarjeta]);

  const eventosFiltrados = useMemo(() => {
    if (filtroActivo === 'todos') return todosEventos;
    if (filtroActivo === 'movimientos') return todosEventos.filter((e) => e.tipoDeEvento === 'movimiento');
    if (filtroActivo === 'ediciones') return todosEventos.filter((e) => e.tipoDeEvento === 'edicion' || e.tipoDeEvento === 'reasignacion');
    if (filtroActivo === 'gestiones') return todosEventos.filter((e) => e.tipoDeEvento === 'gestion');
    if (filtroActivo === 'comentarios') return todosEventos.filter((e) => e.tipoDeEvento === 'comentario');
    if (filtroActivo === 'adjuntos') return todosEventos.filter((e) => e.tipoDeEvento === 'adjunto');
    return todosEventos;
  }, [todosEventos, filtroActivo]);

  return { todosEventos, eventosFiltrados, eventos: eventosFiltrados, totalEventos: todosEventos.length };
}
