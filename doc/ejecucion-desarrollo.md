# Ejecución en desarrollo

## Requisitos

- **Windows** (el instalador y el flujo actual están orientados a este sistema).
- **Node.js** en versión **LTS** (incluye `npm`).
- Cuenta de acceso al portal [Juicio en Línea](https://www.serviciosenlinea.pjf.gob.mx/juicioenlinea/) con rol adecuado para consulta pública de expedientes.

## Obtener el código

Clona el repositorio o descomprime el proyecto y abre una terminal en la carpeta raíz (donde está `package.json`).

## Instalar dependencias

```bash
npm install
```

## Variables de entorno

1. En la raíz del proyecto, crea un archivo **`.env`** (no lo subas al repositorio; está en `.gitignore`).
2. Define al menos `PJF_USER` y `PJF_PASSWORD`. Detalle en [variables-entorno.md](variables-entorno.md).

## Chromium para Playwright (desarrollo)

El bot usa **Playwright** con Chromium. En desarrollo, instala el navegador en la caché por defecto de Playwright:

```bash
npx playwright install chromium
```

Esto **no** es la misma carpeta que `playwright-browsers/` que se usa solo al empaquetar el instalador (ver [build-instalador.md](build-instalador.md)).

## Arrancar la aplicación

```bash
npm start
```

Equivale a `electron .` y carga `main.js`.

## Uso en la interfaz

1. **Cargar Excel:** selecciona un archivo `.xlsx` o `.xls` con el formato descrito en [formato-excel.md](formato-excel.md).
2. **Ejecutar revisión:** el proceso abre sesión en el portal (con las credenciales del `.env`) y procesa los expedientes de forma secuencial.
3. **Resultado:** al terminar correctamente, el Excel actualizado se guarda en la carpeta **Descargas** del usuario con un nombre del tipo `Actualizacion_Boletin_YYYY-MM-DD.xlsx`.

Desde el menú **Ayuda → Cómo usar** se abre una ventana con ayuda integrada (`src/ui/ayuda.html`).

## Solución de problemas

- **Error de credenciales:** revisa que `.env` exista en la raíz y que las variables coincidan con [variables-entorno.md](variables-entorno.md).
- **Playwright no encuentra Chromium:** vuelve a ejecutar `npx playwright install chromium`.
- **Timeout o errores en el portal:** el sitio puede cambiar; revisa logs en la consola de la app o en el flujo del scraper.
