/**
 * Limpieza de texto para filtros del portal.
 * - Eliminar punto final y caracteres especiales al final.
 * - El circuito se usa en MAYÚSCULAS tal cual viene del Excel.
 */
function limpiarParaFiltro(texto) {
  if (texto == null || typeof texto !== 'string') return '';
  let t = texto.trim();
  // Eliminar punto final y caracteres especiales al final
  t = t.replace(/[.\s]+$/, '');
  return t;
}

/**
 * Circuito: usar exactamente en MAYÚSCULAS como viene del Excel.
 * No convertir a minúsculas ni capitalizar.
 */
function normalizarCircuito(texto) {
  if (texto == null || typeof texto !== 'string') return '';
  return texto.trim();
}

/**
 * Órgano jurisdiccional: limpiar puntos y caracteres finales.
 */
function normalizarOrgano(texto) {
  return limpiarParaFiltro(texto);
}

/**
 * Tipo de expediente: limpiar punto final.
 */
function normalizarTipoExpediente(texto) {
  return limpiarParaFiltro(texto);
}

module.exports = {
  limpiarParaFiltro,
  normalizarCircuito,
  normalizarOrgano,
  normalizarTipoExpediente
};
