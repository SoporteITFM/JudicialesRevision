/**
 * Proceso principal de Electron. Gestiona ventana, IPC y ejecución del bot.
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { leerExcelCompleto, buildExpedientesFromData } = require('./src/excel/readExcel');
const { actualizarFilaEnData, guardarExcel } = require('./src/excel/writeExcel');
const { runPool } = require('./src/utils/browserPool');
const logger = require('./src/utils/logger');

const RUTA_SALIDA = path.join(__dirname, 'output', 'resultados.xlsx');

let mainWindow = null;
let excelResultado = null; // { workbook, sheetName, data } al terminar

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'ui', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// Abrir diálogo para seleccionar archivo Excel
ipcMain.handle('abrir-dialogo-excel', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// Cargar Excel: el renderer envía la ruta del archivo seleccionado
ipcMain.handle('cargar-excel', async (event, rutaArchivo) => {
  if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
    return { ok: false, error: 'Archivo no encontrado' };
  }
  try {
    const { workbook, sheetName, data } = leerExcelCompleto(rutaArchivo);
    const expedientes = buildExpedientesFromData(data);
    excelResultado = { workbook, sheetName, data, rutaOriginal: rutaArchivo };
    return { ok: true, total: expedientes.length, nombre: path.basename(rutaArchivo) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Ejecutar revisión: corre el pool con el Excel ya cargado
ipcMain.handle('ejecutar-revision', async () => {
  const user = process.env.PJF_USER;
  const password = process.env.PJF_PASSWORD || process.env.PJF_PASS;
  if (!user || !password) {
    return { ok: false, error: 'Faltan PJF_USER y PJF_PASSWORD en .env' };
  }
  if (!excelResultado) {
    return { ok: false, error: 'Primero carga un archivo Excel' };
  }

  const { workbook, sheetName, data } = excelResultado;
  const expedientes = buildExpedientesFromData(data);

  if (expedientes.length === 0) {
    return { ok: false, error: 'No hay expedientes en el Excel' };
  }

  logger.setOnLog((entry) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log', entry);
    }
  });

  try {
    await runPool({
      expedientes,
      credenciales: { user, password },
      onFilaActualizada: (rowIndex, estadoProcesal, fechaEstado) => {
        actualizarFilaEnData(data, rowIndex, estadoProcesal, fechaEstado);
      },
      onProgreso: (current, total) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('progreso', { current, total });
        }
      }
    });

    guardarExcel(workbook, sheetName, data, RUTA_SALIDA);
    excelResultado = { ...excelResultado, data };
    return { ok: true, rutaSalida: RUTA_SALIDA };
  } catch (err) {
    logger.error('Error en ejecución:', err.message);
    return { ok: false, error: err.message };
  }
});

// Ruta del Excel generado para descarga
ipcMain.handle('obtener-ruta-descarga', () => {
  return fs.existsSync(RUTA_SALIDA) ? RUTA_SALIDA : null;
});

ipcMain.handle('mostrar-en-carpeta', (event, ruta) => {
  if (ruta && fs.existsSync(ruta)) shell.showItemInFolder(ruta);
});
