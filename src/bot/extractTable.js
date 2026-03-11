/**
 * Extrae la tabla de actuaciones y busca si existe una fila con la fecha de publicación igual a la fecha actual.
 */
const logger = require('../utils/logger');
const { getFechaActualFormatoPortal, esFechaHoy } = require('../utils/dateUtils');

/** Nombre de la columna de "Fecha de publicación" en la tabla del portal */
const HEADER_FECHA_PUBLICACION = 'Fecha de publicación';

const headerSelector = 'table#grvAcuerdos thead th, table#grvAcuerdos thead td, table#grvAcuerdos tbody tr:first-child th';

/**
 * Obtiene los índices de columna para Fecha de publicación, Tipo Cuaderno y Resumen en #grvAcuerdos.
 * @returns {Promise<{ indiceFecha: number|null, indiceTipoCuaderno: number|null, indiceResumen: number|null }>}
 */
async function obtenerIndicesColumnas(page) {
  const headerCells = await page.locator(headerSelector).allTextContents();
  const normalized = headerCells.map((t) => t.trim().toLowerCase());
  const indiceFecha = normalized.findIndex((t) => t.includes('fecha') && t.includes('publicación'));
  const indiceTipoCuaderno = normalized.findIndex((t) => t.includes('tipo') && t.includes('cuaderno'));
  const indiceResumen = normalized.findIndex((t) => t.includes('resumen'));
  return {
    indiceFecha: indiceFecha >= 0 ? indiceFecha : null,
    indiceTipoCuaderno: indiceTipoCuaderno >= 0 ? indiceTipoCuaderno : null,
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

/** Separador entre varias entradas (Tipo Cuaderno + Resumen) en Estado Procesal */
const SEPARADOR_ENTRADAS = ' | ';

/**
 * Recorre todas las filas de #grvAcuerdos y recopila las que tienen fecha de publicación = hoy.
 * Para cada fila del día obtiene Tipo Cuaderno y Resumen; construye un único texto para Estado procesal:
 * - 1 fila: "Tipo Cuaderno - Resumen"
 * - 2 o más: "Tipo Cuaderno 1 - Resumen 1 | Tipo Cuaderno 2 - Resumen 2" (misma fecha en Fecha Estado).
 * @param {import('playwright').Page} page
 * @returns {Promise<{ existe: boolean, textoEstadoProcesal: string }>}
 */
async function existePublicacionHoy(page) {
  const fechaHoy = getFechaActualFormatoPortal();
  logger.info('Buscando publicación con fecha:', fechaHoy);

  const { indiceFecha: indiceCol, indiceTipoCuaderno, indiceResumen } = await obtenerIndicesColumnas(page);
  if (indiceCol == null) {
    logger.warn('No se encontró columna "Fecha de publicación"');
    return { existe: false, textoEstadoProcesal: '' };
  }

  const filas = await page.locator('table#grvAcuerdos tbody tr:has(td)').all();
  const entradas = [];

  for (let i = 0; i < filas.length; i++) {
    const celdas = await filas[i].locator('td').allTextContents();
    const textoFecha = celdas[indiceCol] ? String(celdas[indiceCol]).trim() : '';
    if (!esFechaHoy(textoFecha)) continue;

    const tipoCuaderno = (indiceTipoCuaderno != null && celdas[indiceTipoCuaderno])
      ? String(celdas[indiceTipoCuaderno]).trim()
      : '';
    const resumen = (indiceResumen != null && celdas[indiceResumen])
      ? String(celdas[indiceResumen]).trim()
      : '';
    entradas.push({ tipoCuaderno, resumen });
  }

  if (entradas.length === 0) {
    logger.info('No existe publicación con la fecha actual');
    return { existe: false, textoEstadoProcesal: '' };
  }

  logger.info('Publicaciones encontradas hoy:', entradas.length, 'fila(s)');
  const textoEstadoProcesal = entradas
    .map((e) => ((e.tipoCuaderno ? `${e.tipoCuaderno} - ${e.resumen}` : e.resumen) || '').trim())
    .filter(Boolean)
    .join(SEPARADOR_ENTRADAS);

  return { existe: true, textoEstadoProcesal: textoEstadoProcesal || '' };
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
