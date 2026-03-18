/**
 * Instala Chromium de Playwright en la carpeta playwright-browsers del proyecto
 * para que electron-builder pueda incluirla en el instalador.
 */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const browsersDir = path.join(projectRoot, 'playwright-browsers');

fs.mkdirSync(browsersDir, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersDir;

console.log('Instalando Chromium de Playwright en', browsersDir);
execSync('npx playwright install chromium', {
  stdio: 'inherit',
  cwd: projectRoot,
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersDir }
});
console.log('Chromium instalado correctamente para el build.');
