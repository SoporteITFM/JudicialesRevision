# Variables de entorno

La aplicación carga un archivo **`.env`** en la **raíz del proyecto** (mismo nivel que `package.json`) mediante `dotenv`. Ese archivo **no debe versionarse** (está listado en `.gitignore`).

## Variables obligatorias para la revisión

| Variable | Descripción |
|----------|-------------|
| `PJF_USER` | Usuario del portal Juicio en Línea. |
| `PJF_PASSWORD` | Contraseña del portal. |

## Alias aceptado

| Variable | Uso |
|----------|-----|
| `PJF_PASS` | Si `PJF_PASSWORD` no está definida, el proceso principal puede usar `PJF_PASS` como contraseña. |

En la práctica define **`PJF_USER`** y **`PJF_PASSWORD`** (o `PJF_PASS` en su lugar).

## Ejemplo

Puedes copiar el archivo de ejemplo desde la raíz del repo:

```bash
# Windows
copy doc\.env.example .env

# Linux / macOS
cp doc/.env.example .env
```

Edita `.env` y sustituye los valores por los tuyos.

Contenido mínimo de ejemplo (sin datos reales):

```env
PJF_USER=tu_usuario_del_portal
PJF_PASSWORD=tu_contraseña
```

**No** compartas el archivo `.env` ni lo subas a repositorios públicos.
