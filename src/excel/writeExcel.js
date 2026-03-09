/**
 * Escritura/actualización del Excel sin romper el formato.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const {
  COL_ESTADO_PROCESAL,
  COL_FECHA_ESTADO,
  RUTA_EXCEL_SALIDA
} = require('../config/constants');


function actualizarCelda(sheet, rowIndex, colIndex, valor) {

  const direccion = XLSX.utils.encode_cell({
    r: rowIndex,
    c: colIndex
  });

  sheet[direccion] = {
    t: 's',
    v: valor
  };

  // actualizar rango del sheet si es necesario
  const range = XLSX.utils.decode_range(sheet['!ref']);

  if (rowIndex > range.e.r) range.e.r = rowIndex;
  if (colIndex > range.e.c) range.e.c = colIndex;

  sheet['!ref'] = XLSX.utils.encode_range(range);
}



/**
 * Actualiza Estado Procesal y Fecha Estado Procesal
 */

function actualizarFila(sheet, rowIndex, estadoProcesal, fechaEstado) {

  if (!sheet) return;

  if (estadoProcesal) {

    actualizarCelda(
      sheet,
      rowIndex,
      COL_ESTADO_PROCESAL,
      estadoProcesal
    );

  }

  if (fechaEstado) {

    actualizarCelda(
      sheet,
      rowIndex,
      COL_FECHA_ESTADO,
      fechaEstado
    );

  }

}



/**
 * Guarda el Excel
 */

function guardarExcel(workbook, rutaSalida) {

  let ruta = rutaSalida || RUTA_EXCEL_SALIDA;

  // asegurar extensión
  if (!ruta.endsWith('.xlsx')) {
    ruta = `${ruta}.xlsx`;
  }

  const dir = path.dirname(ruta);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  XLSX.writeFile(workbook, ruta);

  logger.info(`Excel guardado correctamente en: ${ruta}`);

  return ruta;
}



module.exports = {
  actualizarFila,
  guardarExcel
};