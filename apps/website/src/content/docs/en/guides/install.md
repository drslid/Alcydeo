---
title: "Local installation"
---

Choose the desktop Chrome or Firefox package. No Alcydeo account or extra software is required. Neither browser has an official Store listing yet.

[Download Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. Download the Chrome ZIP from GitHub Releases and extract it into a folder you will keep.
2. Open chrome://extensions, enable Developer mode and choose Load unpacked. Select the folder containing manifest.json.
3. Pin Alcydeo and refresh the video page. Start playback, open the extension and choose an available quality.

### Firefox

Firefox 153+: load the Firefox ZIP through about:debugging → This Firefox → Load Temporary Add-on. It remains installed until Firefox restarts; a permanent installation requires Mozilla signing.

Firefox 153+ has its own package without YouTube. Chrome tab capture, Google Cast and AirPlay are unavailable in Firefox. Local processing depends on the codecs supported by that browser; the Firefox guide records the tested scope.

The Chrome development ZIP includes experimental YouTube support. The separate Chrome Store preparation and Firefox package exclude YouTube. Firefox ZIP installation is temporary; no signed XPI or Store approval is claimed.

New installation or settings reset: four simultaneous files; multipart enabled at four connections per compatible file. Existing choices are preserved. Both limits are adjustable; no universal speed gain is promised.

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

After updating, reload Alcydeo and video pages which were already open. Version 0.1.39 stops obsolete page observers when Chrome messaging disappears, fixing the sendMessage/context-invalidated error. Historical errors can be cleared in Chrome’s extension Errors panel.
