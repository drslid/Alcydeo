# Sources HLS équivalentes — 0.1.46

La page Coflix fournie expose un lecteur Vidzy, une playlist HLS principale et une playlist native observée en lecture. La seconde ajoute un paramètre `gk` à son adresse et aux adresses des segments. Avant correction, les deux apparaissaient comme des propositions distinctes, dont une sans qualité connue. Un lien MegaUp se terminant par `.mp4` renvoie une page HTML : les contrôles existants l’écartent déjà après échantillonnage.

La correction compare localement les plans HLS VOD déjà analysés : pistes, durées disponibles, ordre de toutes les ressources, plages d’octets et empreintes des premiers échantillons déjà lus. Cette identité est bornée à 256 Kio de données de comparaison ; une identité trop grande, inconnue ou un direct ne suffit pas à regrouper. Il ne s’agit pas d’une empreinte du fichier complet. Deux sources de même titre ne sont jamais rapprochées pour ce seul motif.

Pour les seuls hôtes HTTPS `vidzy.cc` et leurs sous-domaines, un unique champ `gk` est ignoré dans cette comparaison ; toutes les autres composantes signées doivent correspondre. Le téléchargement conserve intégralement l’adresse d’origine contrôlée, y compris `gk` et sa signature. Aucun en-tête d’origine, cookie, signature, URL réseau ou accès n’est fabriqué. Les autres hôtes et les autres différences de paramètres restent distincts.

Le regroupement est limité à la même page et au même cadre du lecteur. Il conserve la qualité du master et préfère l’adresse native contrôlée. Des pistes audio différentes restent distinctes ; une nouvelle analyse avec un autre audio ne reprend pas l’ancienne identité. Le choix utilisateur et les identifiants sont conservés lors d’une recherche de qualités compatible. Les fragments opaques trouvés pendant ce contrôle sont aussi inventoriés pour ne pas être reproposés comme films séparés.

Un refus HTTP natif 401, 403, 404 ou 410 concernant une source déjà connue invalide sa disponibilité en cache. Une erreur transitoire 429/5xx ne suffit pas à l’écarter définitivement. Les refus HTML restent bloqués. Un nouveau succès natif peut remettre à jour la source ; les contrôles de taille, accès, contexte et arrêt restent actifs.

## Essai public et limites

Le 6 novembre 2026, Chrome for Testing 156.0.8078.4, dans un profil Linux/WSL2 isolé, charge normalement [la page fournie](https://coflix.esq/episode/how-to-ruin-diwali-meet-the-parents-1x3/). Le build local 0.1.46 présente **une seule fiche, badge 1, qualité 488p**, conserve l’adresse utilisée par le lecteur et sauvegarde automatiquement le résultat complet : **266 fragments, MP4 de 409 639 001 octets, AVC/AAC, 2 651,56 s**. Le traitement prend 27,168 s lors de cet essai. Chrome confirme la copie complète existante ; le moteur local contrôle les pistes, la durée et la lecture initiale avant enregistrement. [Rapport expurgé](benchmarks/coflix-public-0.1.46.json).

Le décodage indépendant intégral de la copie enregistrée lit **66 287 images vidéo et 114 190 échantillons audio**, correspondant exactement aux comptes déclarés des deux pistes MP4, jusqu’à leur fin. Aucun média ne sort du PC pendant cette vérification. [Décodage complet](benchmarks/coflix-decode-0.1.46.json).

Les tests interceptés utilisent des vidéos originales locales, avec master/playlist native, HTML trompeur, plusieurs qualités, fragments opaques et refus natif récupérable. Ils sont distincts de l’essai public. Le média public, ses captures et ses adresses signées restent dans les artefacts locaux ignorés ; ils ne sont pas redistribués. Aucune publication externe n’a lieu. Les accès futurs, sessions expirées, DRM, autres lecteurs et formats ne sont pas déclarés universellement pris en charge. Le profil Windows de l’utilisateur n’est pas piloté par ces tests.

## Révision 0.1.49 — vidéo et audio séparés

La page Apocalypse expose un master avec une vidéo et plusieurs langues audio déclarées ; le français est choisi par défaut. Le lecteur charge aussi une playlist vidéo native et une playlist audio française native. En 48, leurs trois plans globaux diffèrent légitimement : deux pistes pour le master, une seule pour chaque feuille. Le regroupement global seul laisse donc trois fiches.

Le contrôle 49 conserve aussi une identité par piste (`hls-track-v1`) : durée propre, ordre des ressources, plages et empreintes des deux préfixes déjà échantillonnés. Le rôle « combined » provisoire d’une feuille seule n’empêche pas sa comparaison avec la piste déclarée par son master. Aucun échantillon supplémentaire n’est demandé. Les limites restent deux contrôles simultanés, délai de 8 s, deux pistes, catalogue de comparaison de 256 Kio et URL de 8 192 caractères maximum. Ces identités ne sont pas des empreintes du fichier entier.

La variante complète contrôlée ne reprend que les feuilles correspondantes de la même page et du même cadre. Les adresses vidéo et audio natives restent distinctes ; les alias audio sont séparés et bornés à 64 adresses observées ou déclarées. Un autre audio, une preuve contrôlée contradictoire ou une preuve plus récente portant sur un autre transport ne sont pas écrasés par une ancienne association. La comparaison spéciale de `gk` reste celle décrite plus haut, sans modification des requêtes.

Un succès natif 200 sur la même adresse HLS conserve l’association sans modifier son horodatage ni prolonger le cache de 30 s. Un refus de l’audio choisi invalide la variante concernée ; un refus d’alias inutilisé ne prouve pas que le transport choisi est inaccessible. Une autre adresse déclarée peut être proposée après un nouveau contrôle de ses deux pistes.

Le dernier essai public 49 d’Apocalypse présente **une carte 360p, badge 1, deux pistes contrôlées**, avec les deux adresses natives effectivement observées. Seuls métadonnées, préchargement et échantillons sont lus ; aucun film complet n’est enregistré dans ce lot. Le calque publicitaire intercepte le clic normal : cette lecture n’est pas validée. Impératrice 49 présente une carte 432p ; Horror Collector 48 démarre réellement 9,41 s et présente une carte 720p. [Bilan des six pages](DETECTION-SITES.md).

Le transfert complet 49 est un test intercepté distinct, sur médias originaux locaux : neuf fragments, MP4 de 1 837 166 octets AVC/AAC, 6,021 s, automatiquement enregistré et confirmé par Chrome. Il couvre les événements natifs tardifs, le choix conservé après rescan et les refus audio. L’essai public complet 0.1.46 décrit plus haut reste une preuve historique distincte.

## Reprise French-stream — même build 0.1.49

Avec uBlock Origin Lite officiel 2026.1103.1743 en mode Complete dans un profil Chrome graphique isolé, le lecteur Vidzy de French-stream joue le film en 864×360 ; l’horloge avance de 0:07 à 0:31. Les trois propositions HLS initiales deviennent une carte 360p prête, avec deux pistes contrôlées et badge 1. Voe joue aussi, en 1728×720, jusqu’à 38,993 s observées ; une carte HLS 720p prête avec piste combinée subsiste. Dood n’est pas validé après une redirection non sollicitée et un échec DNS. Aucune tâche de téléchargement, aucun export ni téléchargement de film complet n’est lancé.

Ces essais complètent le cas sans bloqueur où la publicité empêchait le démarrage. Ils ne modifient ni Alcydeo ni sa version ; le bloqueur externe n’est pas embarqué. [Conditions et provenance vérifiée du bloqueur](DETECTION-SITES.md#reprise-french-stream-avec-bloqueur).
