---
title: "Historial de cambios"
---

0.2.0 — Primera versión preliminar pública · v0.2.0.

En esta página, Calidad, Descargar, Biblioteca.

Detección automática de medios

Activada por defecto. Chrome concede acceso a los sitios al instalar. Puedes pausar la detección aquí o limitar el acceso en Chrome.

La fuente devolvió una página HTML en lugar del medio. Se detuvo la descarga. Actualiza el reproductor original y detecta de nuevo la fuente.

Borrar historial

Se eliminarán de Alcydeo los registros finalizados, fallidos y cancelados y sus archivos temporales, en todas las páginas y filtros, incluidos los favoritos. Se conservan los archivos guardados y las descargas activas o pausadas.

## Nube — 0.1.55

Biblioteca → Nube → Destino → Compartir con Gofile

## Biblioteca — 0.1.61

Recortar · Recortar encuadre · Unir clips · Convertir a MP4 · Comprimir · Nube · Mostrar en carpeta

En la ventana de la barra, elige la calidad y pulsa Descargar. Cast está al lado. El menú … contiene recorte y grabación. Capturar pestaña y Biblioteca permanecen abajo al desplazar las fuentes; idioma, ayuda y ajustes están en la cabecera.

Tras actualizar, recarga Alcydeo y las páginas de vídeo que ya estaban abiertas. La versión 0.1.39 detiene observadores antiguos cuando desaparece la mensajería de Chrome y corrige el error sendMessage/contexto invalidado. Puedes borrar errores anteriores en el panel de errores de la extensión.

## 0.1.52

TikTok utiliza los metadatos nativos del vídeo actual y conserva hasta tres direcciones CDN originales por calidad. Una dirección que falla solo se sustituye tras comprobar la alternativa; se mantienen la calidad y el título elegidos. Los límites del servidor requieren esperar. Mantén abiertos la página y el gestor hasta guardar el archivo.

## Diagnóstico de detección — 0.1.53

Informe local, sin enlaces de vídeo, cookies ni firmas. No se envía nada.

Informe local de detección → Copiar informe.

## 0.1.51

Los tiempos de recorte se editan junto al vídeo: segundos, m:ss o h:mm:ss con hasta tres decimales. Los controles y los campos permanecen sincronizados; un intervalo no válido no se puede exportar. Las descargas por segmentos conservan el error original cuando se detienen otras solicitudes. Los límites del servidor requieren esperar; no se eluden.

## 0.1.50

Las propuestas y el contador de archivos directos, HLS y DASH aparecen tras comprobar prefijos multimedia con límites: como máximo dos comprobaciones simultáneas en segundo plano, sin abrir la ventana. Las fuentes inciertas quedan ocultas; Analizar página vuelve a intentarlo. Las pruebas reales cubren el Reel exacto de Instagram, sin recomendaciones, además de TikTok y Odysee. Se indican límites y verificaciones de acceso; la descarga completa de Odysee sigue sin validarse. Se muestran las dimensiones del contenedor si están disponibles. Los totales HTTP coherentes describen la fuente completa; ≈ indica estimaciones, nunca solo el tamaño de la inicialización HLS. Los datos ausentes siguen siendo desconocidos. Los prototipos locales de YouTube SABR, listas y captura conservan límites de validación distintos; este control no certifica sus bytes. La compatibilidad sigue siendo limitada.

## 0.1.49

Las fuentes de audio y vídeo separadas del mismo HLS VOD se agrupan tras comprobar sus pistas. Una sola propuesta conserva las calidades disponibles y combina ambas pistas. No se añade ninguna normalización de URL; los demás formatos y reproductores siguen sujetos a los límites documentados.

## Recortar encuadre — 0.1.48

Selecciona un área del vídeo para exportarla como un MP4 nuevo. Se conserva el original.

Arrastra para dibujar un área nueva. Arrastra dentro para moverla o usa los tiradores para cambiar su tamaño. Las flechas la mueven 1 píxel; mantén Mayús para 10 píxeles.

## 0.1.47

Los archivos ensamblados que superan los controles de estructura se guardan sin un segundo clic. La reproducción local del navegador ya no bloquea el guardado; un códec no disponible puede requerir otro reproductor. Los errores anteriores de reproducción por códec se recuperan sin descargar de nuevo si el resultado conservado está intacto. Cancelar Guardar como sigue requiriendo un reintento explícito.

## 0.1.46

Los duplicados adicionales de HLS VOD se agrupan tras comparar el plan de descarga y muestras de bytes; se conserva la URL original del reproductor. La opción de 2/4/8 conexiones permite descargar juntas las pistas de audio y vídeo DASH compatibles. Dividir un recurso requiere un validador de versión fuerte y rangos de bytes fiables. La velocidad depende del servidor y la conexión.

## VK Video — 0.1.43

VK Video: los vídeos DASH compatibles aparecen como una fuente con selector de calidad. Se excluyen fragmentos y sonidos de la interfaz. Alcydeo combina los recursos de vídeo y audio declarados y guarda un MP4 verificado. El vídeo de 7 min 53 s se guardó y decodificó entero en 144p (AV1/Opus). No se garantiza todo códec, directo, acceso privado o DRM. Mantén abierto el gestor durante el proceso.

## X — 0.1.38

Posts de X: actualiza la página tras actualizar Alcydeo. Los datos nativos proporcionan título y calidades MP4 incluso con un reproductor Blob. Se leen los datos actuales y antiguos sin ejecutar scripts. Las listas de audio y vídeo no se ofrecen por separado si existe un archivo completo. El post proporcionado se guarda y decodifica entero como MP4 AVC/AAC de 57,6 segundos. No se garantiza todo feed, post privado, directo o diseño. No requiere nuevos permisos, cuenta, API ni programa adicional.

## TikTok — 0.1.37

Posts de TikTok: Alcydeo lee el catálogo nativo del post seleccionado aunque el reproductor use un Blob. Agrupa calidades y códecs bajo el título real. La pestaña de origen verifica y transmite el archivo original al procesamiento local, sin alterar cabeceras/firmas ni usar un programa adicional. Mantén TikTok y el gestor abiertos; puedes cerrar la ventana emergente. Los archivos interrumpidos reinician. El post AVC/AAC de 33 segundos proporcionado se guarda y decodifica completo; no se garantiza todo feed, directo, post privado o formato.

## Playlist de YouTube — 0.1.38

Solo build local: en una playlist de YouTube, los vídeos disponibles están marcados inicialmente. Desmarca los que quieras, elige una calidad máxima e inicia. Los archivos se guardan uno a uno en una subcarpeta con el nombre de la playlist, su posición original y título. Mantén abierto el gestor; puedes cerrar la ventana emergente. Al reanudar se omiten archivos guardados y se pueden reintentar los fallidos. Deben cargarse todos los metadatos antes de empezar (hasta 5.000 elementos / 100 páginas). Se usan continuaciones nativas y una pestaña de reproducción propia silenciada, sin eludir accesos. No se ha validado una descarga completa real de YouTube. El paquete Store excluye esta función.

Esta mezcla cambia: solo incluye los títulos cargados ahora por YouTube. Elige cuáles guardar; no se incluyen sugerencias futuras.

Calidad original indica que se desconoce la resolución de la fuente. Se eliminan las fuentes identificadas como HTML. Si se observa una redirección del reproductor, el título y la resolución se conservan con el archivo multimedia real.

Algunos CDN envían MP4 como application/octet-stream. Alcydeo conserva la URL multimedia firmada final observada y excluye páginas HTML de reproductor, errores y adjuntos HTML. Reinicia el reproductor original tras recargar la extensión.

El indicador se actualiza al detectar una fuente, aunque la página o sus marcos sigan cargando. Las calidades disponibles se completan después. El sitio debe exponer primero una fuente multimedia.

Alcydeo puede volver a leer automáticamente las listas detectadas para identificar calidades y fragmentos. La extensión descarga los fragmentos multimedia cuando inicias una descarga.

Una URL puede devolver otra lista HLS. Alcydeo sigue una variante única para mostrar las calidades reales y resuelve la elegida al descargar, hasta seis niveles. Si la calidad desaparece, elige de nuevo; las fuentes cifradas siguen sin ser compatibles.

Los metadatos temporizados (0x15) no se incluyeron en el archivo guardado.

clip.webm → clip-converted.mp4

Conversión a MP4

MP4 con vídeo H.264 y audio AAC. Un archivo a la vez; mantén abierto el gestor. Se conserva el original. Las pistas compatibles se copian; las demás pistas admitidas se recodifican, lo que puede tardar más y cambiar la calidad.

Calidad del vídeo: Automática · copiar vídeo compatible / Alta calidad / Equilibrada / Archivo más pequeño.

Resolución máxima: Original · sin ampliar / 1080p / 720p / 480p.

Tasa de audio: Automática · copiar AAC compatible / 128 / 192 / 256 kb/s.

Valores predeterminados para MP4. Cambiar calidad, resolución o audio puede requerir recodificar. Tamaño y velocidad dependen del original y del equipo.

La conversión es local. Una copia del original seleccionado y el MP4 permanecen en el almacenamiento temporal del navegador hasta eliminar la tarea. Se conserva el original del disco. El contenido no se sube.

La conversión procesa un archivo a la vez. Tras una pausa o al cerrar el gestor, reinicia desde la entrada guardada.

Guardar archivos: Guardar automáticamente. Mostrar Guardar como en cada descarga.

Los archivos se guardan en el directorio elegido en Chrome, dentro de esta subcarpeta. Cambia el directorio principal en los ajustes de descarga de Chrome.

## Descargas simultáneas — 0.1.60

Archivos en paralelo: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8.

De 1 a 8 archivos a la vez, independientemente del número de conexiones por archivo. Los archivos en espera empiezan en cuanto queda un puesto libre.

Bajar el límite permite que terminen las descargas en curso. Las conversiones se siguen procesando una a una.

### Descargas en varias partes

Usar varias conexiones para archivos y DASH compatibles.

Conexiones por archivo: 2 / 4 / 8.

Mantén abierto el gestor. Las pistas de audio y vídeo compatibles pueden descargarse juntas. Dividir un recurso exige rangos fiables y un validador de versión fuerte; de lo contrario se usa la transferencia normal. La velocidad depende del servidor y de tu conexión.

## Biblioteca

Tus vídeos, descargas y procesos en un lugar.

Seleccionar esta página · Convertir a MP4 · Comprimir · Unir clips · Nube · Eliminar selección

Los archivos se procesan uno a uno y se conservan los originales. Elige las copias locales que falten.

Editor visual de recorte — Arrastra los marcadores para elegir el inicio y el final, previsualiza y guarda la selección en MP4.

Editor visual de unión — Arrastra los clips o usa las flechas para ordenarlos. Pulsa una miniatura para previsualizar.

Compresión predeterminada: Se usa al comprimir en la biblioteca. La calidad, resolución y audio influyen en tamaño y tiempo.

Calidad de captura: 720p / 1080p / 4K. Hasta 4K a 30 fps con mayor bitrate. El detalle depende de la fuente; ampliar píxeles no lo recupera.

Dibujar en la pestaña capturada · Deshacer trazo · Borrar dibujo

Idioma: English / Español / Français / Deutsch / 简体中文 / العربية / Русский / Português / हिन्दी / اردو.

Descargas de originales; estas extensiones no garantizan reproducir o convertir todos los códecs en Chrome. M3U8 y MPD describen emisiones por segmentos.

MP4 · WEBM · M3U8 · MPD · M4V · MKV · TS · MOV · AVI · OGG · MPG · WMV · FLV · 3GP · M2TS · MTS

MP3 · AAC · M4A · FLAC · WAV

Ignorar archivos menores de: 10 KB / 100 KB / 1 MB / 2 MB. Los tamaños desconocidos siguen visibles. Una lista no tiene el tamaño del vídeo.

Un dominio o URL por línea, incluidos sus subdominios. Los demás sitios se examinan con la detección automática.

## Herramientas de vídeo

Recorta un vídeo o une clips en el orden que elijas. El procesamiento es local.

Conversión local a MP4 H.264/AAC. Se indican los códecs no admitidos.

Crea un MP4 H.264/AAC local con los valores de compresión de Ajustes. No se garantiza un archivo menor.

Elige 2–20 clips y ordénalos. MP4 hasta 720p/30 fps. Cada clip debe tener una pista de vídeo y la misma distribución de audio.

Arrastra los marcadores para elegir el inicio y el final, previsualiza y guarda la selección en MP4.

## Grabar emisión

En directo — Graba directamente HLS en vivo compatible. Otras fuentes usan captura de pestaña.

Flujo del reproductor — Guarda directamente los segmentos HLS con la calidad original. Admite TS/fMP4 sin cifrar con audio y vídeo en el mismo flujo. Mantén abierto el gestor. Para otras fuentes usa Captura de pestaña.

Empieza en un segmento completo reciente, que puede incluir unos segundos anteriores al clic. Detener y guardar termina el segmento actual y crea un MP4 comprobado. No recupera la emisión anterior.

Este directo tiene audio separado. Usa una fuente HLS combinada o Captura de pestaña; no se guarda un vídeo sin su audio.

Se interrumpió la grabación. Guarda la parte recibida; no se recupera el tiempo de emisión perdido.

Captura de pestaña — Captura la pestaña desde la ventana del complemento o elige una pantalla aquí. Mayor bitrate y resolución de origen. Mantén abierto el gestor.

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

## Eliminar archivos temporales — 0.1.63

Elimina las copias locales de Nube y cancela los envíos en espera. Se conservan los originales y los enlaces para compartir.

Archivos temporales eliminados. Se conservan el historial de envíos y los enlaces para compartir.

Hay una transferencia o preparación en curso. Espera a que termine o cancélala antes de limpiar.

[Gofile API](https://gofile.io/api) · [pCloud API](https://docs.pcloud.com/methods/upload_links/uploadtolink.html)

## Comprobando fuente…

Se comprueba una muestra antes de descargar. No valida el archivo completo. Actualiza para comprobar las propuestas de nuevo.

La comprobación encontró fuentes inválidas, no disponibles o demasiado pequeñas. Recarga el reproductor original y vuelve a detectar.

Esta fuente es menor que el tamaño mínimo elegido en Ajustes.

[Reproducción en TV](/Alcydeo/es/guides/tv/)
