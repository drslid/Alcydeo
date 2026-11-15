---
title: "Utiliser Alcydeo"
---

Firefox 153+ possède son propre paquet sans YouTube. La capture d’onglet Chrome, Google Cast et AirPlay sont indisponibles dans Firefox. Le traitement local dépend de ses codecs ; le guide Firefox indique le périmètre testé.

Lancez la vidéo : Alcydeo la détecte et actualise le compteur automatiquement. Ouvrez la popup, choisissez une qualité disponible puis téléchargez. Pour HLS ou DASH, recherchez les qualités et gardez le gestionnaire ouvert. Chrome demande l’accès HTTP/HTTPS à l’installation ; vous pouvez le limiter dans Chrome ou suspendre la détection dans les réglages. Un téléchargement direct se termine quand Chrome confirme l’enregistrement du fichier. Afficher dans le dossier permet de retrouver le résultat. Les qualités liées à une même vidéo sont regroupées dans une fiche. La qualité choisie reste sélectionnée après une nouvelle analyse.

Sources / Activité. Les téléchargements continuent si vous fermez cette fenêtre. Gardez l’onglet du gestionnaire ouvert pour les flux découpés.

![Sources](/Alcydeo/images/popup-progress.png)

Outils vidéo: Convertir en MP4, Compresser, Assembler des vidéos, Découper.

Détection automatique des médias

La détection démarre sur les sites autorisés. Suspendez-la ici ou limitez les accès dans le navigateur.

Effacer l’historique

Les fiches des téléchargements achevés, en échec ou annulés et leurs fichiers temporaires seront effacés d’Alcydeo, sur toutes les pages et tous les filtres, y compris les favoris. Les fichiers enregistrés et les téléchargements en cours ou en pause seront conservés.

## Cloud — 0.1.55

Bibliothèque → Cloud → Destination → Partager avec Gofile

## Bibliothèque — 0.1.61

Découper · Recadrer · Assembler des vidéos · Convertir en MP4 · Compresser · Cloud · Afficher dans le dossier

Dans la popup, choisissez une qualité puis Télécharger. Caster est juste à côté. Le menu … regroupe la découpe et l’enregistrement. Capture d’onglet et Bibliothèque restent en bas quand les sources défilent ; langues, aide et réglages sont dans l’en-tête.

## 0.1.52

TikTok utilise les métadonnées natives du post affiché et conserve jusqu’à trois adresses CDN originales par qualité. Une adresse en échec ne peut être remplacée qu’après contrôle de l’alternative ; la qualité choisie et le titre sont conservés. Les limites du serveur imposent d’attendre. Gardez la page source et le gestionnaire ouverts jusqu’à l’enregistrement.

## 0.1.51

Les temps de découpe se modifient directement à côté de la vidéo : secondes, m:ss ou h:mm:ss avec jusqu’à trois décimales. Les poignées et les champs restent synchronisés ; un intervalle invalide ne peut pas être exporté. Les transferts segmentés conservent l’erreur d’origine lorsque les autres requêtes s’arrêtent. Une limite du serveur impose toujours d’attendre ; elle n’est pas contournée.

## 0.1.50

Les propositions et le compteur des fichiers directs, HLS et DASH apparaissent après contrôle borné des préfixes médias : deux contrôles simultanés en arrière-plan au maximum, sans ouvrir la popup. Les sources incertaines restent masquées ; Analyser la page les réessaie. Les essais réels couvrent le Reel Instagram exact, sans recommandations, ainsi que TikTok et Odysee. Les limites et challenges d’accès sont signalés ; le téléchargement Odysee complet reste non validé. Les dimensions du conteneur s’affichent si disponibles. Les totaux HTTP cohérents décrivent la source entière ; ≈ indique une estimation, jamais le seul poids de l’initialisation HLS. Une métadonnée absente reste inconnue. Les prototypes locaux YouTube SABR, playlists et capture gardent des limites de validation distinctes ; ce contrôle ne certifie pas leurs octets. La compatibilité reste limitée.

## 0.1.49

Les sources audio et vidéo séparées d’un même HLS VOD sont regroupées après contrôle de leurs pistes. Une seule proposition conserve les qualités disponibles et assemble les deux pistes. Aucune normalisation d’URL supplémentaire n’est appliquée ; les autres formats et lecteurs restent soumis aux limites documentées.

## Recadrer — 0.1.48

Sélectionnez une zone de la vidéo à exporter dans un nouveau MP4. L’original est conservé.

Glissez pour dessiner une nouvelle zone. Déplacez-la en glissant à l’intérieur et redimensionnez-la avec les poignées. Les flèches déplacent de 1 pixel ; maintenez Maj pour 10 pixels.

## 0.1.47

Les fichiers assemblés et contrôlés s’enregistrent automatiquement sans second clic. La lecture locale du navigateur ne bloque plus la sauvegarde ; un codec absent peut nécessiter un autre lecteur. Les anciens échecs de lecture liés au codec sont enregistrés sans retéléchargement si le résultat conservé est intact. Annuler Enregistrer sous exige toujours une reprise explicite.

## 0.1.46

Les doublons HLS VOD supplémentaires sont regroupés après comparaison du plan de téléchargement et des échantillons ; l’URL d’origine du lecteur est conservée. Le réglage facultatif de 2/4/8 connexions permet de charger ensemble les pistes audio et vidéo DASH compatibles. Découper une ressource exige un validateur de version fort et des plages d’octets fiables. Le débit dépend du serveur et de la connexion.

## VK Video — 0.1.43

VK Video : les vidéos DASH compatibles apparaissent dans une fiche avec choix de qualité. Les fragments et sons d’interface sont écartés. Alcydeo assemble les ressources vidéo et audio déclarées, puis enregistre un MP4 vérifié. La vidéo fournie de 7 min 53 s a été sauvegardée et décodée intégralement en 144p (AV1/Opus). Les autres codecs, directs, accès privés et DRM ne sont pas universellement pris en charge. Gardez le gestionnaire ouvert pendant le traitement.

## X — 0.1.38

Posts X : rechargez le post après une mise à jour. Les données natives donnent le titre et les qualités MP4, même avec un lecteur Blob. Le catalogue actuel et ancien est lu sans exécuter de script. Les playlists audio/vidéo ne sont pas proposées séparément lorsqu’un fichier complet est disponible. Le post fourni est enregistré et entièrement décodé en MP4 AVC/AAC de 57,6 secondes. Fils, contenus privés, directs et toutes les mises en page ne sont pas universellement validés. Aucun nouveau droit, compte, API ou compagnon.

## TikTok — 0.1.37

Posts TikTok : Alcydeo lit le catalogue natif du post choisi même avec un lecteur Blob. Qualités et codecs sont regroupés sous le vrai titre. Le cadre source vérifie et transmet le fichier original au traitement local, sans en-tête/signature modifié ni compagnon. Gardez TikTok et le gestionnaire ouverts ; la popup peut fermer. Un fichier interrompu recommence. Le post fourni de 33 secondes AVC/AAC est sauvé et décodé intégralement ; les fils, directs, contenus privés et tous les codecs/mises en page ne sont pas universellement validés.

## Playlist YouTube — 0.1.38

Build local uniquement : sur une playlist YouTube, les vidéos disponibles sont cochées au départ. Décochez celles à exclure, choisissez une qualité maximale puis lancez le lot. Les fichiers sont sauvegardés un par un dans un sous-dossier au nom de la playlist, avec leur position originale et leur titre. Gardez le gestionnaire ouvert ; la popup peut se fermer. La reprise saute les fichiers sauvés et permet de relancer les seuls échecs. Toutes les métadonnées doivent être chargées avant le départ (5 000 éléments / 100 pages maximum). Continuations natives et un onglet lecteur muet détenu, sans contournement. Le transfert intégral d’une vraie playlist YouTube reste non validé. Le paquet Store exclut cette fonction.

Ce mix évolue : seuls les titres actuellement chargés par YouTube sont proposés. Choisissez ceux à enregistrer ; les suggestions futures sont exclues.

Qualité originale indique que la résolution de la source est inconnue. Les sources reconnues comme HTML sont retirées. Lorsqu’une redirection du lecteur est observée, le titre et la résolution restent associés au vrai fichier média.

Certains CDN servent les MP4 comme application/octet-stream. Alcydeo conserve l’URL média signée finale observée et exclut les pages HTML de lecteur, d’erreur et les pièces jointes HTML. Relancez le lecteur d’origine après le rechargement de l’extension.

Le badge s’actualise dès qu’une source est détectée, même si la page ou ses cadres chargent encore. Les qualités disponibles se complètent ensuite. Le site doit d’abord fournir une source média.

Alcydeo peut relire automatiquement les playlists détectées pour identifier les qualités et les fragments. Le téléchargement des fragments par l’extension démarre sur votre action.

Une URL peut renvoyer une autre liste HLS. Alcydeo suit une variante unique pour afficher les qualités réelles, puis résout la variante choisie au téléchargement, jusqu’à six niveaux. Si cette qualité disparaît, choisissez à nouveau ; les sources chiffrées restent non prises en charge.

Les métadonnées temporisées (0x15) n’ont pas été exportées dans le fichier.

clip.webm → clip-converted.mp4

Conversion MP4

MP4 avec vidéo H.264 et audio AAC. Un fichier à la fois ; gardez le gestionnaire ouvert. L’original est conservé. Les pistes compatibles sont copiées ; les autres pistes prises en charge sont réencodées, ce qui peut prendre du temps et modifier la qualité.

Qualité vidéo: Automatique · copie des vidéos compatibles / Qualité élevée / Équilibrée / Fichier plus léger.

Résolution maximale: Originale · sans agrandissement / 1080p / 720p / 480p.

Débit audio: Automatique · copie de l’AAC compatible / 128 / 192 / 256 kb/s.

Réglages par défaut pour le MP4. Changer la qualité, la résolution ou l’audio peut nécessiter un réencodage. La taille et la vitesse dépendent de la source et du PC.

La conversion reste locale. Une copie du fichier choisi et le MP4 restent dans le stockage temporaire du navigateur jusqu’à l’effacement de la fiche. Le fichier d’origine sur le disque est conservé. Le contenu n’est pas envoyé à un serveur.

La conversion traite un fichier à la fois. Après une pause ou la fermeture du gestionnaire, elle recommence à partir du fichier source conservé.

Enregistrement des fichiers: Enregistrer automatiquement. Afficher Enregistrer sous à chaque téléchargement.

Les fichiers utilisent ce sous-dossier du répertoire de téléchargement. Changez le répertoire principal dans les réglages du navigateur.

## Téléchargements simultanés — 1.0.0

Installation neuve ou réglages réinitialisés : quatre fichiers simultanés, plusieurs parties activées à quatre connexions par fichier compatible. Les choix existants sont conservés. Les deux plafonds sont réglables ; aucun gain de vitesse universel n’est promis.

Fichiers en parallèle: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8.

De 1 à 8 fichiers à la fois, indépendamment du nombre de connexions par fichier. Les fichiers en attente démarrent dès qu’une place se libère.

Une baisse de la limite laisse finir les téléchargements en cours. Les conversions restent traitées une par une.

### Téléchargements en plusieurs parties

Utiliser plusieurs connexions pour les fichiers et DASH compatibles.

Connexions par fichier: 2 / 4 / 8.

Gardez le gestionnaire ouvert. Les pistes audio et vidéo compatibles peuvent se télécharger ensemble. Diviser une ressource exige des plages fiables et un validateur de version fort ; sinon le transfert standard est utilisé. Le gain dépend du serveur et de votre connexion.

## Bibliothèque

Vos vidéos, téléchargements et traitements au même endroit.

Sélectionner cette page · Convertir en MP4 · Compresser · Assembler des vidéos · Cloud · Supprimer la sélection

Les fichiers sont traités un par un. Les originaux sont conservés. Choisissez ci-dessous les copies locales manquantes.

Éditeur de découpe visuel — Déplacez les poignées pour choisir le début et la fin, prévisualisez la sélection puis enregistrez-la en MP4.

Éditeur d’assemblage visuel — Glissez les clips pour modifier leur ordre, ou utilisez les flèches. Cliquez sur une miniature pour prévisualiser un clip.

Compression par défaut: Utilisés par Compresser dans la bibliothèque. Qualité, résolution maximale et débit audio influencent la taille et le temps de traitement.

Qualité de capture: 720p / 1080p / 4K. Jusqu’à 4K à 30 images/s avec un débit plus élevé. Le détail dépend de la source capturée ; agrandir les pixels ne recrée pas les détails absents.

Dessiner sur l’onglet capturé · Annuler le trait · Effacer le dessin

Langue: English / Español / Français / Deutsch / 简体中文 / العربية / Русский / Português / हिन्दी / اردو.

L’extension du fichier ne garantit pas la lecture ou la conversion de tous les codecs dans le navigateur. M3U8 et MPD décrivent des flux segmentés.

MP4 · WEBM · M3U8 · MPD · M4V · MKV · TS · MOV · AVI · OGG · MPG · WMV · FLV · 3GP · M2TS · MTS

MP3 · AAC · M4A · FLAC · WAV

Ignorer les fichiers de moins de: 10 KB / 100 KB / 1 MB / 2 MB. Les tailles inconnues restent visibles. La taille d’une playlist n’est pas celle de la vidéo.

Un domaine ou une URL par ligne, sous-domaines inclus. Tous les autres sites sont analysés si la détection automatique est active.

## Outils vidéo

Découpez une vidéo ou assemblez des clips dans l’ordre souhaité. Le traitement reste sur votre appareil.

Conversion locale en MP4 H.264/AAC. Les codecs non pris en charge sont signalés.

Créez un MP4 H.264/AAC local avec les paramètres de compression des Réglages. Un fichier plus petit n’est pas garanti.

Choisissez 2 à 20 clips et ordonnez-les. MP4 normalisé jusqu’à 720p/30 i/s. Chaque clip doit avoir une piste vidéo et la même présence de son.

Déplacez les poignées pour choisir le début et la fin, prévisualisez la sélection puis enregistrez-la en MP4.

## Enregistrer le flux

En direct — Enregistre directement un HLS en direct compatible. Les autres lecteurs utilisent la capture d’onglet.

Flux du lecteur — Enregistrez directement les segments HLS en conservant la qualité source. Ce mode accepte les flux TS/fMP4 non chiffrés, avec audio et vidéo dans le même flux. Gardez le gestionnaire ouvert. Pour les autres sources, utilisez Capture d’onglet.

Démarre sur un segment complet récent, qui peut inclure quelques secondes avant votre clic. Arrêter et enregistrer termine le segment en cours puis crée un MP4 vérifié. Le début de l’émission n’est pas récupéré.

Ce direct possède une piste audio séparée. Choisissez une source HLS combinée ou Capture d’onglet ; aucun fichier privé de son audio n’est enregistré.

L’enregistrement du flux a été interrompu. Enregistrez la partie reçue ; la période manquante du direct ne peut pas être récupérée.

Capture d’onglet — Capturez l’onglet depuis la popup, ou choisissez un écran ici. Débit plus élevé et résolution jusqu’à celle de la source. Gardez ce gestionnaire ouvert.

## Cloud — 0.1.57

Envoi du seul fichier choisi, à votre clic. Aucune synchronisation automatique.

Envoyer sur tous les clouds sans configuration

Gofile · MegaUp · 1fichier · Turbobit. Les limites de chaque service s’appliquent.

**Supprimer les fichiers temporaires** — 0.1.58

Supprime les copies locales du Cloud et annule les envois en attente. Les originaux et les liens de partage sont conservés.

Partager un lien : Gofile / MegaUp / 1fichier / Turbobit. Déposer dans un cloud : pCloud.

Gofile fonctionne sans connexion et crée un lien de partage public. Toute personne ayant le lien peut accéder au fichier. La conservation dépend de Gofile.

Partage expérimental sans compte. Les fichiers sont publics et peuvent expirer après 30 jours d’inactivité. Conservez votre original.

Partage expérimental sans compte. Toute personne ayant le lien peut accéder au fichier. Conservation non garantie après 15 jours ; gardez votre original. La disponibilité peut être différée après l’envoi.

Partage expérimental sans compte, jusqu’à 200 Mo par fichier. Toute personne ayant le lien peut y accéder ; conservation jusqu’à 7 jours. Gardez l’original et vérifiez le fichier sur Turbobit.

Sans connexion ici : collez un lien de dépôt pCloud existant et choisissez la région du dossier. Son propriétaire doit avoir un compte pCloud. Le fichier sera déposé dans ce dossier, sans création de lien public de téléchargement.

Lien ou code de dépôt — Région des données du dossier: Europe / États-Unis.

Réessayer renvoie le fichier entier. Si la réponse précédente a été perdue, vérifiez d’abord le dossier pour éviter un doublon.

Gardez le gestionnaire ouvert. Une copie temporaire conserve le fichier choisi. Retirer une fiche efface sa copie locale et conserve le fichier distant.

Les protocoles Cloud sont testés localement. Les envois réels restent à valider ; MegaUp est expérimental. pCloud nécessite un lien de dépôt existant.

## Supprimer les fichiers temporaires — 0.1.63

Supprime les copies locales du Cloud et annule les envois en attente. Les originaux et les liens de partage sont conservés.

Fichiers temporaires supprimés. L’historique des envois et les liens de partage sont conservés.

Un transfert ou une préparation est en cours. Attendez sa fin ou annulez-le avant de nettoyer.

[Gofile API](https://gofile.io/api) · [pCloud API](https://docs.pcloud.com/methods/upload_links/uploadtolink.html)

## Vérification…

Un petit échantillon est contrôlé avant téléchargement. Cela ne valide pas le fichier complet. Actualisez pour tester à nouveau les propositions.

Le contrôle a trouvé des sources invalides, indisponibles ou trop petites. Actualisez le lecteur d’origine, puis relancez la détection.

Cette source est plus petite que le seuil minimal choisi dans les réglages.

[Diffusion TV](/Alcydeo/fr/guides/tv/)
