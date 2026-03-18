/**
 * Resuelve la ruta del ejecutable de Chromium empaquetado cuando la app se distribuye como .exe.
 * Solo aplica en Electron con app empaquetada; en desarrollo devuelve null y Playwright usa su ubicación por defecto.
 */
const path = require('path');
const fs = require('fs');

/**
 * Devuelve la ruta al chrome.exe o chrome-headless-shell.exe empaquetado, o null si no aplica.
 * @returns {string|null}
 */
function getBundledChromiumPath() {
  try {
    const { app } = require('electron');
    if (!app || !app.isPackaged || !process.resourcesPath) return null;

    const base = path.join(process.resourcesPath, 'playwright-browsers');
    if (!fs.existsSync(base)) return null;

    const dirs = fs.readdirSync(base);
    for (const name of dirs) {
      if (name.startsWith('chromium_headless_shell')) {
        const exe = path.join(base, name, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
        if (fs.existsSync(exe)) return exe;
      }
    }
    for (const name of dirs) {
      if (name.startsWith('chromium')) {
        const chromeExe = path.join(base, name, 'chrome-win', 'chrome.exe');
        const headlessExe = path.join(base, name, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
        if (fs.existsSync(chromeExe)) return chromeExe;
        if (fs.existsSync(headlessExe)) return headlessExe;
      }
    }
    return null;
  } catch (_) {
    return null;
  }
}

module.exports = { getBundledChromiumPath };
