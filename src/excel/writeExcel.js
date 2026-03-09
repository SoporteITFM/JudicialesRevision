/**
 * Escritura/actualización del Excel: columnas H (Estado Procesal) y J (Fecha Estado Procesal).
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { COL_ESTADO_PROCESAL, COL_FECHA_ESTADO, RUTA_EXCEL_SALIDA } = require('../config/constants');

/**
 * Actualiza una fila del sheet: escribe Estado Procesal (H) y Fecha Estado (J).
 * Sobreescribe si ya tenían contenido.
 * @param {any[][]} data - Matriz de datos del sheet (modificada in-place)
 * @param {number} rowIndex - Índice de fila (0-based)
 * @param {string} estadoProcesal - Texto de la síntesis
 * @param {string} fechaEstado - Fecha en formato DD-MM-YYYY
 */
function actualizarFilaEnData(data, rowIndex, estadoProcesal, fechaEstado) {
  if (rowIndex < 0 || rowIndex >= data.length) return;
  const fila = data[rowIndex];
  if (!fila) return;
  fila[COL_ESTADO_PROCESAL] = estadoProcesal;
  fila[COL_FECHA_ESTADO] = fechaEstado;
}

/**
 * Guarda el workbook a la ruta de salida.
 * @param {import('xlsx').WorkBook} workbook
 * @param {string} sheetName
 * @param {any[][]} data
 * @param {string} [rutaSalida] - Si no se pasa, usa RUTA_EXCEL_SALIDA
 */
function guardarExcel(workbook, sheetName, data, rutaSalida) {
  const ruta = rutaSalida || RUTA_EXCEL_SALIDA;
  const dir = path.dirname(ruta);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = sheet;
  XLSX.writeFile(workbook, ruta);
  logger.info('Excel guardado en:', ruta);
}

module.exports = { actualizarFilaEnData, guardarExcel };
