# TV — Alcydeo 0.2.0 preview

## Public preview distribution — November 14, 2026

The owner authorizes the public site at **https://drslid.github.io/Alcydeo/cast/**. Both the repository and Pages path preserve the capital A. The configured public build will use this official-SDK player after its deployed ready protocol2 is verified; no user-side localhost service is required. Preview source builds now default to that public address, with the existing bounded readiness check and native fallback. Development builds can still select the explicit local fixture player through `ALCYDEO_CAST_SENDER_URL`; the Store default remains empty. The receiver must be able to read the actual source.

This publication is not additional evidence of physical receiver playback. The earlier Google sample is user-confirmed; the supplied TikTok and private PC transport to Shield remain unverified and unimplemented respectively. AirPlay is unavailable in Windows Chrome. The historical sections below retain their original version numbers and laboratory paths.

## Lecteur intégré — 0.1.65

Depuis la popup, **Caster** ouvre un lecteur persistant dont la barre vidéo contient directement lecture/pause, progression, volume, Cast et plein écran. Un clic sur l’icône Cast appelle le sélecteur officiel Google ; le choix de la TV reste une action réelle dans ce lecteur. Sans JavaScript, les contrôles vidéo natifs restent présents. L’aide longue se déplie au besoin.

Un défaut est reproduit sur une vidéo originale de six secondes : après fin de l’aperçu, le chargement Cast héritait de cette position finale. Les fichiers à durée finie partent maintenant explicitement à zéro ; les directs ne reçoivent aucune position implicite. Une fin FINISHED peut être relancée par Lecture, sans boucle automatique. Les protections d’erreur, délais de vingt secondes et rapports expurgés de64 restent conservées.

La Bibliothèque et l’activité popup proposent aussi Cast. Pour un téléchargement original, le raccourci peut retrouver sa source réseau dans le même onglet, la même page et le même cadre, contrôler sa qualité et la relire avant ouverture. Le lecteur affiche alors **Source d’origine du téléchargement** : ce parcours lit cette URL en ligne, pas les octets privés sur disque. Les transformations, captures et enregistrements directs ne sont jamais remplacés par la source initiale. Source absente, ambiguë, modifiée ou refusée : ouvrir explicitement le lecteur local sans tentative de sélection cachée.

L’analyse en lecture seule de la page Vidow fournie confirme l’usage du SDK Google et d’une URL TikTok directe pour cette session. Le client web de son outil de fichier local contient une préparation d’upload ; son service privé n’a pas été appelé et aucun fichier ne lui a été transmis. Cette analyse ne démontre pas le trajet réseau de la Shield ni un relais vidéo générique. Les scripts du CRX sont restés des données locales de référence, jamais installés, exécutés ou intégrés au produit. Voir les résultats65 pour les limites des tests.

La lecture réelle du TikTok sur Shield n’est toujours pas confirmée dans Alcydeo ; le comparatif sur l’adresse exacte de la session concurrente reste non essayé par l’utilisateur. Les corrections65 et les contrôles avec SDK simulé ne doivent pas être présentés comme un résultat matériel. Le transport autonome d’un fichier privé du PC vers Shield n’est pas ajouté. Aucun upload privé, compagnon ou récepteur externe déployé.

Le lecteur **Fichier du PC** propose le bouton **Caster** pour les récepteurs compatibles avec la lecture distante native de Chrome. **Les modèles Shield sont filtrés par cette API dans Chrome156** ; pour Nvidia Shield, lire le fichier ici puis utiliser le menu Chrome **Caster l’onglet**. Ce menu est un autre parcours que le sélecteur appelé par une extension. L’envoi direct d’un lien détecté et la lecture distante d’un fichier enregistré sont deux parcours distincts.

## Retour TikTok et annulation du sélecteur — 0.1.64

L’utilisateur signale l’échec sur le TikTok /@ler0i_off/video/7700630488859315489 et son fichier enregistré. Son rapport `cancel`, session présente, LOAD acquitté, IDLE et média absent ne permet pas d’attribuer la cause à CORS, HTTP ou un codec. Un défaut du lecteur63 est reproduit : ouvrir puis annuler un nouveau sélecteur effaçait l’erreur média et affichait à tort une absence de connexion. Une annulation préserve désormais l’erreur/diagnostic et l’échéance existants ; sans route, elle reste neutre. Les erreurs de connexion réelles restent distinctes.

Le SDK peut retirer getMediaSession avant la notification finale. Les idleReason effectivement reçus par l’objet Media sont observés et limités aux enums connus ; aucune cause inconnue n’est inventée. Les écouteurs sont retirés au changement de session, média, tentative ou fermeture ; un ancien ERROR ne doit pas interrompre une relance. Le rapport inclut la version du build web pour repérer une ancienne page encore ouverte.

Le lecteur propose un retour facultatif à la page d’origine si son URL HTTP/HTTPS est propre, sans identifiants, query ou fragment, et de2048caractères maximum. Cette adresse n’est envoyée ni à la TV dans MediaInfo ni au rapport ; elle reste dans le fragment effacé à l’ouverture. Les pages à clé de requête n’ont pas de lien substitué ou amputé.

Pour le fichier déjà téléchargé, un échec RemotePlayback ouvre et focalise le guide complet, avec « Diffuser l’onglet · étapes Chrome » en action principale. « Cast natif · appareils compatibles » conserve une relance volontaire. Il n’y a ni nouvel appel natif automatique ni nouvelle copie du fichier. Cela améliore la récupération ; **le Cast direct du fichier privé vers Shield n’est pas ajouté**. Le succès de la démonstration Google63 reste une preuve déclarée par l’utilisateur pour ce média public uniquement.

Les sondes actuelles du CDN TikTok sont consignées dans [le rapport d’accès](benchmarks/tiktok-cast-access-0.1.64.json), avec bloqueur/version/mode et portée des préfixes. Une restriction CORS du Web Sender n’établit pas seule le comportement du récepteur MP4 ; aucune réception matérielle TikTok n’est revendiquée.

## Lecteur web officiel pour les sources réseau — 0.1.63

Le bouton Cast de la popup peut maintenant ouvrir un lecteur web Alcydeo original avec **Google Cast Web Sender SDK**, Default Media Receiver et contrôles pause, position, volume, rechargement explicite et déconnexion. Le SDK distant est chargé uniquement dans la page HTTP/HTTPS, jamais dans le contexte de l’extension. Le premier clic prépare une source contrôlée ; le clic « Choisir une TV » dans la page appelle la sélection officielle avec un nouveau geste utilisateur.

Le build local63 configure http://localhost:4180/alcydeo/cast/. Le site statique fournit le même lecteur sous /alcydeo/cast/ pour une publication Pages ultérieure. Un contrôle ready.json protocol2, sans credentials ni redirection, borné à800ms/2Kio, sélectionne ce parcours ; sans lecteur disponible le contrôleur natif historique reste utilisé. Le build Store conserve sa configuration vide tant qu’aucune publication n’est autorisée. Le dépôt distant n’est pas accessible dans l’état actuel et Pages répond404 ; aucune création/push/publication n’est tentée.

La source déjà vérifiée est relue avant ouverture. Son URL est remise dans le fragment, effacé avant de charger le SDK ; elle n’entre ni dans la requête du serveur statique, ni dans son stockage persistant. La vraie URL directe ou le manifeste HLS/DASH complet est conservé ; une vidéo à piste audio séparée nécessitant un assemblage externe n’est pas envoyée par ce raccourci. Le récepteur doit pouvoir charger la source sans les cookies/en-têtes privés du navigateur. Les limites de CORS, codecs, sessions et DRM restent applicables.

Une connexion de route ou un acquittement LOAD n’est pas affiché comme lecture. Un statut PLAYING/PAUSED confirme le média ;20s bornent le chargement et chaque épisode BUFFERING, sans prolongation par les notifications répétées ni LOAD automatique. Un IDLE/ERROR devient un échec, sans être présenté comme une fin normale. Le drapeau live vient d’un contrôle ready : StreamType.LIVE sans position initiale forcée et seek désactivé. Les statuts tardifs ne ressuscitent pas un échec terminal. Un rapport explicite contient seulement les codes SDK connus, compteurs et états, sans URL/titre/cookie/jeton ni télémétrie.

**Essai utilisateur Windows/Shield :** le sélecteur affiche la Shield ; le premier média W3C échoue, puis la démonstration officielle [Google Chromecast Ultra37s](https://storage.googleapis.com/cpe-sample-media/content/ads/chromecast_ultra_ad/prog/chromecast_ultra_ad_prog.mp4) fonctionne, selon la réponse « La ca fonctionne ». HEAD200 et GET206/4096octets avec ACAO* ont été contrôlés pour ce second média. Le premier média ne renvoie pas cet en-tête dans la sonde, sans preuve que cela explique son échec. Ce résultat est déclaré par l’utilisateur, pas observé dans un laboratoire équipé ; il ne valide qu’un média réseau.

Le SDK web **ne transporte pas un File/Blob privé du PC** vers Shield. Le lecteur local et le guide de diffusion d’onglet ci-dessous restent nécessaires pour ces fichiers dans le périmètre extension seule confirmé. Aucun relais LAN, compagnon, upload privé ou backend de combinaison n’a été ajouté. Le lecteur public Vidow fourni a été inspecté comme référence d’interface et d’appels SDK ; son service privé et sa capacité d’envoi de fichiers locaux ne sont pas validés.

Sources : [guide SDK officiel](https://developers.google.com/cast/docs/web_sender/integrate), [formats et CORS](https://developers.google.com/cast/docs/media), [exemple Google CastVideos-chrome](https://github.com/googlecast/CastVideos-chrome), [intégration videojs-chromecast](https://github.com/silvermine/videojs-chromecast). Code Alcydeo original ; aucun code tiers repris.

## Caster une vidéo téléchargée

1. Ouvrir **Diffusion TV → Fichier du PC**, ou le raccourci Caster d’un téléchargement dans la petite fenêtre. Choisir le fichier s’il n’est pas déjà disponible.
2. Si nécessaire, cliquer **Préparer le fichier pour Cast**. Chrome demande l’accès facultatif aux fichiers. Si sa case **Autoriser l’accès aux URL de fichier** est désactivée, Alcydeo ouvre les détails de l’extension pour que l’utilisateur l’active, puis rouvre le lecteur depuis sa fiche. L’extension ne peut pas cocher cette option à sa place.
3. Un téléchargement Chrome achevé, existant et déjà identifié est réutilisé. La sélection de fichier affiche les téléchargements Chrome correspondants et propose un champ de chemin absolu pour utiliser l’original. Sans chemin exploitable, une sélection File ou une copie OPFS propose explicitement **Enregistrer sous** pour créer une copie locale ; l’original reste intact. Prévoir l’espace disque correspondant à cette copie. Une copie achevée peut être réutilisée par sa fiche ; aucune recherche dans les dossiers n’est effectuée.
4. Pour un récepteur compatible, la préparation peut ouvrir le sélecteur si le fichier est prêt et le geste encore actif. Après une préparation longue, cliquer **Caster** sur le lecteur pour déclencher le vrai sélecteur avec un nouveau geste. Choisir la TV. Le bouton **Caster** du lecteur reste disponible pour rouvrir le sélecteur. Garder le lecteur ouvert. Les contrôles vidéo restent ceux du lecteur ; **Changer de TV / déconnecter** rouvre le contrôle natif de Chrome.

Le bouton appelle `HTMLMediaElement.remote.prompt()` directement dans le geste utilisateur. Il ne se contente pas d’afficher des instructions. La source du lecteur est alors une URL `file:` issue d’un téléchargement Chrome vérifié, et non une URL Blob transmise à un récepteur HTTP. Chrome assure la découverte, la sélection et le transport média ; aucun relais, serveur localhost, SDK distant, compagnon ou récepteur personnalisé n’est ajouté.

**Limites Chrome 156 :** la vidéo doit être lisible et durer **plus de 15 secondes** pour ce parcours. Les métadonnées du fichier doivent être chargées. Le sélecteur est appelé directement au clic, sans attendre une promesse de lecture qui pourrait rester bloquée dans un onglet masqué. Les codecs et le récepteur doivent rester compatibles ; le décodage sur le PC ne prouve pas la réception sur la TV. Pour les clips courts ou un récepteur incompatible, le guide secondaire explique la diffusion manuelle de l’onglet.

L’état **Récepteur connecté** vient de l’état et des événements natifs RemotePlayback. La lecture locale et la résolution de la promesse de sélection ne suffisent pas. Les annulations, refus et absences de récepteur produisent un message traduit, sans exposer le chemin complet dans un diagnostic. Dans le laboratoire sans TV, l’appel natif reste une erreur visible et n’invente aucune connexion.

## Vidéo détectée sur une page

Lorsque le lecteur web configuré est indisponible ou inadapté, le bouton **Caster** de la popup crée un contrôleur persistant en arrière-plan et lui transmet le geste utilisateur par une messagerie Chrome avec jeton aléatoire. Le contrôleur appelle le sélecteur si le geste utilisateur est toujours actif. Après une préparation lente, il devient visible et demande un nouveau clic Cast ; aucun prompt sans geste valide n’est lancé. Une erreur active le contrôleur pour la rendre visible. Le même raccourci existe sur les résultats de Bibliothèque. Pour une source directe, il transmet le lien complet ; pour HLS/DASH non chiffré, le manifeste complet. Le récepteur doit accéder à cette URL et comprendre son format. Les cookies, mots de passe et en-têtes de session ne sont pas relayés. Le contrôle de source sur le PC ne prouve pas cet accès depuis la TV.

Ce contrôleur utilise l’API Presentation, le récepteur média par défaut `CC1AD845` et un pont de messages TypeScript original fondé sur Chromium 156. Il ne s’agit pas du SDK Google : ces conventions doivent être revalidées lors des mises à jour Chrome. Les commandes LOAD/PLAY/PAUSE et MEDIA_STATUS sont vérifiées ; une route ou un acquittement vide ne signifie pas une lecture confirmée. Ce parcours conserve sa validation matérielle en attente.

## Fichiers et confidentialité

L’hôte `file:///*` est facultatif, distinct de l’accès HTTP/HTTPS nécessaire à la détection. L’autorisation Chrome demeure révocable. Aucun content script n’est injecté sur les fichiers ; aucune analyse de dossiers n’est ajoutée. Les chemins relatifs, partages réseau, segments de traversée et caractères de contrôle sont refusés. Les fichiers ne sont jamais hébergés ou envoyés à un serveur Alcydeo pour Cast.

Une copie demandée explicitement passe par le gestionnaire de téléchargements Chrome, avec Enregistrer sous. Le Blob reste disponible jusqu’à la fin de l’écriture. Fermer/remplacer le lecteur pendant cette préparation annule sa copie en attente et libère les écouteurs et URL temporaires ; cela n’annule pas un autre téléchargement et ne supprime pas l’original ni une copie achevée. Fermer un lecteur actif le met en pause et retire sa source. Le canal natif est géré par Chrome ; aucune terminaison matérielle ou restauration de session après fermeture de Chrome n’est promise.

La révocation de l’accès fichier retire le lecteur natif actif et affiche l’explication de permission ; les fichiers enregistrés restent sur disque. Une copie Cast garde un identifiant de téléchargement distinct de celui de l’original.

## Validation et appareils

Chrome for Testing 156.0.8078.80 sur Linux/WSL2 valide réellement la lecture de fichiers enregistrés, la demande d’autorisation, les copies identiques à l’entrée, les dix langues et le clic sur le bouton natif. Les tests de messages Cast et de transitions d’un récepteur simulé sont identifiés séparément. Une capture graphique précédente prouve l’ouverture des contrôles Chrome pour le lien direct ; elle ne prouve aucune découverte de Shield.

**Aucun récepteur physique n’est disponible dans le laboratoire.** Le nouvel essai utilisateur63 confirme uniquement la démonstration officielle Google du lecteur web sur Shield ; le menu Chrome était déjà confirmé. La réception d’un fichier du PC reste à valider sur cet appareil. Les essais natifs automatisés vérifient le clic et la présence du geste, pas la réception matérielle. L’extension ne modifie pas les flags de son navigateur pour tenter de forcer une connexion.

## Replis et AirPlay

Pour diffuser l’onglet : **⋮ Chrome → Caster, enregistrer et partager → Caster… → Sources → Caster l’onglet**, puis la TV. Le bouton secondaire du lecteur affiche ces étapes ; seul le bouton principal Caster appelle l’API native.

AirPlay reste distinct et indisponible sur la cible Chrome Windows. La page web 0.1.26 et le lecteur 0.1.28 sont historiques ; aucune publication externe n’a été déclenchée.

## Sources primaires, consultées le 3 novembre 2026

- [Remote Playback API](https://www.w3.org/TR/remote-playback/), [Chrome : contrôle de l’accès aux URL de fichiers](https://developer.chrome.com/docs/extensions/reference/api/extension#method-isAllowedFileSchemeAccess), [permissions facultatives et autorisation des fichiers](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions).
- [Chromium 156 : éligibilité HTTP/HTTPS/file du pipeline natif](https://github.com/chromium/chromium/blob/156.0.8078.80/media/remoting/renderer_controller.cc), [seuil natif de 15 secondes](https://github.com/chromium/chromium/blob/156.0.8078.80/media/base/remoting_constants.h), [RemotePlayback côté Blink](https://github.com/chromium/chromium/blob/156.0.8078.80/third_party/blink/renderer/modules/remoteplayback/remote_playback.cc).
- [Presentation API](https://www.w3.org/TR/presentation-api/), [Chromium : sources Cast](https://github.com/chromium/chromium/blob/156.0.8078.80/components/media_router/common/providers/cast/cast_media_source.cc), [messages Cast](https://developers.google.com/cast/docs/media/messages).
- [Chrome : diffusion d’onglet et fichiers du PC](https://support.google.com/chrome/answer/3228332), [Nvidia Shield](https://www.nvidia.com/en-eu/shield/support/shield-tv/).


## 0.1.31 — chargement et reprise

Chaque chargement initial et chaque nouvel épisode BUFFERING après lecture possède une échéance de 20 s. Les messages BUFFERING répétés ne prolongent pas ce délai. Le contrôleur demande GET_STATUS pendant l’attente (au plus un toutes les 2 s) ; il ne relance pas LOAD automatiquement. Après expiration/refus, les statuts tardifs ne remettent plus l’interface en chargement. La route peut rester connectée pour permettre une relance explicite ou une déconnexion.

Réessayer relit la source courante déjà détectée, rematche sa qualité, vérifie ses droits/échantillon puis charge cette source sur la route existante. Aucun paramètre de signature n’est fabriqué. Si l’identité de la source a disparu, revenir au lecteur d’origine et choisir à nouveau la vidéo. Une URL lisible depuis le PC peut toujours être inaccessible à la TV, par exemple à cause d’une session privée ou d’un format non compris ; le timeout ne corrige pas ces limites du récepteur.

Le cas « SHIELD charge en boucle » est reproduit avec un récepteur simulé qui renvoie BUFFERING continuellement. L’échéance, les messages tardifs, le nombre de LOAD et une relance avec URL observée renouvelée sont contrôlés dans Chrome. Cela ne constitue pas un test sur une Shield physique. Sources : [statuts, BUFFERING et GET_STATUS officiels](https://developers.google.com/cast/docs/media/messages).

## Pourquoi la Shield peut manquer au sélecteur de fichiers — 0.1.59

Dans le code primaire de **Chrome156.0.8078.76**, le prédicat de découverte RemotePlayback accepte les modèles commençant par Chromecast ou Eureka Dongle et le nom exact Google TV Streamer. Les chaînes SHIELD/SHIELD Android TV/NVIDIA SHIELD ne correspondent pas. Le nom mDNS exact du matériel de l’utilisateur n’a pas été observé : le lien avec son échec reste une inférence documentée, tandis que la restriction de l’API est vérifiée. Le sélecteur ouvert par cette API ne propose un repli TAB_MIRROR que pour des récepteurs audio, pas pour les TV. La Shield peut donc fonctionner depuis le menu Chrome et pour un lien vidéo via Default Media Receiver sans apparaître pour un fichier local.

Sources épinglées : [filtre des modèles](https://github.com/chromium/chromium/blob/93ce6b54af3fee27e384d1f30346e80db47a14da/media/remoting/device_capability_checker.cc), [filtre du sélecteur](https://github.com/chromium/chromium/blob/93ce6b54af3fee27e384d1f30346e80db47a14da/chrome/browser/ui/global_media_controls/cast_device_list_host.cc), [recherche expurgée](benchmarks/local-cast-research-0.1.59.json). Les anciens liens internes chrome://cast et chrome://media-router ne fournissent pas de sélecteur. Les URN de mirroring internes ne sont pas des URL PresentationRequest publiques ; les applications Cast Streaming via Presentation sont limitées par origine. Aucun faux récepteur vide ni contournement d’origine ne remplace le transport.

Pour Shield, le parcours conservé est : choisir le fichier, le lire dans Alcydeo, puis **⋮ Chrome → Caster, enregistrer et partager → Caster… → Sources → Caster l’onglet → Shield**. La prévisualisation Blob n’exige ni seconde copie sur disque ni envoi à un hébergeur. Un véritable transport autonome vers ce matériel exigerait une autre architecture, hors des choix confirmés ; aucun relais LAN, compagnon, upload privé ou déploiement de récepteur n’est ajouté.

Les correctifs locaux distincts réutilisent un téléchargement Chrome valide avant OPFS et essaient les identifiants alternatifs, évitant une copie redondante si le temporaire ou une ancienne copie Cast a disparu. Choisir un autre fichier détache l’ancienne tâche ; une copie de B ne remplace plus la référence Cast de A. Une erreur de fichier du raccourci active son contrôleur persistant et ne reste pas cachée derrière la popup. Les limites de modèles, codecs et réception matérielle restent distinctes de ces corrections.

## Diagnostic et guide du lecteur — 0.1.62

La limite des récepteurs et le guide **Comment caster ce lecteur** appartiennent désormais au lecteur de fichier lui-même, y compris lorsqu’il est ouvert par un raccourci. Ils restent accessibles avant de choisir ou préparer un fichier : pour Shield, lire le fichier puis diffuser l’onglet ne nécessite pas de préparer une seconde copie. Les précisions AirPlay et les limites de validation matérielle restent consultables dans **Détails techniques**.

Le message d’échec indique seulement que Chrome n’a pas pu communiquer avec le récepteur. Il ne prétend plus que le sélecteur s’est ouvert puis refermé : dans Chromium156, une URL de présentation native absente peut produire le même `NotAllowedError` qu’une demande de sélection annulée. Un `AbortError` peut signaler une connexion échouée. Une promesse résolue avec l’état natif `disconnected` ne confirme toujours aucune connexion. Le bouton appelle l’API directement dans le geste utilisateur, sans relance automatique ; ces diagnostics ne lèvent pas le filtre de modèles ni les contraintes de codecs. Voir le [chemin natif de Chrome156.0.8078.76](https://github.com/chromium/chromium/blob/93ce6b54af3fee27e384d1f30346e80db47a14da/third_party/blink/renderer/modules/remoteplayback/remote_playback.cc).

Choix utilisateur confirmé le 8 novembre 2026 : « Conserver l’extension seule ». Aucun relais/compagnon ajouté ; conserver le parcours de diffusion d’onglet Chrome pour les fichiers vers Shield.
