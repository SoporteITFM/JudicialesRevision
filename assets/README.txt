Icono y logo de la aplicación
==============================

- icon.ico : Para que el .exe y la ventana muestren tu icono, coloca aquí un archivo
  icon.ico (formato ICO, 256x256 recomendado). Luego en package.json, en "build",
  agrega: "icon": "assets/icon.ico" dentro de "win".

- icon.png : Si colocas icon.png aquí, la ventana principal de la app usará este
  icono en la barra de tareas y en la ventana (main.js ya está preparado para ello).

- Logo en la interfaz : Para que aparezca el logo en la pantalla principal, copia
  tu imagen como logo.png en la carpeta src/ui/ (junto a index.html).
