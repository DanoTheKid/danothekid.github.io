# Copia institucional de CIVICA en GitHub Pages

La copia se aloja directamente en https://danothekid.github.io/civica/. Las páginas, imágenes, estilos, fuentes y descargas se sirven desde este repositorio. No se redirige a otro alojamiento.

## Contenido conservado

Se conservan ocho páginas HTML del sitio público de origen, cuatro PDF y diez CSV, además de imágenes, estilos, fuentes y animaciones. Las páginas del catálogo y de acceso a herramientas completan la navegación de la copia. Fuente: https://ingenieria.bogota.unal.edu.co/civica/.

La captura original corresponde al 23 de noviembre de 2026, hora de Colombia. archivo/manifiesto.json conserva las direcciones originales, tamaños y huellas SHA-256 de origen y de los archivos adaptados. Los cuatro PDF y diez CSV mantienen exactamente el contenido público capturado. Los manuales se sirven como PDF completos, sin reconstrucción en el navegador ni Git LFS.

## Abrir localmente

Desde la raíz del repositorio:

```sh
python -m http.server 8767 --bind 127.0.0.1
```

Abrir http://localhost:8767/civica/. Es necesario servir la raíz del repositorio, porque los enlaces conservan el prefijo /civica/.

## Publicación y edición

GitHub Pages ya está configurado para publicar main desde la raíz del repositorio. Al fusionar la PR, publica los archivos estáticos de civica/ junto a la página personal. El archivo .nojekyll evita que Jekyll procese el contenido. La configuración local de atributos conserva los bytes de los archivos y evita filtros de Git LFS.

Para editar, mantener el prefijo /civica/ en los enlaces y recursos locales. Si cambia un recurso conservado, actualizar su preserved_sha256 en el inventario; source_sha256 identifica el archivo de origen y se mantiene como evidencia de la captura.

El sitio completo ocupa menos de 200 MiB, por debajo del límite de 1 GiB de GitHub Pages. Su publicación pública utiliza el alojamiento gratuito de GitHub Pages, sujeto a sus límites de uso: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits.

## Servicios externos

Los visores y el simulador siguen en el servidor privado. Los enlaces localhost solo funcionan en el computador que los ejecuta. Los videos de YouTube, podcasts de Spotify, publicaciones por DOI y otros sitios externos dependen de sus proveedores. El catálogo explica el alcance y ofrece los documentos descargables. Las páginas y archivos propios de la copia no necesitan el servidor institucional original.
