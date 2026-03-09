/**
 * Orquestador del flujo por expediente: login (una vez por contexto), búsqueda, tabla, síntesis y actualización.
 */
const logger = require('../utils/logger');
const { loginPJF } = require('./login');
const { llenarFiltrosYBuscar, clickBuscarYEsperarNuevaPestana } = require('./searchExpediente');
const { existePublicacionHoy } = require('./extractTable');
const { abrirYExtraerSintesis } = require('./extractSintesis');
const { getFechaActualFormatoPortal } = require('../utils/dateUtils');

/**
 * Procesa un solo expediente en una página ya logueada (en "Consulta de datos públicos").
 * @param {import('playwright').BrowserContext} context
 * @param {import('playwright').Page} page - Página ya en consulta (después de login)
 * @param {{ circuito: string, organo: string, tipoExpediente: string, numeroExpediente: string, rowIndex: number }} expediente
 * @param {(rowIndex: number, estadoProcesal: string, fechaEstado: string) => Promise<void>} actualizarFilaExcel
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function procesarExpediente(context, page, expediente, actualizarFilaExcel) {
  const { circuito, organo, tipoExpediente, numeroExpediente, rowIndex } = expediente;

  try {
    await llenarFiltrosYBuscar(page, {
      circuito,
      organo,
      tipoExpediente,
      numeroExpediente
    });

    const pageTabla = await clickBuscarYEsperarNuevaPestana(context, page);
    await pageTabla.waitForLoadState('networkidle').catch(() => {});

    const { existe, indiceFila } = await existePublicacionHoy(pageTabla);

    if (!existe || indiceFila == null) {
      await pageTabla.close().catch(() => {});
      return { ok: true };
    }

    const texto = await abrirYExtraerSintesis(context, pageTabla, indiceFila);
    await pageTabla.close().catch(() => {});

    const fechaHoy = getFechaActualFormatoPortal();
    await actualizarFilaExcel(rowIndex, texto, fechaHoy);
    logger.info('Excel actualizado para fila', rowIndex + 1);
    return { ok: true };
  } catch (err) {
    logger.error(`Expediente ${numeroExpediente} (fila ${rowIndex + 1}):`, err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { procesarExpediente };
