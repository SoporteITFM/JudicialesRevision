# Iconos y assets

Resumen de la carpeta `assets/` del repositorio.

## Archivos esperados

| Archivo | Uso |
|---------|-----|
| **`icon.ico`** | Icono del ejecutable y del instalador NSIS. Formato ICO; 256×256 px recomendado. Referenciado en `package.json` → `build.icon` y `build.win.icon`. |
| **`icon.png`** | Si existe, `main.js` puede usarlo como icono de la ventana y barra de tareas. |

## Logo en la interfaz

Para mostrar un logo en la pantalla principal, coloca la imagen como **`src/ui/logo.png`** junto a `index.html` (si la UI lo referencia).

## Más detalle

El archivo `assets/README.txt` en el repo repite estas indicaciones en formato texto plano.
