---
title: "Instalación local"
---

Elige el paquete de Chrome o Firefox para ordenador. No requiere cuenta Alcydeo ni software adicional. Ninguno tiene todavía una ficha oficial en su tienda.

[Descargar Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. Descarga el ZIP de Chrome desde GitHub Releases y extráelo en una carpeta que conservarás.
2. Abre chrome://extensions, activa el modo de desarrollador y elige Cargar descomprimida. Selecciona la carpeta con manifest.json.
3. Fija Alcydeo y actualiza la página del vídeo. Inicia la reproducción, abre la extensión y elige una calidad disponible.

### Firefox

Firefox 153+: carga el ZIP de Firefox desde about:debugging → Este Firefox → Cargar complemento temporal. Se instala hasta reiniciar Firefox; una instalación permanente requiere la firma de Mozilla.

Firefox 153+ tiene su propio paquete sin YouTube. La captura de pestañas de Chrome, Google Cast y AirPlay no están disponibles en Firefox. El procesamiento local depende de sus códecs; la guía de Firefox indica el alcance probado.

El ZIP de desarrollo de Chrome incluye YouTube experimental. La preparación para Chrome Web Store y el paquete Firefox lo excluyen. La instalación del ZIP de Firefox es temporal; no se anuncia un XPI firmado ni aprobación de tienda.

Instalación nueva o ajustes restablecidos: cuatro archivos simultáneos y descarga por partes activada con cuatro conexiones por archivo compatible. Se conservan las opciones existentes. Ambos límites se pueden ajustar; no se promete una mejora universal de velocidad.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
pnpm build:firefox
```

Chrome: `apps/extension/.output/chrome-mv3`

Firefox: `apps/extension/.output/firefox-mv3`

Tras actualizar, recarga Alcydeo y las páginas de vídeo que ya estaban abiertas. La versión 0.1.39 detiene observadores antiguos cuando desaparece la mensajería de Chrome y corrige el error sendMessage/contexto invalidado. Puedes borrar errores anteriores en el panel de errores de la extensión.
