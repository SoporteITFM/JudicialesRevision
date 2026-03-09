/**
 * Abre "Ver síntesis" (nueva pestaña) y extrae el texto debajo del título "Síntesis".
 */
const logger = require('../utils/logger');
const { getBotonSintesisEnFila } = require('./extractTable');

/**
 * Click en Ver síntesis y espera la nueva pestaña.
 * @param {import('playwright').BrowserContext} context
 * @param {import('playwright').Page} pageTabla - Página con la tabla de actuaciones
 * @param {number} indiceFila - Fila donde está el enlace Ver síntesis
 * @returns {Promise<import('playwright').Page>} Página de la síntesis
 */
async function abrirSintesisEnNuevaPestana(context, pageTabla, indiceFila) {
  const page2Promise = context.waitForEvent('page', { timeout: 15000 });
  const botonSintesis = getBotonSintesisEnFila(pageTabla, indiceFila);
  await botonSintesis.click();
  const page2 = await page2Promise;
  await page2.waitForLoadState('domcontentloaded');
  return page2;
}

/**
 * Extrae el texto que está debajo de la palabra "Síntesis" en la página.
 * @param {import('playwright').Page} pageSintesis
 * @returns {Promise<string>}
 */
async function extraerTextoDeSintesis(pageSintesis) {
  await pageSintesis.waitForLoadState('networkidle').catch(() => {});

  const body = await pageSintesis.locator('body').textContent().catch(() => '');
  if (!body) return '';

  const idx = body.toLowerCase().indexOf('síntesis');
  if (idx >= 0) {
    const despues = body.slice(idx + 'síntesis'.length).trim();
    const hastaSiguienteTitulo = despues.split(/\n\s*[A-ZÁÉÍÓÚ][a-záéíóú]+:?\s*\n/)[0];
    return (hastaSiguienteTitulo || despues).trim();
  }
  return body.trim();
}

/**
 * Flujo completo: abrir síntesis en nueva pestaña y extraer texto.
 * @param {import('playwright').BrowserContext} context
 * @param {import('playwright').Page} pageTabla
 * @param {number} indiceFila
 * @returns {Promise<string>}
 */
async function abrirYExtraerSintesis(context, pageTabla, indiceFila) {
  const page2 = await abrirSintesisEnNuevaPestana(context, pageTabla, indiceFila);
  const texto = await extraerTextoDeSintesis(page2);
  await page2.close().catch(() => {});
  return texto;
}

module.exports = {
  abrirSintesisEnNuevaPestana,
  extraerTextoDeSintesis,
  abrirYExtraerSintesis
};
