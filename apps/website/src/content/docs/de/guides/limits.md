---
title: "Kompatibilität und Grenzen"
---

Direkte Dateien und getestete unverschlüsselte HLS/DASH-Varianten werden unterstützt. Zugriff, Codecs und Speicher bestimmen die Kompatibilität. Geschützte Medien werden abgelehnt. Segmentverarbeitung braucht ungefähr die dreifache Mediengröße; große Dateien sind nicht allgemein validiert.

Firefox 153+ hat ein eigenes Paket ohne YouTube. Chrome-Tabaufnahme, Google Cast und AirPlay sind in Firefox nicht verfügbar. Lokale Verarbeitung hängt von seinen Codecs ab; die Firefox-Anleitung nennt den getesteten Umfang.

Das Chrome-Entwickler-ZIP enthält experimentelles YouTube. Die separate Chrome-Store-Vorbereitung und das Firefox-Paket schließen YouTube aus. Die Firefox-ZIP-Installation ist vorübergehend; kein signiertes XPI und keine Store-Freigabe werden behauptet.

Google Cast bleibt experimentell. Der Nutzer bestätigte eine offizielle Google-Demo auf Shield; andere Quellen und private Dateien sind damit nicht validiert. Nutze für lokale Shield-Dateien die Chrome-Tabübertragung. AirPlay ist in Chrome unter Windows nicht verfügbar.

Gofile, MegaUp, 1fichier, Turbobit und pCloud-Uploadlinks sind optional. Ein Upload beginnt nur nach deinem Klick. Lokale Protokolltests liegen vor; echte Uploads sind nicht validiert. Anbieterlimits und Aufbewahrungszeiten gelten.

Der lokale Build erkennt YouTube experimentell und verarbeitet getrennte Spuren/SABR. Ein bereitgestelltes Short wurde mit 144p/720p samt Audio/Video vollständig gespeichert; andere Videos, Qualitäten und Sitzungen benötigen eigene Prüfung. Das Store-ZIP schließt YouTube aus. Normalen Player starten; unterbrochenes SABR beginnt von vorn. Keine universelle Website-Kompatibilität.

## 0.1.52

TikTok verwendet die nativen Mediendaten des aktuellen Beitrags und behält bis zu drei ursprüngliche CDN-Adressen je Qualität. Eine fehlgeschlagene Adresse wird erst nach Prüfung der Alternative ersetzt; gewählte Qualität und Titel bleiben erhalten. Bei Serverlimits muss gewartet werden. Quellseite und Verwaltung müssen bis zum Speichern geöffnet bleiben.

## 0.1.51

Die Schnittzeiten lassen sich direkt neben dem Video bearbeiten: Sekunden, m:ss oder h:mm:ss mit bis zu drei Nachkommastellen. Griffe und Felder bleiben synchron; ein ungültiger Bereich kann nicht exportiert werden. Segmentierte Übertragungen behalten den ursprünglichen Fehler, wenn andere Anfragen gestoppt werden. Bei einer Serverbegrenzung muss weiterhin gewartet werden; sie wird nicht umgangen.

## 0.1.50

Vorschläge und Zähler für direkte Dateien, HLS und DASH erscheinen nach begrenzten Prüfungen der Medienanfänge: höchstens zwei gleichzeitige Hintergrundprüfungen, ohne das Popup zu öffnen. Unsichere Quellen bleiben verborgen; Seite durchsuchen versucht es erneut. Reale Prüfungen umfassen das genaue Instagram-Reel ohne Empfehlungen sowie TikTok und Odysee. Zugriffslimits und Prüfseiten werden angezeigt; vollständige Odysee-Downloads sind noch nicht validiert. Containerabmessungen erscheinen, soweit verfügbar. Plausible HTTP-Gesamtgrößen beschreiben die gesamte Quelle; ≈ kennzeichnet Schätzungen, niemals nur die HLS-Initialisierung. Fehlende Metadaten bleiben unbekannt. Lokale YouTube-SABR-, Playlist- und Aufnahmeprototypen behalten eigene Validierungsgrenzen; diese Vorprüfung bestätigt ihre Bytes nicht. Die Kompatibilität bleibt begrenzt.

## 0.1.49

Getrennte Audio- und Videoquellen desselben HLS-VOD werden nach Prüfung ihrer Spuren zusammengefasst. Ein Vorschlag behält die verfügbaren Qualitätsstufen und kombiniert beide Spuren. Es erfolgt keine zusätzliche URL-Normalisierung; für andere Formate und Player gelten weiterhin die dokumentierten Grenzen.

## Bild zuschneiden — 0.1.48

Einen Bildbereich als neue MP4-Datei exportieren. Das Original bleibt erhalten.

Ziehen, um einen neuen Bereich zu zeichnen. Innen ziehen zum Verschieben, an den Griffen ziehen zum Vergrößern oder Verkleinern. Pfeiltasten verschieben um 1 Pixel, mit Umschalt um 10 Pixel.

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

clip.webm → clip-converted.mp4

MP4-Konvertierung

MP4 mit H.264-Video und AAC-Audio. Eine Datei gleichzeitig; den Manager geöffnet lassen. Das Original bleibt erhalten. Kompatible Spuren werden kopiert, andere unterstützte Spuren neu kodiert. Das kann dauern und die Qualität verändern.

Videoqualität: Automatisch · kompatibles Video kopieren / Hohe Qualität / Ausgewogen / Kleinere Datei.

Maximale Auflösung: Original · ohne Vergrößerung / 1080p / 720p / 480p.

Audio-Bitrate: Automatisch · kompatibles AAC kopieren / 128 / 192 / 256 kb/s.

Standardwerte für MP4. Änderungen an Qualität, Auflösung oder Audio können eine Neukodierung erfordern. Größe und Tempo hängen von Quelle und Computer ab.

Die Konvertierung erfolgt lokal. Eine Kopie der gewählten Quelle und die MP4 bleiben bis zum Löschen der Aufgabe im temporären Browserspeicher. Das Original auf dem Datenträger bleibt erhalten. Dateiinhalte werden nicht hochgeladen.

Dateien werden einzeln konvertiert. Nach einer Pause oder dem Schließen des Managers startet die Konvertierung mit der gespeicherten Quelldatei neu.

## Livestream speichern

HLS-Segmente direkt in Quellqualität speichern. Unterstützt unverschlüsselte TS/fMP4 mit Audio und Video im selben Stream. Manager offen lassen. Für andere Quellen Tab-Aufnahme nutzen.

Startet mit einem aktuellen vollständigen Segment, eventuell einige Sekunden vor dem Klick. Stoppen und speichern beendet das aktuelle Segment und erstellt eine geprüfte MP4. Frühere Sendungsinhalte werden nicht nachgeladen.

Dieser Livestream hat separates Audio. Kombinierte HLS-Quelle oder Tab-Aufnahme wählen; es wird keine Datei ohne ihre Audiospur gespeichert.

Livestream-Aufnahme unterbrochen. Empfangenen Teil speichern; die verpasste Sendezeit kann nicht wiederhergestellt werden.
