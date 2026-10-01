import { Tarjeta, TarjetaDatosValores } from '../../../types/kanban';
import { AsesorCensoStat, SectorCensoStat, CensoKpis } from './types';
import { normalizarSectorCenso } from '../../censo/sectoresAnaco';

export interface PerfilRow {
  id: string;
  nombre_completo: string | null;
  rol: string | null;
  etiquetas: unknown;
}

export function esAsesorPerfil(p: PerfilRow): boolean {
  if (!p.nombre_completo || !p.nombre_completo.trim()) return false;

  const rol = String(p.rol || '').toLowerCase().trim();
  if (['asesor', 'vendedor', 'ventas', 'comercial', 'censador'].includes(rol)) {
    return true;
  }

  const rawEtiquetas = p.etiquetas;
  let etiquetasList: string[] = [];

  if (Array.isArray(rawEtiquetas)) {
    etiquetasList = rawEtiquetas.map((e) => String(e));
  } else if (typeof rawEtiquetas === 'string') {
    etiquetasList = rawEtiquetas
      .replace(/[{}[\]"']/g, '')
      .split(',')
      .map((e) => e.trim());
  }

  return etiquetasList.some((e) => {
    const val = e.toLowerCase().trim();
    return (
      val === 'asesor' ||
      val.includes('asesor') ||
      val === 'vendedor' ||
      val.includes('vendedor') ||
      val === 'censador' ||
      val.includes('censador')
    );
  });
}

export function deduplicarTarjetasCenso(
  tarjetas: Tarjeta[],
  listaMap: Map<string, string>
): Tarjeta[] {
  const deduplicatedMap = new Map<string, Tarjeta>();

  tarjetas.forEach((t) => {
    const d = (t.datos_valores || {}) as TarjetaDatosValores;
    const keyDoc = (d.documentoIdentidad || d.cedula || d.telefonoMovil || d.nombreApellido || t.id)
      .trim()
      .toLowerCase();
    const existing = deduplicatedMap.get(keyDoc);

    if (!existing) {
      deduplicatedMap.set(keyDoc, t);
    } else {
      const listaActual = (listaMap.get(t.lista_id) || '').toLowerCase();
      const listaExistente = (listaMap.get(existing.lista_id) || '').toLowerCase();
      if (listaActual !== 'censo' && listaExistente === 'censo') {
        deduplicatedMap.set(keyDoc, t);
      }
    }
  });

  return Array.from(deduplicatedMap.values());
}

export interface ResultadoProcesamientoCenso {
  kpis: CensoKpis;
  porAsesor: AsesorCensoStat[];
  porSector: SectorCensoStat[];
}

export function procesarMetricasCenso(
  tarjetasParaCalculo: Tarjeta[],
  nombresAsesoresOficiales: string[],
  listaMap: Map<string, string>,
  asesorFiltro: string,
  isTodosLosAsesores: boolean
): ResultadoProcesamientoCenso {
  const mapaAsesores = new Map<string, AsesorCensoStat>();

  nombresAsesoresOficiales.forEach((nombre) => {
    mapaAsesores.set(nombre, {
      asesorNombre: nombre,
      totalCensados: 0,
      interesados: 0,
      indecisos: 0,
      noInteresados: 0,
      gestiones: 0,
    });
  });

  let totalCensados = 0;
  let totalInteresados = 0;
  let totalIndecisos = 0;
  let totalNoInteresados = 0;
  let totalGestiones = 0;

  const mapaSectores = new Map<string, number>();

  tarjetasParaCalculo.forEach((t) => {
    const d = (t.datos_valores || {}) as TarjetaDatosValores;
    const listaNombre = (listaMap.get(t.lista_id) || '').toLowerCase().trim();
    const dispuesto = String(d.dispuestoCambiar || '').toLowerCase().trim();

    totalCensados++;

    let tipoInteres: 'interesado' | 'indeciso' | 'noInteresado';
    if (dispuesto === 'sí' || dispuesto === 'si' || listaNombre.includes('si desea') || listaNombre.includes('sí desea')) {
      totalInteresados++;
      tipoInteres = 'interesado';
    } else if (dispuesto === 'no' || listaNombre.includes('no desea')) {
      totalNoInteresados++;
      tipoInteres = 'noInteresado';
    } else {
      totalIndecisos++;
      tipoInteres = 'indeciso';
    }

    const gestiones = Array.isArray(d.gestiones) ? d.gestiones : [];
    const cantGestionesTarjeta = gestiones.length;
    totalGestiones += cantGestionesTarjeta;

    const asesorRaw = String(d.asesorComercial || d.asignadoA || d.vendedor || d.censador || 'Sin Asesor Asignado').trim();
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
        totalCensados: 0,
        interesados: 0,
        indecisos: 0,
        noInteresados: 0,
        gestiones: 0,
      });
    }

    const asStat = mapaAsesores.get(matchingKey)!;
    asStat.totalCensados++;
    asStat.gestiones += cantGestionesTarjeta;
    if (tipoInteres === 'interesado') asStat.interesados++;
    else if (tipoInteres === 'indeciso') asStat.indecisos++;
    else asStat.noInteresados++;

    const sectorRaw = String(d.sector || d.urbanizacion || d.zona || d.ciudad || 'Sector No Especificado').trim();
    const sectorNombre = normalizarSectorCenso(sectorRaw);
    mapaSectores.set(sectorNombre, (mapaSectores.get(sectorNombre) || 0) + 1);
  });

  const porAsesor = Array.from(mapaAsesores.values())
    .filter((a) => {
      if (!isTodosLosAsesores) {
        return a.asesorNombre.toLowerCase() === asesorFiltro.toLowerCase();
      }
      return true;
    })
    .sort((a, b) => {
      if (b.totalCensados !== a.totalCensados) {
        return b.totalCensados - a.totalCensados;
      }
      return a.asesorNombre.localeCompare(b.asesorNombre);
    });

  const porSector: SectorCensoStat[] = Array.from(mapaSectores.entries())
    .map(([sectorNombre, count]) => ({
      sectorNombre,
      totalCensados: count,
      porcentaje: totalCensados > 0 ? (count / totalCensados) * 100 : 0,
    }))
    .sort((a, b) => b.totalCensados - a.totalCensados);

  const tasaInteres = totalCensados > 0 ? (totalInteresados / totalCensados) * 100 : 0;
  const tasaIndecision = totalCensados > 0 ? (totalIndecisos / totalCensados) * 100 : 0;
  const tasaNoInteres = totalCensados > 0 ? (totalNoInteresados / totalCensados) * 100 : 0;

  return {
    kpis: {
      totalCensados,
      totalInteresados,
      totalIndecisos,
      totalNoInteresados,
      totalGestiones,
      tasaInteres,
      tasaIndecision,
      tasaNoInteres,
    },
    porAsesor,
    porSector,
  };
}
