---
title: "Installation locale"
---

La preview s’installe localement dans Chrome desktop. Aucun compte Alcydeo ni logiciel supplémentaire requis. Aucune fiche Chrome Web Store n’est encore disponible.

[Télécharger la preview](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. Téléchargez le ZIP Chrome depuis GitHub Releases et décompressez-le dans un dossier à conserver.
2. Ouvrez chrome://extensions, activez le mode développeur et choisissez Charger l’extension non empaquetée. Sélectionnez le dossier contenant manifest.json.
3. Épinglez Alcydeo et actualisez la page vidéo. Lancez la lecture, ouvrez l’extension et choisissez une qualité disponible.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

Après mise à jour, rechargez Alcydeo et les pages vidéo déjà ouvertes. La version 0.1.39 arrête les anciens observateurs lorsque la messagerie Chrome disparaît et corrige l’erreur sendMessage/contexte invalidé. Les anciennes erreurs peuvent être effacées dans le panneau Erreurs de l’extension.
