# Contrôle des sources — 0.1.50

Les candidats détectés restent internes pendant leur analyse. Pour les formats de téléchargement ordinaires, seules les variantes dont le préfixe est contrôlé apparaissent dans les propositions et dans le compteur. Les résultats HTML, trop petits ou refusés sont écartés ; une incertitude réseau reste inconnue, sans être proposée comme fichier disponible. Le bouton d’analyse permet de retenter. Les contrôles commencent sans ouvrir la popup et continuent après sa fermeture ; un état de vérification global remplace les fiches provisoires.

Deux tâches de validation de page peuvent avancer, avec au plus **deux contrôles de sources simultanés** et les deux créneaux de découverte de manifestes existants. Chaque lot de deux contrôles rend sa place aux autres onglets en attente. Les budgets sont 32 couples source/piste et 24 expansions par page/navigation ; un changement SPA renouvelle le budget pour la nouvelle page. Les tentatives interrompues avant persistance ne consomment pas leur place. Les refus réellement échantillonnés et les incertitudes enregistrées attendent une relance explicite. Les qualités d’une paire HLS complète sont contrôlées avant leurs feuilles techniques ; les fragments inventoriés ne deviennent pas des fichiers complets.

Les catalogues YouTube SABR locaux, les playlists et la capture explicite sont des capacités distinctes : ils ne reçoivent pas une fausse preuve de préfixe HTTP. Leur statut expérimental et l’exclusion YouTube Store restent inchangés. Une capture démarre toujours sur action explicite. La qualité choisie reste mémorisée pendant une actualisation de ses URL ; le téléchargement attend sa nouvelle variante contrôlée, sans choisir silencieusement une autre qualité.

## Taille et préfixe

Le contrôle lit au plus 4096 octets par échantillon puis annule le corps. Si le serveur ignore Range, ces 4096 octets conservés ne garantissent pas qu’aucun octet supplémentaire n’a traversé le réseau. Les 4096 octets ne deviennent jamais la taille du fichier.

Pour une réponse 206, début/fin/total et éventuel Content-Length doivent être cohérents. Le total inconnu `*`, une compression HTTP ou des en-têtes insuffisants ne donnent pas de taille exacte. Pour 200, seul un Content-Length entier sûr, sans Content-Range et sans encodage transformant le corps, peut servir de total. Le seuil des réglages compare le fichier direct complet annoncé, jamais un init ou fragment HLS/DASH. Les variantes TikTok appliquent les mêmes gardes dans leur vrai cadre autorisé.

Le champ affiché d’un fichier direct utilise ce total HTTP contrôlé. Pour une sortie remuxée, une somme connue des ressources d’entrée reste précédée de **≈** : ce n’est pas le poids exact du futur MP4. Une estimation HLS par débit agrégé×durée n’est offerte que pour une VOD dont toutes les durées EXTINF sont complètes et les pistes concordantes. Les autres tailles restent inconnues. L’estimation ne sert pas de preuve de disponibilité ni de total final exact.

## Résolution

Les dimensions de présentation peuvent être lues dans le préfixe MP4/fMP4, TS ou WebM. Un MP4/MOV direct dont les en-têtes nécessaires ne sont pas présents bénéficie d’un parcours ISO-BMFF borné : au plus quatre GET par plages et 64 Kio supplémentaires, dans la même échéance de huit secondes. L’URL originale et le contexte normal sont conservés ; If-Range n’utilise qu’un ETag fort existant. Une réponse complète ignorant ces plages est annulée, pas chargée en mémoire.

Le lecteur saute mdat et les tables d’échantillons, ne copie pas un moov distant entier, et examine au plus 64 boîtes dans une hiérarchie limitée. Les matrices de présentation simples, rotations et miroirs orthogonaux sont prises en compte. Plusieurs pistes vidéo, une matrice complexe, des dimensions fractionnaires ou des données insuffisantes laissent les dimensions inconnues. Le préfixe HLS existant reste inchangé pour ses comparaisons de sources.

Ces dimensions sont des métadonnées du conteneur, pas un décodage intégral ni une preuve cryptographique. Le choix de qualité peut conserver sa valeur annoncée par le manifeste lorsqu’aucune dimension réelle n’est disponible ; le couple largeur×hauteur ne s’affiche que lorsqu’il a été lu. Les autres informations restent inconnues plutôt qu’inventées.

## Limites et données

« Accessible » atteste un préfixe reconnaissable : un fragment ultérieur, un changement de serveur ou une expiration peut encore faire échouer le transfert. Le téléchargement revérifie une source dont le contrôle est ancien ; un résultat non confirmé ne devient pas un téléchargement normal. Les sorties assemblées conservent leurs validations automatiques, puis leur enregistrement Chrome. Les fichiers directs terminent après confirmation de copie complète par Chrome, sans annoncer une vérification de structure absente.

Les contrôles respectent les hôtes autorisés et la liste de sites bloqués, y compris les manifestes imbriqués. Les contrôles et dimensions restent locaux, avec la session ou la tâche qui les utilise ; aucun rapport automatique ni nouveau service externe. Les contrôles TikTok libèrent l’attente worker après huit secondes ; Chrome ne permet pas de retirer une injection déjà transmise, mais le code local refuse un démarrage tardif et les résultats hors échéance.

[Résultats et conditions](TEST-RESULTS.md) · [Instagram](INSTAGRAM.md) · [Bilan des sites](DETECTION-SITES.md).
