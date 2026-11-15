---
title: "Installation locale"
---

Choisissez le paquet Chrome ou Firefox pour ordinateur. Aucun compte Alcydeo ni logiciel supplémentaire requis. Aucune fiche officielle n’est encore disponible dans leurs Stores.

[Télécharger Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. Téléchargez le ZIP Chrome depuis GitHub Releases et décompressez-le dans un dossier à conserver.
2. Ouvrez chrome://extensions, activez le mode développeur et choisissez Charger l’extension non empaquetée. Sélectionnez le dossier contenant manifest.json.
3. Épinglez Alcydeo et actualisez la page vidéo. Lancez la lecture, ouvrez l’extension et choisissez une qualité disponible.

### Firefox

Firefox 153+ : chargez le ZIP Firefox depuis about:debugging → Ce Firefox → Charger un module complémentaire temporaire. L’installation prend fin au redémarrage de Firefox ; une installation permanente exige la signature Mozilla.

Firefox 153+ possède son propre paquet sans YouTube. La capture d’onglet Chrome, Google Cast et AirPlay sont indisponibles dans Firefox. Le traitement local dépend de ses codecs ; le guide Firefox indique le périmètre testé.

Le ZIP de développement Chrome inclut YouTube expérimental. La préparation Store Chrome et le paquet Firefox excluent YouTube. L’installation du ZIP Firefox est temporaire ; aucune signature XPI ni approbation Store n’est annoncée.

Installation neuve ou réglages réinitialisés : quatre fichiers simultanés, plusieurs parties activées à quatre connexions par fichier compatible. Les choix existants sont conservés. Les deux plafonds sont réglables ; aucun gain de vitesse universel n’est promis.

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

Après mise à jour, rechargez Alcydeo et les pages vidéo déjà ouvertes. La version 0.1.39 arrête les anciens observateurs lorsque la messagerie Chrome disparaît et corrige l’erreur sendMessage/contexte invalidé. Les anciennes erreurs peuvent être effacées dans le panneau Erreurs de l’extension.
