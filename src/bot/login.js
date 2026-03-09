/**
 * Lógica de login en el portal PJF.
 * No modificar la lógica existente que ya funciona.
 */
const logger = require('../utils/logger');
const {
  URL_LOGIN,
  SELECTOR_INPUT_USUARIO,
  SELECTOR_INPUT_PASSWORD,
  SELECTOR_BOTON_LOGIN,
  SELECTOR_ROL,
  SELECTOR_LINK_CONSULTA,
  SELECTOR_AJAX_CONTAINER,
  TIMEOUT_SELECTOR
} = require('../config/constants');

/**
 * Realiza el login en el portal PJF y deja la página en "Consulta de datos públicos".
 * @param {import('playwright').Page} page
 * @param {{ user: string, password: string }} credenciales
 */
async function loginPJF(page, credenciales) {
  const { user, password } = credenciales;

  await page.goto(URL_LOGIN, { timeout: 60000 });

  await page.waitForSelector(SELECTOR_INPUT_USUARIO, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });
  await page.fill(SELECTOR_INPUT_USUARIO, user);
  await page.fill(SELECTOR_INPUT_PASSWORD, password);
  await page.click(SELECTOR_BOTON_LOGIN);

  logger.info('URL después del login:', page.url());

  await page.waitForSelector(SELECTOR_ROL, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });
  await page.click(SELECTOR_ROL);
  logger.info('Rol seleccionado');

  const botonConsulta = page.locator(SELECTOR_LINK_CONSULTA);
  await botonConsulta.click();
  await page.waitForSelector(SELECTOR_AJAX_CONTAINER, {
    state: 'visible',
    timeout: TIMEOUT_SELECTOR
  });
  logger.info('Entramos a Consulta de datos públicos');
}

module.exports = { loginPJF };
