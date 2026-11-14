---
title: "Compatibilidad y límites"
---

Se admiten archivos directos y variantes HLS/DASH sin cifrar probadas. La compatibilidad depende del acceso, los códecs y el almacenamiento. Se rechazan medios protegidos. Reserva aproximadamente tres veces el tamaño del vídeo para procesar segmentos; no se garantizan todos los archivos grandes.

Google Cast sigue siendo experimental. El usuario confirmó una demo oficial de Google en Shield; no valida otras fuentes ni archivos privados. Para archivos locales en Shield, usa la transmisión de pestaña de Chrome. AirPlay no está disponible en Chrome para Windows.

El envío a Gofile, MegaUp, 1fichier y Turbobit, y los enlaces de depósito pCloud son opcionales. Requieren un clic. Los protocolos tienen pruebas locales; los envíos reales aún no están validados. Se aplican los límites y la retención del proveedor.

El build local detecta YouTube de forma experimental y procesa pistas separadas/SABR. Un Short proporcionado se completó a 144p/720p con audio y vídeo; otras fuentes, calidades y sesiones necesitan validación. El ZIP Store excluye YouTube. Inicia el reproductor normal; SABR interrumpido reinicia desde el principio. Sin compatibilidad universal garantizada.

## 0.1.52

TikTok utiliza los metadatos nativos del vídeo actual y conserva hasta tres direcciones CDN originales por calidad. Una dirección que falla solo se sustituye tras comprobar la alternativa; se mantienen la calidad y el título elegidos. Los límites del servidor requieren esperar. Mantén abiertos la página y el gestor hasta guardar el archivo.

## 0.1.51

Los tiempos de recorte se editan junto al vídeo: segundos, m:ss o h:mm:ss con hasta tres decimales. Los controles y los campos permanecen sincronizados; un intervalo no válido no se puede exportar. Las descargas por segmentos conservan el error original cuando se detienen otras solicitudes. Los límites del servidor requieren esperar; no se eluden.

## 0.1.50

Las propuestas y el contador de archivos directos, HLS y DASH aparecen tras comprobar prefijos multimedia con límites: como máximo dos comprobaciones simultáneas en segundo plano, sin abrir la ventana. Las fuentes inciertas quedan ocultas; Analizar página vuelve a intentarlo. Las pruebas reales cubren el Reel exacto de Instagram, sin recomendaciones, además de TikTok y Odysee. Se indican límites y verificaciones de acceso; la descarga completa de Odysee sigue sin validarse. Se muestran las dimensiones del contenedor si están disponibles. Los totales HTTP coherentes describen la fuente completa; ≈ indica estimaciones, nunca solo el tamaño de la inicialización HLS. Los datos ausentes siguen siendo desconocidos. Los prototipos locales de YouTube SABR, listas y captura conservan límites de validación distintos; este control no certifica sus bytes. La compatibilidad sigue siendo limitada.

## 0.1.49

Las fuentes de audio y vídeo separadas del mismo HLS VOD se agrupan tras comprobar sus pistas. Una sola propuesta conserva las calidades disponibles y combina ambas pistas. No se añade ninguna normalización de URL; los demás formatos y reproductores siguen sujetos a los límites documentados.

## Recortar encuadre — 0.1.48

Selecciona un área del vídeo para exportarla como un MP4 nuevo. Se conserva el original.

Arrastra para dibujar un área nueva. Arrastra dentro para moverla o usa los tiradores para cambiar su tamaño. Las flechas la mueven 1 píxel; mantén Mayús para 10 píxeles.

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
