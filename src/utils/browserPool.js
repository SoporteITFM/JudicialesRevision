const { procesarExpediente } = require('../bot/scraper');
const logger = require('./logger');

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

      logger.info(`Procesando expediente ${i + 1}/${total}: ${expediente.numeroExpediente}`);

      const resultado = await procesarExpediente(
        expediente,
        credenciales
      );

      if (resultado && onFilaActualizada) {

        onFilaActualizada(
          expediente.rowIndex,
          resultado.estadoProcesal,
          resultado.fechaEstado
        );

      }

    } catch (error) {

      logger.error(
        `Error procesando expediente ${expediente.numeroExpediente}:`,
        error.message
      );

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