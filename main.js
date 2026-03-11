/**
 * Proceso principal de Electron. Gestiona ventana, IPC y ejecución del bot.
 */
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { leerExcelCompleto, buildExpedientesFromData } = require('./src/excel/readExcel');
const { actualizarFila, guardarExcel } = require('./src/excel/writeExcel');
const { runPool } = require('./src/utils/browserPool');
const logger = require('./src/utils/logger');
const { getFechaParaArchivo } = require('./src/utils/dateUtils');

let mainWindow = null;
let excelResultado = null; // { workbook, sheetName, data } al terminar

function crearMenuAplicacion() {
  const plantilla = [
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Cómo usar',
          click: () => {
            const ventanaAyuda = new BrowserWindow({
              width: 520,
              height: 520,
              parent: mainWindow,
              modal: false,
              webPreferences: { contextIsolation: true, nodeIntegration: false }
            });
            ventanaAyuda.loadFile(path.join(__dirname, 'src', 'ui', 'ayuda.html'));
            ventanaAyuda.setMenu(null);
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(plantilla);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const opcionesVentana = {
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  };
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  if (fs.existsSync(iconPath)) {
    opcionesVentana.icon = iconPath;
  }
  mainWindow = new BrowserWindow(opcionesVentana);
  mainWindow.loadFile(path.join(__dirname, 'src', 'ui', 'index.html'));
  crearMenuAplicacion();
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
    const { workbook, sheetName, data } = await leerExcelCompleto(rutaArchivo);
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
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    return { ok: false, error: 'No se encontró la hoja en el Excel' };
  }
  const expedientes = buildExpedientesFromData(data);

  if (expedientes.length === 0) {
    return { ok: false, error: 'No hay expedientes en el Excel' };
  }

  logger.setOnLog((entry) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log', entry);
    }
  });

  const fechaArchivo = getFechaParaArchivo();
  const nombreArchivo = `Actualizacion_Boletin_${fechaArchivo}.xlsx`;
  const rutaSalida = path.join(app.getPath('downloads'), nombreArchivo);

  try {
    await runPool({
      expedientes,
      credenciales: { user, password },
      onFilaActualizada: (rowIndex, estadoProcesal, fechaEstado) => {
        actualizarFila(worksheet, rowIndex, estadoProcesal, fechaEstado);
      },
      onProgreso: (current, total) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('progreso', { current, total });
        }
      }
    });

    await guardarExcel(workbook, rutaSalida);
    return { ok: true, rutaSalida };
  } catch (err) {
    logger.error('Error en ejecución:', err.message);
    return { ok: false, error: err.message };
  }
});

// Ruta del Excel generado para descarga (carpeta Descargas del usuario)
ipcMain.handle('obtener-ruta-descarga', () => {
  const { getFechaParaArchivo } = require('./src/utils/dateUtils');
  const nombre = `Actualizacion_Boletin_${getFechaParaArchivo()}.xlsx`;
  const ruta = path.join(app.getPath('downloads'), nombre);
  return fs.existsSync(ruta) ? ruta : null;
});

ipcMain.handle('mostrar-en-carpeta', (event, ruta) => {
  if (ruta && fs.existsSync(ruta)) shell.showItemInFolder(ruta);
});
