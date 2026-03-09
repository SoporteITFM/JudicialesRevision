/**
 * Llenado del formulario de búsqueda de expediente (circuito, órgano, tipo, número)
 * y click en Buscar. Usa el input interno de Chosen y esperas para estabilidad con AJAX.
 */

const logger = require('../utils/logger');
const { normalizarOrgano, normalizarTipoExpediente } = require('../utils/textCleaner');

const {
  SELECTOR_INPUT_EXPEDIENTE,
  SELECTOR_GRID_RESULTADOS,
  TIMEOUT_SELECTOR,
  WAIT_AFTER_DROPDOWN_MS
} = require('../config/constants');

/**
 * Pequeña espera para que el portal cargue opciones dinámicas tras cada dropdown.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Selecciona una opción en un dropdown Chosen usando el input interno.
 * Flujo: abrir chosen → escribir en input → esperar resultados → clic en opción → espera post-selección.
 */
async function seleccionarOpcionChosenConInput(page, selectorChosen, textoBuscado) {
  const texto = String(textoBuscado || '').trim().toUpperCase();
  if (!texto) {
    throw new Error(`Texto vacío para selector ${selectorChosen}`);
  }

  const selectorInput = `${selectorChosen} input`;

  await page.waitForSelector(selectorChosen, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });

  await page.locator(selectorChosen).click();

  await page.waitForSelector(selectorInput, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });

  await page.locator(selectorInput).fill(texto);

  const opcionesSelector = `${selectorChosen} .chosen-results li`;
  await page.waitForSelector(opcionesSelector, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });

  const opciones = page.locator(opcionesSelector);
  const count = await opciones.count();
  if (count === 0) {
    throw new Error(`No hay opciones disponibles en ${selectorChosen}`);
  }

  let encontrada = false;
  for (let i = 0; i < count; i++) {
    const textoOpcion = await opciones.nth(i).innerText();
    if (textoOpcion.toUpperCase().includes(texto)) {
      await opciones.nth(i).click();
      logger.info(`Opción seleccionada: ${textoOpcion}`);
      encontrada = true;
      break;
    }
  }

  if (!encontrada) {
    const listaOpciones = [];
    for (let i = 0; i < count; i++) {
      listaOpciones.push(await opciones.nth(i).innerText());
    }
    logger.error(`No se encontró coincidencia para "${texto}" en ${selectorChosen}. Opciones:`, listaOpciones);
    throw new Error(`No se encontró la opción "${texto}"`);
  }

  await delay(WAIT_AFTER_DROPDOWN_MS);
}

/**
 * Llena los filtros del formulario de consulta del PJF.
 * Orden: circuito → espera → órgano → espera → tipo → espera → número → buscar.
 */
async function llenarFiltrosYBuscar(page, filtros) {
  if (!filtros) {
    throw new Error('Filtros vacíos');
  }

  await page.waitForLoadState('domcontentloaded');

  const circuito = filtros.circuito
    ? String(filtros.circuito).trim().toUpperCase()
    : '';
  const organo = normalizarOrgano(filtros.organo);
  const tipoExpediente = normalizarTipoExpediente(filtros.tipoExpediente);
  const numero = filtros.numeroExpediente
    ? String(filtros.numeroExpediente).trim()
    : '';

  console.log('Circuito:', circuito);
  console.log('Órgano:', organo);
  console.log('Tipo:', tipoExpediente);
  console.log('Expediente:', numero);

  logger.info('======= FILTROS ======');
  logger.info(`Circuito: ${circuito} | Órgano: ${organo} | Tipo: ${tipoExpediente} | Número: ${numero}`);
  logger.info('=====================');

  // 1. Circuito
  await seleccionarOpcionChosenConInput(page, '#ddlCircuito_chosen', circuito);

  // 2. Órgano
  await seleccionarOpcionChosenConInput(page, '#ddlOrgano_chosen', organo);

  // 3. Tipo expediente
  await seleccionarOpcionChosenConInput(page, '#ddlTipoExpediente_chosen', tipoExpediente);

  // 4. Número de expediente
  await page.waitForSelector(SELECTOR_INPUT_EXPEDIENTE, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });
  await page.locator(SELECTOR_INPUT_EXPEDIENTE).fill(numero);
  logger.info(`Número de expediente ingresado: ${numero}`);
}

/**
 * Clic en Buscar y espera la nueva pestaña. Espera a que cargue y a #gridResultados (si hay resultados).
 */
async function clickBuscarYEsperarNuevaPestana(context, page) {
  logger.info('Presionando botón Buscar...');

  const nuevaPaginaPromise = context.waitForEvent('page', { timeout: 20000 });
  await page.getByRole('button', { name: /Buscar/i }).click();

  const pageResultados = await nuevaPaginaPromise;
  await pageResultados.waitForLoadState('domcontentloaded');

  try {
    await pageResultados.waitForSelector(SELECTOR_GRID_RESULTADOS, {
      state: 'visible',
      timeout: 15000
    });
  } catch {
    // Timeout: puede ser página "No se encontraron registros"; el caller lo detecta
  }

  logger.info('Nueva pestaña de resultados abierta');
  return pageResultados;
}

module.exports = {
  llenarFiltrosYBuscar,
  clickBuscarYEsperarNuevaPestana
};
