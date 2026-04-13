# Formato del archivo Excel

El bot lee el **primer libro** del archivo (primera hoja) con **ExcelJS**, preserva formato al guardar y actualiza solo ciertas columnas.

## Filas iniciales

- Las **filas 1, 2 y 3** del Excel se tratan como encabezados o metadatos; la lectura de expedientes empieza en la **fila 4** (índice interno 3).
- Los **circuitos** no van en una columna fija: el archivo puede tener **filas sección** cuyo texto contiene la palabra **CIRCUITO**. En esas filas se extrae el texto del circuito (por ejemplo `SÉPTIMO CIRCUITO`) y se aplica a todas las filas de expediente siguientes hasta la siguiente fila de circuito.

## Columnas de entrada (lectura)

Índices **base 0** (columna A = 0), según `src/config/constants.js`:

| Columna Excel | Índice | Uso |
|---------------|--------|-----|
| **A** | 0 | Órgano jurisdiccional (normalizado en código). |
| **B** | 1 | Número de expediente. |
| **E** | 4 | Tipo de expediente (normalizado en código). |

El **circuito** activo para cada fila de datos es el último detectado en una fila “de circuito” anterior.

Una fila se considera con expediente si la celda del número de expediente (columna B) no está vacía.

## Columnas que escribe el bot (salida)

Solo se modifican valores en estas columnas al actualizar filas que cumplan la lógica de negocio (por ejemplo, resultado válido con fecha del día):

| Columna Excel | Índice | Contenido |
|---------------|--------|-----------|
| **H** | 7 | Estado procesal (texto de la síntesis u otro estado según el flujo). |
| **J** | 9 | Fecha del estado procesal (formato del portal: `DD-MM-YYYY` cuando aplica). |

La ruta de guardado al finalizar la revisión desde la app Electron la define `main.js`: archivo en la carpeta **Descargas** con nombre `Actualizacion_Boletin_<fecha>.xlsx`.

## Formatos admitidos al cargar

Desde la UI se pueden abrir archivos **`.xlsx`** o **`.xls`**. La lectura/escritura principal usa **ExcelJS** (`.xlsx`).

## Ajustes

Si tu plantilla usa otras columnas, hay que cambiar las constantes `COL_*` en `src/config/constants.js` y revisar `src/excel/readExcel.js` y `src/excel/writeExcel.js` para mantener coherencia.
