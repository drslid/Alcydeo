---
title: "Instalación local"
---

La versión preliminar se instala localmente en Chrome de escritorio. No requiere cuenta Alcydeo ni software adicional. Aún no hay una ficha en Chrome Web Store.

[Obtener la versión preliminar](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. Descarga el ZIP de Chrome desde GitHub Releases y extráelo en una carpeta que conservarás.
2. Abre chrome://extensions, activa el modo de desarrollador y elige Cargar descomprimida. Selecciona la carpeta con manifest.json.
3. Fija Alcydeo y actualiza la página del vídeo. Inicia la reproducción, abre la extensión y elige una calidad disponible.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

Tras actualizar, recarga Alcydeo y las páginas de vídeo que ya estaban abiertas. La versión 0.1.39 detiene observadores antiguos cuando desaparece la mensajería de Chrome y corrige el error sendMessage/contexto invalidado. Puedes borrar errores anteriores en el panel de errores de la extensión.
