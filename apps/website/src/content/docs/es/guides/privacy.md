---
title: "Permisos y privacidad"
---

La prueba local de YouTube conserva contexto observado y tokens opacos existentes localmente con la tarea. No genera atestaciones ni ejecuta código remoto del reproductor. Las exportaciones omiten estos datos.

Sin telemetría. Biblioteca y tareas permanecen en este navegador. La red se limita a fuentes autorizadas.

Detección automática de medios

Activada por defecto. Chrome concede acceso a los sitios al instalar. Puedes pausar la detección aquí o limitar el acceso en Chrome.

Alcydeo puede volver a leer automáticamente las listas detectadas para identificar calidades y fragmentos. La extensión descarga los fragmentos multimedia cuando inicias una descarga.

Las tareas guardan URLs de página y fuente, incluidas firmas temporales, localmente en IndexedDB. Los fragmentos y resultados usan OPFS. Eliminar una tarea borra el registro y los archivos temporales, no el archivo final ni el historial de Chrome. Las exportaciones omiten URLs, rutas e identificadores. Las solicitudes contactan fuentes/CDN permitidos con las sesiones aplicables de Chrome. El modo incógnito está desactivado. GitHub Pages podría registrar visitas al sitio. Soporte público: [GitHub Issues](https://github.com/drslid/Alcydeo/issues).

Borrar historial

Se eliminarán de Alcydeo los registros finalizados, fallidos y cancelados y sus archivos temporales, en todas las páginas y filtros, incluidos los favoritos. Se conservan los archivos guardados y las descargas activas o pausadas.

## Diagnóstico de detección — 0.1.53

Informe local, sin enlaces de vídeo, cookies ni firmas. No se envía nada.

Informe local de detección → Copiar informe.

## X — 0.1.38

Posts de X: actualiza la página tras actualizar Alcydeo. Los datos nativos proporcionan título y calidades MP4 incluso con un reproductor Blob. Se leen los datos actuales y antiguos sin ejecutar scripts. Las listas de audio y vídeo no se ofrecen por separado si existe un archivo completo. El post proporcionado se guarda y decodifica entero como MP4 AVC/AAC de 57,6 segundos. No se garantiza todo feed, post privado, directo o diseño. No requiere nuevos permisos, cuenta, API ni programa adicional.

## TikTok — 0.1.37

Posts de TikTok: Alcydeo lee el catálogo nativo del post seleccionado aunque el reproductor use un Blob. Agrupa calidades y códecs bajo el título real. La pestaña de origen verifica y transmite el archivo original al procesamiento local, sin alterar cabeceras/firmas ni usar un programa adicional. Mantén TikTok y el gestor abiertos; puedes cerrar la ventana emergente. Los archivos interrumpidos reinician. El post AVC/AAC de 33 segundos proporcionado se guarda y decodifica completo; no se garantiza todo feed, directo, post privado o formato.

El catálogo local y sus tokens se guardan en IndexedDB y se borran al navegar o limpiar sesiones antiguas. Los lotes seleccionados persisten hasta limpiar su historial finalizado. El contexto nativo permanece en YouTube y las peticiones usan la sesión del navegador. No se envían datos a servidores de Alcydeo, nube ni documentación.

clip.webm → clip-converted.mp4

Conversión a MP4

MP4 con vídeo H.264 y audio AAC. Un archivo a la vez; mantén abierto el gestor. Se conserva el original. Las pistas compatibles se copian; las demás pistas admitidas se recodifican, lo que puede tardar más y cambiar la calidad.

Calidad del vídeo: Automática · copiar vídeo compatible / Alta calidad / Equilibrada / Archivo más pequeño.

Resolución máxima: Original · sin ampliar / 1080p / 720p / 480p.

Tasa de audio: Automática · copiar AAC compatible / 128 / 192 / 256 kb/s.

Valores predeterminados para MP4. Cambiar calidad, resolución o audio puede requerir recodificar. Tamaño y velocidad dependen del original y del equipo.

La conversión es local. Una copia del original seleccionado y el MP4 permanecen en el almacenamiento temporal del navegador hasta eliminar la tarea. Se conserva el original del disco. El contenido no se sube.

La conversión procesa un archivo a la vez. Tras una pausa o al cerrar el gestor, reinicia desde la entrada guardada.

## Grabar un flujo en directo

Guarda directamente los segmentos HLS con la calidad original. Admite TS/fMP4 sin cifrar con audio y vídeo en el mismo flujo. Mantén abierto el gestor. Para otras fuentes usa Captura de pestaña.

Empieza en un segmento completo reciente, que puede incluir unos segundos anteriores al clic. Detener y guardar termina el segmento actual y crea un MP4 comprobado. No recupera la emisión anterior.

Este directo tiene audio separado. Usa una fuente HLS combinada o Captura de pestaña; no se guarda un vídeo sin su audio.

Se interrumpió la grabación. Guarda la parte recibida; no se recupera el tiempo de emisión perdido.

El idioma y las miniaturas se guardan localmente con la biblioteca. Las miniaturas proceden de archivos reales accesibles. Los trazos permanecen en la pestaña y se eliminan al detener la grabación. Quitar registros borra sus datos temporales y conserva los archivos guardados. Grabar requiere una acción explícita o elegir una superficie en Chrome.

## Nube — 0.1.57

Envía solo el archivo elegido al pulsar Enviar. Sin sincronización automática.

Enviar a todas las nubes sin configuración

Gofile · MegaUp · 1fichier · Turbobit. Se aplican los límites de cada servicio.

**Eliminar archivos temporales** — 0.1.58

Elimina las copias locales de Nube y cancela los envíos en espera. Se conservan los originales y los enlaces para compartir.

Compartir un enlace : Gofile / MegaUp / 1fichier / Turbobit. Guardar en la nube : pCloud.

Gofile no requiere iniciar sesión y crea un enlace público. Quien tenga el enlace puede acceder. La conservación depende de Gofile.

Uso experimental sin cuenta. Los archivos son públicos y pueden caducar tras 30 días sin actividad. Conserva el original.

Uso experimental sin cuenta. Cualquiera con el enlace puede acceder. El almacenamiento no se garantiza después de 15 días; conserva el original. La disponibilidad puede tardar tras el envío.

Uso experimental sin cuenta, hasta 200 MB por archivo. Cualquiera con el enlace puede acceder; se conserva hasta 7 días. Guarda el original y verifica el archivo en Turbobit.

Sin iniciar sesión aquí: pega un enlace de subida pCloud existente y elige la región de la carpeta. Su propietario necesita una cuenta pCloud. El archivo se deposita allí sin crear un enlace público de descarga.

Enlace o código de subida — Región de datos de la carpeta: Europa / Estados Unidos.

Reintentar envía el archivo entero. Si se perdió la respuesta, revisa el destino para evitar duplicados.

Mantén el gestor abierto. Una copia temporal conserva el archivo elegido. Eliminar la entrada borra su copia local y conserva el archivo remoto.

Los protocolos se prueban localmente. Falta validar envíos reales; MegaUp es experimental. pCloud necesita un enlace de subida existente.

Captura la pestaña desde la ventana del complemento o elige una pantalla aquí. Mayor bitrate y resolución de origen. Mantén abierto el gestor.
