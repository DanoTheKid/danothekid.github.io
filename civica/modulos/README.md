# Mapas y simulador públicos

La interfaz se publica en /civica/modulos/ y se integra en las páginas institucionales. GitHub Pages sirve las geometrías y el catálogo público de data/, por lo que abrir los mapas no consume cálculos del servidor ni depende del computador del proyecto.

config.json contiene únicamente la URL HTTPS pública de la API de Vercel y la ruta local de los datos. No contiene contraseñas ni conexiones a PostgreSQL. El código Python, los archivos científicos y los datos no publicados permanecen en el servidor y en el repositorio privado CIVICA-Priv.

La copia pública contiene 884 zonas y 94 indicadores publicados. Carrera Séptima muestra 102 zonas y permite calcular el escenario original. El simulador modifica únicamente 22 variables con fuente pública, dentro de sus rangos observados. La referencia original no se recalibra.

Para usarlo, abrir https://danothekid.github.io/civica/ y entrar a los visores o al simulador. No se requiere iniciar sesión ni mantener encendido un computador del proyecto. El primer cálculo puede tardar más por el arranque del servidor. Los planes gratuitos tienen cuotas; si se agota la cuota de cálculo, los mapas y las descargas conservadas siguen disponibles.

La exportación de data/ rechaza campos ajenos al alcance público y verifica los valores contra los CSV publicados y los índices contra la referencia original. manifest.json conserva las huellas de las dos exportaciones. Una actualización de datos debe volver a exportarse y revisarse mediante PR; nunca se copia la base completa al sitio.

Para revisar la interfaz localmente, servir la raíz del repositorio por HTTP y abrir /civica/modulos/. El origen local autorizado para las comprobaciones es http://localhost:8767. La API no se puede cambiar mediante parámetros de la URL.

Leaflet 1.9.4 se conserva en vendor/ con su licencia. OpenStreetMap conserva su atribución. La documentación y las descargas institucionales permanecen en /civica/archivo/.
