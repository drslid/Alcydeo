---
title: "Änderungsprotokoll"
---

1.0.0 — Auf GitHub verfügbar · v1.0.0.

Das Chrome-Entwickler-ZIP enthält experimentelles YouTube. Die separate Chrome-Store-Vorbereitung und das Firefox-Paket schließen YouTube aus. Die Firefox-ZIP-Installation ist vorübergehend; kein signiertes XPI und keine Store-Freigabe werden behauptet.

Neue Installation oder zurückgesetzte Einstellungen: vier gleichzeitige Dateien, Mehrteildownload mit vier Verbindungen je kompatibler Datei aktiviert. Bisherige Einstellungen bleiben erhalten. Beide Grenzen sind einstellbar; kein allgemeiner Geschwindigkeitsgewinn wird versprochen.

Mediathek → Einstellungen → Erkennung: Quell-Tab wählen, um die lokale Diagnose anzusehen oder zu kopieren. Nur sichere Codes und Zähler, kein automatischer Upload. Die Diagnose ist nicht mehr im Popup.

Firefox 153+ hat ein eigenes Paket ohne YouTube. Chrome-Tabaufnahme, Google Cast und AirPlay sind in Firefox nicht verfügbar. Lokale Verarbeitung hängt von seinen Codecs ab; die Firefox-Anleitung nennt den getesteten Umfang.

Auf dieser Seite, Qualität, Herunterladen, Mediathek.

Automatische Medienerkennung

Die Erkennung startet auf erlaubten Websites. Hier pausieren oder den Websitezugriff im Browser einschränken.

Die Quelle lieferte HTML statt Medien. Der Download wurde gestoppt. Originalplayer aktualisieren und die Medienquelle erneut erkennen.

Verlauf löschen

Abgeschlossene, fehlgeschlagene und abgebrochene Einträge samt temporären Dateien auf allen Seiten und in allen Filtern aus Alcydeo entfernen, einschließlich Favoriten. Gespeicherte Dateien sowie laufende oder pausierte Downloads bleiben erhalten.

## Cloud — 0.1.55

Mediathek → Cloud → Ziel → Mit Gofile teilen

## Mediathek — 0.1.61

Zuschneiden · Bild zuschneiden · Clips verbinden · In MP4 umwandeln · Komprimieren · Cloud · Im Ordner anzeigen

Im Symbolfenster Qualität wählen und Herunterladen drücken. Cast steht daneben. Das Menü … enthält Zuschneiden und Aufnahme. Tabaufnahme und Bibliothek bleiben beim Scrollen unten; Sprache, Hilfe und Einstellungen stehen oben.

Nach dem Update Alcydeo und bereits geöffnete Videoseiten neu laden. Version 0.1.39 stoppt alte Seitenbeobachter, wenn die Chrome-Nachrichtenfunktion entfällt, und behebt den sendMessage/Kontextfehler. Frühere Fehler lassen sich im Fehlerbereich der Erweiterung löschen.

## 0.1.52

TikTok verwendet die nativen Mediendaten des aktuellen Beitrags und behält bis zu drei ursprüngliche CDN-Adressen je Qualität. Eine fehlgeschlagene Adresse wird erst nach Prüfung der Alternative ersetzt; gewählte Qualität und Titel bleiben erhalten. Bei Serverlimits muss gewartet werden. Quellseite und Verwaltung müssen bis zum Speichern geöffnet bleiben.

## Erkennungsdiagnose — 1.0.0

Mediathek → Einstellungen → Erkennung: Quell-Tab wählen, um die lokale Diagnose anzusehen oder zu kopieren. Nur sichere Codes und Zähler, kein automatischer Upload. Die Diagnose ist nicht mehr im Popup.

Lokaler Bericht ohne Videolinks, Cookies oder Signaturen. Es wird nichts gesendet.

Lokaler Erkennungsbericht → Bericht kopieren.

## 0.1.51

Die Schnittzeiten lassen sich direkt neben dem Video bearbeiten: Sekunden, m:ss oder h:mm:ss mit bis zu drei Nachkommastellen. Griffe und Felder bleiben synchron; ein ungültiger Bereich kann nicht exportiert werden. Segmentierte Übertragungen behalten den ursprünglichen Fehler, wenn andere Anfragen gestoppt werden. Bei einer Serverbegrenzung muss weiterhin gewartet werden; sie wird nicht umgangen.

## 0.1.50

Vorschläge und Zähler für direkte Dateien, HLS und DASH erscheinen nach begrenzten Prüfungen der Medienanfänge: höchstens zwei gleichzeitige Hintergrundprüfungen, ohne das Popup zu öffnen. Unsichere Quellen bleiben verborgen; Seite durchsuchen versucht es erneut. Reale Prüfungen umfassen das genaue Instagram-Reel ohne Empfehlungen sowie TikTok und Odysee. Zugriffslimits und Prüfseiten werden angezeigt; vollständige Odysee-Downloads sind noch nicht validiert. Containerabmessungen erscheinen, soweit verfügbar. Plausible HTTP-Gesamtgrößen beschreiben die gesamte Quelle; ≈ kennzeichnet Schätzungen, niemals nur die HLS-Initialisierung. Fehlende Metadaten bleiben unbekannt. Lokale YouTube-SABR-, Playlist- und Aufnahmeprototypen behalten eigene Validierungsgrenzen; diese Vorprüfung bestätigt ihre Bytes nicht. Die Kompatibilität bleibt begrenzt.

## 0.1.49

Getrennte Audio- und Videoquellen desselben HLS-VOD werden nach Prüfung ihrer Spuren zusammengefasst. Ein Vorschlag behält die verfügbaren Qualitätsstufen und kombiniert beide Spuren. Es erfolgt keine zusätzliche URL-Normalisierung; für andere Formate und Player gelten weiterhin die dokumentierten Grenzen.

## Bild zuschneiden — 0.1.48

Einen Bildbereich als neue MP4-Datei exportieren. Das Original bleibt erhalten.

Ziehen, um einen neuen Bereich zu zeichnen. Innen ziehen zum Verschieben, an den Griffen ziehen zum Vergrößern oder Verkleinern. Pfeiltasten verschieben um 1 Pixel, mit Umschalt um 10 Pixel.

## 0.1.47

Zusammengesetzte Dateien mit geprüfter Struktur werden ohne zweiten Klick automatisch gespeichert. Die lokale Browserwiedergabe blockiert das Speichern nicht mehr; ein fehlender Codec kann einen anderen Player erfordern. Frühere Codec-Wiedergabefehler werden bei intakter gespeicherter Ausgabedatei ohne erneuten Download behoben. Nach dem Abbrechen von Speichern unter ist weiterhin ein ausdrücklicher neuer Versuch nötig.

## 0.1.46

Zusätzliche HLS-VOD-Duplikate werden nach dem Vergleich des Downloadplans und der Stichproben zusammengefasst; die ursprüngliche Player-URL bleibt erhalten. Mit der optionalen Einstellung für 2/4/8 Verbindungen können kompatible DASH-Audio- und Videospuren gleichzeitig geladen werden. Das Aufteilen einer Ressource erfordert einen starken Versionsvalidator und zuverlässige Bytebereiche. Die Geschwindigkeit hängt von Server und Verbindung ab.

## VK Video — 0.1.43

VK Video: unterstützte DASH-Videos erscheinen als eine Quelle mit Qualitätsauswahl. Wiedergabefragmente und Oberflächentöne werden ausgeblendet. Alcydeo verbindet die angegebenen Video- und Audioressourcen und speichert eine geprüfte MP4. Das bereitgestellte Video mit 7 Min. 53 Sek. wurde in 144p (AV1/Opus) gespeichert und vollständig dekodiert. Nicht alle Codecs, Livestreams, privaten Zugriffe oder DRM sind unterstützt. Den Manager während der Verarbeitung geöffnet lassen.

## X — 0.1.38

X-Beiträge: Beitrag nach einem Alcydeo-Update neu laden. Native Daten liefern Titel und MP4-Qualitäten auch bei Blob-Wiedergabe. Aktuelle und ältere Startdaten werden ohne Skriptausführung gelesen. Bei vollständigen Dateien werden Audio-/Video-Listen nicht getrennt angeboten. Der bereitgestellte Beitrag wurde als 57,6-Sekunden-MP4 mit AVC/AAC gespeichert und vollständig dekodiert. Feeds, private Beiträge, Live und alle Layouts sind nicht allgemein validiert. Keine neue Berechtigung, Konto, API oder Zusatzsoftware.

## TikTok — 0.1.37

TikTok-Beiträge: Alcydeo liest den nativen Katalog des gewählten Beitrags auch bei Blob-Wiedergabe. Qualitäten und Codecs stehen unter dem echten Titel. Der Quell-Tab prüft und streamt die Originaldatei lokal, ohne veränderte Header/Signaturen oder Zusatzprogramm. TikTok und Manager offen lassen; das Popup darf schließen. Unterbrochene Dateien beginnen neu. Der bereitgestellte 33-Sekunden-Beitrag mit AVC/AAC wurde vollständig gespeichert und dekodiert; Feeds, Live, private Beiträge und alle Codecs/Layouts sind nicht allgemein validiert.

## YouTube-Playlist — 0.1.38

Nur lokaler Build: In einer YouTube-Playlist sind verfügbare Videos zunächst markiert. Videos abwählen, maximale Qualität wählen und starten. Dateien werden einzeln in einem Unterordner mit dem Playlist-Namen, ihrer ursprünglichen Position und ihrem Videotitel gespeichert. Den Manager offen lassen; das Popup darf geschlossen werden. Fortsetzen überspringt gespeicherte Dateien; fehlgeschlagene Einträge lassen sich separat wiederholen. Alle Metadaten müssen vor dem Start geladen sein (höchstens 5.000 Einträge / 100 Seiten). Native Fortsetzungen und ein eigener stummer Player-Tab, ohne Zugriffsbarrieren zu umgehen. Ein vollständiger realer YouTube-Playlist-Transfer ist nicht validiert. Das Store-Paket schließt dies aus.

Dieser Mix verändert sich: Nur die aktuell von YouTube geladenen Titel sind enthalten. Gewünschte Titel auswählen; spätere Vorschläge sind ausgeschlossen.

Originalqualität bedeutet, dass die Auflösung der Quelle unbekannt ist. Als HTML erkannte Quellen werden entfernt. Bei einer beobachteten Player-Weiterleitung bleiben Titel und Auflösung der tatsächlichen Mediendatei zugeordnet.

Manche CDNs senden MP4 als application/octet-stream. Alcydeo behält die beobachtete endgültige signierte Medien-URL und schließt HTML-Playerseiten, Fehlerseiten und HTML-Anhänge aus. Nach dem Neuladen der Erweiterung den Originalplayer neu starten.

Die Symbolanzeige wird aktualisiert, sobald eine Quelle erkannt wird, auch wenn die Seite oder ihre Frames noch laden. Verfügbare Qualitäten werden anschließend ergänzt. Die Website muss zuerst eine Medienquelle bereitstellen.

Alcydeo kann erkannte Wiedergabelisten automatisch erneut lesen, um Qualitäten und Fragmente zu erkennen. Medienfragmente lädt die Erweiterung erst nach dem Start eines Downloads herunter.

Eine URL kann eine weitere HLS-Liste liefern. Alcydeo folgt einer einzelnen Variante bis zu den tatsächlichen Qualitäten und löst die gewählte Variante beim Download auf, bis zu sechs Listenebenen. Entfällt die Qualität, erneut auswählen. Verschlüsselte Quellen bleiben ausgeschlossen.

Zeitgesteuerte Metadaten (0x15) wurden nicht in die gespeicherte Datei übernommen.

clip.webm → clip-converted.mp4

MP4-Konvertierung

MP4 mit H.264-Video und AAC-Audio. Eine Datei gleichzeitig; den Manager geöffnet lassen. Das Original bleibt erhalten. Kompatible Spuren werden kopiert, andere unterstützte Spuren neu kodiert. Das kann dauern und die Qualität verändern.

Videoqualität: Automatisch · kompatibles Video kopieren / Hohe Qualität / Ausgewogen / Kleinere Datei.

Maximale Auflösung: Original · ohne Vergrößerung / 1080p / 720p / 480p.

Audio-Bitrate: Automatisch · kompatibles AAC kopieren / 128 / 192 / 256 kb/s.

Standardwerte für MP4. Änderungen an Qualität, Auflösung oder Audio können eine Neukodierung erfordern. Größe und Tempo hängen von Quelle und Computer ab.

Die Konvertierung erfolgt lokal. Eine Kopie der gewählten Quelle und die MP4 bleiben bis zum Löschen der Aufgabe im temporären Browserspeicher. Das Original auf dem Datenträger bleibt erhalten. Dateiinhalte werden nicht hochgeladen.

Dateien werden einzeln konvertiert. Nach einer Pause oder dem Schließen des Managers startet die Konvertierung mit der gespeicherten Quelldatei neu.

Dateien speichern: Automatisch speichern. Bei jedem Download Speichern unter anzeigen.

Dateien werden in diesem Unterordner des Downloadverzeichnisses gespeichert. Ändere den Hauptordner in den Browsereinstellungen.

## Gleichzeitige Downloads — 1.0.0

Neue Installation oder zurückgesetzte Einstellungen: vier gleichzeitige Dateien, Mehrteildownload mit vier Verbindungen je kompatibler Datei aktiviert. Bisherige Einstellungen bleiben erhalten. Beide Grenzen sind einstellbar; kein allgemeiner Geschwindigkeitsgewinn wird versprochen.

Dateien gleichzeitig: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8.

1 bis 8 Dateien gleichzeitig, unabhängig von der Anzahl der Verbindungen je Datei. Wartende Dateien starten, sobald ein Platz frei wird.

Beim Senken des Limits werden laufende Downloads zu Ende geführt. Konvertierungen laufen weiterhin einzeln.

### Downloads in mehreren Teilen

Mehrere Verbindungen für kompatible Dateien und DASH verwenden.

Verbindungen je Datei: 2 / 4 / 8.

Manager geöffnet lassen. Kompatible Audio- und Videospuren können gleichzeitig laden. Das Aufteilen einer Ressource erfordert zuverlässige Bytebereiche und eine starke Versionskennung; sonst erfolgt die normale Übertragung. Die Geschwindigkeit hängt von Server und Verbindung ab.

## Mediathek

Videos, Downloads und Verarbeitung an einem Ort.

Diese Seite auswählen · In MP4 umwandeln · Komprimieren · Clips verbinden · Cloud · Auswahl löschen

Dateien werden einzeln verarbeitet. Originale bleiben erhalten. Fehlende lokale Kopien unten auswählen.

Visueller Schnitteditor — Mit den Griffen Anfang und Ende wählen, den Ausschnitt ansehen und als MP4 speichern.

Visueller Zusammenfüge-Editor — Clips ziehen oder mit Pfeilen sortieren. Vorschaubild zum Abspielen anklicken.

Komprimierungsvorgaben: Für Komprimieren in der Mediathek. Qualität, Maximalauflösung und Audiobitrate beeinflussen Größe und Dauer.

Aufnahmequalität: 720p / 1080p / 4K. Bis 4K mit 30 fps und höherer Bitrate. Details hängen von der Quelle ab; Vergrößern ersetzt keine fehlenden Details.

Auf aufgenommenem Tab zeichnen · Strich rückgängig · Zeichnung löschen

Sprache: English / Español / Français / Deutsch / 简体中文 / العربية / Русский / Português / हिन्दी / اردو.

Dateiendungen garantieren nicht, dass der Browser jeden Codec abspielen oder umwandeln kann. M3U8 und MPD beschreiben segmentierte Streams.

MP4 · WEBM · M3U8 · MPD · M4V · MKV · TS · MOV · AVI · OGG · MPG · WMV · FLV · 3GP · M2TS · MTS

MP3 · AAC · M4A · FLAC · WAV

Dateien ignorieren unter: 10 KB / 100 KB / 1 MB / 2 MB. Unbekannte Größen bleiben sichtbar. Die Playlistgröße ist nicht die Videogröße.

Eine Domain oder URL pro Zeile, einschließlich Subdomains. Andere Seiten werden bei automatischer Erkennung geprüft.

## Videowerkzeuge

Ein Video zuschneiden oder Clips in gewünschter Reihenfolge verbinden. Die Verarbeitung bleibt lokal.

Lokale MP4-Konvertierung in H.264/AAC. Nicht unterstützte Codecs werden gemeldet.

Lokale H.264/AAC-MP4 mit den Kompressionswerten aus Einstellungen erstellen. Eine kleinere Datei ist nicht garantiert.

2–20 Clips wählen und ordnen. MP4 bis 720p/30 fps. Jeder Clip braucht eine Videospur und dieselbe Audiobelegung.

Mit den Griffen Anfang und Ende wählen, den Ausschnitt ansehen und als MP4 speichern.

## Stream aufnehmen

Live — Unterstütztes Live-HLS direkt aufnehmen. Andere Player nutzen Tab-Aufnahme.

Player-Stream — HLS-Segmente direkt in Quellqualität speichern. Unterstützt unverschlüsselte TS/fMP4 mit Audio und Video im selben Stream. Manager offen lassen. Für andere Quellen Tab-Aufnahme nutzen.

Startet mit einem aktuellen vollständigen Segment, eventuell einige Sekunden vor dem Klick. Stoppen und speichern beendet das aktuelle Segment und erstellt eine geprüfte MP4. Frühere Sendungsinhalte werden nicht nachgeladen.

Dieser Livestream hat separates Audio. Kombinierte HLS-Quelle oder Tab-Aufnahme wählen; es wird keine Datei ohne ihre Audiospur gespeichert.

Livestream-Aufnahme unterbrochen. Empfangenen Teil speichern; die verpasste Sendezeit kann nicht wiederhergestellt werden.

Tab-Aufnahme — Tab über das Popup aufnehmen oder hier einen Bildschirm wählen. Höhere Bitrate bis zur Quellauflösung. Manager geöffnet lassen.

## Cloud — 0.1.57

Nur die gewählte Datei wird auf Ihren Klick gesendet. Keine automatische Synchronisierung.

Ohne Einrichtung an alle Clouds senden

Gofile · MegaUp · 1fichier · Turbobit. Für jeden Dienst gelten eigene Grenzen.

**Temporäre Dateien löschen** — 0.1.58

Löscht lokale Kopien im Bereich Cloud und bricht wartende Uploads ab. Originale und Freigabelinks bleiben erhalten.

Link teilen : Gofile / MegaUp / 1fichier / Turbobit. Im Cloud-Speicher ablegen : pCloud.

Gofile benötigt keine Anmeldung und erzeugt einen öffentlichen Link. Jeder mit dem Link hat Zugriff. Die Aufbewahrung richtet sich nach Gofile.

Experimentelles Teilen ohne Konto. Dateien sind öffentlich und können nach 30 Tagen Inaktivität ablaufen. Original behalten.

Experimentelles Teilen ohne Konto. Jeder mit dem Link kann auf die Datei zugreifen. Speicherung nach 15 Tagen nicht garantiert; Original behalten. Nach dem Senden kann die Verfügbarkeit verzögert sein.

Experimentelles Teilen ohne Konto, bis 200 MB pro Datei. Jeder mit dem Link kann zugreifen; Speicherung bis zu 7 Tage. Original behalten und die Datei bei Turbobit prüfen.

Hier ohne Anmeldung: vorhandenen pCloud-Upload-Link einfügen und die Datenregion des Ordners wählen. Der Besitzer benötigt ein pCloud-Konto. Die Datei wird dort abgelegt; kein öffentlicher Download-Link wird erstellt.

Upload-Link oder Code — Datenregion des Ordners: Europa / USA.

Ein erneuter Versuch sendet die ganze Datei. Ging die Antwort verloren, zuerst das Ziel auf Duplikate prüfen.

Den Manager geöffnet lassen. Eine temporäre lokale Kopie hält die gewählte Datei vor. Das Entfernen des Eintrags löscht diese Kopie; die entfernte Datei bleibt erhalten.

Cloud-Protokolle werden lokal getestet. Echte Übertragungen sind noch zu prüfen; MegaUp ist experimentell. pCloud benötigt einen bestehenden Upload-Link.

## Temporäre Dateien löschen — 0.1.63

Löscht lokale Kopien im Bereich Cloud und bricht wartende Uploads ab. Originale und Freigabelinks bleiben erhalten.

Temporäre Dateien gelöscht. Übertragungsverlauf und Freigabelinks bleiben erhalten.

Eine Übertragung oder Vorbereitung läuft. Vor dem Bereinigen warten, bis sie abgeschlossen ist, oder den Vorgang abbrechen.

[Gofile API](https://gofile.io/api) · [pCloud API](https://docs.pcloud.com/methods/upload_links/uploadtolink.html)

## Quelle prüfen…

Vor dem Download wird eine kleine Probe geprüft, nicht die gesamte Datei. Zum erneuten Prüfen die Liste aktualisieren.

Die Prüfung fand ungültige, nicht verfügbare oder zu kleine Quellen. Den Originalplayer neu laden und erneut suchen.

Diese Quelle ist kleiner als die in den Einstellungen gewählte Mindestgröße.

[TV-Wiedergabe](/Alcydeo/de/guides/tv/)
