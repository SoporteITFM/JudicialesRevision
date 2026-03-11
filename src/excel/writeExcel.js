/**
 * Escritura/actualización del Excel con ExcelJS para preservar formato (colores, estilos).
 * Solo se modifican los valores de Estado Procesal y Fecha Estado Procesal.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const {
  COL_ESTADO_PROCESAL,
  COL_FECHA_ESTADO,
  RUTA_EXCEL_SALIDA
} = require('../config/constants');

/**
 * Actualiza solo el valor de Estado Procesal y Fecha Estado Procesal en la fila.
 * No modifica estilos ni formato de celda (ExcelJS preserva lo existente).
 * @param {import('exceljs').Worksheet} worksheet - Hoja de ExcelJS
 * @param {number} rowIndex - Índice de fila 0-based (como en data array)
 * @param {string} estadoProcesal
 * @param {string} fechaEstado
 */
function actualizarFila(worksheet, rowIndex, estadoProcesal, fechaEstado) {
  if (!worksheet) return;

  const excelRow = rowIndex + 1;
  const row = worksheet.getRow(excelRow);

  if (estadoProcesal != null && estadoProcesal !== '') {
    const cellEstado = row.getCell(COL_ESTADO_PROCESAL + 1);
    cellEstado.value = String(estadoProcesal);
  }

  if (fechaEstado != null && fechaEstado !== '') {
    const cellFecha = row.getCell(COL_FECHA_ESTADO + 1);
    cellFecha.value = String(fechaEstado);
  }
}

/**
 * Guarda el workbook de ExcelJS en la ruta indicada (preserva todo el formato).
 * @param {import('exceljs').Workbook} workbook
 * @param {string} rutaSalida
 * @returns {Promise<string>}
 */
async function guardarExcel(workbook, rutaSalida) {
  let ruta = rutaSalida || RUTA_EXCEL_SALIDA;
  if (!ruta.endsWith('.xlsx')) {
    ruta = `${ruta}.xlsx`;
  }

  const dir = path.dirname(ruta);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const rutaTmp = path.join(dir, path.basename(ruta, '.xlsx') + '.tmp.xlsx');
  await workbook.xlsx.writeFile(rutaTmp);
  try {
    fs.renameSync(rutaTmp, ruta);
  } catch (e) {
    fs.copyFileSync(rutaTmp, ruta);
    try { fs.unlinkSync(rutaTmp); } catch (_) {}
  }
  logger.info(`Excel guardado correctamente en: ${ruta}`);
  return ruta;
}

module.exports = {
  actualizarFila,
  guardarExcel
};
