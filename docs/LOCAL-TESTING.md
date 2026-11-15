# Public packages 1.0.0

Download the Chrome ZIP from [GitHub Releases](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0), extract it and use chrome://extensions → Developer mode → Load unpacked. For an existing local install, replace its files and reload the same directory to keep its extension identity and library. No ZIP is an official Store installation.

The Chrome development ZIP includes local YouTube experiments. The separately named Chrome Store preparation and Firefox package omit all YouTube catalog/transport/playlist features. Keep the original page and manager open for contextual/segmented transports that use them; closing the popup is safe. Keep the original files when trying editing tools.

Firefox has its own ZIP: load it with about:debugging → This Firefox → Load Temporary Add-on. It is removed when Firefox restarts; no signed XPI or permanent install is claimed. Chrome tab capture and Cast APIs are unavailable. See [the Firefox versions, tests and codec limits](FIREFOX.md).

Fresh/reset settings use four simultaneous files and multipart enabled at four connections per compatible file. Existing choices are retained. Detection diagnostics now live in Library → Settings → Detection, with an explicit source-tab choice and safe report copy.

Pages uses the exact /Alcydeo/ path. The official SDK player is a separate web page; it never loads remote executable code into the extension. A source must be accessible to the receiver. Actual TikTok/private-PC playback on Shield is not established by a successful SDK load or test fixture. See [TV](TV.md) and [release validation](TEST-RESULTS.md).

The older local laboratory instructions remain below as historical context; their0.1.xfolder names andlocalhost URLs are not the public download destination.

# Essais locaux — Windows Chrome 156

La cible utilisateur est Chrome **156.0.8078.76**, Windows 64 bits. Les résultats Linux automatisés sont séparés dans TEST-RESULTS.md.

Pour essayer le binaire déjà préparé, extrayez `artifacts/alcydeo-0.1.65-chrome.zip` dans un dossier Windows et chargez ce dossier avec le mode développeur. Node/pnpm ne servent qu’à reconstruire le projet. Après une mise à jour du même dossier, cliquez sur « Actualiser » dans chrome://extensions.

Cast0.1.65 : recharger l’extension existante, fermer les anciens lecteurs, actualiser la page vidéo puis cliquer Cast dans la popup. Le nouveau lecteur doit afficher65 et l’icône Cast directement dans sa barre vidéo ; cliquer cette icône puis choisir la Shield. Ce clic passe par le SDK officiel du lecteur web, pas par le guide du menu Chrome. Un aperçu déjà terminé ne doit pas envoyer sa position finale à la TV.

Dans Bibliothèque, le bouton Cast se trouve à côté du favori. Un téléchargement original dont la source est encore détectée dans son onglet ouvre le même lecteur, avec la mention Source d’origine du téléchargement. Une vidéo transformée ou dont la source a disparu ouvre le lecteur local ; elle n’est jamais remplacée par sa source avant modification. Ce parcours ne fournit toujours pas de transport privé direct du PC à la Shield. Vérifier image ET son sur le matériel : aucun test automatisé du laboratoire n’a de Shield physique.

Cast0.1.64 : recharger l’extension existante puis fermer les anciens lecteurs TV, actualiser la page TikTok et rouvrir le lecteur. La page web affiche64et le diagnostic porte build=0.1.64. Une sélection annulée ne doit ni masquer l’erreur vidéo précédente, ni relancer LOAD, ni réarmer son délai. Sans récepteur, annuler reste neutre. Utiliser le retour au lecteur d’origine si disponible pour diffuser l’onglet.

Fichier enregistré : après le premier échec natif, le guide complet prend le focus ; son bouton indique explicitement étapes Chrome. Son ouverture n’appelle aucun sélecteur et ne crée aucune copie. Le bouton secondaire Cast natif reste réservé aux appareils compatibles. Le périmètre extension seule ne fournit toujours pas de transport direct du fichier privé vers Shield.

Cloud0.1.63 : les cinq icônes et Envoyer sont dans un seul formulaire compact ; les informations des services se déplient au besoin. « Nettoyer les copies » supprime uniquement les copies temporaires Cloud ; les fiches d’historique et les liens restent présents. Une erreur ou un succès apparaît près du bouton. Les originaux et les fichiers de Bibliothèque sont conservés.

Cast0.1.63 : le ZIP local utilise le lecteur de développement http://localhost:4180/alcydeo/cast/ tant que cet aperçu tourne. Depuis une source réseau détectée et contrôlée, le bouton Cast de la popup ouvre le lecteur ; cliquer « Choisir une TV », puis choisir la Shield. Le contrôle de lecture attend un vrai statut média. Si le lecteur de développement est indisponible, l’ancien contrôleur natif reste utilisé. Le build Store ne dépend pas de localhost et n’a pas d’URL de lecteur web tant que Pages n’est pas publiée. Pour lancer soi-même l’aperçu : `pnpm docs:build`, puis `pnpm docs:preview --host 127.0.0.1 --port 4180` ; respecter le chemin /alcydeo/cast/.

Pour reconstruire ce build de test sous Bash : `ALCYDEO_CAST_SENDER_URL=http://localhost:4180/alcydeo/cast/ pnpm build:chrome`, puis conserver la même variable pour `pnpm zip:chrome`. Sans variable, le build de développement garde sa configuration par défaut vide. Une future configuration HTTPS pour https://drslid.github.io/alcydeo/cast/ doit suivre une publication autorisée et vérifiée ; elle n’est pas activée automatiquement par la préparation actuelle.

L’utilisateur a confirmé la lecture sur Shield de la démonstration officielle Google Chromecast Ultra37s. Un premier média W3C échouait ; les URL de la source doivent rester accessibles au récepteur. En cas d’échec, « Détails techniques → Copier le rapport » permet une copie explicite des seuls codes/compteurs, sans URL/titre/cookie/jeton. Les fichiers privés du PC conservent le lecteur local et le menu Chrome Caster l’onglet pour Shield, sans relais ni upload.

Si TikTok reste absent en 0.1.53 : ouvrir « Diagnostic de détection » dans la popup, attendre le rapport puis « Copier le rapport ». Coller le texte dans la conversation. Le rapport est visible avant copie et ne contient ni URL, ni signature, ni cookie, ni titre ou identifiant du post. Aucun envoi automatique. Les correctifs 53 sont validés sur des médias originaux de test ; la cause de la session personnelle reste à confirmer.

Bibliothèque 0.1.54 : vérifier les six icônes par fichier, dans l’ordre Découper, Recadrer, Assembler, Convertir, Compresser et Afficher dans le dossier. Survoler pour lire les noms. Assembler précharge le fichier accessible ; ajouter un second clip doit conserver le premier. Pour supprimer ou envoyer au Cloud, utiliser les cases de sélection. Les tâches actives gardent leurs commandes de reprise/arrêt.

Cloud 0.1.55 : cocher un ou plusieurs fichiers dans la Bibliothèque puis cliquer Cloud. La page des fournisseurs doit apparaître directement, sans dialogue Fichiers sélectionnés. Les fichiers accessibles se chargent automatiquement ; choisir les copies manquantes sur cette même page. Choisir un fournisseur puis Envoyer. Recharger le gestionnaire efface cette sélection temporaire ; les envois déjà préparés restent persistants.

1fichier0.1.56 : les familles de serveurs upN et ru-N sont acceptées. Une initialisation refusée doit afficher une phrase traduite, sans code brut. Pour une tâche neuve dont aucun corps n’a été tenté, ne pas montrer l’avertissement de doublon ; une ancienne tentative incertaine ou sans preuve conserve cet avertissement. Les vérifications du laboratoire utilisent une initialisation réelle sans fichier et des transferts interceptés.

Cloud0.1.57 : sélectionner un petit fichier personnel puis « Envoyer sur tous les clouds sans configuration ». Quatre fiches doivent apparaître pour Gofile, MegaUp, 1fichier et Turbobit ; pCloud garde son dépôt individuel. Un échec ou un plafond sur une destination ne doit pas bloquer les autres. Chaque reprise réseau se fait depuis sa fiche. Si une copie locale échoue pendant la préparation, le bouton ne recrée que les destinations encore manquantes. Garder le gestionnaire ouvert.

Turbobit0.1.57 : rouvrir Cloud pour réparer les liens précédents qui omettaient .html, puis utiliser le lien de la fiche ; aucun nouveau transfert n’est nécessaire. Le format correct est https://torbobit.net/<id>.html. La correction du lien ne constitue pas une relecture indépendante du fichier chez le fournisseur.

Cloud0.1.58 : cliquer « Supprimer les fichiers temporaires » sous le formulaire Cloud. Les copies Cloud en attente et orphelines disparaissent, les envois en attente sont annulés ; les originaux, la Bibliothèque et les liens de partage restent présents. Une préparation ou un transfert en cours dans un gestionnaire protège ses fichiers : attendre sa fin ou l’annuler puis réessayer. Un envoi nettoyé exige de choisir à nouveau l’original. Si certaines suppressions échouent, réessayer le nettoyage ; aucun appel distant n’est déclenché.

TV0.1.59 : pour Nvidia Shield, choisir le fichier puis lire la vidéo dans Alcydeo et utiliser le menu Chrome Caster l’onglet. Le bouton natif de fichier concerne les modèles RemotePlayback compatibles de Chrome ; les noms Shield sont filtrés dans156. Pour ces récepteurs compatibles, contrôler que le bouton appelle directement la sélection sans attendre la lecture. Un téléchargement original encore présent doit être réutilisé malgré un OPFS/ancien Cast disparu. Ouvrir la tâche A puis choisir B ne doit pas modifier sa référence Cast. Une copie longue peut exiger un nouveau clic sur Caster. Le laboratoire n’a pas de récepteur physique.

Téléchargements 0.1.60 : dans Réglages, choisir « Fichiers en parallèle » de 1 à 8 et enregistrer. Ce réglage est indépendant de « Connexions par fichier » 2/4/8 dans les téléchargements en plusieurs parties. Essayer quelques fichiers personnels : le surplus reste en attente ; plusieurs gestionnaires n’augmentent pas le plafond. Baisser la limite laisse finir les actifs. Les conversions restent une par une. Pour un essai contrôlé, voir DOWNLOAD-CONCURRENCY.md et TEST-RESULTS.md.

La détection et le compteur sont actifs en standard dès l’installation ; aucun bouton d’activation supplémentaire n’est nécessaire. L’accès HTTP/HTTPS est déclaré dans le manifeste. Rechargez les pages vidéo déjà ouvertes après la mise à jour. Vous pouvez suspendre la détection dans Alcydeo ou restreindre les sites dans Chrome. La première mise à jour vers 0.1.3 applique ce défaut une fois en préservant les autres réglages ; les suspensions choisies ensuite restent mémorisées.

Même si tous les sites sont restreints dans Chrome, aucune erreur « You need to request host permissions… » ne doit apparaître. Effacez les anciennes erreurs avant de recharger l’extension pour contrôler les nouvelles entrées. Chrome peut demander d’accepter l’accès aux sites lors de la mise à jour ; ce consentement natif ne peut pas être accordé par Alcydeo.

1. Utiliser Node 24.22.2 et pnpm 12.5.1, puis `pnpm install --frozen-lockfile` et `pnpm build:chrome`.
2. Ouvrir `chrome://extensions`, activer le mode développeur et charger `apps/extension/.output/chrome-mv3`. Vérifier l’absence d’erreurs de manifeste/service worker.
3. Lancer `node scripts/fixture-server.mjs`, ouvrir `http://127.0.0.1:4179/`, attendre l’affichage de la vidéo et cliquer sur l’icône Alcydeo. Le compteur doit se remplir avant ce clic, sans autre activation.
4. Choisir la qualité 180p et télécharger. Vérifier que le téléchargement est terminé, puis utiliser « Afficher dans le dossier » pour retrouver le fichier et le lire. Aucune sélection pour vérification manuelle n’est demandée. Le nom et le dossier proviennent des réglages et de Chrome.
5. Pour HLS TS, HLS audio séparé et DASH, rechercher les qualités puis télécharger ; vérifier les réglages de Chrome uniquement si l’accès y a été restreint. Garder le gestionnaire ouvert. Vérifier le son, le début et la fin de chaque fichier dans Chrome et dans un lecteur déjà disponible sur Windows.
6. Avec `lifecycle.html`, suspendre/reprendre, ouvrir deux gestionnaires puis annuler une nouvelle tâche. Fermer la popup pendant un téléchargement. Fermer le gestionnaire pendant le traitement ; le rouvrir et attendre au maximum l’expiration du bail de 30 secondes pour retrouver l’état suspendu. Reprendre si la source est toujours valide.
7. Restreindre l’accès à « Au clic » dans Chrome, puis à des sites précis ; vérifier l’arrêt puis la reprise de la détection selon les autorisations. Il ne doit plus y avoir de commande de validation de domaines dans Alcydeo. Les choix d’accès se font dans les réglages de Chrome.
8. Avec `errors.html`, confirmer le refus du manifeste chiffré sans requête de clé et le diagnostic du segment absent. Vérifier l’effacement d’une fiche, des fragments et des métadonnées exportées.
9. Vérifier les thèmes clair/sombre/système, le clavier, le focus, la hauteur réelle de la popup et les dix langues de l’interface Chrome. Arabe/ourdou doivent être RTL ; URL et résolutions restent isolées en LTR.

Le CRX3 `artifacts/alcydeo-0.1.51-local-test.crx` est produit par `pnpm crx:chrome`. Chrome Windows peut bloquer une installation CRX externe selon ses règles ; sa production n’est pas une preuve d’installation. Le parcours local fiable est le chargement non empaqueté. La clé de test reste dans `artifacts/`, ignorée par Git. Ne pas la publier ni la traiter comme une clé Store.

Le ZIP local est `artifacts/alcydeo-0.1.51-chrome.zip`. Le paquet distinct de préparation Store est `artifacts/alcydeo-store-0.1.51-chrome.zip`, sans le transport YouTube expérimental. Rien n’est envoyé à GitHub ou Google par ces commandes. Noter séparément les essais réellement effectués sur Windows, les versions, les erreurs et les fichiers obtenus.

Avec grouping.html, les deux liens de qualité de la même vidéo doivent former une fiche (404p/180p), tandis que l’autre vidéo de titre identique reste distincte. Sélectionnez 180p, relancez l’analyse et contrôlez que la sélection reste inchangée. Avec grouped-hls.html, le master et ses playlists deviennent une seule fiche à deux qualités ; le fichier obtenu en choisissant 180p doit réellement mesurer 180 pixels de haut.

## 0.1.51 — découpe précise et diagnostic des sources

Fermer les gestionnaires Alcydeo déjà ouverts, recharger l’extension dans `chrome://extensions`, vérifier **0.1.51** en bas de la popup puis actualiser les pages vidéo. Cela évite de garder un ancien document ouvert pendant un changement des fichiers du build.

Dans Outils vidéo → Découper, importer la mire originale ou une vidéo locale autorisée. Les champs Début/Fin sont visibles près du lecteur : essayer `1.125` et `0:03.875`, ou `1,125`. Les poignées doivent suivre ; les saisies provisoires restent modifiables et l’export reste désactivé pour une valeur incomplète, inversée ou hors durée. Un export valide conserve l’original et donne un fichier `-trimmed.mp4`. Les temps saisis acceptent la milliseconde ; les images/échantillons du codec déterminent la précision réelle de sortie.

Sur TikTok, garder le post exact et son lecteur ouverts pour le transfert contextualisé. En cas d’absence de proposition, noter la version affichée et si le lecteur natif démarre : les essais Windows/Linux isolés ne reproduisent pas forcément une session connectée ou une restriction réelle. Sur Odysee, un message d’attente serveur ne devient pas une annulation volontaire ; respecter l’attente et reprendre explicitement quand la source revient. Voir ODYSEE.md pour les résultats par qualité, sans garantie de disponibilité future.

## 0.1.50 — propositions contrôlées, dimensions et tailles

1. Fermer les anciens gestionnaires, recharger Alcydeo dans `chrome://extensions`, vérifier **0.1.50**, puis actualiser la page vidéo et démarrer son lecteur natif. Laisser d’abord la popup fermée : les contrôles commencent en arrière-plan, avec deux sources au maximum simultanément. Le compteur et les propositions ordinaires ne doivent contenir que les sources contrôlées ; aucun candidat provisoire HTML, trop petit ou refusé ne doit être proposé.
2. Ouvrir la popup pendant l’analyse pour voir l’état global de vérification. Une source incertaine reste masquée ; **Analyser la page** permet de la retenter. Une taille inconnue est différente : une source accessible peut rester proposée avec « Taille inconnue ».
3. Choisir une qualité et vérifier les dimensions largeur×hauteur lorsqu’elles sont disponibles. Sans ces métadonnées, le libellé annoncé par le manifeste peut rester affiché. Le total HTTP d’un fichier direct décrit sa taille source ; **≈** signale une estimation ou les octets d’entrée d’un futur assemblage, sans promettre le poids exact du MP4. Un init HLS/DASH ne doit pas devenir la taille de la vidéo entière.
4. Télécharger une seule qualité en mode automatique, retrouver 100 % puis **Afficher dans le dossier**, et lire le résultat. Une copie native termine sur confirmation Chrome ; aucune sélection de vérification manuelle n’est requise. Une annulation du dialogue Enregistrer sous conserve sa reprise explicite.

Les observations publiques du laboratoire utilisent Chrome graphique 156 sur Linux, dans des profils isolés avec uBlock Origin Lite officiel 2026.1103.1743, mode Complete et six listes par défaut. Elles ne remplacent pas un essai dans le profil Windows de l’utilisateur.

| Page | Preuve enregistrée et portée |
| --- | --- |
| Instagram, Reel fourni | Un build intermédiaire **50** a enregistré une seule copie de **21 929 838 octets**, entièrement décodée en AVC/AAC, **720×1280**. Le contrôle de métadonnées ultérieur en 50 retrouve une fiche et le compteur 1, sans nouvel export. Les recommandations ne sont pas des propositions. |
| TikTok, nouveau post fourni | Le fichier complet de **2 683 229 octets** a été enregistré et décodé avec **49**, en AVC/AAC, **576×1024**. Les vérifications **50** portent sur les cinq variantes, leurs préfixes et la lecture native, sans nouveau téléchargement complet. |
| Odysee, page fournie | Le lecteur **49** expose quatre qualités HLS contrôlées : 1080p, 720p, 360p et 144p. Preuves de manifestes, préfixes et lecture uniquement ; aucune sortie complète assemblée ou décodée n’est validée. Des réponses 429 ont été observées. |

Garder le gestionnaire ouvert pour HLS/DASH et les transferts contextualisés TikTok ; garder aussi TikTok sur le post sélectionné. Les restrictions Chrome, la liste noire, les refus d’accès et les challenges restent appliqués. Fermer Chrome arrête les traitements ; une URL expirée demande une source fraîche. YouTube SABR local, playlists et capture restent des parcours distincts, sans fausse preuve de préfixe HTTP ; le build Store exclut YouTube. Voir [contrôles et limites](SOURCE-CHECKS.md), [Instagram](INSTAGRAM.md), [TikTok](TIKTOK.md) et [bilan public](benchmarks/platforms-public-0.1.50.json).

## 0.1.11 local and Store builds

The normal build/ZIP/CRX is the experimental local distribution. Reload Alcydeo from `chrome://extensions`, then reload the video page and start its normal player. YouTube can display available qualities before a usable stream context arrives; Download stays disabled while that context or initial playback is missing. A source refusal is shown explicitly and never converted into a successful partial file. Keep the manager open for assembly. An interrupted SABR download restarts from the beginning.

`pnpm zip:store` compiles into `apps/extension/.output-store/chrome-mv3` and writes `artifacts/alcydeo-store-0.1.11-chrome.zip`. It excludes YouTube transport code and keeps its host rejection. Do not upload the experimental local ZIP as the Store artifact. Neither command publishes anything. Real Windows Chrome/CRX installation remains a manual check.

`tests/e2e/youtube.spec.ts` routes an original six-second fixture through a synthetic player catalog and UMP responses, including a source-refusal case. Its successful output is deliberately distinguished from the real YouTube access reports. No real YouTube attestation challenge is implemented by that fixture or product.

## 0.1.49 — Sources HLS complètes et sites fournis

Pour tester les lecteurs de sites publics, utiliser un bloqueur officiel dans un profil Chrome isolé et noter sa version, son mode et ses listes. La reprise French-stream avec uBlock Origin Lite 2026.1103.1743 en mode Complete confirme une proposition Vidzy 360p avec audio séparé et une proposition Voe 720p, après lecture réelle. L’ancien essai sans bloqueur était arrêté avant le chargement du film. Le bloqueur reste un outil de test distinct, absent des paquets Alcydeo. [Conditions et résultats](DETECTION-SITES.md).

Recharger le même dossier d’extension dans `chrome://extensions`, vérifier **0.1.49**, puis actualiser les pages vidéo déjà ouvertes. Sur Apocalypse Z, ouvrir le lecteur Vidzy normalement : les manifestes/pistes correspondants doivent former une seule proposition vidéo avec son audio, et la qualité choisie doit rester après une nouvelle analyse. Les pistes d’une autre langue ne doivent pas remplacer l’audio choisi. Garder le gestionnaire ouvert pendant l’assemblage.

Voir [le bilan des six pages](DETECTION-SITES.md) : certaines fonctionnent déjà lorsque leur lecteur natif démarre ; une erreur de lecteur ou une publicité qui empêche son ouverture ne prouve pas un défaut de détection. Aucun film public complet n’a été téléchargé pour ce lot. La preuve de téléchargement complet utilise une vidéo originale de six secondes avec pistes séparées et enregistrement Chrome automatique. Les refus HTML et les contrôles de taille restent actifs.

## 0.1.12 binary CDN regression

Reload the prepared extension in chrome://extensions, then reload/restart the original player so Chrome exposes a fresh signed media request. An expired ff value copied from Network is not repaired or reused automatically.

The local binary-proxy.html and binary-video.html fixtures serve original six-second media through a PHP proxy, a second CDN redirect and a final application/octet-stream response. Their signed query is fixed synthetic data. The offered download must use the exact final source, produce one card/badge and match the original bytes. HTML/403/embedded-document/HTML-attachment fixtures must be absent. tests/e2e/binary-media.spec.ts exercises those flows, validation and service-worker replacement. The real Webflix film is not the test corpus.

## 0.1.13 multi-part downloads

In Settings, enable Multi-part downloads, choose 2/4/8, then save. The option is off initially; the selected count defaults to 4. Reloading the settings retains the values, and older callers that omit them preserve stored choices. New tasks capture the mode/count; changing settings does not alter a running task. Keep the manager open.

The parts.html fixture and parts-fixture.mjs server exercise exact range identity, native fallback, HTML/incorrect range refusal, pause from a second manager, worker replacement, cancellation and actual manager closure/lease expiry. The optional existing >2 GB original corpus validates the saved file's full SHA-256. The controlled speed case limits each response to 16 KiB every 40 ms; it is not an Internet benchmark.

Chrome rejected a DevTools quota override for this extension origin in the available environment. That browser test is explicitly skipped; the early space-error/handle-close path is unit-tested with a simulated quota. Do not describe this as an actual full-disk test. Native Windows Save As, browser/receiver hardware and an Internet speed gain remain manual/separate checks.

## 0.1.14 cartoon identity

Reload Alcydeo in chrome://extensions and check the version is 0.1.14. The original kingfisher now uses a 1930s Cuphead-inspired drawing with pie-cut eyes and rounded ink outlines, retaining the approved colors and download arrow. The 16/32/48 px toolbar icons use an enlarged face; the UI and 128 px icon show the whole bird. Check the pinned icon against the actual Windows toolbar in light/dark mode. Automated Chrome page captures are recorded separately and do not validate the native Windows toolbar.

## 0.1.15 history and pagination

In Downloads or Library, use **Clear history**. The dialog applies to every page/filter, including favorites; Cancel and Escape leave records untouched. Confirm removes finished, failed and cancelled records and associated temporary directories, including saved native downloads awaiting an optional check. It keeps saved files, Chrome’s own download history, queued/active/paused tasks and live worker leases. Records created after opening the dialog are retained, and resumed tasks are rechecked at deletion time.

With more than 20 matching entries, Previous/Next and a localized page counter appear. Search/favorites apply before paging; changing filters/view returns to page 1. Deleting the last item on the last page returns to the preceding valid page. tests/e2e/history.spec.ts uses explicit synthetic history metadata (not evidence of 105 real media downloads), actual temporary directories, a real saved MP4 and a real resumed native download.

## 0.1.16 local MP4 conversion

In Settings, choose one video to convert. Applicable download records also offer Convert to MP4: select the actual saved original when Chrome downloaded it, or reuse an available manager output. The original is kept. Queue several files individually and verify that only one converts at a time, even across two managers. Keep a manager open; a paused/interrupted conversion restarts from its preserved input after lease recovery. Verify audio, duration and the whole output in a local player. Unsupported tracks must fail without exporting an audio-only or partial MP4. Native Windows file and Save As dialogs remain manual checks.

The conversion fixtures are original synthetic media; regenerate with FFMPEG_FOR_FIXTURES=/path/to/development/ffmpeg node scripts/conversion-fixtures.mjs. Add --long for the ignored 60-second recovery corpus. This development encoder is not part of the extension.

## Nouveautés 0.1.17

1. Réglages : seuil 10 Ko par défaut, alternatives 100 Ko/1 Mo/2 Mo ; saisir un domaine ou une URL dans la liste noire, enregistrer et vérifier la disparition du compteur. Les autres sites restent actifs selon les permissions Chrome. Une taille inconnue n’est pas masquée.
2. Les originaux vidéo/audio demandés sont reconnus. Lancer `ALCYDEO_FIXTURE_FFMPEG=/chemin/vers/ffmpeg pnpm exec node scripts/feature-fixtures.mjs` pour régénérer les dix-neuf conteneurs synthétiques de développement. Ce binaire n’est ni requis ni exécuté par l’extension.
3. Outils vidéo : convertir, compresser, découper ou fusionner les fichiers choisis. La compression ajuste son débit au fichier source, avec un plafond de 1,5 Mb/s vidéo et 720p ; l’interface affiche la taille avant/après. Fusionner des clips avec une disposition audio différente doit donner une erreur explicite, sans MP4 incomplet.
4. Enregistrer : choisir un onglet Chrome, cocher son audio dans le sélecteur puis démarrer. Arrêter et enregistrer doit donner un WebM lisible. Fermer le gestionnaire puis attendre l’expiration de son bail : la partie écrite doit pouvoir être vérifiée et enregistrée. Une nouvelle capture nécessite une nouvelle sélection ; ne pas présenter le fichier récupéré comme une capture complète.
5. Cloud : consulter [CLOUD.md](CLOUD.md). Les tests automatiques interceptent les requêtes du fournisseur ; ils ne réalisent aucun téléversement réel. Les comptes OAuth et le consentement réel sont à configurer et valider séparément. Gofile doit annoncer un lien public avant le clic d’envoi.
6. Aide : avant publication de Pages, le bouton doit afficher l’aide locale après le contrôle de disponibilité. `pnpm zip:pages` construit et archive le site statique sans le publier.

Parcours des ajouts : `pnpm exec playwright test tests/e2e/features.spec.ts tests/e2e/recording.spec.ts tests/e2e/tools-locales.spec.ts` avec le Chrome de test configuré. Les options d’auto-sélection de surface existent uniquement dans les tests, jamais dans le produit. La validation Windows/boîte native de partage et les appareils TV restent distincts des essais Chrome Linux automatisés.


## Gestionnaire 0.1.18

Recharger l’extension puis la page gestionnaire. Vérifier navigation latérale, recherche/favoris, titres longs, actions de fichier, réglages groupés et bouton Enregistrer persistant. Le bouton Ajouter une vidéo réutilise le dialogue local de traitement ; il ne choisit aucun fichier automatiquement. À la première tabulation d’une nouvelle page, Aller au contenu doit être visible et placer le focus sur la zone principale.

Le rail compact à 900 px et la disposition étroite à 390 px doivent conserver les noms accessibles, Aide, les formulaires alignés et les textes sans débordement. Tester les thèmes clair/sombre/système et le RTL arabe/ourdou. Les icônes sont des SVG locaux Material Symbols Rounded ; l’ouverture du gestionnaire ne contacte aucun service de polices Google.

Les captures dédiées au design utilisent des fiches synthétiques pour vérifier états, filtres et disposition. Les tests de médias qui produisent réellement des fichiers restent séparés. Commande : `pnpm exec playwright test tests/e2e/manager-design.spec.ts`.

## 0.1.20 — source checks, names and TV

Open /preflight/page.html in the fixture lab: HTML disguised as MP4, 404, tiny file and bad HLS quality should disappear after small sample checks. The working quality remains; since 0.1.50 an unconfirmed redirect stays internal until a successful check. No native download should appear before a click. The saved working file must equal the original fixture. /preflight/title.html exercises an iframe with a generic title; the actual native saved filename must use the main page title. Refresh detection resets checks. The new TV button opens a persistent manager player; inspect the explicit experimental notice and unavailable AirPlay explanation. A real receiver is required to validate playback.

## 0.1.21 — conversion filenames

Choose a local file such as `Vacances.été.2026.MOV`: conversion must save `Vacances.été.2026-converted.mp4`. Reopen a completed HLS file in Video tools: the input must use its original user-facing filename, not `output.mp4`. Reconvert a result: keep one `-converted` suffix and let Chrome create a unique duplicate, leaving the first file unchanged. Preparing a cloud export must show the same meaningful filename without sending it automatically. Tests use Chrome’s default native download behavior for real filename checks, rather than CDP’s URL/GUID filename overrides.


## 0.1.30 — parcours actuels

Recharger l’extension et fermer les anciennes pages gestionnaire/TV. La version doit être 0.1.30. Choisir une langue par le drapeau et vérifier que les tâches/lecteurs ne sont pas rechargés. Dans Bibliothèque, sélectionner deux fichiers, convertir ou compresser : traitements successifs, noms réels avec suffixe, originaux inchangés. Effacer la sélection supprime seulement les fiches éligibles et données temporaires, jamais les fichiers téléchargés.

Découper : ouvrir la fiche ou le raccourci popup, déplacer les poignées du filmstrip, lire la sélection puis traiter. Assembler : ajouter 2–20 clips et réordonner par glisser/déposer ou boutons. Régler qualité/résolution/audio dans Réglages ; compression et conversion ont des valeurs distinctes.

Pour tester tabCapture, **cliquer réellement sur l’icône Alcydeo dans la barre Chrome** : ouvrir une URL popup comme un onglet ou appeler action.openPopup par automatisation n’accorde pas l’invocation requise par Chrome. Cliquer Capturer cet onglet, dessiner avec le stylo, puis Arrêter et enregistrer depuis la popup ou le gestionnaire. Vérifier le fichier et le retrait de l’overlay. Le sélecteur manuel de surface du gestionnaire reste disponible.

Pour pCloud, utiliser un lien de dépôt existant ; le format e.pcloud.com choisit EU. Préparer plusieurs fichiers n’envoie rien avant le bouton de dépôt. Drive/OneDrive ne sont plus proposés. Les simulations d’API ne remplacent pas un essai réel chez le fournisseur.

Pour PC-file Cast, réutiliser un téléchargement connu ou renseigner le chemin absolu de l’original ; à défaut une copie Enregistrer sous est annoncée. Autoriser l’accès fichier si Chrome le demande. La préparation appelle le sélecteur natif quand la vidéo est éligible (>15 s dans Chrome 156). Les tests natifs sans TV attendent une erreur visible, jamais une fausse connexion. La Shield doit être vérifiée sur le PC Windows.

## Enregistrement disque — 0.1.32

Recharger l’extension et fermer les anciens gestionnaires avant l’essai. En mode automatique, cliquer une seule fois Télécharger depuis la popup : attendre Enregistré/100 %, puis Afficher dans le dossier. Le fichier doit exister dans le sous-dossier choisi. Avant la fin de l’écriture Chrome, la préparation vérifiée reste à 99 % avec Enregistrement du fichier. En mode Enregistrer sous, annuler une fois : la fenêtre ne doit pas revenir seule. Enregistrer le fichier reprend la sauvegarde du temporaire existant, sans relire la source. Une invocation Chrome interrompue sans confirmation reste explicite : vérifier ses téléchargements ou le dialogue ouvert avant de réessayer.

## 0.1.33 — partage MegaUp expérimental

Recharger Alcydeo et vérifier 0.1.33. Dans Cloud, choisir l’icône MegaUp puis un petit fichier personnel de test. Aucun envoi ne doit commencer avant **Partager avec MegaUp**. L’envoi conserve le nom, affiche les octets confirmés par morceaux d’au plus 8 Mio, puis propose uniquement le lien confirmé par le fournisseur. Le formulaire annonce actuellement une limite de 5 Gio ; une limite plus basse annoncée ensuite est respectée.

L’intégration utilise le formulaire public anonyme, sans script distant, sans compte connecté et sans redirection d’envoi. Elle reste expérimentale : les tests réseau sont interceptés et aucun fichier n’a encore été envoyé au vrai MegaUp par le laboratoire. Les fichiers déposés sont publics ; la FAQ annonce une suppression après 30 jours d’inactivité. Garder l’original. Annuler coupe l’envoi local sans promettre d’effacer les morceaux distants. Reprendre repart du début avec une nouvelle configuration et peut créer un doublon après une réponse finale perdue. **Ouvrir MegaUp** permet le parcours direct du site si le formulaire change ou refuse l’envoi.

Gofile et pCloud restent disponibles. Les contrôles automatisés de non-régression et les limites réelles sont détaillés dans [TEST-RESULTS.md](TEST-RESULTS.md) et [CLOUD.md](CLOUD.md). Aucun dépôt, Release, Pages ou Store n’est publié.

## 0.1.34 — partage 1fichier expérimental

Recharger Alcydeo, vérifier 0.1.34 puis choisir Cloud → 1fichier. Choisir un petit fichier personnel de test et cliquer Partager avec 1fichier : aucun envoi ne démarre au simple choix. La barre reste indéterminée jusqu’au rapport du fournisseur ; ne pas confondre l’absence de pourcentage avec un blocage. Garder le gestionnaire ouvert. Après confirmation du nom, de la taille et du lien, ouvrir ce lien et vérifier séparément le fichier reçu chez 1fichier. La disponibilité peut être différée. Le laboratoire n’a validé que l’initialisation anonyme réelle et les échanges interceptés, pas un dépôt réel.

L’original est conservé. Annuler coupe l’envoi local sans promettre la suppression distante ; Reprendre renvoie le fichier complet avec un nouvel identifiant. Une réponse finale perdue peut créer un doublon. L’aide de 1fichier ne garantit pas la conservation sans compte après 15 jours. Le plafond documenté de 300 Go n’a pas été mesuré dans Chrome ; l’espace local peut limiter la préparation avant ce plafond. Ouvrir 1fichier permet le parcours direct en cas de refus.

Le test réseau HTTPS local utilise un certificat de test temporaire et accepte ce certificat uniquement dans son profil automatisé ; aucune exception TLS ni clé de test n’est livrée dans le produit. Les cookies préexistants sont exclus et les octets réellement reçus sont comparés au fichier original.

## 0.1.35 — Turbobit invité expérimental

Recharger Alcydeo et vérifier 0.1.35. Cloud → Turbobit : choisir un petit fichier personnel puis Partager avec Turbobit. Aucun fichier n’est envoyé lors du choix. Le plafond conservateur est 200 Mo ; pour un fichier plus gros, choisir une autre destination. La barre reste indéterminée pendant l’envoi. Le lien est créé après acquittement de l’identifiant par le serveur ; ouvrir le lien et vérifier séparément le fichier reçu, son nom, sa taille et sa lecture. L’initialisation anonyme réelle a été vérifiée, mais le laboratoire n’a envoyé aucun fichier au vrai Turbobit.

La FAQ héritée annonce jusqu’à sept jours de stockage invité ; garder l’original. Annuler ne garantit pas la suppression distante. Reprendre renvoie intégralement le fichier vers une nouvelle destination et peut créer un doublon après une réponse perdue. Le parcours invité n’utilise ni compte, ni API CostAction authentifiée. Le lien Ouvrir Turbobit conserve le parcours direct du site. Les tests réseau HTTPS locaux comparent les vrais octets avec un certificat temporaire accepté uniquement dans leur profil de test ; aucune exception TLS ou clé n’est livrée dans le produit.

## 0.1.36 — Playlists YouTube (build local)

1. Fermer les anciens gestionnaires, recharger Alcydeo dans chrome://extensions et vérifier 0.1.36. Ouvrir une playlist YouTube dont les vidéos sont accessibles. Le compteur représente une playlist, pas chaque vidéo.
2. Ouvrir la popup : le titre de la playlist, la liste des vidéos et leurs cases apparaissent. Toutes les vidéos accessibles sont cochées ; les indisponibles restent grisées. Attendre la lecture complète des métadonnées. Pour une longue liste, changer de page ; les sélections restent mémorisées pendant cette ouverture.
3. Décocher deux vidéos, choisir Meilleure disponible ou un plafond de qualité, puis Télécharger la sélection. Un onglet YouTube muet prépare chaque source. La popup conserve la progression ; le gestionnaire s’ouvre en arrière-plan. Le garder ouvert.
4. Le chemin automatique est celui de Réglages + titre de la playlist. Les fichiers portent la position originale et le titre vidéo, par exemple Alcydeo/Ma playlist/001 - Première vidéo.mp4. Le réglage Enregistrer sous reste respecté pour chaque fichier ; le désactiver pour l’enregistrement automatique. Chrome choisit le dossier racine.
5. Fermer puis rouvrir la popup pendant le lot. Vérifier les vrais fichiers, leur son, début/fin et Ouvrir dans le dossier. Une vidéo n’est comptée sauvée qu’après confirmation Chrome. Les échecs isolés ne bloquent pas la suite ; Relancer les échecs conserve les fichiers déjà sauvés.
6. Essayer Pause/Reprendre, puis fermer le gestionnaire. Le lot doit être suspendu et récupérable depuis Bibliothèque ou la popup ; les résultats déjà sauvés ne doivent pas être téléchargés de nouveau. Une source inachevée peut recommencer depuis le début. Annuler conserve les fichiers déjà sauvés.
7. Restreindre YouTube dans Chrome ou le bloquer dans Alcydeo : aucun nouveau lecteur ne doit démarrer. Ne pas confondre une liste de métadonnées lisible avec une autorisation de transfert : YouTube peut refuser une vidéo. Aucun contournement n’est ajouté.

Limites : 5 000 entrées / 100 pages, une vidéo à la fois, 45 secondes maximum pour préparer chaque lecteur, gestionnaire ouvert. Les sources protégées et les playlists dynamiques infinies ne sont pas promises. Le ZIP Store conserve l’exclusion YouTube. Voir PLAYLISTS.md et les preuves séparées réelles/simulées dans TEST-RESULTS.md.

## 0.1.37 — Posts TikTok

Fermer les anciens gestionnaires et recharger Alcydeo dans chrome://extensions ; vérifier 0.1.37. Recharger aussi la page TikTok fournie. Le badge doit apparaître avant l’ouverture de la popup. Celle-ci doit proposer #Ubud, les formats 1024p H.264/HEVC disponibles et leurs tailles, sans animation de connexion. Choisir H.264 pour reproduire le format réellement validé, puis Télécharger. Garder l’onglet TikTok et le gestionnaire ouverts ; la popup peut se fermer.

Vérifier le MP4 dans le dossier Chrome, son vrai nom, image et son du début à la fin. Le test Linux produit 9 510 143 octets en 576 × 1024 H.264/AAC, 33,667 secondes ; une autre session/variante peut fournir des octets différents. Essayer pause/reprise, annulation, fermeture de la popup et de la source. Après fermeture de la source, rouvrir le post et le détecter à nouveau. Une reprise de transfert contextualisé repart depuis le début ; le résultat vérifié peut se sauvegarder sans nouveau transfert. Les sources HTML sont refusées.

Les formats, le seuil minimum, la blacklist, Enregistrer sous et la destination restent respectés. Aucune nouvelle permission, DNR, connexion ou application externe n’est requise. Certaines navigations internes de TikTok conservent un JSON périmé : recharger la page du post. Les fils, directs et contenus privés ne sont pas promis. Voir TIKTOK.md, TEST-RESULTS.md et les rapports réels/fixtures séparés.

## 0.1.38 — Posts X et mix YouTube

Fermer les anciens gestionnaires, recharger l’extension dans chrome://extensions, vérifier 0.1.38 puis recharger le post X fourni. Le badge doit afficher 1, et la popup une fiche 320p ; elle ne doit pas proposer les deux playlists techniques séparément. Télécharger doit enregistrer un vrai MP4 selon les préférences de destination. Le test public mesure 1 545 730 octets et 57,557 s AVC/AAC ; la vérification locale explicite et le décodage intégral sont documentés dans X.md. Ce parcours direct normal n’exige pas de conserver X ouvert après le départ. Le mode multipart et HLS conservent le gestionnaire requis.

Le lien YouTube fourni est un mix évolutif. La popup affiche seulement les titres actuellement chargés avec une notice et des cases sélectionnables. L’essai réel est strictement limité à deux titres ; YouTube les a refusés avec sourceRestricted, sans lancer les autres ni livrer de fichier partiel. La fixture locale valide deux fichiers complets. Le build Store reste sans YouTube.

## 0.1.39 — Erreur observe.js après rechargement

Fermer les anciens gestionnaires, recharger l’extension dans chrome://extensions et vérifier 0.1.39. Recharger aussi les pages web déjà ouvertes pour retirer les scripts 0.1.38 encore présents, puis effacer les anciennes erreurs dans Chrome. Modifier/rejouer une vidéo et vérifier que le badge et les sources se mettent à jour sans nouvelle erreur. Un prochain rechargement/désactivation doit arrêter proprement l’observateur devenu invalide. Le cas reproduit est Extension context invalidated ; une simple référence observe.js:1 peut aussi désigner d’autres exceptions, à identifier avec leur première ligne. Voir OBSERVER.md et TEST-RESULTS.md.

## 0.1.40 — Popup

Recharger l’extension, vérifier 0.1.40 puis ouvrir l’icône sur une page média. Vérifier qualité/Télécharger/Cast, prévisualisation, menu … (découpe et capture), langues, pied Bibliothèque et capture d’onglet. Une longue liste doit défiler sans déplacer le pied ; ouvrir le menu de la dernière fiche, puis Échap ou clic extérieur. Tester clair/sombre et une langue RTL. Les outils complets s’ouvrent toujours dans le gestionnaire. Voir POPUP.md et TEST-RESULTS.md.

## 0.1.41 — Martin-pêcheur cohérent

Recharger l’extension, vérifier 0.1.41 puis ouvrir la popup sur une page sans média : comparer la tête en haut avec celle de l’illustration. Même œil, même bec ; aucun liseré blanc autour de l’oiseau. Vérifier clair/sombre, le gestionnaire et l’icône Chrome après rechargement. Le fond bleu clair arrondi est le support volontaire du logo, distinct de son contour. Les images de publication et les favicons sont dans le kit d’identité.

## 0.1.46 — Fin des validations de domaines

Recharger Alcydeo et vérifier 0.1.46. Ouvrir la popup sur une page vidéo : aucune demande de validation de domaine. Sur chrome://extensions ou le gestionnaire, vérifier l’état neutre, sans ancien message d’autorisation. Avec un accès réellement restreint dans Chrome, les requêtes restent bloquées et la reprise est disponible après rétablissement du réglage Chrome. Voir SITE-ACCESS.md.


## 0.1.46 — sources HLS et parallélisation VK

Recharger l’extension, vérifier la version 0.1.46, puis actualiser la page vidéo et relancer son lecteur pour obtenir des adresses fraîches. Sur le cas Coflix fourni, une seule fiche avec qualité 488p doit subsister après les contrôles ; la page HTML de l’hébergeur ne constitue pas un média. Le téléchargement complet du laboratoire est distinct d’une promesse sur toutes les sessions ou pages.

Pour VK, ouvrir **Réglages → Téléchargements en plusieurs parties**, activer le réglage puis choisir 2, 4 ou 8 connexions. Le réglage reste désactivé initialement et s’applique aux nouvelles tâches. Le garder activé ne garantit pas le débit : sur le CDN réellement observé sans ETag, audio et vidéo sont chargés ensemble, sans découpage arbitraire d’une même ressource. Garder le gestionnaire ouvert. Vérifier le début, la fin et le son du résultat ; pause, reprise et annulation restent disponibles. Les mesures publiques 144p et les limites figurent dans [VK.md](VK.md).


## 0.1.47 — sauvegarde automatique du résultat

Fermer les gestionnaires puis recharger Alcydeo dans chrome://extensions. Rouvrir la Bibliothèque : un résultat encore conservé, assemblé et contrôlé, bloqué seulement par l’ancien contrôle de lecture, s’enregistre automatiquement sans retélécharger ses segments. Il doit ensuite afficher « Afficher dans le dossier » et 100 %. Le lecteur du navigateur n’a pas besoin de prendre en charge ses codecs pour permettre cet enregistrement. Les contrôles structure/pistes/durée et la taille exacte du fichier temporaire restent exigés.

Le mode automatique demeure le réglage initial. Si Enregistrer sous a été choisi, Chrome demande toujours une destination. Une annulation de ce dialogue ou un enregistrement natif incertain conserve une reprise explicite, afin de ne pas ouvrir une boucle de dialogues ou créer une copie supplémentaire. Voir [OUTPUT-SAVING.md](OUTPUT-SAVING.md).


## 0.1.48 — recadrage visuel

Dans Outils vidéo, choisir Recadrer puis une vidéo. Tracer la zone sur l’image : le premier export reste désactivé avant une sélection valide. Déplacer la zone, ajuster ses quatre poignées ou ses coordonnées numériques ; les flèches déplacent de 1 pixel, Maj+flèches de 10. L’aperçu montre la région conservée. « Exporter la vidéo recadrée » crée un MP4 nommé -cropped, sauvegardé automatiquement selon les réglages, avec durée/son conservés et original intact. Vérifier une source paysage puis portrait, clavier, thème sombre et langues RTL. Les dimensions H.264 sont paires ; une taille impaire est réduite d’au plus un pixel. [CROP.md](CROP.md).

## Mise à jour 0.1.52 — alternatives TikTok

Fermer les anciens gestionnaires, recharger l’extension existante dans `chrome://extensions`, vérifier **0.1.52** en bas de sa petite fenêtre et actualiser le post TikTok. Les dossiers Windows identiques à la livraison précédente sont sauvegardés puis mis à jour ; garder ce chemin préserve l’identité Chrome et la Bibliothèque.

Alcydeo conserve jusqu’à trois adresses natives par qualité. Si la première échoue, une autre adresse de ce même format doit passer son propre contrôle. Un échec au début du transfert peut utiliser cette alternative si sa taille exacte correspond ; aucune substitution au milieu des octets ni baisse automatique de qualité. Un refus429 ne déclenche pas de rotation des serveurs. La page TikTok et le gestionnaire restent ouverts jusqu’à la sauvegarde ; la popup peut fermer.

Les essais isolés réussis ne prouvent pas la cause de l’échec dans une session personnelle. Si l’incident continue, le message exact et l’étape (aucune détection, transfert en échec ou enregistrement absent) permettront de le distinguer. Aucun profil Chrome personnel n’est copié ni piloté. Voir TIKTOK.md et TEST-RESULTS.md.

Bibliothèque 0.1.61 : cliquer sur le nuage à côté de Compresser, sur la fiche du fichier. La page Cloud doit afficher uniquement ce fichier et les fournisseurs, sans cocher la fiche ni ouvrir un dialogue intermédiaire. Si la copie manque, la choisir dans la page ; aucun envoi avant Envoyer. Le bouton Cloud de la sélection multiple reste disponible.

Cast 0.1.62 : le lecteur Fichier du PC et le raccourci autonome affichent la limite des récepteurs avant toute préparation. « Comment caster ce lecteur » est accessible avant le choix du fichier. L’erreur ne prétend plus que le sélecteur s’est ouvert/refermé. La Shield nécessite toujours le parcours Chrome Caster l’onglet ; ce lot n’annonce pas une réparation du transport matériel.
