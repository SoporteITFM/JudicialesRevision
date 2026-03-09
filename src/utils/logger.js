/**
 * Logger simple para el bot. Emite mensajes a consola y puede enviar a la UI vía callback.
 */
let onLogCallback = null;

function setOnLog(callback) {
  onLogCallback = callback;
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line, data !== null ? data : '');
  if (onLogCallback) {
    try {
      onLogCallback({ level, message, data });
    } catch (e) {
      console.error('Error en callback de log:', e);
    }
  }
}

function info(message, data = null) {
  log('INFO', message, data);
}

function error(message, data = null) {
  log('ERROR', message, data);
}

function warn(message, data = null) {
  log('WARN', message, data);
}

module.exports = {
  setOnLog,
  info,
  error,
  warn,
  log
};
