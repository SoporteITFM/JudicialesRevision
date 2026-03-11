const { procesarExpediente } = require('../bot/scraper');
const logger = require('./logger');

/**
 * Solo se debe actualizar el Excel cuando el estado procesal tenga fecha del día actual.
 * No actualizar si: SIN RESULTADOS, Error, o fecha vacía.
 */
function debeActualizarExcel(resultado) {
  if (!resultado || !resultado.fechaEstado) return false;
  if (resultado.estadoProcesal === 'SIN RESULTADOS') return false;
  if (String(resultado.estadoProcesal || '').startsWith('Error:')) return false;
  return true;
}

async function runPool({
  expedientes,
  credenciales,
  onFilaActualizada,
  onProgreso
}) {

  const total = expedientes.length;

  logger.info(`Iniciando procesamiento secuencial de ${total} expedientes`);

  for (let i = 0; i < expedientes.length; i++) {

    const expediente = expedientes[i];

    try {

      logger.info(`[${i + 1}/${total}] Expediente procesado: ${expediente.numeroExpediente}`);

      const resultado = await procesarExpediente(
        expediente,
        credenciales
      );

      if (resultado && debeActualizarExcel(resultado)) {

        logger.info(`Estado encontrado con fecha del día → actualización en fila ${expediente.rowIndex + 1}`);
        if (onFilaActualizada) {
          onFilaActualizada(
            expediente.rowIndex,
            resultado.estadoProcesal,
            resultado.fechaEstado
          );
        }

      } else if (resultado) {

        logger.info(`Sin actualización para expediente ${expediente.numeroExpediente} (sin movimiento del día o sin resultados)`);

      }

    } catch (error) {

      logger.error(
        `Error procesando expediente ${expediente.numeroExpediente}:`,
        error.message
      );
      // Continuar con el siguiente expediente; no detener el procesamiento
    }

    if (onProgreso) {

      onProgreso(i + 1, total);

    }

  }

  logger.info('Procesamiento de expedientes finalizado');

}

module.exports = {
  runPool
};