# Interface compacte et nettoyage — 0.1.63

La page Cloud rassemble les fichiers et les cinq destinations dans un seul formulaire compact. Les noms longs sont tronqués à l’écran, sans changer le nom réel du fichier. Les boutons à icônes gardent le nom du fournisseur et son état sélectionné. Les conditions, limites et notes du fournisseur restent consultables dans les détails repliés ; le lien de dépôt et la région pCloud restent directement accessibles.

L’envoi individuel, **Tous sans configuration** et **Nettoyer les copies** restent visibles. L’envoi multiple conserve ses quatre destinations : Gofile, MegaUp, 1fichier et Turbobit, avec leurs limites propres ; pCloud exige toujours son lien de dépôt. Le clic Cloud d’une fiche de Bibliothèque conserve ce seul fichier, la sélection groupée reste disponible et une copie manquante se choisit sur la page. Aucun nouvel envoi ni copie de préparation ne commence avant Envoyer. L’historique est présenté en lignes compactes, avec lien, annulation, reprise et suppression de fiche selon l’état du travail.

**Nettoyer les copies** efface les répertoires temporaires locaux `cloud-*`, y compris les orphelins, et annule les envois en attente dont la copie est effacée. Il conserve les originaux, les médias de Bibliothèque, les fiches d’historique, les liens de partage et les preuves d’une tentative d’envoi. Les octets affichés dans l’historique décrivent le transfert enregistré, pas l’espace temporaire encore occupé. La suppression d’une fiche reste une action distincte ; le nettoyage ne demande aucune suppression distante.

Le succès ou l’erreur apparaît directement près du bouton de nettoyage. Un transfert, une préparation ou un bail vivant reste protégé, y compris dans un autre gestionnaire. Les erreurs de stockage, notamment l’accès à la racine OPFS ou son énumération, donnent un message d’échec du nettoyage traduit et permettent de réessayer. Une suppression partielle reste signalée. La mention **Copie locale indisponible pour une reprise** ne prouve pas à elle seule une suppression physique : une préparation échouée peut laisser une copie partielle et l’état non reprenable est enregistré avant l’effacement.

## Vérifications de cette révision

Le passage final exécute **15cas de nettoyage/suppression sur chacun des builds local et Store**, dont les trois nouveaux scénarios de suppression individuelle concurrente. Les neuf cas d’interface/actions passent sur le build local final ; le scénario de compacité dix langues passe également sur Store. Voir [le rapport final63](benchmarks/cloud-cast-validation-0.1.63.json). Les rapports12cas ci-dessous conservent les essais intermédiaires antérieurs à ce correctif supplémentaire.

Les douze tests de nettoyage passent sur chacun des builds local et Store. Ils couvrent les copies et orphelins, les verrous entre gestionnaires, l’annulation d’un envoi actif intercepté, la reprise périmée, la suppression partielle puis sa nouvelle tentative, une liste de 205 répertoires et les erreurs de racine/énumération OPFS. Une fixture originale de **525 622 octets** est réellement préparée dans OPFS ; après l’échec d’un envoi intercepté puis le nettoyage, aucun répertoire Cloud ne reste et sa fiche annulée non reprenable est conservée. L’original reste intact. Preuves locales : `.local/cloud-cast63/cleanup/final-local.json`, `final-store.json` et `opfs-proof-local.json` dans le même dossier.

Les neuf tests d’interface et d’actions passent sur le candidat, puis le test de compacité est rejoué avec succès sur le build final après regroupement du libellé et du compteur du bouton. Les contrôles couvrent les dix langues, RTL, clair/sombre, 1 280 et 390 px, le clavier, les noms longs et l’absence d’envoi avant clic. Rapports : `.local/cloud-cast63/ui/local.json` et `final-compact.json` dans le même dossier. Aucun défaut de suppression physique dans la session de l’utilisateur n’est revendiqué comme reproduit ; ces essais utilisent des fixtures locales et des requêtes interceptées. **Aucun fichier n’a été envoyé à un fournisseur Cloud réel pour cette révision.**

La suppression individuelle d’une fiche relit également son état et son bail dans une transaction protégée par les mêmes verrous. Une fiche affichée en pause dans un second gestionnaire ne peut plus effacer un transfert repris, en attente ou détenu ailleurs. Trois scénarios de cette course sont reproduits avant correction ; leur résultat final figure dans le rapport63.

# Accès direct depuis la Bibliothèque — 0.1.61

Sur chaque fiche de fichier disponible, l’icône nuage entre Compresser et Afficher dans le dossier ouvre directement Cloud avec ce seul fichier. Pour plusieurs fichiers, cocher les fiches et utiliser le bouton Cloud de la sélection. Choisir le fournisseur puis Envoyer ; une copie locale absente se sélectionne sur cette même page. Aucun envoi nouveau ne démarre au seul clic sur le nuage.

# Cloud — Alcydeo 0.1.58

Cinq destinations à icônes sont proposées : **Gofile** pour partager un lien sans connexion, **MegaUp** pour un partage expérimental sans compte, **1fichier** pour un partage expérimental sans compte, **Turbobit** pour un partage expérimental sans compte, et **pCloud** pour déposer dans un dossier personnel au moyen d’un lien de dépôt existant. À la demande de l’utilisateur, **Google Drive et OneDrive sont retirés**. Aucun identifiant d’application, connexion OAuth ou permission `identity` n’est nécessaire.

Depuis Bibliothèque, sélectionner une ou plusieurs vidéos puis Cloud. Les fichiers accessibles sont relus localement ; sinon un sélecteur permet de désigner les originaux. Il faut ensuite choisir la destination et cliquer **Partager avec Gofile**, **Partager avec MegaUp**, **Partager avec 1fichier**, **Partager avec Turbobit** ou **Déposer sur pCloud**. Aucun envoi ne démarre lors de la sélection. Les fichiers sont préparés successivement et un seul transfert cloud est actif entre gestionnaires. Garder le gestionnaire ouvert.

## Gofile

L’API officielle reçoit le fichier en multipart sans connexion et renvoie un lien public. Toute personne possédant ce lien peut accéder au fichier ; la conservation dépend du fournisseur. Alcydeo vérifie la réponse et la taille déclarée lorsqu’elle est fournie. Le lien affiché vient de cette réponse, sans création de compte Alcydeo ni relais.

## MegaUp — expérimental

À la demande de l’utilisateur, le connecteur utilise le formulaire public anonyme de megaup.net. Aucune API publique documentée n’a été trouvée. À chaque envoi explicite, la page est lue avec une limite de 512 Kio et un délai de 20 s. La configuration JSON/les champs nécessaires sont extraits comme données ; aucun script du fournisseur n’est exécuté. L’URL de destination est conservée, avec HTTPS et une liste bornée d’hôtes/chemin attendus (megaup.net et ses sous-domaines, un hôte sous mupload.store). Aucun cookie, compte MegaUp existant, identifiant OAuth ou jeton personnel n’est copié.

Le formulaire observé annonce 5 368 709 120 octets par fichier et des parties de 100 000 000 octets. Le connecteur applique aussi la limite publiée plus petite si elle change. Alcydeo utilise au plus 8 Mio par partie, dans la limite annoncée par la page. La progression compte les octets confirmés par réponse. Les requêtes sont séquentielles, le même nom est conservé et Content-Range indique les parties. Un maximum de 1 024 requêtes protège contre une configuration anormale. Chaque requête de partie est bornée à 120 s. Les cookies sont explicitement omis et les redirections refusées par fetch. Les données de session et paramètres temporaires restent en mémoire du Worker ; ils ne sont pas copiés dans les tâches ou rapports.

Le résultat doit être un lien HTTPS MegaUp et les métadonnées de nom/taille présentes doivent correspondre. Ce contrôle de réponse ne constitue pas une relecture indépendante ou une empreinte cryptographique du fichier distant. Les conditions précisent que les fichiers ne sont pas privés ; la FAQ annonce leur suppression après 30 jours d’inactivité. L’original local reste conservé.

Une page changée, un refus, une protection ou du HTML arrête le transfert ; aucune réparation de signature ou contournement n’est tenté. Les morceaux distants d’un envoi interrompu ne sont pas supprimés par Alcydeo. Reprendre envoie le fichier entier avec une configuration fraîche et peut créer un doublon si une réponse finale a été perdue. Le lien Ouvrir MegaUp permet d’utiliser directement le site.

Les tests Chrome interceptent le formulaire et son serveur d’envoi pour vérifier les vrais octets, parties, erreurs, annulation, reprise et absence de cookies. La lecture de la vraie page publique a confirmé les champs et limites ; **aucun téléversement réel vers MegaUp n’a été effectué**. Le statut expérimental est visible dans l’interface. [Capture française](screenshots/cloud-megaup-fr.png) et [arabe RTL](screenshots/cloud-megaup-ar-narrow.png).

## 1fichier — expérimental

L’API officielle documente l’envoi web avec identification facultative. L’initialisation anonyme POST de get_upload_server.cgi a répondu HTTP 200 avec un nœud et un identifiant valides ; aucun fichier n’a été envoyé. Un GET exploratoire a répondu 400, et n’est pas utilisé par le connecteur.

Après votre clic, un seul fichier multipart de taille connue est envoyé à un nœud HTTPS upN.1fichier.com fourni par cette initialisation. Chrome calcule Content-Length ; Alcydeo ne charge pas le fichier entier dans un ArrayBuffer JavaScript et n’invente pas d’envoi par morceaux. Limite conservatrice de 300 000 000 000 octets par fichier, correspondant au plafond de 300 Go documenté ; l’espace OPFS disponible peut être inférieur. Aucun essai à cette taille n’est revendiqué. Délai maximum d’envoi de quatre heures, comme le service ; métadonnées et rapport limités à 64 Kio et respectivement 20/30 s.

Les requêtes omettent explicitement les cookies. La redirection de fin est laissée opaque et n’est jamais suivie, quelle que soit sa destination. Le connecteur lit uniquement end.pl sur le nœud validé, avec le même identifiant d’émission et l’en-tête JSON:1. Le rapport doit confirmer un seul fichier, son nom et sa taille exacts et un lien HTTPS de téléchargement 1fichier. Une page HTML, un dépôt incoming privé, un lien externe ou un rapport incohérent ne deviennent pas une réussite. Les identifiants d’émission, liens de suppression et empreintes annoncées par le fournisseur sont ignorés pour la persistance ; seul le lien de lecture est conservé. Aucun retrait distant n’est déclenché.

La barre reste indéterminée pendant l’envoi : le parcours choisi ne mesure pas les octets reçus en temps réel. Un rapport accepté confirme les métadonnées et le lien, pas une relecture indépendante du stockage distant. La disponibilité du fichier peut encore être différée. Toute personne disposant du lien peut accéder au fichier ; l’aide ne garantit pas la conservation gratuite après 15 jours sans compte. Garder l’original.

L’annulation coupe la requête locale sans promettre un nettoyage distant. Une reprise explicite recommence le fichier complet avec un nouvel identifiant ; une réponse perdue peut laisser un doublon. Le lien Ouvrir 1fichier donne accès au parcours direct du site. Les transferts de test sont interceptés dans Chrome ; le véritable téléversement reste à valider et le statut expérimental demeure visible. [Capture française](screenshots/cloud-onefichier-fr.png) et [arabe RTL](screenshots/cloud-onefichier-ar-narrow.png).

## Turbobit / torbobit.net — expérimental

Le domaine torbobit.net fourni et turbobit.net servent la même interface actuelle. Leur initialisation web anonyme POST upload/urls répond HTTP 200 sans cookie ni authentification et fournit un nœud de stockage fdfiles.net. Aucun fichier n’a été envoyé au fournisseur. La documentation officielle CostAction, liée depuis le site historique, demande un compte et une clé API ; ce connecteur n’utilise pas cette API authentifiée.

Le connecteur original reproduit les champs du parcours invité, sans copier/exécuter le code du site : fichier Filedata, apptype fd1, folder_id 0, sans user_id ni compte. Une seule destination HTTPS sN.fdfiles.net/uploadfile est acceptée par réponse, avec URL exacte et paramètres conservés. Les requêtes omettent les cookies et refusent les redirections. Chaque fichier reçoit une nouvelle destination ; un seul transfert Cloud est actif. Initialisation limitée à 20 s, envoi à une heure et réponses JSON à 64 Kio. La fermeture du gestionnaire interrompt le Worker ; la reprise explicite recommence depuis l’entrée conservée.

La FAQ héritée accessible sur cdn.turbobit.net annonce 200 MB par fichier et jusqu’à sept jours de stockage pour les non-inscrits. Alcydeo applique par prudence **200 000 000 octets** avant la préparation locale ; le serveur reste souverain. Ces limites n’ont pas été mesurées sur le nouveau site et ne garantissent pas un dépôt de cette taille. Pour un fichier plus gros, choisir une autre destination.

Le nouveau client web utilise un identifiant de fichier comme acquittement. Alcydeo exige un identifiant alphanumérique valide, refuse les erreurs explicites et vérifie les noms/tailles s’ils sont fournis. Le lien de partage standard est construit sur torbobit.net avec cet identifiant et le suffixe natif .html ; aucune URL arbitraire du serveur ni donnée de suppression n’est conservée. **Un acquittement ne prouve pas indépendamment le nom, la taille ou la lecture du fichier distant lorsque ces métadonnées sont absentes.** Vérifier le fichier chez Turbobit et garder l’original. Le lien donne accès à toute personne qui le possède.

La barre reste indéterminée pendant l’envoi. Annuler ne promet pas l’effacement distant ; une réponse tardive ne réactive pas la fiche annulée. Reprendre renvoie le fichier entier sur une destination fraîche, avec risque de doublon après une réponse perdue. Ouvrir Turbobit donne le parcours direct du site. Tous les transferts de laboratoire sont interceptés ou dirigés vers un serveur HTTPS local ; **aucun dépôt réel Turbobit n’est validé**. Aucun compte, paiement ou contournement d’accès n’est ajouté. [Capture française](screenshots/cloud-turbobit-fr.png) et [arabe RTL](screenshots/cloud-turbobit-ar-narrow.png).

## pCloud

Le propriétaire doit avoir un compte et créer un **lien de dépôt**, distinct d’un lien de partage en lecture. L’expéditeur n’a pas à se connecter dans Alcydeo. Formats acceptés :

- `https://e.pcloud.com/#/puplink?code=…` : région Europe déterminée automatiquement.
- `https://my.pcloud.com/#page=puplink&code=…` ou code seul : région du dossier choisie explicitement.

Le format récent `e.pcloud.com` était refusé par l’ancien parseur ; il est désormais reconnu. Un contrôle **en lecture seule** de `showuploadlink` avec le lien fourni a renvoyé `result:0`. Aucun fichier n’a été envoyé, et le vrai code n’est inscrit ni dans le dépôt, ni dans les tests, ni dans les captures.

Le fichier est envoyé à `eapi.pcloud.com/uploadtolink` (Europe) ou `api.pcloud.com/uploadtolink` (États-Unis), avec `code` et `nopartial=1`. Alcydeo ne lit ni ne copie de cookies et n’ajoute aucun jeton OAuth ou mot de passe. Les transports XHR existants de Gofile/pCloud peuvent toutefois recevoir les cookies du fournisseur gérés par Chrome ; l’omission explicite vérifiée avec des cookies préexistants concerne MegaUp. L’autre région n’est pas essayée automatiquement. La réponse doit contenir `result:0` ; les métadonnées de taille, si présentes, doivent correspondre. La réponse minimale documentée confirme le dépôt, sans somme de contrôle ni vérification indépendante du fichier distant.

Le propriétaire retrouve le fichier dans le dossier. Alcydeo ne crée pas de nouveau lien public de lecture ou de transfert pCloud Transfer. Le formulaire conserve localement le lien/région, et chaque tâche garde sa destination initiale même si le formulaire change. Le code propre à la tâche est effacé après réussite/annulation ; supprimer une fiche ne révoque pas le lien du propriétaire.

## Stockage et interruptions

Les entrées choisies sont copiées progressivement dans un répertoire temporaire OPFS distinct. Les fichiers d’origine et les téléchargements sur disque sont conservés. L’espace disponible est contrôlé. Les copies terminées sont libérées après confirmation du fournisseur. Retirer la fiche efface ses données locales ; cela ne supprime jamais un fichier distant.

Gofile/pCloud/MegaUp/1fichier/Turbobit ne reprennent pas un transfert interrompu au dernier morceau dans ce lot. Après interruption et expiration du bail, la tâche reste en pause jusqu’à une relance explicite, qui repart du début. Une réponse perdue peut laisser un fichier reçu chez le fournisseur : vérifier la destination avant de réessayer. Les refus, quotas, réponses HTML et erreurs de connexion ne deviennent pas des réussites.

Les anciennes tâches Drive/OneDrive restent identifiables pour être annulées/supprimées ; leur reprise est désactivée. Les anciens jetons de session et la préférence d’identifiant OneDrive sont nettoyés. Cela ne révoque pas un éventuel consentement déjà donné au fournisseur et ne supprime pas de fichier distant.

## Validation et limites

Les tests Chrome interceptent les requêtes vers les API et contrôlent leur contenu, l’absence d’envoi avant clic, l’ordre des traitements, les erreurs, l’annulation et les fichiers originaux. Ces tests ne constituent pas des téléversements réels. L’utilisateur rapporte que Gofile fonctionne ; l’envoi pCloud reste à valider chez lui après correction du lien. Aucun téléversement réel n’a été effectué dans le laboratoire.

Les autres fournisseurs demandés ne sont pas annoncés comme intégrés. Aucune publication externe n’a été déclenchée.

Sources MegaUp : [formulaire public](https://megaup.net/), [FAQ](https://megaup.net/faq), [conditions](https://megaup.net/terms).

Sources officielles : [Gofile API](https://gofile.io/api), [pCloud uploadtolink](https://docs.pcloud.com/methods/upload_links/uploadtolink.html), [pCloud showuploadlink](https://docs.pcloud.com/methods/upload_links/showuploadlink.html), [régions pCloud](https://docs.pcloud.com/). Voir aussi [confidentialité](PRIVACY.md) et [résultats](TEST-RESULTS.md).

Sources 1fichier : [API et protocole web](https://1fichier.com/api.html), [aide et limites](https://1fichier.com/hlp.html).

Sources Turbobit : [site fourni](https://torbobit.net/), [FAQ héritée](https://cdn.turbobit.net/faq), [API officielle](https://api.costaction.com/en/v1/docs), [authentification API](https://api.costaction.com/api-docs/en/v1/description.yml).

## Direct Library selection — 0.1.55

Select files in the Library and click Cloud to open the destinations directly. The intermediate selected-files dialog is removed. Accessible retained outputs or authorized saved files load locally; choose any missing local copies in the Cloud page. The displayed name follows the actual file, including processed suffixes. This temporary selection remains in the current manager and is not a persisted cloud job. No new upload or staging job starts until Send. Previously authorized queued jobs retain their own lifecycle.

Each row pairs its file with its source task; removing or replacing another row does not shift that association. Read-only lookup results arriving after a new selection/removal are ignored. Send snapshots its own batch, keeps preparation locked across its files and removes only its successfully staged rows. A later Library selection therefore requires its own Send. Source-task acquire/renew/release, progressive OPFS staging and existing provider limits/cancellation remain intact. Inline disk selection does not grant folder access or request a new permission. Provider tests are intercepted and do not demonstrate a real provider upload.

## 1fichier allocator and error correction — 0.1.56

A real anonymous metadata request returns ru-3.1fichier.com, which the previous upN-only validator rejected before sending a file. Both bounded native families upN and ru-N are now accepted, retaining the exact bare hostname and ten-character ID. Schemes, ports, paths and foreign hosts remain refused. The official documentation describes a load-balanced server choice. A separate Chrome156 initialization returns up3 and is accepted; these two samples are distinct and do not establish every possible node. See [official upload initialization](https://1fichier.com/api.html#s-upload-get_upload_server) and [sanitized evidence](benchmarks/onefichier-initialization-0.1.56.json). No real upload or completion-report request is made.

Cloud errors now look up direct message keys, then existing err_ keys, then a translated generic message. This fixes raw Onefichier/Turbobit/MegaUp/file-size codes in all ten languages. The initialization error explicitly concerns the current attempt.

New 1fichier jobs alone persist uploadAttempted=false. The Worker commits true before invoking the first multipart request, with current owner/state/abort guards. It never resets this evidence on retry. The duplicate warning is hidden only for explicit false; old jobs with no marker and jobs with an earlier uncertain request retain it, even at zero confirmed bytes or after a later initialization failure. The boolean means a body request may have been engaged, not a confirmed completed remote upload. Original files and the existing explicit retry remain available.

## Envoi multiple — 0.1.57

Après sélection des fichiers, **Envoyer sur tous les clouds sans configuration** prépare un envoi vers **Gofile, MegaUp, 1fichier et Turbobit**, même si pCloud est sélectionné sans lien. pCloud garde son bouton de dépôt individuel. Les quatre copies partagent les fichiers choisis au clic ; choisir ensuite d’autres fichiers ne les ajoute pas à cet envoi. Aucun travail fournisseur ne commence seulement en ouvrant Cloud ou en choisissant des fichiers.

Chaque destination a sa fiche, sa progression, son annulation et sa reprise. Un seul transfert est actif à la fois. Les plafonds sont contrôlés séparément : Turbobit 200 000 000 octets, MegaUp 5 368 709 120 octets (une session native peut abaisser ce plafond), 1fichier 300 000 000 000 octets. Un service trop limité est signalé et ignoré pour ce fichier ; les autres continuent. La place temporaire OPFS doit permettre les copies par destination encore en attente. Les fichiers locaux d’origine sont conservés.

En cas d’échec de préparation locale, la sélection indique les destinations déjà préparées : un nouveau clic ne recrée que celles manquantes. Une erreur réseau après préparation se reprend depuis sa propre fiche, selon les règles de doublons du fournisseur ; les trois autres envois restent indépendants. La sélection temporaire n’est pas restaurée après fermeture, les tâches préparées restent persistantes.

Le client natif Turbobit construit un lien standard **https://torbobit.net/<id>.html**. Le suffixe manquant faisait ouvrir une route inexistante. Les nouveaux liens sont corrigés ; l’historique répare uniquement les anciens liens exacts de ce fournisseur, sans nouveau transfert ni modification de l’état du travail. Les pages publiques renvoient une coque SPA HTTP 200 avec ou sans suffixe : ce statut ne vérifie pas l’existence du fichier. La preuve provient du constructeur et des routes natifs lus comme données, sans exécuter de JavaScript fournisseur. [Constat expurgé](benchmarks/turbobit-link-0.1.57.json).

Les essais du bouton multiple utilisent exclusivement les fichiers originaux de test et des réponses interceptées. Ils couvrent les octets/noms, l’échec isolé, l’annulation, les changements de sélection et la reprise sans doublon des préparations réussies. Aucun dépôt réel supplémentaire n’est effectué.

## Supprimer les fichiers temporaires — 0.1.58

Le bouton de la page Cloud efface les copies locales préparées pour les fournisseurs, y compris les répertoires Cloud orphelins. Les fichiers d’origine, les sorties de Bibliothèque, les fiches et leurs liens de partage restent conservés. Les envois en attente qui perdent leur copie sont annulés : pour envoyer à nouveau, choisir le fichier d’origine puis une destination. Le nettoyage n’efface jamais un fichier distant et n’appelle aucun fournisseur.

Une préparation ou un transfert actif protège sa copie, même dans un autre gestionnaire. Attendre sa fin ou l’annuler avant le nettoyage. Les baux vivants sont également respectés. L’état non reprenable est enregistré avant suppression ; un ancien bouton Reprendre ne peut pas remettre en file une entrée nettoyée. En cas de suppression partielle, un message invite à réessayer ; les autres copies supprimables sont traitées.
