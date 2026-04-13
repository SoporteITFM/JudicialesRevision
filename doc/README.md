# Documentación — ETHOS · PJF Bot Expedientes

Aplicación de escritorio (Electron) para consultar expedientes en el portal **Juicio en Línea** del Poder Judicial Federal y actualizar un Excel con el estado procesal.

## Índice

| Documento | Descripción |
|-----------|-------------|
| [Ejecución en desarrollo](ejecucion-desarrollo.md) | Requisitos, instalación, `.env`, Playwright y `npm start` |
| [Variables de entorno](variables-entorno.md) | Credenciales del portal (`PJF_USER`, `PJF_PASSWORD`) |
| [Formato del Excel](formato-excel.md) | Estructura del archivo de entrada y columnas que se escriben |
| [Build e instalador Windows](build-instalador.md) | `npm run build`, Chromium empaquetado, salida en `dist/` |
| [Arquitectura](arquitectura.md) | Flujo Electron, scraper Playwright y actualización del Excel |
| [Iconos y assets](iconos-y-assets.md) | Iconos para el ejecutable y la ventana |

## Inicio rápido

1. [Node.js](https://nodejs.org/) LTS y `npm install` en la raíz del repositorio.
2. Archivo `.env` con credenciales (ver [variables-entorno.md](variables-entorno.md)).
3. `npx playwright install chromium` y `npm start`.

Para generar el instalador NSIS para Windows, ver [build-instalador.md](build-instalador.md).
