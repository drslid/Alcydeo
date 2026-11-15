---
title: "Permissions et confidentialité"
---

Le ZIP de développement Chrome inclut YouTube expérimental. La préparation Store Chrome et le paquet Firefox excluent YouTube. L’installation du ZIP Firefox est temporaire ; aucune signature XPI ni approbation Store n’est annoncée.

Firefox demande un consentement natif facultatif avant un envoi Cloud, pour le contenu du fichier et les données personnelles qu’il peut contenir, comme une voix ou une image. Un refus empêche préparation et envoi. Aucun upload automatique.

L’essai local YouTube conserve un contexte observé borné et les jetons de transport opaques existants, localement avec la tâche. Il ne génère aucune attestation et n’exécute pas de code distant du lecteur. Les exports omettent ces données.

Aucune télémétrie. Bibliothèque et tâches restent dans ce navigateur. L’accès réseau se limite aux sources autorisées.

Détection automatique des médias

La détection démarre sur les sites autorisés. Suspendez-la ici ou limitez les accès dans le navigateur.

Alcydeo peut relire automatiquement les playlists détectées pour identifier les qualités et les fragments. Le téléchargement des fragments par l’extension démarre sur votre action.

Les tâches conservent localement les URL de page et de source, signatures temporaires comprises, dans IndexedDB. Les fragments et sorties utilisent OPFS. Effacer une tâche supprime sa fiche et ses fichiers temporaires, pas le fichier final ni l’historique Chrome. Les exports omettent URL, chemins et identifiants de téléchargement. Les requêtes contactent les sources/CDN autorisés avec les sessions applicables de Chrome. La navigation privée est désactivée. GitHub Pages héberge la documentation publique et peut journaliser les visites du site. Assistance publique : [GitHub Issues](https://github.com/drslid/Alcydeo/issues).

Effacer l’historique

Les fiches des téléchargements achevés, en échec ou annulés et leurs fichiers temporaires seront effacés d’Alcydeo, sur toutes les pages et tous les filtres, y compris les favoris. Les fichiers enregistrés et les téléchargements en cours ou en pause seront conservés.

## Diagnostic de détection — 1.0.0

Bibliothèque → Réglages → Détection : choisissez l’onglet source pour consulter ou copier son diagnostic local. Codes et compteurs sûrs uniquement, sans envoi automatique. Le diagnostic n’est plus dans la popup.

Rapport local, sans lien vidéo, cookie ni signature. Rien n’est envoyé.

Rapport local de détection → Copier le rapport.

## X — 0.1.38

Posts X : rechargez le post après une mise à jour. Les données natives donnent le titre et les qualités MP4, même avec un lecteur Blob. Le catalogue actuel et ancien est lu sans exécuter de script. Les playlists audio/vidéo ne sont pas proposées séparément lorsqu’un fichier complet est disponible. Le post fourni est enregistré et entièrement décodé en MP4 AVC/AAC de 57,6 secondes. Fils, contenus privés, directs et toutes les mises en page ne sont pas universellement validés. Aucun nouveau droit, compte, API ou compagnon.

## TikTok — 0.1.37

Posts TikTok : Alcydeo lit le catalogue natif du post choisi même avec un lecteur Blob. Qualités et codecs sont regroupés sous le vrai titre. Le cadre source vérifie et transmet le fichier original au traitement local, sans en-tête/signature modifié ni compagnon. Gardez TikTok et le gestionnaire ouverts ; la popup peut fermer. Un fichier interrompu recommence. Le post fourni de 33 secondes AVC/AAC est sauvé et décodé intégralement ; les fils, directs, contenus privés et tous les codecs/mises en page ne sont pas universellement validés.

Le catalogue et ses jetons de continuation restent dans IndexedDB et sont effacés lors de la navigation ou du nettoyage de session. Le lot sélectionné persiste jusqu’au nettoyage de son historique terminé. Le contexte natif reste dans la page YouTube ; les requêtes ordinaires utilisent la session du navigateur. Aucune donnée de playlist n’est envoyée à Alcydeo, au Cloud ou à la documentation.

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

La langue et les miniatures sont conservées localement avec la bibliothèque. Les miniatures viennent des fichiers réels accessibles. Les traits restent dans l’onglet choisi et disparaissent à l’arrêt. Supprimer les fiches efface leurs données temporaires et conserve les fichiers sur disque. La capture commence après une action explicite sur l’icône ou le choix d’une surface dans Chrome.

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

Capturez l’onglet depuis la popup, ou choisissez un écran ici. Débit plus élevé et résolution jusqu’à celle de la source. Gardez ce gestionnaire ouvert.
