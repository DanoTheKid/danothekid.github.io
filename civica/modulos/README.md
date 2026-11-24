# Mapas y simulador públicos

Esta carpeta contiene únicamente la interfaz estática que GitHub Pages publica en /civica/modulos/. Las páginas institucionales integran esta interfaz en marcos del mismo sitio.

config.json contiene la dirección HTTPS pública de la API. No debe contener contraseñas, conexiones de PostgreSQL ni claves de proveedores. El código del servidor, los archivos del modelo y la base completa permanecen en el repositorio privado CIVICA-Priv.

Los visitantes pueden consultar 884 zonas y 94 indicadores publicados. Carrera Séptima muestra 102 zonas y permite calcular el escenario original. El simulador modifica únicamente 22 variables que ya tienen una fuente pública, dentro de los rangos observados. Las entradas restantes conservan los valores del modelo original.

Para abrir el sitio, entrar a https://danothekid.github.io/civica/ y usar los enlaces de los visores o del simulador. No se requiere iniciar sesión. Durante esta etapa temporal, los mapas y cálculos dependen de que el computador del proyecto esté encendido y conectado. La API usa un enlace HTTPS temporal; config.json debe actualizarse mediante una PR cuando se reinicie el túnel. La portada y las descargas no dependen de ese computador.

Para revisar la interfaz localmente, servir la raíz del repositorio por HTTP y abrir /civica/modulos/. La API de prueba debe autorizar el origen local correspondiente. No se admite cambiar el servidor desde parámetros de la URL.

Leaflet 1.9.4 se conserva en vendor/ con su licencia. El mapa base utiliza OpenStreetMap y conserva su atribución. La documentación y las descargas institucionales permanecen en /civica/archivo/.
