/**
 * Preload: expone API segura al renderer (cargar Excel, ejecutar, progreso, log, descarga).
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pjfApi', {
  abrirDialogoExcel: () => ipcRenderer.invoke('abrir-dialogo-excel'),
  cargarExcel: (rutaArchivo) => ipcRenderer.invoke('cargar-excel', rutaArchivo),
  ejecutarRevision: () => ipcRenderer.invoke('ejecutar-revision'),
  obtenerRutaDescarga: () => ipcRenderer.invoke('obtener-ruta-descarga'),
  mostrarEnCarpeta: (ruta) => ipcRenderer.invoke('mostrar-en-carpeta', ruta),
  onProgreso: (cb) => {
    const sub = (e, data) => cb(data);
    ipcRenderer.on('progreso', sub);
    return () => ipcRenderer.removeListener('progreso', sub);
  },
  onLog: (cb) => {
    const sub = (e, entry) => cb(entry);
    ipcRenderer.on('log', sub);
    return () => ipcRenderer.removeListener('log', sub);
  }
});
