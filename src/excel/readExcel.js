/**
 * Lectura del archivo Excel con expedientes.
 * Usa ExcelJS para preservar formato (colores, estilos) al guardar después.
 * El primer circuito comienza en la fila 4. Las filas 1, 2 y 3 se ignoran.
 */

const ExcelJS = require('exceljs');
const logger = require('../utils/logger');
const { normalizarOrgano, normalizarTipoExpediente } = require('../utils/textCleaner');

const {
  COL_ORGANO,
  COL_NUMERO_EXPEDIENTE,
  COL_TIPO_EXPEDIENTE
} = require('../config/constants');


/** Primera fila de datos (fila 4 en Excel = índice 3) */
const PRIMERA_FILA_DATOS = 3;



/**
 * Limpia valores provenientes de Excel
 */
function limpiarTextoExcel(valor) {

  if (valor == null) return '';

  return String(valor)
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}



/** Patrón estricto para nombres de circuito del portal (ordinales habituales) */
const REGEX_CIRCUITO_ESTRICTO =
  /(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|SÉPTIMO|SEPTIMO|OCTAVO|NOVENO|DÉCIMO|DECIMO|DÉCIMO\s+PRIMERO|DECIMO\s+PRIMERO|DÉCIMO\s+SEGUNDO|DECIMO\s+SEGUNDO|DÉCIMO\s+TERCERO|DECIMO\s+TERCERO|DÉCIMO\s+CUARTO|DECIMO\s+CUARTO|VIG[EÉ]SIMO|TRIG[EÉ]SIMO)\s+CIRCUITO/i;

/**
 * Valor en columna B con formato de número de expediente (evita cabeceras combinadas que repiten texto en B).
 * Ejemplos: 146/2025, 4/2025,  128/2024
 */
function columnaBEsNumeroExpediente(valor) {
  const t = limpiarTextoExcel(valor);
  if (!t) return false;
  return /^\d{1,6}\s*\/\s*\d{2,4}$/.test(t);
}

/**
 * Extrae el texto del circuito para el portal.
 * Prueba regex estricto; si falla, toma el tramo final tras " - " o el fragmento ...CIRCUITO (boletines con vigésimo, trigésimo, etc.).
 */
function extraerTextoCircuito(texto) {
  const limpio = limpiarTextoExcel(texto);
  if (!limpio) return '';

  let match = limpio.match(REGEX_CIRCUITO_ESTRICTO);
  if (match) return match[0].toUpperCase();

  const segmentos = limpio.split(/\s*-\s*/);
  for (let s = segmentos.length - 1; s >= 0; s--) {
    const seg = limpiarTextoExcel(segmentos[s]);
    if (!seg.includes('CIRCUITO')) continue;
    match = seg.match(REGEX_CIRCUITO_ESTRICTO);
    if (match) return match[0].toUpperCase();
    const suelto = seg.match(/([\wÁÉÍÓÚÑ0-9][\wÁÉÍÓÚÑ0-9\s]{0,100}CIRCUITO)/i);
    if (suelto) return limpiarTextoExcel(suelto[1]).toUpperCase();
  }

  match = limpio.match(/([\wÁÉÍÓÚÑ0-9][\wÁÉÍÓÚÑ0-9\s\-]{2,120}CIRCUITO)/i);
  return match ? limpiarTextoExcel(match[1]).toUpperCase() : '';
}



/**
 * Detecta si una fila contiene encabezado de circuito
 */

function filaContieneCircuito(fila) {

  if (!fila || !Array.isArray(fila)) return false;

  const concatenado = fila
    .map((c) => (c != null ? String(c) : ''))
    .join(' ')
    .toUpperCase();

  return concatenado.includes('CIRCUITO');
}



/**
 * Detecta si la fila tiene número de expediente válido en columna B (formato número/año).
 */

function filaTieneExpediente(fila) {
  if (!fila) return false;
  return columnaBEsNumeroExpediente(fila[COL_NUMERO_EXPEDIENTE]);
}



/**
 * Texto de cabecera de circuito: prioriza columna A de la hoja (celda maestra si hay combinación).
 */
function textoParaCircuito(worksheet, excelRowNumber, fila) {
  if (worksheet) {
    try {
      const row = worksheet.getRow(excelRowNumber);
      const a = row.getCell(1);
      const raw = a.text != null && a.text !== '' ? a.text : a.value;
      if (raw != null && String(raw).trim() !== '') {
        return limpiarTextoExcel(raw);
      }
    } catch (_) {
      /* continúa con fila del array */
    }
  }
  const primeraCelda = fila[0] != null && String(fila[0]).trim() !== '' ? String(fila[0]).trim() : '';
  return primeraCelda || fila.map((c) => (c != null ? String(c) : '')).join(' ').trim();
}

/**
 * Obtiene el workbook completo (ExcelJS) para poder actualizarlo después preservando formato.
 * @returns {Promise<{ workbook: import('exceljs').Workbook, sheetName: string, data: any[][], worksheet: import('exceljs').Worksheet }>}
 */
async function leerExcelCompleto(rutaArchivo) {
  logger.info(`Leyendo archivo Excel: ${rutaArchivo}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(rutaArchivo);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo Excel no contiene hojas');
  }
  const sheetName = worksheet.name;

  const data = [];
  worksheet.eachRow((row, rowNumber) => {
    const values = row.values;
    data.push(values && Array.isArray(values) ? values.slice(1) : []);
  });

  logger.info(`Filas detectadas en Excel: ${data.length}`);
  return { workbook, sheetName, data, worksheet };
}



/**
 * Construye la lista de expedientes.
 * @param {any[][]} data - Matriz por filas (como leerExcelCompleto).
 * @param {import('exceljs').Worksheet} [worksheet] - Misma hoja: mejora lectura de cabeceras combinadas (columna A).
 */
function buildExpedientesFromData(data, worksheet) {

  const expedientes = [];

  let circuitoActual = '';

  for (let i = PRIMERA_FILA_DATOS; i < data.length; i++) {

    const fila = data[i];

    if (!fila) continue;

    const excelRowNumber = i + 1;

    /**
     * Columna B con formato número/año → fila de dato (no cabecera aunque B repita texto de un merge).
     * Sin ese formato → puede ser cabecera de circuito si contiene CIRCUITO.
     */
    if (filaTieneExpediente(fila)) {
      if (!circuitoActual) {
        logger.warn(`Fila ${i + 1} ignorada porque no hay circuito activo`);
        continue;
      }

      const organoRaw = limpiarTextoExcel(fila[COL_ORGANO]);
      const expedienteRaw = limpiarTextoExcel(fila[COL_NUMERO_EXPEDIENTE]);
      const tipoRaw = limpiarTextoExcel(fila[COL_TIPO_EXPEDIENTE]);

      const organo = normalizarOrgano(organoRaw);
      const tipo = normalizarTipoExpediente(tipoRaw);
      const expediente = expedienteRaw;

      const expedienteObj = {
        circuito: circuitoActual,
        organo,
        expediente,
        tipo,
        numeroExpediente: expediente,
        tipoExpediente: tipo,
        filaExcel: i + 1,
        rowIndex: i
      };

      expedientes.push(expedienteObj);
      continue;
    }

    /**
     * Sin número de expediente en B: cabecera de circuito o fila vacía/irrelevante.
     */
    if (filaContieneCircuito(fila)) {
      const textoCircuito = textoParaCircuito(worksheet, excelRowNumber, fila);

      const circuitoDetectado = extraerTextoCircuito(textoCircuito);

      if (circuitoDetectado) {
        circuitoActual = circuitoDetectado;
        logger.info(`Circuito detectado: ${circuitoActual} (fila ${i + 1})`);
      }
    }
  }



  logger.info(`Total expedientes leídos: ${expedientes.length}`);

  return expedientes;
}



/**
 * Función principal para leer expedientes
 */

async function leerExpedientesDesdeExcel(rutaArchivo) {
  const { data, worksheet } = await leerExcelCompleto(rutaArchivo);
  return buildExpedientesFromData(data, worksheet);
}



module.exports = {
  leerExpedientesDesdeExcel,
  leerExcelCompleto,
  buildExpedientesFromData,
  extraerTextoCircuito,
  PRIMERA_FILA_DATOS
};