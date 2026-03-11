/**
 * Llenado del formulario de búsqueda de expediente (circuito, órgano, tipo, número)
 * y click en Buscar. Usa el patrón del portal PJF: Chosen + getByText para circuito/órgano;
 * para tipo de expediente usa listitem o enlace (a) con filter(hasText) para evitar timeouts.
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
 * Selecciona el circuito: click en el Chosen y luego en la opción por texto exacto.
 */
async function seleccionarCircuito(page, circuito) {
  if (!circuito) throw new Error('Circuito vacío');
  await page.waitForSelector('#ddlCircuito_chosen', { state: 'visible', timeout: TIMEOUT_SELECTOR });
  await page.locator('#ddlCircuito_chosen').click();
  await delay(WAIT_AFTER_DROPDOWN_MS);
  await page.locator('#ddlCircuito_chosen').getByText(circuito, { exact: true }).click();
  logger.info('Circuito seleccionado:', circuito);
  await delay(WAIT_AFTER_DROPDOWN_MS);
}

/**
 * Selecciona el órgano: click en el Chosen y luego en la opción por texto (coincidencia parcial).
 */
async function seleccionarOrgano(page, organo) {
  if (!organo) throw new Error('Órgano vacío');
  await page.waitForSelector('#ddlOrgano_chosen', { state: 'visible', timeout: TIMEOUT_SELECTOR });
  await page.locator('#ddlOrgano_chosen').click();
  await delay(WAIT_AFTER_DROPDOWN_MS);
  await page.locator('#ddlOrgano_chosen').getByText(organo, { exact: false }).click();
  logger.info('Órgano seleccionado:', organo);
  await delay(WAIT_AFTER_DROPDOWN_MS);
}

/**
 * Selecciona el tipo de expediente usando listitem o enlace (a) con el texto.
 * Opcionalmente abre el chosen de tipo si está visible (timeout corto); luego clic en la opción.
 */
async function seleccionarTipoExpediente(page, tipoExpediente) {
  if (!tipoExpediente) throw new Error('Tipo de expediente vacío');
  await delay(WAIT_AFTER_DROPDOWN_MS);
  try {
    await page.locator('#ddlTipoExpediente_chosen').click({ timeout: 5000 });
    await delay(500);
  } catch {
    // Chosen de tipo puede no estar visible; las opciones pueden mostrarse de otra forma
  }
  const listitem = page.getByRole('listitem').filter({ hasText: tipoExpediente }).first();
  const enlace = page.locator('a').filter({ hasText: tipoExpediente }).first();
  try {
    await listitem.waitFor({ state: 'visible', timeout: TIMEOUT_SELECTOR });
    await listitem.click();
    logger.info('Tipo de expediente seleccionado (listitem):', tipoExpediente);
  } catch {
    await enlace.waitFor({ state: 'visible', timeout: TIMEOUT_SELECTOR });
    await enlace.click();
    logger.info('Tipo de expediente seleccionado (enlace):', tipoExpediente);
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
  await page.waitForLoadState('networkidle').catch(() => {});

  const circuito = filtros.circuito
    ? String(filtros.circuito).trim().toUpperCase()
    : '';
  const organo = normalizarOrgano(filtros.organo);
  const tipoExpediente = normalizarTipoExpediente(filtros.tipoExpediente);
  const numero = filtros.numeroExpediente
    ? String(filtros.numeroExpediente).trim()
    : '';

  logger.info('======= FILTROS ======');
  logger.info(`Circuito: ${circuito} | Órgano: ${organo} | Tipo: ${tipoExpediente} | Número: ${numero}`);
  logger.info('=====================');

  await seleccionarCircuito(page, circuito);
  await seleccionarOrgano(page, organo);
  await seleccionarTipoExpediente(page, tipoExpediente);

  await page.waitForSelector(SELECTOR_INPUT_EXPEDIENTE, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });
  await page.locator(SELECTOR_INPUT_EXPEDIENTE).fill(numero);
  logger.info(`Número de expediente ingresado: ${numero}`);
}

/**
 * Clic en Buscar y espera la nueva pestaña.
 * Antes de hacer click se cierra cualquier dropdown Chosen abierto (Escape + click en input)
 * para evitar que un <li> del modal intercepte el click.
 */
async function clickBuscarYEsperarNuevaPestana(context, page) {
  logger.info('Cerrando dropdown y presionando botón Buscar...');

  await page.keyboard.press('Escape');
  await delay(150);
  await page.keyboard.press('Escape');
  await delay(150);
  await page.locator(SELECTOR_INPUT_EXPEDIENTE).click({ force: true }).catch(() => {});
  await delay(300);

  const nuevaPaginaPromise = context.waitForEvent('page', { timeout: 20000 });
  await page.locator('#btnBuscaExpediente').evaluate((el) => el.click());

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
