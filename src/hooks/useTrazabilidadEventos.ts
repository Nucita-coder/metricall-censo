import { useMemo } from 'react';
import { Tarjeta } from '../types/kanban';

export type TipoEventoTrazabilidad = 'creacion' | 'edicion' | 'gestion' | 'reasignacion' | 'movimiento' | 'comentario' | 'adjunto' | 'fase';

export interface EventoTrazabilidad {
  id: string;
  fecha: Date;
  fechaRaw?: string;
  usuario: string;
  tipoDeEvento: TipoEventoTrazabilidad;
  titulo: string;
  descripcion?: string;
  detallesExtra?: any;
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
        cliente: tarjeta.datos_valores?.nombreCliente || 'Sin nombre',
        documento: tarjeta.datos_valores?.documentoIdentidad,
        servicio: tarjeta.datos_valores?.tipoServicio,
      },
    });

    const data = tarjeta.datos_valores || {};

    // 2. Historial de Auditoría
    if (Array.isArray(data.historial_auditoria)) {
      data.historial_auditoria.forEach((audit: any, idx: number) => {
        const fecha = new Date(audit.fecha);
        const mods = audit.modificaciones || [];

        const isMovimiento = audit.tipo === 'movimiento' || mods.some((m: any) => m.campo === 'lista_id' || m.campo === 'lista');
        const isReasignacion = mods.some((m: any) => m.campo === 'asignado_a' || m.campo === 'tecnico_id');

        let tipo: TipoEventoTrazabilidad = 'edicion';
        let titulo = 'Modificación de Datos';
        let desc = 'Se actualizaron datos del formulario.';

        if (isMovimiento) {
          tipo = 'movimiento';
          titulo = 'Movimiento de Columna';
          const modMov = mods.find((m: any) => m.campo === 'lista_id' || m.campo === 'lista');
          if (modMov) {
            desc = `Tarjeta movida de "${modMov.valor_anterior || 'Fase Previa'}" a "${modMov.valor_nuevo || 'Fase Siguiente'}".`;
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
      data.gestiones.forEach((gestion: any, idx: number) => {
        let fecha = new Date(0);
        if (gestion.fecha) {
          const parsed = Date.parse(gestion.fecha);
          if (!isNaN(parsed)) {
            fecha = new Date(parsed);
          } else {
            fecha = new Date(new Date(tarjeta.created_at).getTime() + idx * 1000);
          }
        }

        consolidado.push({
          id: `gestion-${idx}`,
          fecha,
          fechaRaw: gestion.fecha,
          usuario: gestion.autor || 'Asesor Comercial',
          tipoDeEvento: 'gestion',
          titulo: `Gestión Comercial (${gestion.tipoContacto || 'Contacto'})`,
          descripcion: `Resultado: ${gestion.resultado || 'Registrado'}`,
          detallesExtra: {
            etapa: gestion.etapa,
            resultado: gestion.resultado,
            motivoRechazo: gestion.motivoRechazo,
            evidenciaUrl: gestion.evidenciaUrl,
          },
        });
      });
    }

    // 4. Comentarios
    if (Array.isArray(data.comentarios)) {
      data.comentarios.forEach((com: any, idx: number) => {
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
          titulo: 'Comentario Registrado',
          descripcion: com.texto || com.comentario || '',
        });
      });
    }

    // 5. Archivos Adjuntos
    const adjuntosList = Array.isArray(data.adjuntos) ? data.adjuntos : [];
    const geofotosList = Array.isArray(data.geofotos) ? data.geofotos : [];
    const todosAdjuntos = [...adjuntosList, ...geofotosList];

    if (data.lch_imagen) todosAdjuntos.push(data.lch_imagen);
    if (data.geo_nap?.fotoUrl) todosAdjuntos.push(data.geo_nap.fotoUrl);
    if (data.geo_casa?.fotoUrl) todosAdjuntos.push(data.geo_casa.fotoUrl);

    const uniqueAdjuntos = Array.from(new Set(todosAdjuntos));
    uniqueAdjuntos.forEach((url: string, idx: number) => {
      consolidado.push({
        id: `adjunto-${idx}`,
        fecha: new Date(new Date(tarjeta.created_at).getTime() + idx * 2000),
        usuario: 'Equipo de Campo',
        tipoDeEvento: 'adjunto',
        titulo: 'Evidencia / Archivo Adjunto',
        descripcion: `Archivo o fotografía adjuntada a la tarjeta.`,
        detallesExtra: { url },
      });
    });

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

  return { todosEventos, eventosFiltrados };
}
