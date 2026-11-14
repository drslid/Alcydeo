---
title: "Local installation"
---

The preview installs locally in desktop Chrome. No Alcydeo account or extra software is required. There is no Chrome Web Store listing yet.

[Get the preview](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. Download the Chrome preview ZIP from GitHub Releases and extract it into a folder you will keep.
2. Open chrome://extensions, enable Developer mode and choose Load unpacked. Select the folder containing manifest.json.
3. Pin Alcydeo and refresh the video page. Start playback, open the extension and choose an available quality.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

After updating, reload Alcydeo and video pages which were already open. Version 0.1.39 stops obsolete page observers when Chrome messaging disappears, fixing the sendMessage/context-invalidated error. Historical errors can be cleared in Chrome’s extension Errors panel.
