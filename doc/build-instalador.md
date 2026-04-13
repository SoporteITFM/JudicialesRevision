# Build e instalador (Windows)

El proyecto usa **electron-builder** con objetivo **NSIS** para Windows. El nombre del producto empaquetado es el definido en `package.json` → `build.productName` (por ejemplo **ETHOS - PJF Bot Expedientes**).

## Comando

Desde la raíz del repositorio:

```bash
npm run build
```

Este script hace dos cosas en secuencia:

1. **`node scripts/install-playwright-browsers.js`**  
   - Crea la carpeta `playwright-browsers/` (ignorada por git).  
   - Instala **Chromium** de Playwright ahí, con `PLAYWRIGHT_BROWSERS_PATH` apuntando a esa carpeta.  
   - Así el instalador puede incluir el navegador sin depender de la caché global del desarrollador.

2. **`electron-builder`**  
   - Empaqueta la aplicación Electron.  
   - Copia `playwright-browsers` como recurso extra (`extraResources` en `package.json`).  
   - Genera el instalador en la carpeta **`dist/`**.

## Salida

- Busca el **instalador NSIS** (`.exe` de setup) y el ejecutable en **`dist/`**.  
- El instalador permite elegir carpeta de instalación (`oneClick: false`, `allowToChangeInstallationDirectory: true`).

## Requisitos

- Misma máquina de build: **Node.js**, dependencias instaladas (`npm install`).  
- Iconos: opcionalmente coloca `assets/icon.ico` (y `assets/icon.png` para la ventana) según [iconos-y-assets.md](iconos-y-assets.md).

## Firma de código (`signAndEditExecutable`)

En `package.json`, bajo `build.win`, está configurado por defecto:

```json
"signAndEditExecutable": false
```

Así el build **no** intenta descargar y extraer el paquete `winCodeSign` para editar/firmar el ejecutable. Eso evita errores habituales en Windows como *Cannot create symbolic link / El cliente no dispone de un privilegio requerido* al descomprimir herramientas que incluyen enlaces simbólicos (sin modo desarrollador ni terminal como administrador).

Si en tu organización necesitáis **firma de código** con certificado:

- Poned `signAndEditExecutable` en `true` y configurad el entorno de firma (y privilegios o Modo de desarrollador en Windows para symlinks), o  
- Seguid la documentación de electron-builder para firma en Windows.

La app instalada funciona igual; solo cambia si el `.exe` queda preparado para firma adicional en el pipeline de build.

## Plataforma

La configuración actual genera instalador para **Windows**. Otros sistemas no están definidos en el `build` actual.

## Tamaño del instalador

Incluir Chromium aumenta mucho el tamaño del paquete; es esperado para que el usuario final no tenga que ejecutar `playwright install` a mano.
