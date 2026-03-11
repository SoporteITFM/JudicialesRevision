/**
 * Constantes del sistema de automatización PJF
 */

// URLs del portal
const URL_LOGIN = 'https://www.serviciosenlinea.pjf.gob.mx/juicioenlinea/Home/Login';

// Selectores de login
const SELECTOR_INPUT_USUARIO = '#UserName';
const SELECTOR_INPUT_PASSWORD = '#UserPassword';
const SELECTOR_BOTON_LOGIN = '#btnIngresaLogin';
const SELECTOR_ROL = 'input[type="image"][src*="rol-p-juridica-privada"]';

// Selectores de consulta
const SELECTOR_LINK_CONSULTA = 'a[href="/juicioenlinea/juicioenlinea/Expediente/GetMapa"]';
const SELECTOR_AJAX_CONTAINER = '#AjaxContainer';
const SELECTOR_CIRCUITO = '#ddlCircuito_chosen';
const SELECTOR_ORGANO = '#ddlOrgano_chosen';
const SELECTOR_TIPO_EXPEDIENTE = '#ddlTipoExpediente_chosen';
const SELECTOR_INPUT_EXPEDIENTE = '#txtExpediente';
const SELECTOR_BOTON_BUSCAR = 'button:has-text("Buscar"), input[value="Buscar"]';
const SELECTOR_GRID_RESULTADOS = '#grvAcuerdos';

// Espera tras cada dropdown (AJAX del portal)
const WAIT_AFTER_DROPDOWN_MS = 1200;

// Columna del circuito en Excel (0-based). A=0, B=1, C=2. Ajustar si tu Excel usa otra columna.
const COL_CIRCUITO = 2;
// Mapeo de columnas Excel (0-based)
const COL_ORGANO = 0;           // A - Órgano jurisdiccional
const COL_NUMERO_EXPEDIENTE = 1; // B - Número de expediente
const COL_TIPO_EXPEDIENTE = 4;   // E - Tipo de expediente
const COL_ESTADO_PROCESAL = 7;   // H - Estado Procesal (escritura)
const COL_FECHA_ESTADO = 9;      // J - Fecha Estado Procesal (escritura)

// Formato de fecha del portal
const FORMATO_FECHA_PORTAL = 'DD-MM-YYYY';

// Ruta de salida del Excel
const RUTA_EXCEL_SALIDA = 'output/resultados.xlsx';

// Tamaño del pool de navegadores
const POOL_SIZE = 5;

// Timeouts
const TIMEOUT_NAVEGACION = 30000;
const TIMEOUT_SELECTOR = 15000;

module.exports = {
  URL_LOGIN,
  SELECTOR_INPUT_USUARIO,
  SELECTOR_INPUT_PASSWORD,
  SELECTOR_BOTON_LOGIN,
  SELECTOR_ROL,
  SELECTOR_LINK_CONSULTA,
  SELECTOR_AJAX_CONTAINER,
  SELECTOR_CIRCUITO,
  SELECTOR_ORGANO,
  SELECTOR_TIPO_EXPEDIENTE,
  SELECTOR_INPUT_EXPEDIENTE,
  SELECTOR_BOTON_BUSCAR,
  SELECTOR_GRID_RESULTADOS,
  WAIT_AFTER_DROPDOWN_MS,
  COL_CIRCUITO,
  COL_ORGANO,
  COL_NUMERO_EXPEDIENTE,
  COL_TIPO_EXPEDIENTE,
  COL_ESTADO_PROCESAL,
  COL_FECHA_ESTADO,
  FORMATO_FECHA_PORTAL,
  RUTA_EXCEL_SALIDA,
  POOL_SIZE,
  TIMEOUT_NAVEGACION,
  TIMEOUT_SELECTOR
};
