import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export interface ImportResult {
  exito: boolean;
  totalProcesados: number;
  mensajes: string[];
  tarjetasInsertadas?: any[];
}

/**
 * Normaliza las llaves de un objeto de fila extraído del Excel
 */
export function normalizarFilaExcel(row: Record<string, any>): Record<string, any> {
  const normalizado: Record<string, any> = {};

  const clean = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  Object.entries(row).forEach(([rawKey, val]) => {
    if (val === undefined || val === null) return;
    const cleanKey = clean(rawKey);
    const valueStr = String(val).trim();

    if (cleanKey === 'cliente' || cleanKey === 'nombre' || cleanKey === 'nombre y apellido') {
      normalizado.nombreApellido = valueStr;
      normalizado['NOMBRE Y APELLIDO'] = valueStr;
    } else if (cleanKey === 'documento' || cleanKey === 'cedula' || cleanKey === 'doc identidad') {
      normalizado.documentoIdentidad = valueStr;
      normalizado.nroIdentidad = valueStr;
      normalizado['DOC IDENTIDAD'] = valueStr;
    } else if (cleanKey.includes('abonado') || cleanKey.includes('suscriptor')) {
      normalizado.nroAbonado = valueStr;
      normalizado['NRO SUSCRIPTOR'] = valueStr;
    } else if (cleanKey === 'observacion' || cleanKey === 'facturacion') {
      normalizado.observacionFacturacion = valueStr;
      normalizado['FACTURACION'] = valueStr;
    } else if (cleanKey === 'estatus' || cleanKey === 'estado suscriptor') {
      normalizado.estatusSuscriptor = valueStr;
      normalizado['ESTATUS'] = valueStr;
    } else if (cleanKey === 'saldo') {
      normalizado.saldo = valueStr;
      normalizado['SALDO'] = valueStr;
    } else if (cleanKey === 'suscripcion' || cleanKey === 'plan suscripcion' || cleanKey === 'plan') {
      normalizado.planSuscripcion = valueStr;
      normalizado['PLAN SUSCRIPCION'] = valueStr;
    } else if (cleanKey === 'telefono' || cleanKey === 'celular' || cleanKey === 'movil') {
      normalizado.telefonoMovil = valueStr;
      normalizado.nroTelefonoMovil = valueStr;
      normalizado['TELEFONO'] = valueStr;
    } else if (cleanKey === 'correo' || cleanKey === 'email') {
      normalizado.correo = valueStr;
      normalizado['CORREO'] = valueStr;
    } else if (cleanKey === 'grupo afinidad' || cleanKey === 'tipo') {
      normalizado.tipoServicio = valueStr;
      normalizado['TIPO'] = valueStr;
    } else if (cleanKey === 'departamento' || cleanKey === 'estado') {
      normalizado.estado = valueStr;
      normalizado['ESTADO'] = valueStr;
    } else if (cleanKey === 'ciudad' || cleanKey === 'municipio') {
      normalizado.ciudad = valueStr;
      normalizado['CIUDAD'] = valueStr;
    } else if (cleanKey === 'zona') {
      normalizado.zona = valueStr;
      normalizado['ZONA'] = valueStr;
    } else if (cleanKey === 'barrio' || cleanKey === 'sector') {
      normalizado.barrio = valueStr;
      normalizado['BARRIO'] = valueStr;
    } else if (cleanKey === 'direccion' || cleanKey === 'calle') {
      normalizado.direccion = valueStr;
      normalizado.puntoReferencia = valueStr;
      normalizado['DIRECCION'] = valueStr;
    } else if (cleanKey === 'vendedor' || cleanKey === 'asesor') {
      normalizado.vendedor = valueStr;
      normalizado.asesorComercial = valueStr;
      normalizado['VENDEDOR'] = valueStr;
    } else if (!normalizado[rawKey]) {
      normalizado[rawKey] = valueStr;
    }
  });

  // Marca de origen para identificar la importación
  normalizado.origenImportacion = 'COBRANZA-RECUPERO-CHURN';
  normalizado.fechaCarga = new Date().toISOString();

  return normalizado;
}

/**
 * Parsea un ArrayBuffer de un archivo Excel y retorna una lista de filas mapeadas
 */
export function procesarArchivoExcelBuffer(arrayBuffer: ArrayBuffer): Record<string, any>[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('El archivo Excel no contiene hojas de trabajo válidas.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('La hoja de trabajo no contiene filas con datos.');
  }

  return rawRows.map(row => normalizarFilaExcel(row));
}

/**
 * Inserta un conjunto de filas extraídas del Excel como Tarjetas en Supabase
 */
export async function importarTarjetasDesdeExcel(
  filasNormalizadas: Record<string, any>[],
  listaId: string,
  empresaId: string | null,
  creadorId: string | null
): Promise<ImportResult> {
  if (!listaId) {
    return { exito: false, totalProcesados: 0, mensajes: ['Se requiere un listaId válido.'] };
  }

  try {
    const payloads = filasNormalizadas.map(datosValores => ({
      lista_id: listaId,
      creador_id: creadorId,
      empresa_id: empresaId,
      datos_valores: datosValores,
      estado_archivo: false,
    }));

    // Inserción en lotes de 50 registros
    const BATCH_SIZE = 50;
    const insertedCards: any[] = [];

    for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
      const chunk = payloads.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('tarjetas')
        .insert(chunk)
        .select();

      if (error) {
        console.error('Error al insertar lote de tarjetas:', error);
        throw error;
      }
      if (data) {
        insertedCards.push(...data);
      }
    }

    return {
      exito: true,
      totalProcesados: insertedCards.length,
      mensajes: [`Se cargaron ${insertedCards.length} clientes cortados correctamente.`],
      tarjetasInsertadas: insertedCards,
    };
  } catch (err: any) {
    console.error('Error en importarTarjetasDesdeExcel:', err);
    return {
      exito: false,
      totalProcesados: 0,
      mensajes: [`Error al guardar tarjetas en la base de datos: ${err?.message || err}`],
    };
  }
}

export interface ReconciliacionResult extends ImportResult {
  tarjetasMovidasAEfectiva: number;
  tarjetasConservadas: number;
  tarjetasNuevasInsertadas: number;
}

/**
 * Importa un nuevo archivo Excel de Cobranza/Recupero y realiza la reconciliación automática:
 * 1. Los clientes existentes que ya NO figuran en el nuevo Excel se mueven automáticamente a 'Acción efectiva' con el resultado 'COBRO EFECTIVO'.
 * 2. Los clientes que SÍ siguen apareciendo en el Excel se mantienen en su posición actual.
 * 3. Los clientes completamente nuevos del Excel se insertan en la columna de carga.
 */
export async function importarYReconciliarCobranzaDesdeExcel(
  filasNormalizadas: Record<string, any>[],
  listaId: string,
  empresaId: string | null,
  creadorId: string | null
): Promise<ReconciliacionResult> {
  if (!listaId) {
    return {
      exito: false,
      totalProcesados: 0,
      mensajes: ['Se requiere un listaId válido.'],
      tarjetasMovidasAEfectiva: 0,
      tarjetasConservadas: 0,
      tarjetasNuevasInsertadas: 0,
    };
  }

  try {
    // 1. Obtener la información de la lista y todas las listas del mismo tablero
    const { data: listaTarget, error: errLista } = await supabase
      .from('listas')
      .select('id, tablero_id, empresa_id, nombre')
      .eq('id', listaId)
      .single();

    if (errLista || !listaTarget) {
      throw new Error('No se pudo encontrar la lista de destino.');
    }

    const { data: listasTablero, error: errTableroListas } = await supabase
      .from('listas')
      .select('id, nombre')
      .eq('tablero_id', listaTarget.tablero_id);

    if (errTableroListas || !listasTablero) {
      throw new Error('No se pudieron obtener las listas del tablero para la reconciliación.');
    }

    const listaIdsTablero = listasTablero.map(l => l.id);

    // Buscar lista de destino 'Acción efectiva' (o 'Acción efectiva (Recupero)')
    const esFlujoRecuperoTarget = (listaTarget.nombre || '').toLowerCase().includes('recupero');

    const listaEfectivaObj = listasTablero.find(l => {
      const n = (l.nombre || '').toLowerCase().trim();
      return esFlujoRecuperoTarget ? n.includes('efectiva') && n.includes('recupero') : n === 'acción efectiva' || n === 'accion efectiva';
    }) || listasTablero.find(l => (l.nombre || '').toLowerCase().includes('efectiva'));

    // 2. Obtener todas las tarjetas activas existentes en el tablero
    const { data: tarjetasExistentes, error: errTarjetas } = await supabase
      .from('tarjetas')
      .select('id, lista_id, datos_valores')
      .in('lista_id', listaIdsTablero)
      .eq('estado_archivo', false);

    if (errTarjetas) {
      throw errTarjetas;
    }

    // 3. Extraer identificadores clave del nuevo Excel (Abonado y Cédula/Documento)
    const abonadosEnNuevoExcel = new Set<string>();
    const docsEnNuevoExcel = new Set<string>();
    const nombresEnNuevoExcel = new Set<string>();

    filasNormalizadas.forEach(row => {
      const ab = String(row.nroAbonado || row['NRO SUSCRIPTOR'] || '').toLowerCase().trim();
      const doc = String(row.documentoIdentidad || row.nroIdentidad || row['DOC IDENTIDAD'] || '').toLowerCase().trim();
      const nom = String(row.nombreApellido || row['NOMBRE Y APELLIDO'] || '').toLowerCase().trim();

      if (ab) abonadosEnNuevoExcel.add(ab);
      if (doc) docsEnNuevoExcel.add(doc);
      if (nom) nombresEnNuevoExcel.add(nom);
    });

    // Helper para verificar si una tarjeta coincide con el nuevo Excel
    const existeEnNuevoExcel = (t: any): boolean => {
      const vals = t.datos_valores || {};
      const ab = String(vals.nroAbonado || vals['NRO SUSCRIPTOR'] || '').toLowerCase().trim();
      const doc = String(vals.documentoIdentidad || vals.nroIdentidad || vals['DOC IDENTIDAD'] || '').toLowerCase().trim();
      const nom = String(vals.nombreApellido || vals['NOMBRE Y APELLIDO'] || '').toLowerCase().trim();

      if (ab && abonadosEnNuevoExcel.has(ab)) return true;
      if (doc && docsEnNuevoExcel.has(doc)) return true;
      if (nom && nombresEnNuevoExcel.has(nom)) return true;
      return false;
    };

    // 4. Analizar tarjetas existentes en el tablero
    const tarjetasAMoverAEfectiva: any[] = [];
    const tarjetasQueSiguenEnCobro: any[] = [];
    const idsExistentesEnTablero = new Set<string>();

    (tarjetasExistentes || []).forEach(t => {
      const vals = t.datos_valores || {};
      const ab = String(vals.nroAbonado || vals['NRO SUSCRIPTOR'] || '').toLowerCase().trim();
      const doc = String(vals.documentoIdentidad || vals.nroIdentidad || vals['DOC IDENTIDAD'] || '').toLowerCase().trim();
      const nom = String(vals.nombreApellido || vals['NOMBRE Y APELLIDO'] || '').toLowerCase().trim();

      if (ab) idsExistentesEnTablero.add(ab);
      if (doc) idsExistentesEnTablero.add(doc);
      if (nom) idsExistentesEnTablero.add(nom);

      const estaEnNuevoExcel = existeEnNuevoExcel(t);

      // Si NO está en el nuevo Excel y NO está ya en Acción Efectiva -> ¡PAGÓ!
      const listaNombreCard = (listasTablero.find(l => l.id === t.lista_id)?.nombre || '').toLowerCase();
      const yaEstaEnEfectiva = listaNombreCard.includes('efectiva');

      if (!estaEnNuevoExcel && !yaEstaEnEfectiva) {
        tarjetasAMoverAEfectiva.push(t);
      } else {
        tarjetasQueSiguenEnCobro.push(t);
      }
    });

    // 5. Ejecutar movimientos automáticos a Acción Efectiva para los clientes que ya no vienen en la lista
    let contadorMovidas = 0;
    if (tarjetasAMoverAEfectiva.length > 0 && listaEfectivaObj) {
      for (const t of tarjetasAMoverAEfectiva) {
        const datosActualizados = {
          ...(t.datos_valores || {}),
          tipoContacto: (t.datos_valores?.tipoContacto) || 'RECONCILIACIÓN EXCEL',
          resultadoContacto: 'COBRO EFECTIVO',
          RESULTADO: 'COBRO EFECTIVO',
          etiquetaCobranza: 'Cobranza (Pagado)',
          fechaCobroReconciliacion: new Date().toISOString(),
        };

        const { error: errUpdate } = await supabase
          .from('tarjetas')
          .update({
            lista_id: listaEfectivaObj.id,
            datos_valores: datosActualizados,
          })
          .eq('id', t.id);

        if (!errUpdate) contadorMovidas++;
      }
    }

    // 6. Filtrar filas del Excel para insertar SOLO clientes que no existían previamente en el tablero
    const filasParaInsertar = filasNormalizadas.filter(row => {
      const ab = String(row.nroAbonado || row['NRO SUSCRIPTOR'] || '').toLowerCase().trim();
      const doc = String(row.documentoIdentidad || row.nroIdentidad || row['DOC IDENTIDAD'] || '').toLowerCase().trim();
      const nom = String(row.nombreApellido || row['NOMBRE Y APELLIDO'] || '').toLowerCase().trim();

      const yaExiste = (ab && idsExistentesEnTablero.has(ab)) || (doc && idsExistentesEnTablero.has(doc)) || (nom && idsExistentesEnTablero.has(nom));
      return !yaExiste;
    });

    // Insertar nuevas tarjetas
    let contadorInsertadas = 0;
    const tarjetasInsertadasList: any[] = [];
    if (filasParaInsertar.length > 0) {
      const resImport = await importarTarjetasDesdeExcel(filasParaInsertar, listaId, empresaId, creadorId);
      if (resImport.exito) {
        contadorInsertadas = resImport.totalProcesados;
        if (resImport.tarjetasInsertadas) {
          tarjetasInsertadasList.push(...resImport.tarjetasInsertadas);
        }
      }
    }

    return {
      exito: true,
      totalProcesados: contadorInsertadas + contadorMovidas,
      tarjetasMovidasAEfectiva: contadorMovidas,
      tarjetasConservadas: tarjetasQueSiguenEnCobro.length,
      tarjetasNuevasInsertadas: contadorInsertadas,
      mensajes: [
        `Reconciliación completada: ${contadorMovidas} clientes pasaron a Acción efectiva (pagaron), ${tarjetasQueSiguenEnCobro.length} conservados y ${contadorInsertadas} tarjetas nuevas creadas.`,
      ],
      tarjetasInsertadas: tarjetasInsertadasList,
    };
  } catch (err: any) {
    console.error('Error en importarYReconciliarCobranzaDesdeExcel:', err);
    return {
      exito: false,
      totalProcesados: 0,
      tarjetasMovidasAEfectiva: 0,
      tarjetasConservadas: 0,
      tarjetasNuevasInsertadas: 0,
      mensajes: [`Error durante la reconciliación: ${err?.message || err}`],
    };
  }
}
