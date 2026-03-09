/**
 * Llenado del formulario de búsqueda de expediente (circuito, órgano, tipo, número)
 * y click en Buscar.
 */

const logger = require('../utils/logger');
const { normalizarOrgano, normalizarTipoExpediente } = require('../utils/textCleaner');

const {
  SELECTOR_CIRCUITO,
  SELECTOR_ORGANO,
  SELECTOR_TIPO_EXPEDIENTE,
  SELECTOR_INPUT_EXPEDIENTE,
  TIMEOUT_SELECTOR
} = require('../config/constants');


/**
 * Busca una opción dentro de un dropdown "chosen"
 */
async function seleccionarOpcionDropdown(page, selectorChosen, textoBuscado) {

  const texto = String(textoBuscado || '').trim().toUpperCase();

  if (!texto) {
    throw new Error(`Texto vacío para selector ${selectorChosen}`);
  }

  logger.info(`Buscando opción "${texto}" en ${selectorChosen}`);

  await page.waitForSelector(selectorChosen, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });

  await page.locator(selectorChosen).click();

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

    logger.error(`No se encontró coincidencia para "${texto}" en ${selectorChosen}`);

    const listaOpciones = [];

    for (let i = 0; i < count; i++) {
      listaOpciones.push(await opciones.nth(i).innerText());
    }

    logger.error("Opciones disponibles:");
    logger.error(listaOpciones);

    throw new Error(`No se encontró la opción "${texto}"`);
  }
}


/**
 * Llena los filtros del formulario de consulta del PJF
 */
async function llenarFiltrosYBuscar(page, filtros) {

  if (!filtros) {
    throw new Error("Filtros vacíos");
  }

  const circuito = filtros.circuito
    ? String(filtros.circuito).trim().toUpperCase()
    : '';

  const organo = normalizarOrgano(filtros.organo);

  const tipoExpediente = normalizarTipoExpediente(filtros.tipoExpediente);

  const numero = filtros.numeroExpediente
    ? String(filtros.numeroExpediente).trim()
    : '';

  logger.info("======= FILTROS RECIBIDOS =======");
  logger.info(`Circuito: ${circuito}`);
  logger.info(`Órgano: ${organo}`);
  logger.info(`Tipo expediente: ${tipoExpediente}`);
  logger.info(`Número expediente: ${numero}`);
  logger.info("================================");


  /**
   * ==========================
   * SELECCIONAR CIRCUITO
   * ==========================
   */

  await seleccionarOpcionDropdown(
    page,
    '#ddlCircuito_chosen',
    circuito
  );


  /**
   * ==========================
   * SELECCIONAR ÓRGANO
   * ==========================
   */

  await seleccionarOpcionDropdown(
    page,
    '#ddlOrgano_chosen',
    organo
  );


  /**
   * ==========================
   * SELECCIONAR TIPO EXPEDIENTE
   * ==========================
   */

  await seleccionarOpcionDropdown(
    page,
    '#ddlTipoExpediente_chosen',
    tipoExpediente
  );


  /**
   * ==========================
   * ESCRIBIR NÚMERO EXPEDIENTE
   * ==========================
   */

  await page.waitForSelector(SELECTOR_INPUT_EXPEDIENTE, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });

  await page.locator(SELECTOR_INPUT_EXPEDIENTE).fill(numero);

  logger.info(`Número de expediente ingresado: ${numero}`);
}



/**
 * Click en botón Buscar y espera la nueva pestaña
 */

async function clickBuscarYEsperarNuevaPestana(context, page) {

  logger.info("Presionando botón Buscar...");

  const nuevaPaginaPromise = context.waitForEvent('page', {
    timeout: 20000
  });

  await page.getByRole('button', { name: /Buscar/i }).click();

  const pageResultados = await nuevaPaginaPromise;

  await pageResultados.waitForLoadState('domcontentloaded');

  logger.info("Nueva pestaña de resultados abierta correctamente");

  return pageResultados;
}



module.exports = {
  llenarFiltrosYBuscar,
  clickBuscarYEsperarNuevaPestana
};