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
      normalizado.referencia = valueStr;
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
