---
title: "Lokale Installation"
---

Die Vorschau wird lokal in Desktop-Chrome installiert. Kein Alcydeo-Konto und keine zusätzliche Software nötig. Es gibt noch keinen Chrome-Web-Store-Eintrag.

[Vorschau herunterladen](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. Lade das Chrome-ZIP von GitHub Releases herunter und entpacke es in einen dauerhaften Ordner.
2. Öffne chrome://extensions, aktiviere den Entwicklermodus und wähle Entpackte Erweiterung laden. Wähle den Ordner mit manifest.json.
3. Hefte Alcydeo an und lade die Videoseite neu. Starte das Video, öffne die Erweiterung und wähle eine verfügbare Qualität.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

Nach dem Update Alcydeo und bereits geöffnete Videoseiten neu laden. Version 0.1.39 stoppt alte Seitenbeobachter, wenn die Chrome-Nachrichtenfunktion entfällt, und behebt den sendMessage/Kontextfehler. Frühere Fehler lassen sich im Fehlerbereich der Erweiterung löschen.
