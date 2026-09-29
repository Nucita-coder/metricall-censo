import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import {
  AsesorVentasStat,
  FactibilidadVentasStat,
  ZonaVentasStat,
  TipoServicioVentasStat,
  PlanVentasStat,
  VentasStats,
} from './types';
import { COLORES_VENTAS } from './ventasConstants';
import {
  clasificarFactibilidad,
  extraerTipoServicio,
  extraerPlan,
  extraerZona,
} from './ventasExtraccion';

export function procesarMetricasVentas(
  tarjetas: Tarjeta[],
  nombresAsesoresOficiales: string[],
  listaMap: Map<string, string>,
  asesorFiltro: string,
  isTodosLosAsesores: boolean
): VentasStats {
  const mapaAsesores = new Map<string, AsesorVentasStat>();

  nombresAsesoresOficiales.forEach((nombre) => {
    mapaAsesores.set(nombre, {
      asesorNombre: nombre,
      totalVentas: 0,
      factibles: 0,
      porInstalar: 0,
      instaladas: 0,
      rechazadas: 0,
      enVerificacion: 0,
      tasaFactibilidad: 0,
      desgloseTipos: {},
      desglosePlanes: {},
    });
  });

  let totalVentas = 0;
  let ventasFactibles = 0;
  let ventasPorInstalar = 0;
  let ventasInstaladas = 0;
  let ventasRechazadas = 0;
  let ventasEnVerificacion = 0;

  const mapaZonas = new Map<string, number>();
  const mapaTipos = new Map<string, number>();
  const mapaPlanes = new Map<string, { count: number; tipo: string }>();

  tarjetas.forEach((t) => {
    const d = (t.datos_valores || {}) as TarjetaDatosValores;
    const listaNombre = listaMap.get(t.lista_id) || '';
    const cleanLn = listaNombre.toLowerCase().trim();

    totalVentas++;

    // Factibilidad
    const estadoFact = clasificarFactibilidad(t, listaNombre);
    if (estadoFact === 'factible') ventasFactibles++;
    else if (estadoFact === 'rechazada') ventasRechazadas++;
    else ventasEnVerificacion++;

    // Por Instalar
    const esPorInstalar =
      cleanLn.includes('por instalar') ||
      cleanLn.includes('instalar') ||
      (estadoFact === 'factible' && !cleanLn.includes('activo') && !cleanLn.includes('activar'));
    if (esPorInstalar) ventasPorInstalar++;

    // Instaladas
    const esInstalada = cleanLn.includes('activo') || cleanLn.includes('activar');
    if (esInstalada) ventasInstaladas++;

    // Tipo de Servicio
    const tipoServicio = extraerTipoServicio(d);
    mapaTipos.set(tipoServicio, (mapaTipos.get(tipoServicio) || 0) + 1);

    // Plan
    const planNombre = extraerPlan(d, tipoServicio);
    const planExistente = mapaPlanes.get(planNombre);
    if (planExistente) {
      planExistente.count++;
    } else {
      mapaPlanes.set(planNombre, { count: 1, tipo: tipoServicio });
    }

    // Zona
    const zonaNombre = extraerZona(d);
    mapaZonas.set(zonaNombre, (mapaZonas.get(zonaNombre) || 0) + 1);

    // Asignación a Asesor
    const asesorRaw = String(d.vendedor || d.asesorComercial || d.asignadoA || d.supervisor || 'Sin Asesor Asignado').trim();
    const asesorNombre = asesorRaw || 'Sin Asesor Asignado';

    let matchingKey = asesorNombre;
    for (const key of mapaAsesores.keys()) {
      if (key.toLowerCase() === asesorNombre.toLowerCase()) {
        matchingKey = key;
        break;
      }
    }

    if (!mapaAsesores.has(matchingKey)) {
      mapaAsesores.set(matchingKey, {
        asesorNombre: matchingKey,
        totalVentas: 0,
        factibles: 0,
        porInstalar: 0,
        instaladas: 0,
        rechazadas: 0,
        enVerificacion: 0,
        tasaFactibilidad: 0,
        desgloseTipos: {},
        desglosePlanes: {},
      });
    }

    const asStat = mapaAsesores.get(matchingKey)!;
    asStat.totalVentas++;
    if (estadoFact === 'factible') asStat.factibles++;
    else if (estadoFact === 'rechazada') asStat.rechazadas++;
    else asStat.enVerificacion++;

    if (esPorInstalar) asStat.porInstalar++;
    if (esInstalada) asStat.instaladas++;

    asStat.desgloseTipos[tipoServicio] = (asStat.desgloseTipos[tipoServicio] || 0) + 1;
    asStat.desglosePlanes[planNombre] = (asStat.desglosePlanes[planNombre] || 0) + 1;
  });

  mapaAsesores.forEach((asStat) => {
    asStat.tasaFactibilidad =
      asStat.totalVentas > 0 ? (asStat.factibles / asStat.totalVentas) * 100 : 0;
  });

  const porAsesor = Array.from(mapaAsesores.values())
    .filter((a) => {
      if (!isTodosLosAsesores) {
        return a.asesorNombre.toLowerCase() === asesorFiltro.toLowerCase();
      }
      return true;
    })
    .sort((a, b) => {
      if (b.totalVentas !== a.totalVentas) return b.totalVentas - a.totalVentas;
      return a.asesorNombre.localeCompare(b.asesorNombre);
    });

  const porFactibilidad: FactibilidadVentasStat[] = [
    {
      estado: 'Factibles / Aprobadas',
      clave: 'factible',
      cantidad: ventasFactibles,
      porcentaje: totalVentas > 0 ? (ventasFactibles / totalVentas) * 100 : 0,
      color: COLORES_VENTAS.factible,
    },
    {
      estado: 'En Verificación',
      clave: 'verificacion',
      cantidad: ventasEnVerificacion,
      porcentaje: totalVentas > 0 ? (ventasEnVerificacion / totalVentas) * 100 : 0,
      color: COLORES_VENTAS.verificacion,
    },
    {
      estado: 'No Factibles / Rechazadas',
      clave: 'rechazada',
      cantidad: ventasRechazadas,
      porcentaje: totalVentas > 0 ? (ventasRechazadas / totalVentas) * 100 : 0,
      color: COLORES_VENTAS.rechazada,
    },
  ];

  const porZona: ZonaVentasStat[] = Array.from(mapaZonas.entries())
    .map(([zonaNombre, count]) => ({
      zonaNombre,
      totalVentas: count,
      porcentaje: totalVentas > 0 ? (count / totalVentas) * 100 : 0,
    }))
    .sort((a, b) => b.totalVentas - a.totalVentas);

  const colorTipoMap: Record<string, string> = {
    Hogar: COLORES_VENTAS.hogar,
    PYMES: COLORES_VENTAS.pymes,
    Dedicado: COLORES_VENTAS.dedicado,
    ISP: COLORES_VENTAS.isp,
  };

  const porTipo: TipoServicioVentasStat[] = Array.from(mapaTipos.entries())
    .map(([tipoServicio, count]) => ({
      tipoServicio,
      totalVentas: count,
      porcentaje: totalVentas > 0 ? (count / totalVentas) * 100 : 0,
      color: colorTipoMap[tipoServicio] || COLORES_VENTAS.otro,
    }))
    .sort((a, b) => b.totalVentas - a.totalVentas);

  const porPlan: PlanVentasStat[] = Array.from(mapaPlanes.entries())
    .map(([planNombre, info]) => ({
      planNombre,
      tipoServicio: info.tipo,
      totalVentas: info.count,
      porcentaje: totalVentas > 0 ? (info.count / totalVentas) * 100 : 0,
    }))
    .sort((a, b) => b.totalVentas - a.totalVentas);

  const tasaFactibilidad = totalVentas > 0 ? (ventasFactibles / totalVentas) * 100 : 0;

  return {
    kpis: {
      totalVentas,
      ventasFactibles,
      ventasPorInstalar,
      ventasInstaladas,
      ventasRechazadas,
      ventasEnVerificacion,
      tasaFactibilidad,
    },
    porAsesor,
    porFactibilidad,
    porZona,
    porTipo,
    porPlan,
    rawTarjetas: tarjetas,
  };
}
