/**
 * Orquestador del flujo por expediente: login, búsqueda, detección de resultados y extracción.
 * procesarExpediente(expediente, credenciales) abre navegador, ejecuta el flujo y devuelve { estadoProcesal, fechaEstado }.
 */
const { chromium } = require('playwright');
const logger = require('../utils/logger');
const { loginPJF } = require('./login');
const { llenarFiltrosYBuscar, clickBuscarYEsperarNuevaPestana } = require('./searchExpediente');
const { existePublicacionHoy } = require('./extractTable');
const { getFechaActualFormatoPortal } = require('../utils/dateUtils');
const { SELECTOR_GRID_RESULTADOS } = require('../config/constants');

const MENSAJE_SIN_REGISTROS = 'No se encontraron registros';

/**
 * Comprueba si la página de resultados indica que no hay registros.
 */
async function esPaginaSinResultados(page) {
  const body = await page.locator('body').textContent().catch(() => '');
  return String(body || '').includes(MENSAJE_SIN_REGISTROS);
}

/**
 * Comprueba si en la página está visible el grid de resultados.
 */
async function tieneGridResultados(page) {
  const el = page.locator(SELECTOR_GRID_RESULTADOS).first();
  return (await el.count()) > 0 && (await el.isVisible().catch(() => false));
}

/**
 * Procesa un expediente: login, búsqueda, detección de "sin resultados" o extracción de estado/fecha.
 * Compatible con browserPool: recibe (expediente, credenciales) y devuelve { estadoProcesal, fechaEstado }.
 *
 * @param {{ circuito: string, organo: string, tipoExpediente: string, numeroExpediente: string, rowIndex: number }} expediente
 * @param {{ user: string, password: string }} credenciales
 * @returns {Promise<{ estadoProcesal: string, fechaEstado: string }>}
 */
async function procesarExpediente(expediente, credenciales) {
  const { circuito, organo, tipoExpediente, numeroExpediente, rowIndex } = expediente;
  let browser;
  let pageResultados = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginPJF(page, credenciales);
    await page.waitForLoadState('domcontentloaded');

    await llenarFiltrosYBuscar(page, {
      circuito,
      organo,
      tipoExpediente,
      numeroExpediente
    });

    pageResultados = await clickBuscarYEsperarNuevaPestana(context, page);
    await pageResultados.waitForLoadState('networkidle').catch(() => {});

    const sinResultados = await esPaginaSinResultados(pageResultados);
    const conGrid = await tieneGridResultados(pageResultados);

    if (sinResultados || !conGrid) {
      logger.info(`Expediente ${numeroExpediente}: sin resultados en el portal`);
      await pageResultados.close().catch(() => {});
      await browser.close().catch(() => {});
      return {
        estadoProcesal: 'SIN RESULTADOS',
        fechaEstado: ''
      };
    }

    const { existe, indiceFila, textoResumen } = await existePublicacionHoy(pageResultados);

    if (!existe || indiceFila == null) {
      logger.info(`Expediente ${numeroExpediente}: no hay publicación con fecha del día actual → no actualizar`);
      await pageResultados.close().catch(() => {});
      await browser.close().catch(() => {});
      return { estadoProcesal: '', fechaEstado: '' };
    }

    await pageResultados.close().catch(() => {});
    await browser.close().catch(() => {});

    const fechaHoy = getFechaActualFormatoPortal();
    logger.info(`Expediente ${numeroExpediente} (fila ${rowIndex + 1}): estado encontrado con fecha del día → se actualizará Excel`);
    return {
      estadoProcesal: textoResumen || '',
      fechaEstado: fechaHoy
    };
  } catch (err) {
    logger.error(`Expediente ${numeroExpediente} (fila ${rowIndex + 1}):`, err.message);
    if (pageResultados && !pageResultados.isClosed()) {
      await pageResultados.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    return {
      estadoProcesal: `Error: ${err.message}`,
      fechaEstado: ''
    };
  }
}

module.exports = { procesarExpediente };
