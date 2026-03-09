/**
 * Pool de N navegadores Playwright. Cada uno procesa expedientes desde una cola compartida.
 */
const { chromium } = require('playwright');
const logger = require('./logger');
const { loginPJF } = require('../bot/login');
const { procesarExpediente } = require('../bot/scraper');
const { POOL_SIZE, TIMEOUT_NAVEGACION } = require('../config/constants');

/**
 * Crea un pool de navegadores y ejecuta el procesamiento de expedientes en paralelo.
 * @param {Object} opts
 * @param {number} [opts.size=5] - Número de navegadores
 * @param {Array} opts.expedientes - Lista de expedientes a procesar
 * @param {{ user: string, password: string }} opts.credenciales
 * @param {(rowIndex: number, estadoProcesal: string, fechaEstado: string) => void} opts.onFilaActualizada
 * @param {(current: number, total: number) => void} [opts.onProgreso]
 */
async function runPool(opts) {
  const size = opts.size || POOL_SIZE;
  const { expedientes, credenciales, onFilaActualizada, onProgreso } = opts;
  const total = expedientes.length;
  let procesados = 0;
  const cola = [...expedientes];

  async function worker(workerId) {
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        timeout: TIMEOUT_NAVEGACION
      });
      const page = await context.newPage();

      await loginPJF(page, credenciales);

      const actualizarFila = async (rowIndex, estadoProcesal, fechaEstado) => {
        onFilaActualizada(rowIndex, estadoProcesal, fechaEstado);
      };

      while (cola.length > 0) {
        const expediente = cola.shift();
        if (!expediente) break;

        try {
          await procesarExpediente(context, page, expediente, actualizarFila);
        } catch (err) {
          logger.error(`Worker ${workerId} expediente ${expediente.numeroExpediente}:`, err.message);
        }

        procesados++;
        if (onProgreso) onProgreso(procesados, total);
      }

      await browser.close();
    } catch (err) {
      logger.error(`Worker ${workerId}:`, err.message);
      if (browser) await browser.close().catch(() => {});
    }
  }

  const workers = Array.from({ length: Math.min(size, total) }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  logger.info('Pool finalizado. Procesados:', procesados);
}

module.exports = { runPool };
