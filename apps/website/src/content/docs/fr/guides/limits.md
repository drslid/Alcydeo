---
title: "Compatibilité et limites"
---

Les fichiers directs et les variantes HLS/DASH non chiffrées testées sont pris en charge. Accès à la source, codecs et stockage déterminent la compatibilité. Les médias protégés sont refusés. Prévoyez environ trois fois la taille du média pour le traitement segmenté ; les gros fichiers ne sont pas tous validés.

Google Cast reste expérimental. L’utilisateur a confirmé une démo officielle Google sur Shield ; ce résultat ne couvre ni les autres sources ni les fichiers privés. Pour un fichier local sur Shield, utilisez la diffusion d’onglet Chrome. AirPlay est absent de Chrome Windows.

Gofile, MegaUp, 1fichier et Turbobit proposent le partage, pCloud le dépôt par lien. Ces envois facultatifs exigent votre clic. Les protocoles sont testés localement ; les envois réels ne sont pas validés. Limites et conservation dépendent du fournisseur.

Le build local expérimente YouTube et les pistes séparées/SABR. Un Short fourni est téléchargé entièrement en 144p/720p avec audio et vidéo ; les autres sources, qualités et sessions demandent des vérifications distinctes. Le ZIP Store exclut YouTube. Lancez le lecteur habituel ; un transfert SABR interrompu recommence au début. Aucune compatibilité tous sites n’est promise.

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

clip.webm → clip-converted.mp4

Conversion MP4

MP4 avec vidéo H.264 et audio AAC. Un fichier à la fois ; gardez le gestionnaire ouvert. L’original est conservé. Les pistes compatibles sont copiées ; les autres pistes prises en charge sont réencodées, ce qui peut prendre du temps et modifier la qualité.

Qualité vidéo: Automatique · copie des vidéos compatibles / Qualité élevée / Équilibrée / Fichier plus léger.

Résolution maximale: Originale · sans agrandissement / 1080p / 720p / 480p.

Débit audio: Automatique · copie de l’AAC compatible / 128 / 192 / 256 kb/s.

Réglages par défaut pour le MP4. Changer la qualité, la résolution ou l’audio peut nécessiter un réencodage. La taille et la vitesse dépendent de la source et du PC.

La conversion reste locale. Une copie du fichier choisi et le MP4 restent dans le stockage temporaire du navigateur jusqu’à l’effacement de la fiche. Le fichier d’origine sur le disque est conservé. Le contenu n’est pas envoyé à un serveur.

La conversion traite un fichier à la fois. Après une pause ou la fermeture du gestionnaire, elle recommence à partir du fichier source conservé.

## Enregistrer un flux en direct

Enregistrez directement les segments HLS en conservant la qualité source. Ce mode accepte les flux TS/fMP4 non chiffrés, avec audio et vidéo dans le même flux. Gardez le gestionnaire ouvert. Pour les autres sources, utilisez Capture d’onglet.

Démarre sur un segment complet récent, qui peut inclure quelques secondes avant votre clic. Arrêter et enregistrer termine le segment en cours puis crée un MP4 vérifié. Le début de l’émission n’est pas récupéré.

Ce direct possède une piste audio séparée. Choisissez une source HLS combinée ou Capture d’onglet ; aucun fichier privé de son audio n’est enregistré.

L’enregistrement du flux a été interrompu. Enregistrez la partie reçue ; la période manquante du direct ne peut pas être récupérée.
