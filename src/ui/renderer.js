/**
 * Renderer: UI para cargar Excel, ejecutar bot, ver progreso y descargar resultado.
 */
const btnCargar = document.getElementById('btnCargar');
const nombreArchivo = document.getElementById('nombreArchivo');
const btnEjecutar = document.getElementById('btnEjecutar');
const textoProgreso = document.getElementById('textoProgreso');
const logContainer = document.getElementById('logContainer');
const btnDescargar = document.getElementById('btnDescargar');

let totalExpedientes = 0;
let rutaArchivoCargado = null;

btnCargar.addEventListener('click', async () => {
  const ruta = await window.pjfApi.abrirDialogoExcel();
  if (!ruta) return;
  rutaArchivoCargado = ruta;
  const result = await window.pjfApi.cargarExcel(rutaArchivoCargado);
  if (result.ok) {
    totalExpedientes = result.total;
    nombreArchivo.textContent = result.nombre;
    btnEjecutar.disabled = false;
    addLog('info', `Excel cargado: ${result.total} expedientes`);
  } else {
    nombreArchivo.textContent = '—';
    addLog('error', result.error || 'Error al cargar');
  }
});

btnEjecutar.addEventListener('click', async () => {
  btnEjecutar.disabled = true;
  btnDescargar.disabled = true;
  textoProgreso.textContent = 'Iniciando...';
  addLog('info', 'Iniciando revisión');

  const result = await window.pjfApi.ejecutarRevision();
  if (result.ok) {
    textoProgreso.textContent = `Finalizado. Procesados ${totalExpedientes} expedientes.`;
    addLog('info', 'Revisión completada. Puedes descargar el Excel.');
    btnDescargar.disabled = false;
  } else {
    addLog('error', result.error || 'Error en la ejecución');
    textoProgreso.textContent = 'Error';
    btnEjecutar.disabled = false;
  }
});

window.pjfApi.onProgreso(({ current, total }) => {
  textoProgreso.textContent = `Procesando expediente ${current} de ${total}`;
});

window.pjfApi.onLog((entry) => {
  addLog(entry.level.toLowerCase(), entry.message, entry.data);
});

function addLog(level, message, data) {
  const line = document.createElement('div');
  line.className = `log-line log-${level}`;
  line.textContent = data != null ? `${message} ${JSON.stringify(data)}` : message;
  logContainer.appendChild(line);
  logContainer.scrollTop = logContainer.scrollHeight;
}

btnDescargar.addEventListener('click', async () => {
  const ruta = await window.pjfApi.obtenerRutaDescarga();
  if (ruta) {
    addLog('info', 'Archivo guardado en: ' + ruta);
    window.pjfApi.mostrarEnCarpeta(ruta);
  }
});
