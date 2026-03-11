/**
 * Extrae la tabla de actuaciones y busca si existe una fila con la fecha de publicación igual a la fecha actual.
 */
const logger = require('../utils/logger');
const { getFechaActualFormatoPortal, esFechaHoy } = require('../utils/dateUtils');

/** Nombre de la columna de "Fecha de publicación" en la tabla del portal */
const HEADER_FECHA_PUBLICACION = 'Fecha de publicación';

const headerSelector = 'table#grvAcuerdos thead th, table#grvAcuerdos thead td, table#grvAcuerdos tbody tr:first-child th';

/**
 * Obtiene los índices de columna para Fecha de publicación y Resumen en #grvAcuerdos.
 * @returns {Promise<{ indiceFecha: number|null, indiceResumen: number|null }>}
 */
async function obtenerIndicesColumnas(page) {
  const headerCells = await page.locator(headerSelector).allTextContents();
  const normalized = headerCells.map((t) => t.trim().toLowerCase());
  const indiceFecha = normalized.findIndex((t) => t.includes('fecha') && t.includes('publicación'));
  const indiceResumen = normalized.findIndex((t) => t.includes('resumen'));
  return {
    indiceFecha: indiceFecha >= 0 ? indiceFecha : null,
    indiceResumen: indiceResumen >= 0 ? indiceResumen : null
  };
}

/**
 * Busca el índice de la columna "Fecha de publicación" en la tabla #grvAcuerdos.
 * @param {import('playwright').Page} page
 * @returns {Promise<number|null>}
 */
async function obtenerIndiceColumnaFechaPublicacion(page) {
  const { indiceFecha } = await obtenerIndicesColumnas(page);
  return indiceFecha;
}

/**
 * Recorre las filas de datos de #grvAcuerdos y comprueba si alguna tiene la fecha de publicación = hoy.
 * Si existe, devuelve también el texto de la columna Resumen de esa fila para Estado procesal.
 * Formato portal: DD-MM-YYYY.
 * @param {import('playwright').Page} page
 * @returns {Promise<{ existe: boolean, indiceFila?: number, textoResumen?: string }>}
 */
async function existePublicacionHoy(page) {
  const fechaHoy = getFechaActualFormatoPortal();
  logger.info('Buscando publicación con fecha:', fechaHoy);

  const { indiceFecha: indiceCol, indiceResumen } = await obtenerIndicesColumnas(page);
  if (indiceCol == null) {
    logger.warn('No se encontró columna "Fecha de publicación"');
    return { existe: false };
  }

  const filas = await page.locator('table#grvAcuerdos tbody tr:has(td)').all();
  for (let i = 0; i < filas.length; i++) {
    const celdas = await filas[i].locator('td').allTextContents();
    const textoFecha = celdas[indiceCol] ? String(celdas[indiceCol]).trim() : '';
    if (esFechaHoy(textoFecha)) {
      const textoResumen = (indiceResumen != null && celdas[indiceResumen])
        ? String(celdas[indiceResumen]).trim()
        : '';
      logger.info('Publicación encontrada hoy en fila:', i + 1);
      return { existe: true, indiceFila: i, textoResumen };
    }
  }

  logger.info('No existe publicación con la fecha actual');
  return { existe: false };
}

/**
 * Obtiene el locator del enlace "Ver síntesis" para una fila de datos de #grvAcuerdos.
 * indiceFila es el índice entre las filas con td (datos), no incluye la fila de cabecera.
 * @param {import('playwright').Page} page
 * @param {number} indiceFila - Índice de fila de datos (0-based)
 * @returns {import('playwright').Locator}
 */
function getBotonSintesisEnFila(page, indiceFila) {
  const fila = page.locator('table#grvAcuerdos tbody tr:has(td)').nth(indiceFila);
  return fila.locator('a').filter({ hasText: /Ver síntesis|Ver sintesis/i }).first();
}

module.exports = {
  existePublicacionHoy,
  getBotonSintesisEnFila,
  HEADER_FECHA_PUBLICACION
};
