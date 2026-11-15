---
title: "Lokale Installation"
---

Wähle das Paket für Desktop-Chrome oder Firefox. Kein Alcydeo-Konto und keine Zusatzsoftware nötig. Für beide gibt es noch keinen offiziellen Store-Eintrag.

[Alcydeo herunterladen](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. Lade das Chrome-ZIP von GitHub Releases herunter und entpacke es in einen dauerhaften Ordner.
2. Öffne chrome://extensions, aktiviere den Entwicklermodus und wähle Entpackte Erweiterung laden. Wähle den Ordner mit manifest.json.
3. Hefte Alcydeo an und lade die Videoseite neu. Starte das Video, öffne die Erweiterung und wähle eine verfügbare Qualität.

### Firefox

Firefox 153+: Lade das Firefox-ZIP über about:debugging → Dieser Firefox → Temporäres Add-on laden. Die Installation endet beim Neustart; eine dauerhafte Installation erfordert Mozillas Signatur.

Firefox 153+ hat ein eigenes Paket ohne YouTube. Chrome-Tabaufnahme, Google Cast und AirPlay sind in Firefox nicht verfügbar. Lokale Verarbeitung hängt von seinen Codecs ab; die Firefox-Anleitung nennt den getesteten Umfang.

Das Chrome-Entwickler-ZIP enthält experimentelles YouTube. Die separate Chrome-Store-Vorbereitung und das Firefox-Paket schließen YouTube aus. Die Firefox-ZIP-Installation ist vorübergehend; kein signiertes XPI und keine Store-Freigabe werden behauptet.

Neue Installation oder zurückgesetzte Einstellungen: vier gleichzeitige Dateien, Mehrteildownload mit vier Verbindungen je kompatibler Datei aktiviert. Bisherige Einstellungen bleiben erhalten. Beide Grenzen sind einstellbar; kein allgemeiner Geschwindigkeitsgewinn wird versprochen.

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

Nach dem Update Alcydeo und bereits geöffnete Videoseiten neu laden. Version 0.1.39 stoppt alte Seitenbeobachter, wenn die Chrome-Nachrichtenfunktion entfällt, und behebt den sendMessage/Kontextfehler. Frühere Fehler lassen sich im Fehlerbereich der Erweiterung löschen.
