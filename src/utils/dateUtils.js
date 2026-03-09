/**
 * Utilidades de fecha. Formato del portal: DD-MM-YYYY
 */
function getFechaActualFormatoPortal() {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  return `${dia}-${mes}-${anio}`;
}

/**
 * Compara una fecha en formato DD-MM-YYYY con la fecha actual.
 */
function esFechaHoy(fechaPortal) {
  if (!fechaPortal || typeof fechaPortal !== 'string') return false;
  const limpia = String(fechaPortal).trim();
  return limpia === getFechaActualFormatoPortal();
}

module.exports = {
  getFechaActualFormatoPortal,
  esFechaHoy
};
