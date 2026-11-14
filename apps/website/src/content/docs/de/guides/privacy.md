---
title: "Berechtigungen und Datenschutz"
---

Der lokale YouTube-Test speichert begrenzten beobachteten Kontext und bestehende undurchsichtige Transport-Token lokal mit der Aufgabe. Keine Attestierungen werden erzeugt, kein entfernter Player-Code ausgeführt. Exporte lassen diese Daten aus.

Keine Telemetrie. Mediathek und Aufgaben bleiben in diesem Browser. Netzwerkzugriff nur auf erlaubte Quellen.

Automatische Medienerkennung

Standardmäßig aktiv. Chrome gewährt den Websitezugriff bei der Installation. Hier pausieren oder den Zugriff in Chrome beschränken.

Alcydeo kann erkannte Wiedergabelisten automatisch erneut lesen, um Qualitäten und Fragmente zu erkennen. Medienfragmente lädt die Erweiterung erst nach dem Start eines Downloads herunter.

Aufgaben speichern Seiten- und Quell-URLs samt temporären Signaturen lokal in IndexedDB. Fragmente und Ausgaben nutzen OPFS. Das Löschen entfernt Eintrag und temporäre Dateien, nicht die gespeicherte Datei oder den Chrome-Verlauf. Exporte enthalten keine URLs, Pfade oder Download-IDs. Anfragen kontaktieren erlaubte Quellen/CDNs mit den anwendbaren Chrome-Sitzungen. Inkognito ist deaktiviert. Ein künftiger GitHub-Pages-Host kann Websitebesuche protokollieren. Ein öffentlicher Kontakt fehlt noch.

Verlauf löschen

Abgeschlossene, fehlgeschlagene und abgebrochene Einträge samt temporären Dateien auf allen Seiten und in allen Filtern aus Alcydeo entfernen, einschließlich Favoriten. Gespeicherte Dateien sowie laufende oder pausierte Downloads bleiben erhalten.

## Erkennungsdiagnose — 0.1.53

Lokaler Bericht ohne Videolinks, Cookies oder Signaturen. Es wird nichts gesendet.

Lokaler Erkennungsbericht → Bericht kopieren.

## X — 0.1.38

X-Beiträge: Beitrag nach einem Alcydeo-Update neu laden. Native Daten liefern Titel und MP4-Qualitäten auch bei Blob-Wiedergabe. Aktuelle und ältere Startdaten werden ohne Skriptausführung gelesen. Bei vollständigen Dateien werden Audio-/Video-Listen nicht getrennt angeboten. Der bereitgestellte Beitrag wurde als 57,6-Sekunden-MP4 mit AVC/AAC gespeichert und vollständig dekodiert. Feeds, private Beiträge, Live und alle Layouts sind nicht allgemein validiert. Keine neue Berechtigung, Konto, API oder Zusatzsoftware.

## TikTok — 0.1.37

TikTok-Beiträge: Alcydeo liest den nativen Katalog des gewählten Beitrags auch bei Blob-Wiedergabe. Qualitäten und Codecs stehen unter dem echten Titel. Der Quell-Tab prüft und streamt die Originaldatei lokal, ohne veränderte Header/Signaturen oder Zusatzprogramm. TikTok und Manager offen lassen; das Popup darf schließen. Unterbrochene Dateien beginnen neu. Der bereitgestellte 33-Sekunden-Beitrag mit AVC/AAC wurde vollständig gespeichert und dekodiert; Feeds, Live, private Beiträge und alle Codecs/Layouts sind nicht allgemein validiert.

Der lokale Katalog und Fortsetzungstokens bleiben in IndexedDB und werden bei Navigation oder Sitzungsbereinigung gelöscht. Gewählte Aufträge bleiben bis zur Bereinigung ihres beendeten Verlaufs gespeichert. Der native Kontext bleibt auf YouTube; Anfragen nutzen die Browsersitzung. Keine Playlist-Daten an Alcydeo-Server, Cloud oder Dokumentation.

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

Sprache und Vorschaubilder werden lokal mit der Mediathek gespeichert. Vorschaubilder stammen aus zugänglichen echten Dateien. Zeichnungen bleiben im gewählten Tab und werden beim Aufnahmestopp entfernt. Einträge entfernen löscht temporäre Daten und behält gespeicherte Dateien. Die Aufnahme beginnt nur nach einer ausdrücklichen Aktion oder Chrome-Oberflächenauswahl.

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

Tab über das Popup aufnehmen oder hier einen Bildschirm wählen. Höhere Bitrate bis zur Quellauflösung. Manager geöffnet lassen.
