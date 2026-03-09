/**
 * Extrae la tabla de actuaciones y busca si existe una fila con la fecha de publicación igual a la fecha actual.
 */
const logger = require('../utils/logger');
const { getFechaActualFormatoPortal, esFechaHoy } = require('../utils/dateUtils');

/** Nombre de la columna de "Fecha de publicación" en la tabla del portal */
const HEADER_FECHA_PUBLICACION = 'Fecha de publicación';

/**
 * Busca el índice de la columna "Fecha de publicación" en la tabla.
 * @param {import('playwright').Page} page - Página con la tabla de actuaciones
 * @returns {Promise<number|null>} Índice de columna o null
 */
async function obtenerIndiceColumnaFechaPublicacion(page) {
  const headerCells = await page.locator('table thead th, table thead td').allTextContents();
  const normalized = headerCells.map((t) => t.trim().toLowerCase());
  const idx = normalized.findIndex((t) => t.includes('fecha') && t.includes('publicación'));
  return idx >= 0 ? idx : null;
}

/**
 * Recorre las filas de la tabla y comprueba si alguna tiene la fecha de publicación = hoy.
 * Formato portal: DD-MM-YYYY.
 * @param {import('playwright').Page} page
 * @returns {Promise<{ existe: boolean, indiceFila?: number }>}
 */
async function existePublicacionHoy(page) {
  const fechaHoy = getFechaActualFormatoPortal();
  logger.info('Buscando publicación con fecha:', fechaHoy);

  const indiceCol = await obtenerIndiceColumnaFechaPublicacion(page);
  if (indiceCol == null) {
    logger.warn('No se encontró columna "Fecha de publicación"');
    return { existe: false };
  }

  const filas = await page.locator('table tbody tr').all();
  for (let i = 0; i < filas.length; i++) {
    const celdas = await filas[i].locator('td').allTextContents();
    const textoFecha = celdas[indiceCol] ? String(celdas[indiceCol]).trim() : '';
    if (esFechaHoy(textoFecha)) {
      logger.info('Publicación encontrada hoy en fila:', i + 1);
      return { existe: true, indiceFila: i };
    }
  }

  logger.info('No existe publicación con la fecha actual');
  return { existe: false };
}

/**
 * Obtiene el locator del botón "Ver síntesis" para una fila dada.
 * Asumimos que en cada fila hay un enlace o botón "Ver síntesis" / "síntesis".
 * @param {import('playwright').Page} page
 * @param {number} indiceFila - Índice de fila (0-based)
 * @returns {import('playwright').Locator}
 */
function getBotonSintesisEnFila(page, indiceFila) {
  const fila = page.locator('table tbody tr').nth(indiceFila);
  return fila.getByRole('link', { name: /síntesis|sintesis/i }).or(
    fila.locator('a').filter({ hasText: /síntesis|sintesis/i })
  ).first();
}

module.exports = {
  existePublicacionHoy,
  getBotonSintesisEnFila,
  HEADER_FECHA_PUBLICACION
};
