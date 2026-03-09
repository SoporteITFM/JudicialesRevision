/**
 * Lectura del archivo Excel con expedientes.
 * El primer circuito comienza en la fila 4. Las filas 1, 2 y 3 se ignoran.
 * Columnas: A=órgano, B=número expediente, E=tipo expediente.
 */

const XLSX = require('xlsx');
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



/**
 * Extrae el texto del circuito
 * Ejemplo:
 * "CIUDAD DE MÉXICO PRIMER CIRCUITO"
 * → "PRIMER CIRCUITO"
 */

function extraerTextoCircuito(texto) {

  const limpio = limpiarTextoExcel(texto);

  const match = limpio.match(
    /(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|SÉPTIMO|SEPTIMO|OCTAVO|NOVENO|DÉCIMO|DECIMO|DÉCIMO\s+PRIMERO|DECIMO\s+PRIMERO|DÉCIMO\s+SEGUNDO|DECIMO\s+SEGUNDO).*CIRCUITO/i
  );

  if (!match) return '';

  return match[0].toUpperCase();
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
 * Detecta si la fila tiene expediente
 */

function filaTieneExpediente(fila) {

  if (!fila) return false;

  const numero = fila[COL_NUMERO_EXPEDIENTE];

  if (numero == null) return false;

  return limpiarTextoExcel(numero) !== '';
}



/**
 * Obtiene el workbook completo para poder actualizarlo después.
 */

function leerExcelCompleto(rutaArchivo) {

  logger.info(`Leyendo archivo Excel: ${rutaArchivo}`);

  const workbook = XLSX.readFile(rutaArchivo);

  const sheetName = workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false
  });

  logger.info(`Filas detectadas en Excel: ${data.length}`);

  return { workbook, sheetName, data };
}



/**
 * Construye la lista de expedientes
 */

function buildExpedientesFromData(data) {

  const expedientes = [];

  let circuitoActual = '';

  for (let i = PRIMERA_FILA_DATOS; i < data.length; i++) {

    const fila = data[i];

    if (!fila) continue;


    /**
     * Detectar cambio de circuito
     */

    if (filaContieneCircuito(fila)) {

      const textoCircuito = fila
        .map((c) => (c != null ? String(c) : ''))
        .join(' ');

      const circuitoDetectado = extraerTextoCircuito(textoCircuito);

      if (circuitoDetectado) {

        circuitoActual = circuitoDetectado;

        logger.info(`Circuito detectado: ${circuitoActual} (fila ${i + 1})`);
      }

      continue;
    }



    /**
     * Filas sin expediente se ignoran
     */

    if (!filaTieneExpediente(fila)) continue;



    /**
     * Si no hay circuito aún, el Excel está mal formado
     */

    if (!circuitoActual) {

      logger.warn(`Fila ${i + 1} ignorada porque no hay circuito activo`);

      continue;
    }



    /**
     * Lectura de datos
     */

    const organoRaw = limpiarTextoExcel(fila[COL_ORGANO]);
    const expedienteRaw = limpiarTextoExcel(fila[COL_NUMERO_EXPEDIENTE]);
    const tipoRaw = limpiarTextoExcel(fila[COL_TIPO_EXPEDIENTE]);


    const organo = normalizarOrgano(organoRaw);
    const tipo = normalizarTipoExpediente(tipoRaw);
    const expediente = expedienteRaw;



    /**
     * Construcción del objeto expediente
     */

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
  }



  logger.info(`Total expedientes leídos: ${expedientes.length}`);

  return expedientes;
}



/**
 * Función principal para leer expedientes
 */

async function leerExpedientesDesdeExcel(rutaArchivo) {

  const { data } = leerExcelCompleto(rutaArchivo);

  const expedientes = buildExpedientesFromData(data);

  return expedientes;
}



module.exports = {
  leerExpedientesDesdeExcel,
  leerExcelCompleto,
  buildExpedientesFromData,
  extraerTextoCircuito,
  PRIMERA_FILA_DATOS
};